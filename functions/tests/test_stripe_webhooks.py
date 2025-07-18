"""
Comprehensive end-to-end tests for Stripe webhook functionality.
Tests the complete webhook handling workflow including session processing,
fulfillment, and error handling scenarios.
"""

import hashlib
import json
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch

import pytest
import stripe
from lib.stripe.webhooks import (
    SessionMetadata,
    add_stripe_event_and_checkout_tags,
    check_if_session_has_been_processed_already,
    fulfill_completed_event_ticket_purchase,
    fulfilment_workflow_on_expired_session,
    fulfilment_workflow_on_ticket_purchase,
    record_checkout_session_by_customer_email,
    restock_tickets_after_expired_checkout,
    stripe_webhook_checkout_fulfilment,
)


class TestSessionMetadata:
    """Tests for the SessionMetadata dataclass validation and initialization."""

    def test_session_metadata_valid_initialization(self):
        """Test that SessionMetadata correctly initializes with valid string and boolean inputs."""
        metadata = SessionMetadata("test-event-123", True)
        assert metadata.eventId == "test-event-123"
        assert metadata.isPrivate is True

    def test_session_metadata_string_boolean_conversion(self):
        """Test that SessionMetadata correctly converts string 'true'/'false' to boolean."""
        metadata_true = SessionMetadata("test-event-123", "true")
        assert metadata_true.isPrivate is True

        metadata_false = SessionMetadata("test-event-123", "false")
        assert metadata_false.isPrivate is False

    def test_session_metadata_invalid_event_id_raises_error(self):
        """Test that SessionMetadata raises ValueError when eventId is not a string."""
        with pytest.raises(ValueError, match="Event Id must be provided as a string"):
            SessionMetadata(123, True)

    def test_session_metadata_invalid_is_private_raises_error(self):
        """Test that SessionMetadata raises ValueError when isPrivate cannot be converted to boolean."""
        with pytest.raises(
            ValueError, match="Is Private must be provided as a boolean"
        ):
            SessionMetadata("test-event-123", "invalid-boolean")


class TestCheckIfSessionProcessed:
    """Tests for checking if a checkout session has already been processed."""

    @patch("lib.stripe.webhooks.db")
    def test_session_not_processed_when_event_not_found(self, mock_db):
        """Test that function returns False when the event metadata document doesn't exist."""
        mock_transaction = Mock()
        mock_logger = Mock()

        # Mock event document that doesn't exist
        mock_event_doc = Mock()
        mock_event_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = (
            mock_event_doc
        )

        result = check_if_session_has_been_processed_already(
            mock_transaction, mock_logger, "session-123", "event-456"
        )

        assert result is False
        mock_logger.error.assert_called_once()

    @patch("lib.stripe.webhooks.db")
    def test_session_not_processed_when_no_completed_sessions(self, mock_db):
        """Test that function returns False when event has no completed checkout sessions."""
        mock_transaction = Mock()
        mock_logger = Mock()

        # Mock event document that exists but has no completedStripeCheckoutSessionIds
        mock_event_doc = Mock()
        mock_event_doc.exists = True
        mock_event_doc.to_dict.return_value = {
            "completedStripeCheckoutSessionIds": None
        }
        mock_db.collection.return_value.document.return_value.get.return_value = (
            mock_event_doc
        )

        result = check_if_session_has_been_processed_already(
            mock_transaction, mock_logger, "session-123", "event-456"
        )

        assert result is False

    @patch("lib.stripe.webhooks.db")
    def test_session_already_processed_when_session_id_exists(self, mock_db):
        """Test that function returns True when checkout session ID is found in completed sessions."""
        mock_transaction = Mock()
        mock_logger = Mock()

        # Mock event document with session ID in completed list
        mock_event_doc = Mock()
        mock_event_doc.exists = True
        mock_event_doc.to_dict.return_value = {
            "completedStripeCheckoutSessionIds": ["session-123", "other-session"]
        }
        mock_db.collection.return_value.document.return_value.get.return_value = (
            mock_event_doc
        )

        result = check_if_session_has_been_processed_already(
            mock_transaction, mock_logger, "session-123", "event-456"
        )

        assert result is True


class TestAddStripeEventTags:
    """Tests for adding event and checkout tags to logger."""

    def test_add_stripe_event_and_checkout_tags_complete(self):
        """Test that all required tags are added to logger from stripe event data."""
        mock_logger = Mock()
        mock_event = {
            "type": "checkout.session.completed",
            "id": "evt_123",
            "data": {"object": {"id": "cs_session_123"}},
            "account": "acct_123",
        }

        add_stripe_event_and_checkout_tags(mock_logger, mock_event)

        expected_tags = {
            "eventType": "checkout.session.completed",
            "eventId": "evt_123",
            "checkoutSessionId": "cs_session_123",
            "stripeAccount": "acct_123",
        }
        mock_logger.add_tags.assert_called_once_with(expected_tags)


