###############################
# STRIPE WEBHOOKS INTEGRATION #
###############################

import json
import logging
import os
import time
from datetime import date

import stripe
from constants import db
from firebase_admin import firestore
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import DocumentReference, Transaction
from google.protobuf.timestamp_pb2 import Timestamp
from lib.stripe.commons import STRIPE_WEBHOOK_ENDPOINT_SECRET


@firestore.transactional
def fulfill_completed_event_ticket_purchase(transaction: Transaction, event_id: str, is_private: bool, line_items, customer):
  # Update the event to include the new attendees
  private_path = "Private" if is_private else "Public"
  event_ref = db.collection(f"Events/Active/{private_path}").document(event_id)

  maybe_event = event_ref.get(transaction=transaction)

  if (not maybe_event.exists):
    return False
  
  event = maybe_event.to_dict()

  item = line_items["data"][0] # we only offer one item type per checkout (can buy multiple quantities)

  # Increment will set the field to the given value if the field does not exist/ not numeric value
  transaction.update(event_ref, {f"attendees.{customer.email}": firestore.Increment(item.quantity)})
  # Update our attendee metadata with their names and phone numbers
  transaction.upate(
    event_ref, 
    {
      f"attendeesMetadata.{customer.email}": {
        "names" : firestore.ArrayUnion([customer.name]),
        "phones": firestore.ArrayUnion([customer.phone])
      } 
    }
  )

  # Quickly reconcile vacancy while we are at it to ensure there wasn't any discrepancy
  total_attendees = item.quantity # start the total at the new sold tickets
  for ticket_count in event["attendees"].values():
    total_attendees += ticket_count

  # If there are more vacant spots than capacity - total attendees, make the vacancy the lower number
  if event["vacancy"] > event["capacity"] - total_attendees:
    transaction.update(event_ref, {"vacancy": event["capacity"] - total_attendees})

  return True


@firestore.transactional
def record_checkout_session_by_customer_email(transaction: Transaction, event_id: str, checkout_session, customer):
  # Update our table for Attendees by email with the new checkout session details.
  attendee_ref = db.collection(f"Attendees/{customer.email}").document(event_id)
  transaction.update(attendee_ref, {"checkout_sessions": firestore.ArrayUnion([checkout_session])})


@firestore.transactional
def restock_tickets_after_expired_checkout(transaction: Transaction, event_id: str, is_private: bool, line_items):
  private_path = "Private" if is_private else "Public"
  event_ref = db.collection(f"Events/Active/{private_path}").document(event_id)

  item = line_items["data"][0] # we only offer one item type per checkout (can buy multiple quantities)

  transaction.update(event_ref, {"vacancy": firestore.Increment(item.quantity)})


@https_fn.on_request(cors=options.CorsOptions(cors_origins=["localhost", "www.sportshub.net.au", "*"], cors_methods=["post"]))
def stripe_webhook_checkout_fulfilment(req: https_fn.Request) -> https_fn.Response:
  payload = req.get_json()
  sig_header = req.META["HTTP_STRIPE_SIGNATURE"]
  event = None

  try:
    event = stripe.Webhook.construct_event(
      payload, sig_header, STRIPE_WEBHOOK_ENDPOINT_SECRET
    )
  except ValueError as e:
    # Invalid payload
    return https_fn.Response(status=400)
  except stripe.error.SignatureVerificationError as e:
    # Invalid signature
    return https_fn.Response(status=400)
  
  match event["type"]:
    # Handle the checkout.session.completed event
    case "checkout.session.completed":
      # Retrieve the completed session
      session = stripe.checkout.Session.retrieve(
        event['data']['object']['id'],
        expand=['line_items', "customer"],
      )

      session_metadata = session.metadata
      
      if session_metadata is None:
        return https_fn.Response(status=400)
      
      event_id = session_metadata["eventId"]
      is_private = session_metadata["isPrivate"]
      line_items = session.line_items
      customer = session.customer
      transaction = db.transaction()
      # TODO Fulfill the purchase by updating attendees on the event list to customer done?
      # (no need to mark tickets as sold as we already deducted it when generating checkout link)
      success = fulfill_completed_event_ticket_purchase(transaction, event_id, is_private, line_items, customer)
      if not success:
        return https_fn.Response(status=400) 
      
      record_checkout_session_by_customer_email(transaction, event_id, session, customer)

      return https_fn.Response(status=200)

      # Handle the checkout.session.expired event
    case "checkout.session.expired":
      # Retrieve the expired session
      session = stripe.checkout.Session.retrieve(
        event['data']['object']['id'],
        expand=['line_items'],
      )

      session_metadata = session.metadata
      
      if session_metadata is None:
        return https_fn.Response(status=400)
      
      event_id = session_metadata["eventId"]
      is_private = session_metadata["isPrivate"]
      line_items = session.line_items
      # TODO Restock the tickets back into our inventory done?
      transaction = db.transaction()
      restock_tickets_after_expired_checkout(transaction, event_id, is_private, line_items)
      return https_fn.Response(status=200)
    
    # Default case
    case _:
      logging.error(f"Stripe sent a webhook request which does not match to any of our handled events. event={event} webhook_request={req}")
      return https_fn.Response(status=500)

