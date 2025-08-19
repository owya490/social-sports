"""
Comprehensive end-to-end tests for Stripe checkout functionality.
Tests the complete checkout session creation workflow including validation,
pricing calculations, and error handling scenarios.
"""

import json
import math
import time
from datetime import UTC, datetime
from unittest.mock import MagicMock, Mock, patch

import pytest
from lib.stripe.checkout import (
    StripeCheckoutRequest,
    calculate_stripe_fee,
    create_stripe_checkout_session_by_event_id,
    get_stripe_checkout_url_by_event_id,
)


class TestStripeCheckoutRequest:
    """Tests for the StripeCheckoutRequest dataclass validation."""

    def test_stripe_checkout_request_valid_initialization(self):
        """Test that StripeCheckoutRequest correctly initializes with all valid inputs."""
        request = StripeCheckoutRequest(
            eventId="test-event-123",
            isPrivate=True,
            quantity=2,
            cancelUrl="https://example.com/cancel",
            successUrl="https://example.com/success",
        )

        assert request.eventId == "test-event-123"
        assert request.isPrivate is True
        assert request.quantity == 2
        assert request.cancelUrl == "https://example.com/cancel"
        assert request.successUrl == "https://example.com/success"

    def test_stripe_checkout_request_invalid_event_id_raises_error(self):
        """Test that StripeCheckoutRequest raises ValueError when eventId is not a string."""
        with pytest.raises(ValueError, match="Event Id must be provided as a string"):
            StripeCheckoutRequest(
                eventId=123,
                isPrivate=True,
                quantity=2,
                cancelUrl="https://example.com/cancel",
                successUrl="https://example.com/success",
            )

    def test_stripe_checkout_request_invalid_is_private_raises_error(self):
        """Test that StripeCheckoutRequest raises ValueError when isPrivate is not a boolean."""
        with pytest.raises(
            ValueError, match="Is Private must be provided as a boolean"
        ):
            StripeCheckoutRequest(
                eventId="test-event-123",
                isPrivate="not-a-boolean",
                quantity=2,
                cancelUrl="https://example.com/cancel",
                successUrl="https://example.com/success",
            )

    def test_stripe_checkout_request_invalid_quantity_raises_error(self):
        """Test that StripeCheckoutRequest raises ValueError when quantity is not an integer."""
        with pytest.raises(ValueError, match="Quantity must be provided as a integer"):
            StripeCheckoutRequest(
                eventId="test-event-123",
                isPrivate=True,
                quantity="two",
                cancelUrl="https://example.com/cancel",
                successUrl="https://example.com/success",
            )

    def test_stripe_checkout_request_invalid_cancel_url_raises_error(self):
        """Test that StripeCheckoutRequest raises ValueError when cancelUrl is not a string."""
        with pytest.raises(ValueError, match="Cancel Url must be provided as a string"):
            StripeCheckoutRequest(
                eventId="test-event-123",
                isPrivate=True,
                quantity=2,
                cancelUrl=None,
                successUrl="https://example.com/success",
            )

    def test_stripe_checkout_request_invalid_success_url_raises_error(self):
        """Test that StripeCheckoutRequest raises ValueError when successUrl is not a string."""
        with pytest.raises(
            ValueError, match="Success Url must be provided as a string"
        ):
            StripeCheckoutRequest(
                eventId="test-event-123",
                isPrivate=True,
                quantity=2,
                cancelUrl="https://example.com/cancel",
                successUrl=123,
            )