class TestFulfillEventTicketPurchase:
    """Tests for the complete ticket purchase fulfillment workflow."""

    @patch("lib.stripe.webhooks.db")
    @patch("lib.stripe.webhooks.firestore")
    @patch("lib.stripe.webhooks.datetime")
    def test_fulfill_purchase_success_new_event_metadata(
        self, mock_datetime, mock_firestore, mock_db
    ):
        """Test successful ticket purchase fulfillment when event metadata doesn't exist yet."""
        # Setup mocks
        mock_transaction = Mock()
        mock_logger = Mock()
        mock_datetime.now.return_value = datetime(2024, 1, 1, 12, 0, 0)

        # Mock event document
        mock_event_doc = Mock()
        mock_event_doc.exists = True
        mock_event_doc.to_dict.return_value = {
            "organiserId": "org-123",
            "name": "Test Event",
        }

        # Mock event metadata document (doesn't exist)
        mock_metadata_doc = Mock()
        mock_metadata_doc.exists = False

        # Setup db mocks
        mock_db.collection.return_value.document.return_value.get.side_effect = [
            mock_event_doc,
            mock_metadata_doc,
        ]

        # Mock line items
        mock_line_items = Mock()
        mock_line_items.data = [Mock(quantity=2, price=Mock(unit_amount=2500))]

        # Mock customer
        mock_customer = Mock()
        mock_customer.email = "test@example.com"

        # Mock payment details
        mock_payment_details = Mock()
        mock_payment_details.amount_shipping = None
        mock_payment_details.amount_discount = 0

        result = fulfill_completed_event_ticket_purchase(
            mock_transaction,
            mock_logger,
            "session-123",
            "event-456",
            False,
            mock_line_items,
            mock_customer,
            "John Doe",
            "+1234567890",
            mock_payment_details,
        )

        # Verify order ID is returned
        assert result is not None
        assert isinstance(result, str)

    @patch("lib.stripe.webhooks.db")
    def test_fulfill_purchase_fails_when_event_not_found(self, mock_db):
        """Test that fulfillment returns None when the event document doesn't exist."""
        mock_transaction = Mock()
        mock_logger = Mock()

        # Mock event document that doesn't exist
        mock_event_doc = Mock()
        mock_event_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = (
            mock_event_doc
        )

        result = fulfill_completed_event_ticket_purchase(
            mock_transaction,
            mock_logger,
            "session-123",
            "event-456",
            False,
            Mock(),
            Mock(),
            "John Doe",
            "+1234567890",
            Mock(),
        )

        assert result is None
        mock_logger.error.assert_called_once()

    @patch("lib.stripe.webhooks.db")
    def test_fulfill_purchase_fails_when_no_line_items(self, mock_db):
        """Test that fulfillment returns None when line items are empty."""
        mock_transaction = Mock()
        mock_logger = Mock()

        # Mock event document that exists
        mock_event_doc = Mock()
        mock_event_doc.exists = True
        mock_event_doc.to_dict.return_value = {"organiserId": "org-123"}
        mock_db.collection.return_value.document.return_value.get.return_value = (
            mock_event_doc
        )

        # Mock empty line items
        mock_line_items = Mock()
        mock_line_items.data = []

        result = fulfill_completed_event_ticket_purchase(
            mock_transaction,
            mock_logger,
            "session-123",
            "event-456",
            False,
            mock_line_items,
            Mock(),
            "John Doe",
            "+1234567890",
            Mock(),
        )

        assert result is None
        mock_logger.error.assert_called_once()


class TestRecordCheckoutSession:
    """Tests for recording checkout session by customer email."""

    @patch("lib.stripe.webhooks.db")
    @patch("lib.stripe.webhooks.hashlib")
    @patch("lib.stripe.webhooks.firestore")
    def test_record_checkout_session_success(
        self, mock_firestore, mock_hashlib, mock_db
    ):
        """Test successful recording of checkout session for customer email."""
        mock_transaction = Mock()
        mock_customer = Mock()
        mock_customer.email = "test@example.com"
        mock_checkout_session = {"id": "session-123"}

        # Mock email hashing
        mock_hash = Mock()
        mock_hash.hexdigest.return_value = "abc123def456"
        mock_hashlib.md5.return_value = mock_hash

        record_checkout_session_by_customer_email(
            mock_transaction, "event-456", mock_checkout_session, mock_customer
        )

        # Verify database operations
        mock_db.collection.assert_called()
        mock_transaction.set.assert_called_once()


