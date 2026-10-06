import importlib
import sys
import unittest
from datetime import date, datetime, timezone
from types import ModuleType
from unittest.mock import Mock, patch

import pytz
from google.api_core.exceptions import Aborted, InternalServerError
from google.auth.credentials import AnonymousCredentials
from google.cloud import firestore
from google.cloud.firestore_v1 import _helpers
from google.cloud.firestore_v1.types import (
    BatchGetDocumentsResponse,
    BeginTransactionResponse,
    CommitResponse,
    Document,
    RunQueryResponse,
)


# Only the application's credential/logging bootstrap is replaced; Firestore
# references, transactions, retries, and wire-format builders remain real.
constants = ModuleType("lib.constants")
constants.ACTIVE_PUBLIC = "Events/Active/Public"
constants.ACTIVE_PRIVATE = "Events/Active/Private"
constants.INACTIVE_PUBLIC = "Events/InActive/Public"
constants.INACTIVE_PRIVATE = "Events/InActive/Private"
constants.SYDNEY_TIMEZONE = pytz.timezone("Australia/Sydney")
constants.db = None
with patch.dict(sys.modules, {"lib.constants": constants}):
    archival = importlib.import_module("lib.move_inactive_events")


class TestMoveInactiveEvents(unittest.TestCase):
    TODAY = date(2026, 10, 6)
    ENDED = datetime(2026, 10, 1, 10, tzinfo=timezone.utc)
    FUTURE = datetime(2026, 10, 13, 10, tzinfo=timezone.utc)

    def setUp(self):
        self.db = firestore.Client(
            project="demo-event-archival", credentials=AnonymousCredentials()
        )
        self.api = Mock()
        self.db._firestore_api_internal = self.api
        self.api.begin_transaction.return_value = BeginTransactionResponse(
            transaction=b"transaction"
        )
        self.api.commit.return_value = CommitResponse()
        self.api.batch_get_documents.side_effect = self.get_document
        self.db_patch = patch.object(archival, "db", self.db)
        self.db_patch.start()
        self.addCleanup(self.db_patch.stop)
        self.addCleanup(self.db.close)
        self.source = self.db.document("Events/Active/Public/event-1")
        self.destination = self.db.document("Events/InActive/Public/event-1")
        self.owner_path = "Users/Active/Public/owner-1"
        self.event_data = {
            "endDate": self.ENDED,
            "organiserId": "owner-1",
            "isActive": True,
            "vacancy": 14,
            "eventTicketTypes": {"ticket-1": {"vacancy": 14, "price": 1350}},
            "unknownField": {"preserved": True},
        }
        self.documents = {
            self.source.path: self.event_data,
            self.owner_path: {"publicUpcomingOrganiserEvents": ["event-1", "event-2"]},
        }

    def document(self, path, data):
        return Document(
            name=self.db.document(path)._document_path,
            fields=_helpers.encode_dict(data),
        )

    def get_document(self, request, **kwargs):
        name = request["documents"][0]
        path = name.split("/documents/", 1)[1]
        data = self.documents.get(path)
        if data is None:
            response = BatchGetDocumentsResponse(missing=name)
        else:
            response = BatchGetDocumentsResponse(found=self.document(path, data))
        return iter([response])

    def stream(self, candidates):
        self.api.run_query.return_value = iter(
            RunQueryResponse(document=self.document(path, data))
            for path, data in candidates
        )

    def move(self):
        return archival.move_event_to_inactive(
            self.db.transaction(),
            self.source,
            self.destination,
            self.TODAY,
        )

    def committed_writes(self):
        return self.api.commit.call_args.kwargs["request"]["writes"]

    def test_public_move_commits_preserved_event_delete_and_targeted_index_removal(self):
        self.assertTrue(self.move())

        self.api.commit.assert_called_once()
        writes = self.committed_writes()
        self.assertEqual(len(writes), 3)
        create, delete, owner_update = writes
        self.assertEqual(create.update.name, self.destination._document_path)
        self.assertTrue(create._pb.HasField("current_document"))
        self.assertFalse(create.current_document.exists)
        self.assertEqual(
            _helpers.decode_dict(create.update.fields, self.db),
            {**self.event_data, "isActive": False},
        )
        self.assertEqual(delete.delete, self.source._document_path)
        self.assertEqual(
            owner_update.update.name, self.db.document(self.owner_path)._document_path
        )
        self.assertEqual(list(owner_update.update.fields), [])
        transform = owner_update.update_transforms[0]
        self.assertEqual(transform.field_path, "publicUpcomingOrganiserEvents")
        self.assertEqual(
            [value.string_value for value in transform.remove_all_from_array.values],
            ["event-1"],
        )
        self.assertTrue(owner_update.current_document.exists)

    def test_private_move_never_reads_or_writes_public_organiser(self):
        self.source = self.db.document("Events/Active/Private/event-1")
        self.destination = self.db.document("Events/InActive/Private/event-1")
        self.documents = {self.source.path: self.event_data}

        self.assertTrue(self.move())
        self.assertEqual(len(self.committed_writes()), 2)
        reads = [
            call.kwargs["request"]["documents"][0]
            for call in self.api.batch_get_documents.call_args_list
        ]
        self.assertEqual(reads, [self.source._document_path, self.destination._document_path])

    def test_stale_stream_candidate_with_renewed_end_date_is_not_archived(self):
        self.stream([(self.source.path, self.event_data)])
        self.documents[self.source.path] = {**self.event_data, "endDate": self.FUTURE}
        logger = Mock()

        archival.get_and_move_inactive_events(
            self.TODAY, logger, "Events/Active/Public", "Events/InActive/Public"
        )

        self.assertEqual(self.committed_writes(), [])
        logger.info.assert_not_called()
        logger.error.assert_not_called()

    def test_index_removal_uses_organiser_from_transaction_snapshot(self):
        self.stream([(self.source.path, self.event_data)])
        self.documents[self.source.path] = {**self.event_data, "organiserId": "owner-2"}
        self.documents["Users/Active/Public/owner-2"] = {
            "publicUpcomingOrganiserEvents": ["event-1"]
        }

        archival.get_and_move_inactive_events(
            self.TODAY, Mock(), "Events/Active/Public", "Events/InActive/Public"
        )

        self.assertEqual(
            self.committed_writes()[2].update.name,
            self.db.document("Users/Active/Public/owner-2")._document_path,
        )

    def test_retry_rereads_end_date_and_drops_previous_attempt_writes(self):
        def commit(request, **kwargs):
            if self.api.commit.call_count == 1:
                self.documents[self.source.path] = {
                    **self.event_data, "endDate": self.FUTURE
                }
                raise Aborted("concurrent date extension")
            return CommitResponse()

        self.api.commit.side_effect = commit

        self.assertFalse(self.move())
        self.assertEqual(self.api.begin_transaction.call_count, 2)
        self.assertEqual(self.committed_writes(), [])

    def test_missing_source_is_a_noop(self):
        del self.documents[self.source.path]

        self.assertFalse(self.move())
        self.assertEqual(self.committed_writes(), [])

    def test_existing_destination_fails_before_any_write_is_committed(self):
        self.documents[self.destination.path] = {"endDate": self.ENDED, "vacancy": 5}

        with self.assertRaisesRegex(archival.EventArchivalError, "already exists"):
            self.move()

        self.api.commit.assert_not_called()
        self.api.rollback.assert_called_once()
        self.assertEqual(self.documents[self.destination.path]["vacancy"], 5)

    def test_invalid_organiser_data_rolls_back_without_partial_archival(self):
        cases = [
            ({**self.event_data, "organiserId": ""}, {}, "organiserId"),
            ({**self.event_data, "organiserId": "nested/owner"}, {}, "organiserId"),
            (self.event_data, {}, "missing"),
            (self.event_data, {"publicUpcomingOrganiserEvents": "event-1"}, "ID list"),
        ]
        for event, owner, error in cases:
            with self.subTest(error=error, organiser=event["organiserId"]):
                self.documents = {self.source.path: event}
                if owner:
                    self.documents[self.owner_path] = owner
                self.api.commit.reset_mock()
                with self.assertRaisesRegex(archival.EventArchivalError, error):
                    self.move()
                self.api.commit.assert_not_called()

    def test_bad_event_does_not_prevent_later_valid_event_archival(self):
        missing_owner_event = {**self.event_data, "organiserId": "missing-owner"}
        self.documents["Events/Active/Public/bad-event"] = missing_owner_event
        self.stream([
            ("Events/Active/Public/malformed-event", {"endDate": "not-a-timestamp"}),
            ("Events/Active/Public/bad-event", missing_owner_event),
            (self.source.path, self.event_data),
        ])
        logger = Mock()

        archival.get_and_move_inactive_events(
            self.TODAY, logger, "Events/Active/Public", "Events/InActive/Public"
        )

        self.assertEqual(logger.error.call_count, 2)
        self.api.commit.assert_called_once()
        self.assertEqual(self.committed_writes()[0].update.name, self.destination._document_path)
        logger.info.assert_called_once()

    def test_commit_failure_propagates_and_never_logs_success(self):
        self.stream([(self.source.path, self.event_data)])
        self.api.commit.side_effect = InternalServerError("Firestore failed")
        logger = Mock()

        with self.assertRaises(InternalServerError):
            archival.get_and_move_inactive_events(
                self.TODAY, logger, "Events/Active/Public", "Events/InActive/Public"
            )

        logger.info.assert_not_called()
        logger.error.assert_not_called()

    def test_exhausted_transaction_retries_propagate(self):
        self.stream([(self.source.path, self.event_data)])
        self.api.commit.side_effect = Aborted("conflict")
        logger = Mock()

        with self.assertRaisesRegex(ValueError, "Failed to commit transaction"):
            archival.get_and_move_inactive_events(
                self.TODAY, logger, "Events/Active/Public", "Events/InActive/Public"
            )

        self.assertEqual(self.api.commit.call_count, 5)
        logger.info.assert_not_called()
        logger.error.assert_not_called()

    def test_eligibility_uses_sydney_calendar_day_across_dst(self):
        cases = [
            (date(2026, 10, 5), datetime(2026, 10, 4, 12, 59, tzinfo=timezone.utc), True),
            (date(2026, 10, 5), datetime(2026, 10, 4, 13, 0, tzinfo=timezone.utc), False),
            (date(2026, 7, 6), datetime(2026, 7, 5, 13, 59, tzinfo=timezone.utc), True),
            (date(2026, 7, 6), datetime(2026, 7, 5, 14, 0, tzinfo=timezone.utc), False),
        ]
        for today, end_date, expected in cases:
            with self.subTest(today=today, end_date=end_date):
                self.assertEqual(archival.has_ended({"endDate": end_date}, today), expected)

    def test_malformed_end_dates_are_data_errors(self):
        for end_date in [None, "2026-10-01", datetime(2026, 10, 1)]:
            with self.subTest(end_date=end_date):
                with self.assertRaises(archival.EventArchivalError):
                    archival.has_ended({"endDate": end_date}, self.TODAY)


if __name__ == "__main__":
    unittest.main()