class TestCalculateStripeFee:
    """Tests for Stripe fee calculation functionality."""

    def test_calculate_stripe_fee_basic_amount(self):
        """Test that Stripe fee is correctly calculated for a basic amount (30c + 1.7%)."""
        price_in_cents = 1000  # $10.00
        expected_fee = int(math.ceil(30 + (1000 * 0.017)))  # 30 + 17 = 47 cents

        result = calculate_stripe_fee(price_in_cents)

        assert result == expected_fee

    def test_calculate_stripe_fee_small_amount(self):
        """Test that Stripe fee calculation works correctly for small amounts where fixed fee dominates."""
        price_in_cents = 100  # $1.00
        expected_fee = int(
            math.ceil(30 + (100 * 0.017))
        )  # 30 + 1.7 = 32 cents (rounded up)

        result = calculate_stripe_fee(price_in_cents)

        assert result == expected_fee

    def test_calculate_stripe_fee_large_amount(self):
        """Test that Stripe fee calculation works correctly for large amounts where percentage dominates."""
        price_in_cents = 10000  # $100.00
        expected_fee = int(math.ceil(30 + (10000 * 0.017)))  # 30 + 170 = 200 cents

        result = calculate_stripe_fee(price_in_cents)

        assert result == expected_fee

    def test_calculate_stripe_fee_zero_amount(self):
        """Test that Stripe fee calculation returns only the fixed fee for zero amount."""
        price_in_cents = 0
        expected_fee = 30  # Only the fixed 30c fee

        result = calculate_stripe_fee(price_in_cents)

        assert result == expected_fee


