# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from datetime import date

import google.cloud.firestore
from firebase_admin import firestore, initialize_app
from firebase_functions import https_fn, options
from google.cloud.firestore import DocumentReference
from google.protobuf.timestamp_pb2 import Timestamp

initialize_app()

db: google.cloud.firestore.Client = firestore.client()


@firestore.transactional
def move_event_to_inactive(old_event_ref: DocumentReference, new_event_ref: DocumentReference):
  transaction = db.transaction()
  
  # Get the event in the transaction to ensure operations are atomic
  event_dict = old_event_ref.get(transaction=transaction).to_dict()
  event_dict.update("isActive", False)
  
  # Set the document in InActive
  transaction.set(new_event_ref, event_dict)
  
  # Delete from the active partition
  transaction.delete(old_event_ref)


@https_fn.on_request(cors=options.CorsOptions(cors_origins="*", cors_methods=["post"]))
def move_inactive_events(req: https_fn.Request) -> https_fn.Response:
  today = date.today()

  # Get all Active Events in Public
  public_events_ref = db.collection("Events/Active/Public")
  public_events = public_events_ref.stream()

  # Scan through and if the endDate is past todays date then move it to Events/Inactive/Public
  for event in public_events:
    event_id = event.id
    event_dict = event.to_dict()
    event_end_date: Timestamp = event_dict.get("endDate")

    if event_end_date.ToDatetime() < today:
      # The events datetime is earlier so it has already passed, hence we should move it
      move_event_to_inactive(public_events_ref.document(event_id), db.collection("Events/InActive/Public").document(event_id))

  # Get all Active Private Events
  private_events_ref = db.collection("Events/Active/Private")
  private_events = private_events_ref.stream()
  
  # Repeat for Private events, checking if endDate has passed and move to Events/Inactive/Private
  for event in private_events:
    event_id = event.id
    event_dict = event.to_dict()
    event_end_date: Timestamp = event_dict.get("endDate")

    if event_end_date.ToDatetime() < today:
      # The events datetime is earlier so it has already passed, hence we should move it
      move_event_to_inactive(private_events_ref.document(event_id), db.collection("Events/InActive/Private").document(event_id))