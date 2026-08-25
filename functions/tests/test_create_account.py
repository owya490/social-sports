import unittest
from unittest.mock import Mock, patch

from lib.stripe.commons import *
from lib.stripe.create_account import *


class TestCreateStandardStripeAccount(unittest.TestCase):

  @patch("lib.stripe.create_account.check_and_update_organiser_stripe_account")
  def test_validate_create_account_request_data(self, mock):
    # When
    TEST_URL = "https://test.com"
    mock_url = Mock()
    mock_url.return_value = TEST_URL

    mock_request: https_fn.Request = https_fn.Request({
      "organiser": "owen",
      "returnUrl": "some_url"
    })

    # Then
    response = create_stripe_standard_account(mock_request)

    # Verify
    self.assertEqual(TEST_URL, response.get_json()["url"])


class TestResyncStandardStripeAccount(unittest.TestCase):

  @patch("lib.stripe.create_account.resync_organiser_stripe_account")
  def test_resync_requires_authenticated_organiser(self, mock_resync):
    mock_resync.return_value = {"stripeAccountActive": True, "needsOnboarding": False}

    mock_request = Mock()
    mock_request.auth = Mock(uid="owen")
    mock_request.data = {"organiser": "owen"}

    response = resync_stripe_standard_account(mock_request)

    self.assertEqual({"stripeAccountActive": True, "needsOnboarding": False}, response)
    mock_resync.assert_called_once()

  def test_resync_rejects_unauthenticated_request(self):
    mock_request = Mock()
    mock_request.auth = None
    mock_request.data = {"organiser": "owen"}

    response = resync_stripe_standard_account(mock_request)

    self.assertEqual(401, response.status_code)