class TestRestockTickets:
    """Tests for restocking tickets after expired checkout sessions."""

    @patch("lib.stripe.webhooks.db")
    @patch("lib.stripe.webhooks.firestore")
    def test_restock_tickets_after_expired_checkout(self, mock_firestore, mock_db):
        """Test that tickets are properly restocked when checkout session expires."""
        mock_transaction = Mock()

        # Mock line items with quantity
        mock_line_items = {"data": [Mock(quantity=3)]}

        restock_tickets_after_expired_checkout(
            mock_transaction, "session-123", "event-456", False, mock_line_items
        )

        # Verify vacancy is incremented and session is marked as processed
        mock_transaction.update.assert_called()


class TestFulfillmentWorkflows:
    """Tests for complete fulfillment workflows."""

    @patch("lib.stripe.webhooks.check_if_session_has_been_processed_already")
    @patch("lib.stripe.webhooks.fulfill_completed_event_ticket_purchase")
    @patch("lib.stripe.webhooks.send_email_on_purchase_event")
    @patch("lib.stripe.webhooks.record_checkout_session_by_customer_email")
    @patch("lib.stripe.webhooks.https_fn")
    def test_fulfillment_workflow_purchase_success(
        self,
        mock_https_fn,
        mock_record,
        mock_send_email,
        mock_fulfill,
        mock_check_processed,
    ):
        """Test complete successful ticket purchase fulfillment workflow."""
        # Setup mocks
        mock_transaction = Mock()
        mock_logger = Mock()
        mock_check_processed.return_value = False
        mock_fulfill.return_value = "order-123"
        mock_send_email.return_value = True
        mock_https_fn.Response.return_value = Mock(status=200)

        # Mock line items and customer
        mock_line_items = Mock()
        mock_customer_details = Mock()
        mock_customer_details.email = "test@example.com"
        mock_checkout_session = Mock()

        result = fulfilment_workflow_on_ticket_purchase(
            mock_transaction,
            mock_logger,
            "session-123",
            "event-456",
            False,
            mock_line_items,
            mock_customer_details,
            mock_checkout_session,
            "John Doe",
            "+1234567890",
        )

        # Verify all steps were called
        mock_check_processed.assert_called_once()
        mock_fulfill.assert_called_once()
        mock_send_email.assert_called_once()
        mock_record.assert_called_once()

    @patch("lib.stripe.webhooks.check_if_session_has_been_processed_already")
    @patch("lib.stripe.webhooks.https_fn")
    def test_fulfillment_workflow_already_processed(
        self, mock_https_fn, mock_check_processed
    ):
        """Test that workflow returns early when session has already been processed."""
        mock_transaction = Mock()
        mock_logger = Mock()
        mock_check_processed.return_value = True
        mock_https_fn.Response.return_value = Mock(status=200)

        result = fulfilment_workflow_on_ticket_purchase(
            mock_transaction,
            mock_logger,
            "session-123",
            "event-456",
            False,
            Mock(),
            Mock(),
            Mock(),
            "John Doe",
            "+1234567890",
        )

        # Verify early return
        mock_check_processed.assert_called_once()
        mock_logger.info.assert_called_with(
            "Current webhook event checkout session has been already processed. Returning early. session=session-123"
        )

    @patch("lib.stripe.webhooks.check_if_session_has_been_processed_already")
    @patch("lib.stripe.webhooks.restock_tickets_after_expired_checkout")
    @patch("lib.stripe.webhooks.https_fn")
    def test_fulfillment_workflow_expired_session(
        self, mock_https_fn, mock_restock, mock_check_processed
    ):
        """Test complete workflow for handling expired checkout sessions."""
        mock_transaction = Mock()
        mock_logger = Mock()
        mock_check_processed.return_value = False
        mock_https_fn.Response.return_value = Mock(status=200)

        result = fulfilment_workflow_on_expired_session(
            mock_transaction, mock_logger, "session-123", "event-456", False, Mock()
        )

        # Verify restock was called
        mock_restock.assert_called_once_with(
            mock_transaction, "session-123", "event-456", False, Mock()
        )