class TestCreateStripeCheckoutSession:
    """Tests for the complete checkout session creation workflow."""

    @patch("lib.stripe.checkout.stripe.checkout.Session.create")
    @patch("lib.stripe.checkout.db")
    @patch("lib.stripe.checkout.datetime")
    def test_create_checkout_session_success_public_event(
        self, mock_datetime, mock_db, mock_stripe_create
    ):
        """Test successful creation of checkout session for a public event with all conditions met."""
        # Setup mock datetime
        mock_now = datetime(2024, 6, 1, 12, 0, 0, tzinfo=UTC)
        mock_datetime.now.return_value = mock_now

        # Setup mock transaction
        mock_transaction = Mock()
        mock_logger = Mock()

        # Mock event document
        mock_event_doc = Mock()
        mock_event_doc.exists = True
        mock_event_doc.to_dict.return_value = {
            "name": "Test Sports Event",
            "paused": False,
            "endDate": Mock(
                timestamp_pb=Mock(
                    return_value=Mock(
                        ToDatetime=Mock(
                            return_value=datetime(2024, 12, 31, 23, 59, 59, tzinfo=UTC)
                        )
                    )
                )
            ),
            "registrationDeadline": Mock(
                timestamp_pb=Mock(
                    return_value=Mock(
                        ToDatetime=Mock(
                            return_value=datetime(2024, 12, 30, 23, 59, 59, tzinfo=UTC)
                        )
                    )
                )
            ),
            "paymentsActive": True,
            "organiserId": "org-123",
            "vacancy": 10,
            "price": 2500,  # $25.00
            "stripeFeeToCustomer": False,
            "promotionalCodesEnabled": False,
        }

        # Mock organiser document
        mock_organiser_doc = Mock()
        mock_organiser_doc.exists = True
        mock_organiser_doc.to_dict.return_value = {
            "stripeAccount": "acct_123",
            "stripeAccountActive": True,
        }

        # Setup db collection chain
        mock_db.collection.return_value.document.return_value.get.side_effect = [
            mock_event_doc,
            mock_organiser_doc,
        ]

        # Mock Stripe checkout session creation
        mock_checkout = Mock()
        mock_checkout.id = "cs_test_session_123"
        mock_checkout.url = "https://checkout.stripe.com/session_123"
        mock_stripe_create.return_value = mock_checkout

        result = create_stripe_checkout_session_by_event_id(
            mock_transaction,
            mock_logger,
            "event-456",
            2,
            False,
            "https://example.com/cancel",
            "https://example.com/success",
        )

        # Verify result
        result_data = json.loads(result)
        assert result_data["url"] == "https://checkout.stripe.com/session_123"

        # Verify vacancy was reduced
        mock_transaction.update.assert_called_once()

        # Verify Stripe session was created with correct parameters
        mock_stripe_create.assert_called_once()
        call_args = mock_stripe_create.call_args[1]
        assert call_args["mode"] == "payment"
        assert call_args["line_items"][0]["quantity"] == 2
        assert call_args["line_items"][0]["price_data"]["unit_amount"] == 2500
        assert call_args["stripe_account"] == "acct_123"

    @patch("lib.stripe.checkout.db")
    def test_create_checkout_session_event_not_found(self, mock_db):
        """Test that checkout creation returns error URL when event doesn't exist."""
        mock_transaction = Mock()
        mock_logger = Mock()

        # Mock event document that doesn't exist
        mock_event_doc = Mock()
        mock_event_doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = (
            mock_event_doc
        )

        result = create_stripe_checkout_session_by_event_id(
            mock_transaction,
            mock_logger,
            "nonexistent-event",
            2,
            False,
            "https://example.com/cancel",
            "https://example.com/success",
        )

        result_data = json.loads(result)
        assert result_data["url"] == "/error"
        mock_logger.error.assert_called_once()

    @patch("lib.stripe.checkout.db")
    @patch("lib.stripe.checkout.datetime")
    def test_create_checkout_session_event_concluded(self, mock_datetime, mock_db):
        """Test that checkout creation returns error URL when event has already concluded."""
        # Setup mock datetime - current time is after event end
        mock_now = datetime(2025, 1, 1, 12, 0, 0, tzinfo=UTC)
        mock_datetime.now.return_value = mock_now

        mock_transaction = Mock()
        mock_logger = Mock()

        # Mock event document with past end date
        mock_event_doc = Mock()
        mock_event_doc.exists = True
        mock_event_doc.to_dict.return_value = {
            "paused": False,
            "endDate": Mock(
                timestamp_pb=Mock(
                    return_value=Mock(
                        ToDatetime=Mock(
                            return_value=datetime(2024, 12, 31, 23, 59, 59, tzinfo=UTC)
                        )
                    )
                )
            ),
            "registrationDeadline": Mock(
                timestamp_pb=Mock(
                    return_value=Mock(
                        ToDatetime=Mock(
                            return_value=datetime(2024, 12, 30, 23, 59, 59, tzinfo=UTC)
                        )
                    )
                )
            ),
        }
        mock_db.collection.return_value.document.return_value.get.return_value = (
            mock_event_doc
        )

        result = create_stripe_checkout_session_by_event_id(
            mock_transaction,
            mock_logger,
            "event-456",
            2,
            False,
            "https://example.com/cancel",
            "https://example.com/success",
        )

        result_data = json.loads(result)
        assert result_data["url"] == "/error"
        mock_logger.warning.assert_called_once()

    @patch("lib.stripe.checkout.db")
    @patch("lib.stripe.checkout.datetime")
    def test_create_checkout_session_payments_not_active(self, mock_datetime, mock_db):
        """Test that checkout creation returns cancel URL when payments are not enabled for event."""
        # Setup mock datetime
        mock_now = datetime(2024, 6, 1, 12, 0, 0, tzinfo=UTC)
        mock_datetime.now.return_value = mock_now

        mock_transaction = Mock()
        mock_logger = Mock()

        # Mock event document with payments disabled
        mock_event_doc = Mock()
        mock_event_doc.exists = True
        mock_event_doc.to_dict.return_value = {
            "paused": False,
            "endDate": Mock(
                timestamp_pb=Mock(
                    return_value=Mock(
                        ToDatetime=Mock(
                            return_value=datetime(2024, 12, 31, 23, 59, 59, tzinfo=UTC)
                        )
                    )
                )
            ),
            "registrationDeadline": Mock(
                timestamp_pb=Mock(
                    return_value=Mock(
                        ToDatetime=Mock(
                            return_value=datetime(2024, 12, 30, 23, 59, 59, tzinfo=UTC)
                        )
                    )
                )
            ),
            "paymentsActive": False,
        }
        mock_db.collection.return_value.document.return_value.get.return_value = (
            mock_event_doc
        )

        result = create_stripe_checkout_session_by_event_id(
            mock_transaction,
            mock_logger,
            "event-456",
            2,
            False,
            "https://example.com/cancel",
            "https://example.com/success",
        )

        result_data = json.loads(result)
        assert result_data["url"] == "https://example.com/cancel"

    @patch("lib.stripe.checkout.db")
    @patch("lib.stripe.checkout.datetime")
    def test_create_checkout_session_organiser_not_found(self, mock_datetime, mock_db):
        """Test that checkout creation returns error URL when organiser doesn't exist."""
        # Setup mock datetime
        mock_now = datetime(2024, 6, 1, 12, 0, 0, tzinfo=UTC)
        mock_datetime.now.return_value = mock_now

        mock_transaction = Mock()
        mock_logger = Mock()

        # Mock event document
        mock_event_doc = Mock()
        mock_event_doc.exists = True
        mock_event_doc.to_dict.return_value = {
            "paused": False,
            "endDate": Mock(
                timestamp_pb=Mock(
                    return_value=Mock(
                        ToDatetime=Mock(
                            return_value=datetime(2024, 12, 31, 23, 59, 59, tzinfo=UTC)
                        )
                    )
                )
            ),
            "registrationDeadline": Mock(
                timestamp_pb=Mock(
                    return_value=Mock(
                        ToDatetime=Mock(
                            return_value=datetime(2024, 12, 30, 23, 59, 59, tzinfo=UTC)
                        )
                    )
                )
            ),
            "paymentsActive": True,
            "organiserId": "org-123",
        }

        # Mock organiser document that doesn't exist
        mock_organiser_doc = Mock()
        mock_organiser_doc.exists = False

        mock_db.collection.return_value.document.return_value.get.side_effect = [
            mock_event_doc,
            mock_organiser_doc,
        ]

        result = create_stripe_checkout_session_by_event_id(
            mock_transaction,
            mock_logger,
            "event-456",
            2,
            False,
            "https://example.com/cancel",
            "https://example.com/success",
        )

        result_data = json.loads(result)
        assert result_data["url"] == "/error"

    @patch("lib.stripe.checkout.db")
    @patch("lib.stripe.checkout.datetime")
    def test_create_checkout_session_insufficient_vacancy(self, mock_datetime, mock_db):
        """Test that checkout creation returns cancel URL when not enough tickets are available."""
        # Setup mock datetime
        mock_now = datetime(2024, 6, 1, 12, 0, 0, tzinfo=UTC)
        mock_datetime.now.return_value = mock_now

        mock_transaction = Mock()
        mock_logger = Mock()

        # Mock event document with insufficient vacancy
        mock_event_doc = Mock()
        mock_event_doc.exists = True
        mock_event_doc.to_dict.return_value = {
            "paused": False,
            "endDate": Mock(
                timestamp_pb=Mock(
                    return_value=Mock(
                        ToDatetime=Mock(
                            return_value=datetime(2024, 12, 31, 23, 59, 59, tzinfo=UTC)
                        )
                    )
                )
            ),
            "registrationDeadline": Mock(
                timestamp_pb=Mock(
                    return_value=Mock(
                        ToDatetime=Mock(
                            return_value=datetime(2024, 12, 30, 23, 59, 59, tzinfo=UTC)
                        )
                    )
                )
            ),
            "paymentsActive": True,
            "organiserId": "org-123",
            "vacancy": 1,  # Only 1 ticket available, but requesting 2
        }

        # Mock organiser document
        mock_organiser_doc = Mock()
        mock_organiser_doc.exists = True
        mock_organiser_doc.to_dict.return_value = {
            "stripeAccount": "acct_123",
            "stripeAccountActive": True,
        }

        mock_db.collection.return_value.document.return_value.get.side_effect = [
            mock_event_doc,
            mock_organiser_doc,
        ]

        result = create_stripe_checkout_session_by_event_id(
            mock_transaction,
            mock_logger,
            "event-456",
            2,
            False,
            "https://example.com/cancel",
            "https://example.com/success",
        )

        result_data = json.loads(result)
        assert result_data["url"] == "https://example.com/cancel"
        mock_logger.warning.assert_called_once()

    @patch("lib.stripe.checkout.stripe.checkout.Session.create")
    @patch("lib.stripe.checkout.db")
    @patch("lib.stripe.checkout.datetime")
    def test_create_checkout_session_with_stripe_fees_to_customer(
        self, mock_datetime, mock_db, mock_stripe_create
    ):
        """Test checkout session creation when Stripe fees are passed to customer as shipping."""
        # Setup mock datetime
        mock_now = datetime(2024, 6, 1, 12, 0, 0, tzinfo=UTC)
        mock_datetime.now.return_value = mock_now

        mock_transaction = Mock()
        mock_logger = Mock()

        # Mock event document with stripe fees to customer enabled
        mock_event_doc = Mock()
        mock_event_doc.exists = True
        mock_event_doc.to_dict.return_value = {
            "name": "Test Event",
            "paused": False,
            "endDate": Mock(
                timestamp_pb=Mock(
                    return_value=Mock(
                        ToDatetime=Mock(
                            return_value=datetime(2024, 12, 31, 23, 59, 59, tzinfo=UTC)
                        )
                    )
                )
            ),
            "registrationDeadline": Mock(
                timestamp_pb=Mock(
                    return_value=Mock(
                        ToDatetime=Mock(
                            return_value=datetime(2024, 12, 30, 23, 59, 59, tzinfo=UTC)
                        )
                    )
                )
            ),
            "paymentsActive": True,
            "organiserId": "org-123",
            "vacancy": 10,
            "price": 2500,
            "stripeFeeToCustomer": True,  # Fees passed to customer
            "promotionalCodesEnabled": False,
        }

        # Mock organiser document
        mock_organiser_doc = Mock()
        mock_organiser_doc.exists = True
        mock_organiser_doc.to_dict.return_value = {
            "stripeAccount": "acct_123",
            "stripeAccountActive": True,
        }

        mock_db.collection.return_value.document.return_value.get.side_effect = [
            mock_event_doc,
            mock_organiser_doc,
        ]

        # Mock Stripe checkout session creation
        mock_checkout = Mock()
        mock_checkout.url = "https://checkout.stripe.com/session_123"
        mock_stripe_create.return_value = mock_checkout

        result = create_stripe_checkout_session_by_event_id(
            mock_transaction,
            mock_logger,
            "event-456",
            2,
            False,
            "https://example.com/cancel",
            "https://example.com/success",
        )

        # Verify shipping options were added for stripe fees
        call_args = mock_stripe_create.call_args[1]
        assert "shipping_options" in call_args
        assert call_args["shipping_options"] is not None
        assert len(call_args["shipping_options"]) == 1
        assert (
            call_args["shipping_options"][0]["shipping_rate_data"]["display_name"]
            == "Stripe Card Surcharge Fees"
        )

    @patch("lib.stripe.checkout.stripe.checkout.Session.create")
    @patch("lib.stripe.checkout.db")
    @patch("lib.stripe.checkout.datetime")
    def test_create_checkout_session_with_promotional_codes(
        self, mock_datetime, mock_db, mock_stripe_create
    ):
        """Test checkout session creation when promotional codes are enabled for the event."""
        # Setup mock datetime
        mock_now = datetime(2024, 6, 1, 12, 0, 0, tzinfo=UTC)
        mock_datetime.now.return_value = mock_now

        mock_transaction = Mock()
        mock_logger = Mock()

        # Mock event document with promotional codes enabled
        mock_event_doc = Mock()
        mock_event_doc.exists = True
        mock_event_doc.to_dict.return_value = {
            "name": "Test Event",
            "paused": False,
            "endDate": Mock(
                timestamp_pb=Mock(
                    return_value=Mock(
                        ToDatetime=Mock(
                            return_value=datetime(2024, 12, 31, 23, 59, 59, tzinfo=UTC)
                        )
                    )
                )
            ),
            "registrationDeadline": Mock(
                timestamp_pb=Mock(
                    return_value=Mock(
                        ToDatetime=Mock(
                            return_value=datetime(2024, 12, 30, 23, 59, 59, tzinfo=UTC)
                        )
                    )
                )
            ),
            "paymentsActive": True,
            "organiserId": "org-123",
            "vacancy": 10,
            "price": 2500,
            "stripeFeeToCustomer": False,
            "promotionalCodesEnabled": True,  # Promotional codes enabled
        }

        # Mock organiser document
        mock_organiser_doc = Mock()
        mock_organiser_doc.exists = True
        mock_organiser_doc.to_dict.return_value = {
            "stripeAccount": "acct_123",
            "stripeAccountActive": True,
        }

        mock_db.collection.return_value.document.return_value.get.side_effect = [
            mock_event_doc,
            mock_organiser_doc,
        ]

        # Mock Stripe checkout session creation
        mock_checkout = Mock()
        mock_checkout.url = "https://checkout.stripe.com/session_123"
        mock_stripe_create.return_value = mock_checkout

        result = create_stripe_checkout_session_by_event_id(
            mock_transaction,
            mock_logger,
            "event-456",
            2,
            False,
            "https://example.com/cancel",
            "https://example.com/success",
        )

        # Verify promotional codes were enabled
        call_args = mock_stripe_create.call_args[1]
        assert call_args["allow_promotion_codes"] is True


