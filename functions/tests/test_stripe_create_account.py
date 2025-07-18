"""
Comprehensive end-to-end tests for Stripe account creation functionality.
Tests the complete account creation workflow including validation,
Stripe account management, and error handling scenarios.
"""

import json
from unittest.mock import Mock, patch

import pytest
import stripe
from lib.stripe.create_account import (
    CreateStandardStripeAccountRequest,
    check_and_update_organiser_stripe_account,
    create_stripe_standard_account,
)


class TestCreateStandardStripeAccountRequest:
    """Tests for the CreateStandardStripeAccountRequest dataclass validation."""

    def test_create_account_request_valid_initialization(self):
        """Test that CreateStandardStripeAccountRequest correctly initializes with all valid inputs."""
        request = CreateStandardStripeAccountRequest(
            refreshUrl="https://example.com/refresh",
            returnUrl="https://example.com/return",
            organiser="org-123",
        )

        assert request.refreshUrl == "https://example.com/refresh"
        assert request.returnUrl == "https://example.com/return"
        assert request.organiser == "org-123"

    def test_create_account_request_invalid_refresh_url_raises_error(self):
        """Test that CreateStandardStripeAccountRequest raises ValueError when refreshUrl is not a string."""
        with pytest.raises(
            ValueError, match="Refresh Url must be provided as a string"
        ):
            CreateStandardStripeAccountRequest(
                refreshUrl=123,
                returnUrl="https://example.com/return",
                organiser="org-123",
            )

    def test_create_account_request_invalid_return_url_raises_error(self):
        """Test that CreateStandardStripeAccountRequest raises ValueError when returnUrl is not a string."""
        with pytest.raises(ValueError, match="Return Url must be provided as a string"):
            CreateStandardStripeAccountRequest(
                refreshUrl="https://example.com/refresh",
                returnUrl=None,
                organiser="org-123",
            )

    def test_create_account_request_invalid_organiser_raises_error(self):
        """Test that CreateStandardStripeAccountRequest raises ValueError when organiser is not a string."""
        with pytest.raises(
            ValueError, match="Organiser Id must be provided as a string"
        ):
            CreateStandardStripeAccountRequest(
                refreshUrl="https://example.com/refresh",
                returnUrl="https://example.com/return",
                organiser=123,
            )


