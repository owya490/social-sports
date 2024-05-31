import os

import stripe

stripe.api_key = os.environ.get("STRIPE_API_KEY")

STRIPE_WEBHOOK_ENDPOINT_SECRET = os.environ.get("STRIPE_WEBHOOK_ENDPOINT_SECRET")

ERROR_URL = "/error"