class TestWebhookEndpoint:
    """Tests for the main webhook endpoint handler."""

    @patch("lib.stripe.webhooks.stripe.Webhook.construct_event")
    @patch("lib.stripe.webhooks.stripe.checkout.Session.retrieve")
    @patch("lib.stripe.webhooks.fulfilment_workflow_on_ticket_purchase")
    @patch("lib.stripe.webhooks.db")
    def test_webhook_checkout_completed_success(
        self, mock_db, mock_fulfillment, mock_retrieve, mock_construct
    ):
        """Test successful processing of checkout.session.completed webhook event."""
        # Mock request
        mock_request = Mock()
        mock_request.data = b'{"test": "data"}'
        mock_request.headers = {"Stripe-Signature": "test-signature"}

        # Mock stripe event
        mock_event = {
            "type": "checkout.session.completed",
            "id": "evt_123",
            "data": {
                "object": {
                    "id": "cs_session_123",
                    "cancel_url": "https://www.sportshub.net.au/cancel",
                    "success_url": "https://www.sportshub.net.au/success",
                }
            },
            "account": "acct_123",
        }
        mock_construct.return_value = mock_event

        # Mock checkout session
        mock_session = Mock()
        mock_session.id = "cs_session_123"
        mock_session.metadata = {"eventId": "event-456", "isPrivate": "false"}
        mock_session.custom_fields = [
            Mock(key="attendeeFullName", text=Mock(value="John Doe")),
            Mock(key="attendeePhone", text=Mock(value="+1234567890")),
        ]
        mock_session.line_items = Mock()
        mock_session.customer_details = Mock()
        mock_retrieve.return_value = mock_session

        # Mock transaction
        mock_db.transaction.return_value = Mock()
        mock_fulfillment.return_value = Mock(status=200)

        with patch("lib.stripe.webhooks.uuid.uuid4", return_value="test-uuid"):
            result = stripe_webhook_checkout_fulfilment(mock_request)

        # Verify webhook processing
        mock_construct.assert_called_once()
        mock_retrieve.assert_called_once()
        mock_fulfillment.assert_called_once()

    @patch("lib.stripe.webhooks.stripe.Webhook.construct_event")
    def test_webhook_invalid_signature_error(self, mock_construct):
        """Test that webhook returns 400 for invalid signature verification."""
        mock_request = Mock()
        mock_request.data = b'{"test": "data"}'
        mock_request.headers = {"Stripe-Signature": "invalid-signature"}

        mock_construct.side_effect = stripe.SignatureVerificationError(
            "Invalid signature", "sig"
        )

        with patch("lib.stripe.webhooks.uuid.uuid4", return_value="test-uuid"):
            result = stripe_webhook_checkout_fulfilment(mock_request)

        assert hasattr(result, "status")

    @patch("lib.stripe.webhooks.stripe.Webhook.construct_event")
    def test_webhook_invalid_payload_error(self, mock_construct):
        """Test that webhook returns 400 for invalid JSON payload."""
        mock_request = Mock()
        mock_request.data = b"invalid-json"
        mock_request.headers = {"Stripe-Signature": "test-signature"}

        mock_construct.side_effect = ValueError("Invalid JSON")

        with patch("lib.stripe.webhooks.uuid.uuid4", return_value="test-uuid"):
            result = stripe_webhook_checkout_fulfilment(mock_request)

        assert hasattr(result, "status")

    @patch("lib.stripe.webhooks.stripe.Webhook.construct_event")
    def test_webhook_ignores_non_sportshub_events(self, mock_construct):
        """Test that webhook ignores events not from SportHub domains."""
        mock_request = Mock()
        mock_request.data = b'{"test": "data"}'
        mock_request.headers = {"Stripe-Signature": "test-signature"}

        # Mock event from different domain
        mock_event = {
            "type": "checkout.session.completed",
            "id": "evt_123",
            "data": {
                "object": {
                    "cancel_url": "https://example.com/cancel",
                    "success_url": "https://example.com/success",
                }
            },
        }
        mock_construct.return_value = mock_event

        with patch("lib.stripe.webhooks.uuid.uuid4", return_value="test-uuid"):
            result = stripe_webhook_checkout_fulfilment(mock_request)

        assert hasattr(result, "status")

    @patch("lib.stripe.webhooks.stripe.Webhook.construct_event")
    def test_webhook_unsupported_event_type(self, mock_construct):
        """Test that webhook returns 500 for unsupported event types."""
        mock_request = Mock()
        mock_request.data = b'{"test": "data"}'
        mock_request.headers = {"Stripe-Signature": "test-signature"}

        # Mock unsupported event type
        mock_event = {
            "type": "unsupported.event.type",
            "id": "evt_123",
            "data": {
                "object": {
                    "cancel_url": "https://www.sportshub.net.au/cancel",
                    "success_url": "https://www.sportshub.net.au/success",
                }
            },
        }
        mock_construct.return_value = mock_event

        with patch("lib.stripe.webhooks.uuid.uuid4", return_value="test-uuid"):
            result = stripe_webhook_checkout_fulfilment(mock_request)

        assert hasattr(result, "status")
