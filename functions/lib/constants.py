import os

import google.cloud.firestore
import google.cloud.logging
import pytz
from firebase_admin import firestore, initialize_app
from google.cloud import firestore
from posthog import Posthog

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./functions_key.json"

app = initialize_app()

firebase_project = os.environ.get("PROJECT_NAME")

db: google.cloud.firestore.Client = firestore.Client(project=firebase_project)

client = google.cloud.logging.Client()
client.setup_logging()
POSTHOG_API_KEY = os.environ.get("POSTHOG_API_KEY")
posthog = Posthog(project_api_key=str(POSTHOG_API_KEY), host='https://app.posthog.com')
# posthog = Posthog(project_api_key="", host='https://app.posthog.com')


ACTIVE_PUBLIC = "Events/Active/Public"
ACTIVE_PRIVATE = "Events/Active/Private"
INACTIVE_PUBLIC = "Events/InActive/Public"
INACTIVE_PRIVATE = "Events/InActive/Private"
EVENT_METADATA = "EventsMetadata"

SYDNEY_TIMEZONE = pytz.timezone("Australia/Sydney")
