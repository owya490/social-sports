import os

import google.cloud.firestore
import google.cloud.logging
import pytz
from firebase_admin import firestore, initialize_app
from google.cloud import firestore

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./functions_key.json"

app = initialize_app()

firebase_project = os.environ.get("PROJECT_NAME")

db: google.cloud.firestore.Client = firestore.Client(project=firebase_project)

client = google.cloud.logging.Client()
client.setup_logging()

ACTIVE_PUBLIC = "Events/Active/Public"
ACTIVE_PRIVATE = "Events/Active/Private"
INACTIVE_PUBLIC = "Events/InActive/Public"
INACTIVE_PRIVATE = "Events/InActive/Private"
EVENT_METADATA = "EventsMetadata"

SYDNEY_TIMEZONE = pytz.timezone("Australia/Sydney")
