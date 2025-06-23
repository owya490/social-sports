import os
import uuid

import requests
from firebase_functions import https_fn, scheduler_fn
from lib.constants import firebase_project
from lib.logging import Logger

# List of endpoints to ping (HEAD request)
DEV_ENDPOINTS_TO_PING = [
    "https://get-stripe-checkout-url-by-event-id-7aikp3s36a-ts.a.run.app",  # Get Stripe Checkout Url By Event Id
    "https://australia-southeast1-socialsports-44162.cloudfunctions.net/createRecurrenceTemplate",  # Create Recurrence Template
    "https://australia-southeast1-socialsports-44162.cloudfunctions.net/updateRecurrenceTemplate",  # Update Recurrence Template
]

PROD_ENDPOINTS_TO_PING = [
    "https://get-stripe-checkout-url-by-event-id-7s5rajjxba-ts.a.run.app",  # Get Stripe Checkout Url By Event Id
    "https://australia-southeast1-socialsportsprod.cloudfunctions.net/createRecurrenceTemplate",  # Create Recurrence Template
    "https://australia-southeast1-socialsportsprod.cloudfunctions.net/updateRecurrenceTemplate",  # Update Recurrence Template
]

# Use ENV environment variable to select endpoints list (set ENV=dev for development)
ENDPOINTS_TO_PING = (
    PROD_ENDPOINTS_TO_PING
    if firebase_project == "socialsportsprod"
    else DEV_ENDPOINTS_TO_PING
)


@scheduler_fn.on_schedule(
    schedule="every 1 minutes",
    region="australia-southeast1",
    timezone=scheduler_fn.Timezone("Australia/Sydney"),
)
def coldstart(event: scheduler_fn.ScheduledEvent) -> None:
    uid = str(uuid.uuid4())
    logger = Logger(f"coldstart_logger_{uid}")
    logger.add_tag("uuid", uid)

    logger.info(f"Pinging {ENDPOINTS_TO_PING} endpoints to keep them warm.")
    results = []
    for url in ENDPOINTS_TO_PING:
        try:
            response = requests.options(url, timeout=5)
            logger.info(f"OPTIONS {url} - Status: {response.status_code}")
            results.append((url, response.status_code))
        except Exception as e:
            logger.error(f"Failed to ping {url}: {e}")
            results.append((url, str(e)))

    logger.info(f"Pinged endpoints: {results}")