class TestGetStripeCheckoutUrl:
    """Tests for the main checkout URL endpoint."""

    @patch("lib.stripe.checkout.create_stripe_checkout_session_by_event_id")
    @patch("lib.stripe.checkout.db")
    def test_get_checkout_url_success(self, mock_db, mock_create_session):
        """Test successful retrieval of checkout URL with valid request data."""
        # Mock request
        mock_request = Mock()
        mock_request.data = {
            "eventId": "event-123",
            "isPrivate": False,
            "quantity": 2,
            "cancelUrl": "https://example.com/cancel",
            "successUrl": "https://example.com/success",
        }

        # Mock transaction
        mock_db.transaction.return_value = Mock()

        # Mock session creation response
        mock_create_session.return_value = json.dumps(
            {"url": "https://checkout.stripe.com/session_123"}
        )

        with patch("lib.stripe.checkout.uuid.uuid4", return_value="test-uuid"):
            result = get_stripe_checkout_url_by_event_id(mock_request)

        # Verify result
        result_data = json.loads(result)
        assert result_data["url"] == "https://checkout.stripe.com/session_123"

    @patch("lib.stripe.checkout.db")
    def test_get_checkout_url_invalid_request_data(self, mock_db):
        """Test that endpoint returns error URL when request data is invalid."""
        # Mock request with missing required fields
        mock_request = Mock()
        mock_request.data = {
            "eventId": "event-123",
            # Missing other required fields
        }

        with patch("lib.stripe.checkout.uuid.uuid4", return_value="test-uuid"):
            result = get_stripe_checkout_url_by_event_id(mock_request)

        # Verify error response
        result_data = json.loads(result)
        assert result_data["url"] == "/error"

    @patch("lib.stripe.checkout.db")
    def test_get_checkout_url_wrong_data_types(self, mock_db):
        """Test that endpoint returns error URL when request data has wrong types."""
        # Mock request with wrong data types
        mock_request = Mock()
        mock_request.data = {
            "eventId": 123,  # Should be string
            "isPrivate": "not-a-boolean",  # Should be boolean
            "quantity": "two",  # Should be integer
            "cancelUrl": None,  # Should be string
            "successUrl": [],  # Should be string
        }

        with patch("lib.stripe.checkout.uuid.uuid4", return_value="test-uuid"):
            result = get_stripe_checkout_url_by_event_id(mock_request)

        # Verify error response
        result_data = json.loads(result)
        assert result_data["url"] == "/error"
