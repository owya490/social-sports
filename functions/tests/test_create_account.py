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
