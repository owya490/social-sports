import os

import google.cloud.firestore
import google.cloud.logging
import pytz
from firebase_admin import firestore, initialize_app
from google.cloud import firestore

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./functions_key.json"

app = initialize_app()
# I think this is none
firebase_project = os.environ.get("PROJECT_NAME")

GCLOUD_PROJECT = os.environ.get("GCLOUD_PROJECT")

IS_PROD = GCLOUD_PROJECT == "socialsportsprod"

MIN_INSTANCE = 1 if IS_PROD else 0

# If none resolves to use Google Application Credentials                                                                                                                      
db: google.cloud.firestore.Client = firestore.Client(project=firebase_project)
                 
client = google.cloud.logging.Client()
client.setup_logging()

ACTIVE_PUBLIC = "Events/Active/Public"
ACTIVE_PRIVATE = "Events/Active/Private"
INACTIVE_PUBLIC = "Events/InActive/Public"
INACTIVE_PRIVATE = "Events/InActive/Private"
EVENT_METADATA = "EventsMetadata"

SYDNEY_TIMEZONE = pytz.timezone("Australia/Sydney")

# Stripe requires each checkout session have a minimum price of $0.50
# https://docs.stripe.com/api/charges#:~:text=The%20minimum%20amount%20is%20%240.50%20US%20or%20equivalent%20in%20charge%20currency.
MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS = 50
