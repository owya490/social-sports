import json
import os

import stripe
from firebase_functions import https_fn, options

stripe.api_key = os.environ.get("STRIPE_API_KEY")

STRIPE_WEBHOOK_ENDPOINT_SECRET = ""

ERROR_URL = "/error"
