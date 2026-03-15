import json
import unittest
from unittest.mock import ANY, Mock, patch

from lib.stripe.commons import *
from lib.stripe.create_account import *


class TestCreateStandardStripeAccount(unittest.TestCase):

  @patch("lib.stripe.create_account.db")
  @patch("lib.stripe.create_account.check_and_update_organiser_stripe_account")
  def test_uses_authenticated_uid_when_request_organiser_is_empty(self, mock_check_and_update, mock_db):
    test_url = "https://test.com"
    expected_response = json.dumps({"url": test_url})
    transaction = Mock()
    organiser_ref = Mock()

    mock_check_and_update.return_value = expected_response
    mock_db.transaction.return_value = transaction
    mock_db.collection.return_value.document.return_value = organiser_ref

    mock_request = Mock()
    mock_request.data = {
      "organiser": "",
      "refreshUrl": "https://refresh.test",
      "returnUrl": "https://return.test",
    }
    mock_request.auth = Mock(uid="auth-uid")

    response = create_stripe_standard_account(mock_request)

    self.assertEqual(expected_response, response)
    mock_db.collection.assert_called_once_with("Users/Active/Private")
    mock_db.collection.return_value.document.assert_called_once_with("auth-uid")
    mock_check_and_update.assert_called_once_with(
      transaction, ANY, organiser_ref, "https://return.test", "https://refresh.test"
    )

  def test_returns_error_url_when_required_request_fields_are_missing(self):
    mock_request = Mock()
    mock_request.data = {
      "organiser": "auth-uid",
      "returnUrl": "https://return.test",
    }
    mock_request.auth = Mock(uid="auth-uid")

    response = create_stripe_standard_account(mock_request)

    self.assertEqual(ERROR_URL, json.loads(response)["url"])
