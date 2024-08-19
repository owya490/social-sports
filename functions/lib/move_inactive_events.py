from datetime import date

from firebase_admin import firestore
from firebase_functions import https_fn, options, scheduler_fn
from google.cloud import firestore
from google.cloud.firestore import DocumentReference, Transaction
from google.protobuf.timestamp_pb2 import Timestamp
from lib.auth import *
from lib.constants import *

ACTIVE_PUBLIC = "Events/Active/Public"
ACTIVE_PRIVATE = "Events/Active/Private"
INACTIVE_PUBLIC = "Events/InActive/Public"
INACTIVE_PRIVATE = "Events/InActive/Private"


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


def get_and_move_public_inactive_events(today: date):
  # Get all Active Events in Public
  public_events_ref = db.collection(ACTIVE_PUBLIC)
  public_events = public_events_ref.stream()

  # Scan through and if the endDate is past todays date then move it to Events/Inactive/Public
  for event in public_events:
    event_id = event.id
    event_dict = event.to_dict()
    event_end_date: Timestamp  = event_dict.get("endDate").timestamp_pb()

    if event_end_date.ToDatetime().date() < today:
      transaction = db.transaction()
      # The events datetime is earlier so it has already passed, hence we should move it
      move_event_to_inactive(transaction=transaction, old_event_ref=db.collection(ACTIVE_PUBLIC).document(event_id), new_event_ref=db.collection(INACTIVE_PUBLIC).document(event_id))


def get_and_move_private_inactive_events(today: date):

  # Get all Active Private Events
  private_events_ref = db.collection(ACTIVE_PRIVATE)
  private_events = private_events_ref.stream()
  
  # Repeat for Private events, checking if endDate has passed and move to Events/Inactive/Private
  for event in private_events:
    event_id = event.id
    event_dict = event.to_dict()
    event_end_date: Timestamp = event_dict.get("endDate").timestamp_pb()

    if event_end_date.ToDatetime().date() < today:
      transaction = db.transaction()
      # The events datetime is earlier so it has already passed, hence we should move it
      move_event_to_inactive(transaction=transaction, old_event_ref=db.collection(ACTIVE_PRIVATE).document(event_id), new_event_ref=db.collection(INACTIVE_PRIVATE).document(event_id))



@scheduler_fn.on_schedule(schedule="every day 00:00", region="australia-southeast1")
def move_inactive_events(event: scheduler_fn.ScheduledEvent) -> None:
  
  today = date.today()

  get_and_move_public_inactive_events(today)
  get_and_move_private_inactive_events(today)

  return https_fn.Response(f"Moved all Public and Private Active Events which are past their end date to Inactive.")
 