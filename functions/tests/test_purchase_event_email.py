import importlib.util
import json
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path
from types import ModuleType
from unittest.mock import Mock, patch
from zoneinfo import ZoneInfo


class TestPurchaseEventEmail(unittest.TestCase):
    def setUp(self):
        self.db = Mock()
        constants = ModuleType("lib.constants")
        constants.db = self.db
        constants.SYDNEY_TIMEZONE = ZoneInfo("Australia/Sydney")
        logging = ModuleType("lib.logging")
        logging.Logger = Mock()
        email_constants = ModuleType("lib.emails.constants")
        email_constants.LOOPS_API_KEY = "test-loops-key"
        requests = ModuleType("requests")
        self.post = requests.post = Mock(return_value=Mock(status_code=200))
        timestamps = ModuleType("google.protobuf.timestamp_pb2")
        timestamps.Timestamp = object

        name = "purchase_event_email_under_test"
        path = Path(__file__).resolve().parents[1] / "lib/emails/purchase_event.py"
        spec = importlib.util.spec_from_file_location(name, path)
        self.purchase = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, {
            name: self.purchase,
            "lib.constants": constants,
            "lib.logging": logging,
            "lib.emails.constants": email_constants,
            "requests": requests,
            "google.protobuf.timestamp_pb2": timestamps,
        }):
            spec.loader.exec_module(self.purchase)
        sleep = patch.object(self.purchase.time, "sleep")
        self.sleep = sleep.start()
        self.addCleanup(sleep.stop)

        event_data = {
            "name": "Sunday Volleyball",
            "startDate": self.timestamp(datetime(2026, 7, 12, 8, tzinfo=timezone.utc)),
            "endDate": self.timestamp(datetime(2026, 7, 12, 10, tzinfo=timezone.utc)),
            "price": 1350,
            "location": "Court One",
            "organiserId": "organiser-1",
            "eventLink": "https://organiser.example/contact",
        }
        order_data = {
            "datePurchased": self.timestamp(datetime(2026, 7, 5, 8, tzinfo=timezone.utc)),
            "tickets": ["ticket-1", "ticket-2"],
        }
        organiser_data = {
            "sendOrganiserTicketEmails": True,
            "contactInformation": {"email": "organiser@example.com"},
        }
        self.collections = {}
        for path, data in [
            ("Events/Active/Public", event_data),
            ("Orders", order_data),
            ("Users/Active/Private", organiser_data),
        ]:
            collection = Mock()
            snapshot = collection.document.return_value.get.return_value
            snapshot.exists = True
            snapshot.to_dict.return_value = data
            self.collections[path] = collection
        self.db.collection.side_effect = self.collections.__getitem__
        self.request = self.purchase.PurchaseEventRequest(
            eventId="event-1",
            visibility="Public",
            email="attendee@example.com",
            first_name="Alex",
            orderId="order-1",
        )

    def timestamp(self, value):
        timestamp = Mock()
        timestamp.timestamp_pb.return_value.ToDatetime.return_value = value
        return timestamp

    def test_purchase_sends_event_url_and_retained_fields_to_both_recipients(self):
        self.assertTrue(self.purchase.send_email_on_purchase_event(self.request))

        self.assertEqual(self.post.call_count, 2)
        expected_variables = {
            "name": "Alex",
            "eventName": "Sunday Volleyball",
            "orderId": "order-1",
            "orderLink": "https://www.sportshub.net.au/order/order-1",
            "eventUrl": "https://www.sportshub.net.au/event/event-1",
            "datePurchased": "07/05/2026, 18:00",
            "quantity": "2",
            "price": "13.5",
            "startDate": "07/12/2026, 18:00",
            "endDate": "07/12/2026, 20:00",
            "location": "Court One",
        }
        for call, recipient in zip(
            self.post.call_args_list,
            ["attendee@example.com", "organiser@example.com"],
        ):
            self.assertEqual(call.args, ("https://app.loops.so/api/v1/transactional",))
            self.assertEqual(call.kwargs["headers"], {"Authorization": "Bearer test-loops-key"})
            self.assertEqual(json.loads(call.kwargs["data"]), {
                "transactionalId": "cm4r78nk301ehx79nrrxaijgl",
                "email": recipient,
                "dataVariables": expected_variables,
            })
        self.collections["Events/Active/Public"].document.assert_called_once_with("event-1")
        self.sleep.assert_not_called()

    def test_rate_limit_retries_the_same_purchase_payload(self):
        self.post.side_effect = [
            Mock(status_code=429), Mock(status_code=200), Mock(status_code=200)
        ]

        self.assertTrue(self.purchase.send_email_on_purchase_event(self.request))

        self.assertEqual(self.post.call_count, 3)
        first, retry, organiser = self.post.call_args_list
        self.assertEqual(first, retry)
        self.assertEqual(
            json.loads(retry.kwargs["data"])["dataVariables"]["eventUrl"],
            "https://www.sportshub.net.au/event/event-1",
        )
        self.assertEqual(
            json.loads(organiser.kwargs["data"])["dataVariables"]["eventUrl"],
            "https://www.sportshub.net.au/event/event-1",
        )
        self.sleep.assert_called_once_with(1)


if __name__ == "__main__":
    unittest.main()
