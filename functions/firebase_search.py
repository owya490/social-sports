import typesense
from typesense.exceptions import TypesenseClientError
from dotenv import load_dotenv
load_dotenv()
import os
import firebase_admin
from firebase_admin import credentials, firestore
from firebase_functions.firestore_fn import (
  on_document_created,
  on_document_deleted,
  on_document_updated,
  on_document_written,
  Event,
  Change,
  DocumentSnapshot,
)

from decouple import config

# create db client to firebase
firebase_config = {
    "apiKey": config("FIREBASE_DEV_API_KEY"),
    "authDomain": config("FIREBASE_DEV_AUTH_DOMAIN"),
    "databaseURL": config("FIREBASE_DEV_DATABASE_URL"),
    "projectId": config("FIREBASE_DEV_PROJECT_ID"),
    "storageBucket": config("FIREBASE_DEV_STORAGE_BUCKET"),
    "messagingSenderId": config("FIREBASE_DEV_MESSAGING_SENDER_ID"),
    "appId": config("FIREBASE_DEV_APP_ID"),
    "measurementId": config("FIREBASE_DEV_MEASUREMENT_ID"),
}

# Initialize the Firebase Admin SDK using the environment variables
cred = credentials.Certificate(firebase_config)
firebase_admin.initialize_app(cred)
db = firestore.client()

TYPESENSE_ADMIN_API_KEY = os.getenv('TYPESENSE_ADMIN_API_KEY')

# Initialise the Typesense client
# Information below can be found in confluence - Typesense Search API Keys
ts_client = typesense.Client({
    'api_key': TYPESENSE_ADMIN_API_KEY,
    'nodes': [{
        'host': 'e7klnhfmoidgu0cvp-1.a1.typesense.net',
        'port': '443',
        'protocol': 'https'
    }],
    'connection_timeout_seconds': 2
})

# create all relevant tables in typesense from firebase search manually
create_events_collection_response = ts_client.collections.create({
    "name": "Events",
    "fields": [
        {"name": "startDate", "type": "auto"},
        {"name": "endDate", "type": "auto"},
        {"name": "location", "type": "string"},
        {"name": "capacity", "type": "int32"},
        {"name": "vacancy", "type": "int32"},
        {"name": "price", "type": "float"},
        {"name": "registrationDeadline", "type": "auto"},
        {"name": "organiserId", "type": "string"},
        {"name": "name", "type": "string"},
        {"name": "description", "type": "string"},
        {"name": "image", "type": "string"},
        {"name": "eventTags", "type": "string[]"},
        {"name": "isActive", "type": "bool"},
        {"name": "attendees", "type": "string[]"},
    ],
})

print(create_events_collection_response)


# backfill typesense database with existing data from firebase
def backfill_data():
    events_collection_ref = db.collection("Events")
    ts_events_collection = ts_client.collections("Events")

    db_events_documents = events_collection_ref.stream()

    for doc in db_events_documents:
        data = doc.to_dict()
        ts_events_collection.upsert(data)

backfill_data()


# Triggers function when a new document is added to the Events table
@on_document_created(document="Events/{eventId}")
def index_event(event: Event[Change[DocumentSnapshot | None]]) -> None:
    event_id = event.params["eventId"]
    event_ref = db.collection("Events").document(event_id)
    
    if event_ref:
        event_data = event_ref.get().to_dict()

        if event_data:
            event_document = {
                "startDate": event_data.get("startDate"),
                "endDate": event_data.get("endDate"),
                "location": event_data.get("location"),
                "capacity": event_data.get("capacity"),
                "vacancy": event_data.get("vacancy"),
                "registrationDeadline": event_data.get("registrationDeadline"),
                "organiserId": event_data.get("organiserId"),
                "name": event_data.get("name"),
                "description": event_data.get("description"),
                "image": event_data.get("image"),
                "eventTags": event_data.get("eventTags"),
                "isActive": event_data.get("isActive"),
                "attendees": event_data.get("attendees"),
            }

            # Index the document in Typesense
            ts_client.collections["Events"].documents.create(event_document)

