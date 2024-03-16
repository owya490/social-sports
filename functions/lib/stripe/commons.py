import json
import os

import stripe
from firebase_functions import https_fn, options

stripe.api_key = os.environ.get("STRIPE_API_KEY")

STRIPE_WEBHOOK_ENDPOINT_SECRET = ""

ERROR_URL = "https://localhost:3000/error"


def create_https_response_from_code_and_message_and_url(status_code, message=None, url=None):
  payload = {}
  if message:
    payload["message"] = message
  if url:
    payload["url"] = url
  return https_fn.Response(json.dumps(payload), status=status_code)