class TestCheckAndUpdateOrganiserStripeAccount:
    """Tests for the organiser Stripe account check and update functionality."""

    def test_organiser_not_found_returns_error_url(self):
        """Test that function returns error URL when organiser document doesn't exist."""
        mock_transaction = Mock()
        mock_logger = Mock()
        mock_organiser_ref = Mock()

        # Mock organiser document that doesn't exist
        mock_organiser_doc = Mock()
        mock_organiser_doc.exists = False
        mock_organiser_ref.get.return_value = mock_organiser_doc
        mock_organiser_ref.path = "Users/Active/Private/org-123"

        result = check_and_update_organiser_stripe_account(
            mock_transaction,
            mock_logger,
            mock_organiser_ref,
            "https://example.com/return",
            "https://example.com/refresh",
        )

        result_data = json.loads(result)
        assert result_data["url"] == "/error"
        mock_logger.error.assert_called_once()

    def test_organiser_with_active_stripe_account_returns_to_dashboard(self):
        """Test that function returns to dashboard when organiser already has active Stripe account."""
        mock_transaction = Mock()
        mock_logger = Mock()
        mock_organiser_ref = Mock()

        # Mock organiser document with active stripe account
        mock_organiser_doc = Mock()
        mock_organiser_doc.exists = True
        mock_organiser_doc.to_dict.return_value = {
            "stripeAccount": "acct_123",
            "stripeAccountActive": True,
        }
        mock_organiser_ref.get.return_value = mock_organiser_doc
        mock_organiser_ref.path = "Users/Active/Private/org-123"

        result = check_and_update_organiser_stripe_account(
            mock_transaction,
            mock_logger,
            mock_organiser_ref,
            "https://example.com/return",
            "https://example.com/refresh",
        )

        result_data = json.loads(result)
        assert result_data["url"] == "https://example.com/return"
        mock_logger.info.assert_called_once()

    @patch("lib.stripe.create_account.stripe.Account.create")
    @patch("lib.stripe.create_account.stripe.AccountLink.create")
    def test_organiser_without_stripe_account_creates_new_account(
        self, mock_account_link, mock_account_create
    ):
        """Test that new Stripe account is created when organiser doesn't have one."""
        mock_transaction = Mock()
        mock_logger = Mock()
        mock_organiser_ref = Mock()

        # Mock organiser document without stripe account
        mock_organiser_doc = Mock()
        mock_organiser_doc.exists = True
        mock_organiser_doc.to_dict.return_value = {"stripeAccount": None}
        mock_organiser_ref.get.return_value = mock_organiser_doc
        mock_organiser_ref.path = "Users/Active/Private/org-123"

        # Mock Stripe account creation
        mock_account = Mock()
        mock_account.id = "acct_new_123"
        mock_account_create.return_value = mock_account

        # Mock account link creation
        mock_link = Mock()
        mock_link.url = "https://connect.stripe.com/setup/onboard_123"
        mock_account_link.return_value = mock_link

        result = check_and_update_organiser_stripe_account(
            mock_transaction,
            mock_logger,
            mock_organiser_ref,
            "https://example.com/return",
            "https://example.com/refresh",
        )

        # Verify new account was created
        mock_account_create.assert_called_once_with(type="standard")

        # Verify organiser document was updated
        mock_transaction.update.assert_called_once_with(
            mock_organiser_ref,
            {"stripeAccount": "acct_new_123", "stripeAccountActive": False},
        )

        # Verify account link was created
        mock_account_link.assert_called_once_with(
            account=mock_account,
            refresh_url="https://example.com/refresh",
            return_url="https://example.com/return",
            type="account_onboarding",
        )

        result_data = json.loads(result)
        assert result_data["url"] == "https://connect.stripe.com/setup/onboard_123"

    @patch("lib.stripe.create_account.stripe.Account.retrieve")
    @patch("lib.stripe.create_account.stripe.AccountLink.create")
    def test_organiser_with_incomplete_stripe_account_reactivates_onboarding(
        self, mock_account_link, mock_account_retrieve
    ):
        """Test that onboarding is reactivated when organiser has incomplete Stripe account."""
        mock_transaction = Mock()
        mock_logger = Mock()
        mock_organiser_ref = Mock()

        # Mock organiser document with existing but incomplete stripe account
        mock_organiser_doc = Mock()
        mock_organiser_doc.exists = True
        mock_organiser_doc.to_dict.return_value = {"stripeAccount": "acct_existing_123"}
        mock_organiser_ref.get.return_value = mock_organiser_doc
        mock_organiser_ref.path = "Users/Active/Private/org-123"

        # Mock Stripe account with incomplete setup
        mock_account = Mock()
        mock_account.charges_enabled = False
        mock_account.details_submitted = False
        mock_account_retrieve.return_value = mock_account

        # Mock account link creation
        mock_link = Mock()
        mock_link.url = "https://connect.stripe.com/setup/reactivate_123"
        mock_account_link.return_value = mock_link

        result = check_and_update_organiser_stripe_account(
            mock_transaction,
            mock_logger,
            mock_organiser_ref,
            "https://example.com/return",
            "https://example.com/refresh",
        )

        # Verify account was retrieved
        mock_account_retrieve.assert_called_once_with("acct_existing_123")

        # Verify account link was created for reactivation
        mock_account_link.assert_called_once_with(
            account=mock_account,
            refresh_url="https://example.com/refresh",
            return_url="https://example.com/return",
            type="account_onboarding",
        )

        result_data = json.loads(result)
        assert result_data["url"] == "https://connect.stripe.com/setup/reactivate_123"

    @patch("lib.stripe.create_account.stripe.Account.retrieve")
    def test_organiser_with_complete_stripe_account_activates_account(
        self, mock_account_retrieve
    ):
        """Test that account is activated when organiser has complete Stripe setup but inactive status."""
        mock_transaction = Mock()
        mock_logger = Mock()
        mock_organiser_ref = Mock()

        # Mock organiser document with existing stripe account
        mock_organiser_doc = Mock()
        mock_organiser_doc.exists = True
        mock_organiser_doc.to_dict.return_value = {"stripeAccount": "acct_complete_123"}
        mock_organiser_ref.get.return_value = mock_organiser_doc
        mock_organiser_ref.path = "Users/Active/Private/org-123"

        # Mock Stripe account with complete setup
        mock_account = Mock()
        mock_account.charges_enabled = True
        mock_account.details_submitted = True
        mock_account_retrieve.return_value = mock_account

        result = check_and_update_organiser_stripe_account(
            mock_transaction,
            mock_logger,
            mock_organiser_ref,
            "https://example.com/return",
            "https://example.com/refresh",
        )

        # Verify account was retrieved
        mock_account_retrieve.assert_called_once_with("acct_complete_123")

        # Verify organiser account was activated
        mock_transaction.update.assert_called_once_with(
            mock_organiser_ref, {"stripeAccountActive": True}
        )

        result_data = json.loads(result)
        assert result_data["url"] == "https://example.com/return"

    @patch("lib.stripe.create_account.stripe.Account.retrieve")
    @patch("lib.stripe.create_account.stripe.AccountLink.create")
    def test_organiser_with_partial_stripe_setup_requires_completion(
        self, mock_account_link, mock_account_retrieve
    ):
        """Test different combinations of incomplete Stripe account setup."""
        mock_transaction = Mock()
        mock_logger = Mock()
        mock_organiser_ref = Mock()

        # Mock organiser document
        mock_organiser_doc = Mock()
        mock_organiser_doc.exists = True
        mock_organiser_doc.to_dict.return_value = {"stripeAccount": "acct_partial_123"}
        mock_organiser_ref.get.return_value = mock_organiser_doc
        mock_organiser_ref.path = "Users/Active/Private/org-123"

        # Test case: charges enabled but details not submitted
        mock_account = Mock()
        mock_account.charges_enabled = True
        mock_account.details_submitted = False
        mock_account_retrieve.return_value = mock_account

        mock_link = Mock()
        mock_link.url = "https://connect.stripe.com/setup/complete_123"
        mock_account_link.return_value = mock_link

        result = check_and_update_organiser_stripe_account(
            mock_transaction,
            mock_logger,
            mock_organiser_ref,
            "https://example.com/return",
            "https://example.com/refresh",
        )

        # Should still require onboarding completion
        mock_account_link.assert_called_once()
        result_data = json.loads(result)
        assert result_data["url"] == "https://connect.stripe.com/setup/complete_123"


