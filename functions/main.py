import os
from datetime import date

import google.cloud.firestore
from firebase_admin import firestore, initialize_app
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import DocumentReference, Transaction
from google.protobuf.timestamp_pb2 import Timestamp

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./functions_key.json"


app = initialize_app()

db: google.cloud.firestore.Client = firestore.Client(project="socialsports-44162")

@firestore.transactional
def move_event_to_inactive(transaction: Transaction, old_event_ref: DocumentReference, new_event_ref: DocumentReference):

  # Get the event in the transaction to ensure operations are atomic
  event_snapshot = old_event_ref.get(transaction=transaction)
  event_dict = event_snapshot.to_dict()
  event_dict.update({"isActive": False})

  # Set the document in InActive
  transaction.set(new_event_ref, event_dict)

  # Delete from the active partition
  transaction.delete(old_event_ref)

# Moves all inactive events from the active folder to the inactive folder
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
    print(event_dict)
    print(event_dict.get("endDate"))
    event_end_date: Timestamp  = event_dict.get("endDate").timestamp_pb()

    if event_end_date.ToDatetime().date() < today:
      transaction = db.transaction()
      # The events datetime is earlier so it has already passed, hence we should move it
      move_event_to_inactive(transaction=transaction, old_event_ref=db.collection("Events/Active/Public").document(event_id), new_event_ref=db.collection("Events/InActive/Public").document(event_id))

  # Get all Active Private Events
  private_events_ref = db.collection("Events/Active/Private")
  private_events = private_events_ref.stream()

  # Repeat for Private events, checking if endDate has passed and move to Events/Inactive/Private
  for event in private_events:
    event_id = event.id
    event_dict = event.to_dict()
    event_end_date: Timestamp = event_dict.get("endDate").timestamp_pb()

    if event_end_date.ToDatetime().date() < today:
      transaction = db.transaction()
      # The events datetime is earlier so it has already passed, hence we should move it
      move_event_to_inactive(transaction=transaction, old_event_ref=db.collection("Events/Active/Private").document(event_id), new_event_ref=db.collection("Events/InActive/Private").document(event_id))

  return https_fn.Response(f"Moved all Public and Private Active Events which are past their end date to Inactive.")


import stripe

stripe.api_key = os.environ.get("STRIPE_API_KEY")
@https_fn.on_request(cors=options.CorsOptions(cors_origins="*", cors_methods=["post"]))
def create_stripe_standard_account():
  account = stripe.Account.create(type="standard")
  return stripe.AccountLink.create(
    account=account,
    refresh_url="https://example.com/reauth",
    return_url="https://example.com/return",
    type="account_onboarding",
  )
