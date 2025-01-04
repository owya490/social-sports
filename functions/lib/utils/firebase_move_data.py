import json
import uuid
from dataclasses import dataclass

import stripe
from firebase_admin import firestore
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import DocumentReference, Transaction
from lib.constants import db
from lib.logging import Logger
from lib.move_inactive_events import ACTIVE_PRIVATE, INACTIVE_PRIVATE
from lib.stripe.commons import ERROR_URL


@firestore.transactional
def move_event(transaction: Transaction, old_event_ref: DocumentReference, new_event_ref: DocumentReference):
  
  # Get the event in the transaction to ensure operations are atomic
  event_snapshot = old_event_ref.get(transaction=transaction)
  event_dict = event_snapshot.to_dict()

  # Do mutation here
  event_dict.update({"isActive": True})
  
  # Set the document in InActive
  transaction.set(new_event_ref, event_dict)
  
  # Delete from the active partition
  transaction.delete(old_event_ref)

@https_fn.on_request(cors=options.CorsOptions(cors_origins=["https://www.sportshub.net.au", "*"], cors_methods=["get", "post"]), region="australia-southeast1")
def move_data(req: https_fn.CallableRequest):
  uid = str(uuid.uuid4())
  logger = Logger(f"firebase_move_data_logger_{uid}")
  logger.add_tag("uuid", uid)

  event_id = "ILmS0XyAijQsLTPf7LoV"
  transaction = db.transaction()
  move_event(transaction=transaction, old_event_ref=db.collection(INACTIVE_PRIVATE).document(event_id), new_event_ref=db.collection(ACTIVE_PRIVATE).document(event_id))

  return https_fn.Response(f"Moved all {event_id} from {INACTIVE_PRIVATE} to {ACTIVE_PRIVATE}.")


