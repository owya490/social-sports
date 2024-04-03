import os

import stripe

stripe.api_key = os.environ.get("STRIPE_API_KEY")

STRIPE_WEBHOOK_ENDPOINT_SECRET = os.environ.get("STRIPE_WEBHOOK_ENDPOINT_SECRET")
# STRIPE_WEBHOOK_ENDPOINT_SECRET = "whsec_27c78058b4b2a2e98bc9b0da2e4eb4eb49e0eb48da44eb47c6c28157fec98cfe"

ERROR_URL = "/error"