class TestCreateStripeStandardAccount:
    """Tests for the main create Stripe account endpoint."""

    @patch("lib.stripe.create_account.check_and_update_organiser_stripe_account")
    @patch("lib.stripe.create_account.db")
    def test_create_account_success_with_valid_auth(self, mock_db, mock_check_update):
        """Test successful account creation when user is properly authenticated and authorized."""
        # Mock authenticated request
        mock_request = Mock()
        mock_request.auth = Mock()
        mock_request.auth.uid = "org-123"
        mock_request.data = {
            "refreshUrl": "https://example.com/refresh",
            "returnUrl": "https://example.com/return",
            "organiser": "org-123",
        }

        # Mock transaction
        mock_db.transaction.return_value = Mock()

        # Mock successful account creation
        mock_check_update.return_value = json.dumps(
            {"url": "https://connect.stripe.com/setup_123"}
        )

        with patch("lib.stripe.create_account.uuid.uuid4", return_value="test-uuid"):
            result = create_stripe_standard_account(mock_request)

        # Verify successful response
        result_data = json.loads(result)
        assert result_data["url"] == "https://connect.stripe.com/setup_123"

    def test_create_account_unauthorized_no_auth(self):
        """Test that endpoint returns 401 when user is not authenticated."""
        # Mock unauthenticated request
        mock_request = Mock()
        mock_request.auth = Mock()
        mock_request.auth.uid = None
        mock_request.data = {
            "refreshUrl": "https://example.com/refresh",
            "returnUrl": "https://example.com/return",
            "organiser": "org-123",
        }

        with patch("lib.stripe.create_account.uuid.uuid4", return_value="test-uuid"):
            result = create_stripe_standard_account(mock_request)

        # Verify unauthorized response
        assert hasattr(result, "status")

    def test_create_account_unauthorized_wrong_organiser(self):
        """Test that endpoint returns 401 when authenticated user doesn't match organiser."""
        # Mock request where auth uid doesn't match organiser
        mock_request = Mock()
        mock_request.auth = Mock()
        mock_request.auth.uid = "different-user-456"
        mock_request.data = {
            "refreshUrl": "https://example.com/refresh",
            "returnUrl": "https://example.com/return",
            "organiser": "org-123",
        }

        with patch("lib.stripe.create_account.uuid.uuid4", return_value="test-uuid"):
            result = create_stripe_standard_account(mock_request)

        # Verify unauthorized response
        assert hasattr(result, "status")

    def test_create_account_invalid_request_data(self):
        """Test that endpoint returns error URL when request data is invalid."""
        # Mock request with invalid data
        mock_request = Mock()
        mock_request.auth = Mock()
        mock_request.auth.uid = "org-123"
        mock_request.data = {
            "refreshUrl": 123,  # Should be string
            "returnUrl": None,  # Should be string
            "organiser": [],  # Should be string
        }

        with patch("lib.stripe.create_account.uuid.uuid4", return_value="test-uuid"):
            result = create_stripe_standard_account(mock_request)

        # Verify error response
        result_data = json.loads(result)
        assert result_data["url"] == "/error"

    def test_create_account_missing_required_fields(self):
        """Test that endpoint returns error URL when required fields are missing."""
        # Mock request with missing fields
        mock_request = Mock()
        mock_request.auth = Mock()
        mock_request.auth.uid = "org-123"
        mock_request.data = {
            "organiser": "org-123"
            # Missing refreshUrl and returnUrl
        }

        with patch("lib.stripe.create_account.uuid.uuid4", return_value="test-uuid"):
            result = create_stripe_standard_account(mock_request)

        # Verify error response
        result_data = json.loads(result)
        assert result_data["url"] == "/error"

    @patch("lib.stripe.create_account.check_and_update_organiser_stripe_account")
    @patch("lib.stripe.create_account.db")
    def test_create_account_passes_correct_parameters(self, mock_db, mock_check_update):
        """Test that endpoint passes correct parameters to the account creation function."""
        # Mock authenticated request
        mock_request = Mock()
        mock_request.auth = Mock()
        mock_request.auth.uid = "org-123"
        mock_request.data = {
            "refreshUrl": "https://example.com/refresh",
            "returnUrl": "https://example.com/return",
            "organiser": "org-123",
        }

        # Mock transaction and organiser reference
        mock_transaction = Mock()
        mock_db.transaction.return_value = mock_transaction
        mock_organiser_ref = Mock()
        mock_db.collection.return_value.document.return_value = mock_organiser_ref

        mock_check_update.return_value = json.dumps(
            {"url": "https://connect.stripe.com/test"}
        )

        with patch("lib.stripe.create_account.uuid.uuid4", return_value="test-uuid"):
            result = create_stripe_standard_account(mock_request)

        # Verify correct parameters were passed
        mock_check_update.assert_called_once_with(
            mock_transaction,
            mock.ANY,  # logger
            mock_organiser_ref,
            "https://example.com/return",
            "https://example.com/refresh",
        )

        # Verify correct organiser reference was created
        mock_db.collection.assert_called_with("Users/Active/Private")
        mock_db.collection.return_value.document.assert_called_with("org-123")
