import os

import google.cloud.firestore
import google.cloud.logging
from firebase_admin import firestore, initialize_app
from google.cloud import firestore

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./functions_key.json"

app = initialize_app()

db: google.cloud.firestore.Client = firestore.Client(project="socialsports-44162")

client = google.cloud.logging.Client()
client.setup_logging()

