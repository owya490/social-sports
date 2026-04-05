import json
import time
import uuid
from dataclasses import dataclass

import requests
from google.protobuf.timestamp_pb2 import Timestamp
from lib.constants import SYDNEY_TIMEZONE, db
from lib.logging import Logger
from lib.emails.constants import LOOPS_API_KEY
from lib.emails.purchase_event import get_organiser_email_for_ticket_email
from lib.utils.priceUtils import centsToDollars

BOOKING_APPROVAL_TRANSACTIONAL_ID = "cmnd2gkqh03ja0ixlz9fx93re"


@dataclass
class BookingApprovalEmailRequest:
    eventId: str
    visibility: str
    email: str
    first_name: str
    orderId: str

    def __post_init__(self):
        if not isinstance(self.eventId, str):
            raise ValueError("Event Id must be provided as a string.")
        if not isinstance(self.visibility, str):
            raise ValueError("Visibility must be provided as a string.")


def send_booking_approval_email_with_loop(
    logger,
    email,
    name,
    event_name,
    organiser_id,
    order_id,
    date_purchased,
    quantity,
    price,
    start_date,
    end_date,
    location,
):
    headers = {"Authorization": "Bearer " + LOOPS_API_KEY}
    body = {
        "transactionalId": BOOKING_APPROVAL_TRANSACTIONAL_ID,
        "email": email,
        "dataVariables": {
            "name": name,
            "eventName": event_name,
            "organiserId": organiser_id,
            "orderId": order_id,
            "datePurchased": date_purchased,
            "quantity": quantity,
            "price": price,
            "startDate": start_date,
            "endDate": end_date,
            "location": location,
        },
    }

    response = requests.post(
        "https://app.loops.so/api/v1/transactional",
        data=json.dumps(body),
        headers=headers,
    )

    if response.status_code == 429:
        time.sleep(1)
        response = requests.post(
            "https://app.loops.so/api/v1/transactional",
            data=json.dumps(body),
            headers=headers,
        )

    if response.status_code != 200:
        logger.error(
            f"Failed to send booking approval email for orderId={order_id}, body={response.text}"
        )
        raise Exception("Failed to send booking approval email.")


def send_email_on_booking_approval(request_data: BookingApprovalEmailRequest):
    uid = str(uuid.uuid4())
    logger = Logger(f"loops_booking_approval_email_logger_{uid}")
    logger.add_tag("uuid", uid)

    maybe_event_data = (
        db.collection(f"Events/Active/{request_data.visibility}")
        .document(request_data.eventId)
        .get()
    )
    if not maybe_event_data.exists:
        logger.error(
            f"Unable to find event provided in datastore to send email. eventId={request_data.eventId}"
        )
        return False

    event_data = maybe_event_data.to_dict()

    maybe_order_data = db.collection(f"Orders").document(request_data.orderId).get()
    if not maybe_order_data.exists:
        logger.error(
            f"Unable to find orderId provided in datastore to send email. orderId={request_data.orderId}"
        )
        return False

    order_data = maybe_order_data.to_dict()

    try:
        start_date: Timestamp = event_data.get("startDate").timestamp_pb()
        end_date: Timestamp = event_data.get("endDate").timestamp_pb()
        start_date_string = (
            start_date.ToDatetime()
            .astimezone(SYDNEY_TIMEZONE)
            .strftime("%m/%d/%Y, %H:%M")
        )
        end_date_string = (
            end_date.ToDatetime()
            .astimezone(SYDNEY_TIMEZONE)
            .strftime("%m/%d/%Y, %H:%M")
        )
        date_purchased: Timestamp = order_data.get("datePurchased").timestamp_pb()
        date_purchased_string = (
            date_purchased.ToDatetime()
            .astimezone(SYDNEY_TIMEZONE)
            .strftime("%m/%d/%Y, %H:%M")
        )

        organiser_id = event_data.get("organiserId")
        if organiser_id is None:
            logger.error(
                f"Event missing organiserId for booking approval email. eventId={request_data.eventId}"
            )
            return False

        send_booking_approval_email_with_loop(
            logger,
            request_data.email,
            request_data.first_name,
            event_data.get("name"),
            organiser_id,
            request_data.orderId,
            date_purchased_string,
            str(len(order_data.get("tickets"))),
            str(centsToDollars(event_data.get("price"))),
            start_date_string,
            end_date_string,
            event_data.get("location"),
        )

        organiser_email = get_organiser_email_for_ticket_email(logger, organiser_id)
        if not organiser_email == None:
            send_booking_approval_email_with_loop(
                logger,
                organiser_email,
                request_data.first_name,
                event_data.get("name"),
                organiser_id,
                request_data.orderId,
                date_purchased_string,
                str(len(order_data.get("tickets"))),
                str(centsToDollars(event_data.get("price"))),
                start_date_string,
                end_date_string,
                event_data.get("location"),
            )

        return True
    except Exception as e:
        logger.error(
            f"Error sending booking approval email. eventId={request_data.eventId} error={e}"
        )
        return False
