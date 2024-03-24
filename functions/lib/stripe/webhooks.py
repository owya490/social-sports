###############################
# STRIPE WEBHOOKS INTEGRATION #
###############################

import json
import logging
import os
import time
from dataclasses import dataclass
from datetime import date

import stripe
from stripe import Customer, ListObject, LineItem
from constants import db
from firebase_admin import firestore
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import DocumentReference, Transaction
from google.protobuf.timestamp_pb2 import Timestamp
from lib.stripe.commons import STRIPE_WEBHOOK_ENDPOINT_SECRET


@dataclass
class SessionMetadata:
  eventId: str
  isPrivate: bool

  def __post_init__(self):
    if not isinstance(self.eventId, str):
      raise ValueError("Event Id must be provided as a string.")
    if not isinstance(self.isPrivate, bool):
      raise ValueError("Is Private must be provided as a boolean.")

@firestore.transactional
def fulfill_completed_event_ticket_purchase(transaction: Transaction, event_id: str, is_private: bool, line_items: ListObject[LineItem], customer: Customer):
  # Update the event to include the new attendees
  private_path = "Private" if is_private else "Public"
  event_ref = db.collection(f"Events/Active/{private_path}").document(event_id)

  maybe_event = event_ref.get(transaction=transaction)

  if (not maybe_event.exists):
    logging.error(f"Unable to find event provided in datastore to fulfill purchase. eventId={event_id}, isPrivate={is_private}")
    return False
  
  event = maybe_event.to_dict()

  try:
    # For data shape, @see https://docs.stripe.com/api/checkout/sessions/line_items
    item = line_items.data[0] # we only offer one item type per checkout (can buy multiple quantities)
  except IndexError as e:
    logging.error(f"Unable to access the first index of the line_items raising error {e}. It is probably empty... line_items={line_items}")
    return False

  # Increment will set the field to the given value if the field does not exist/ not numeric value
  transaction.update(event_ref, {f"attendees.{customer.email}": firestore.Increment(item.quantity)})
  # Update our attendee metadata with their names and phone numbers
  transaction.update(
    event_ref, 
    {
      f"attendeesMetadata.{customer.email}": {
        "names" : firestore.ArrayUnion([customer.name]),
        "phones": firestore.ArrayUnion([customer.phone])
      } 
    }
  )
  logging.info(f"Updated attendee list to reflect newly purchased tickets. email={customer.email}, name={customer.name}")

  # Quickly reconcile vacancy while we are at it to ensure there wasn't any discrepancy
  total_attendees = item.quantity # start the total at the new sold tickets
  for ticket_count in event["attendees"].values():
    total_attendees += ticket_count

  # If there are more vacant spots than capacity - total attendees, make the vacancy the lower number
  if event["vacancy"] > event["capacity"] - total_attendees:
    transaction.update(event_ref, {"vacancy": event["capacity"] - total_attendees})
    logging.warning(f"WARNING!! After reconciling vacancy with new ticket count sold, we detected there was a decrepancy, so setting it to the lower of the two. total_attendees={total_attendees}, event_vacancy={event["vacancy"]}, event_capacity={event["capacity"]}")

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
  sig_header = req.headers["HTTP_STRIPE_SIGNATURE"]
  event = None

  try:
    event = stripe.Webhook.construct_event(
      payload, sig_header, STRIPE_WEBHOOK_ENDPOINT_SECRET
    )
  except ValueError as e:
    # Invalid payload
    logging.error(f"Invalid Paylod provided with error {e}. payload={payload}, returned 400.")
    return https_fn.Response(status=400)
  except stripe.SignatureVerificationError as e:
    # Invalid signature
    logging.error(f"Invalid Signature provided with error {e}. payload={payload} signature={sig_header}, returned 400.")
    return https_fn.Response(status=400)
  
  match event["type"]:
    # Handle the checkout.session.completed event
    case "checkout.session.completed":
      logging.info(f"Processing webhook event of checkout.session.completed for {event.id}.")
      # Retrieve the completed session
      session = stripe.checkout.Session.retrieve(
        event['data']['object']['id'],
        expand=['line_items', "customer"],
      )

      if session is None:
        logging.error(f"Unable to retrieve stripe checkout session from webhook event. event={event}")
        return https_fn.Response(status=500)
      
      if session.metadata is None:
        logging.error(f"Unable to retrieve session metadata from session, returned none. session={session.id}")
        return https_fn.Response(status=400)
      
      try:
        session_metadata = SessionMetadata(**session.metadata)
      except ValueError as v:
        logging.error(f"Session Metadata did not contain necessary fields of eventId or isPrivate. session.metadata={session.metadata} error={v}")
        return https_fn.Response(status=400)
      
      line_items = session.line_items
      customer = session.customer

      if (line_items is None):
        logging.error(f"Unable to obtain line_items from session. session={session.id}")
        return https_fn.Response(status=500)

      if (customer is None):
        logging.error(f"Unable to obtain customer from session. session={session.id}")
        return https_fn.Response(status=500)

      transaction = db.transaction()
      # TODO Fulfill the purchase by updating attendees on the event list to customer done?
      # (no need to mark tickets as sold as we already deducted it when generating checkout link)
      logging.info(f"Attempting to fulfill completed event ticket purchase. session={session.id}, eventId={session_metadata.eventId}, line_items={line_items}, customer={customer.name}")
      success = fulfill_completed_event_ticket_purchase(transaction, session_metadata.eventId, session_metadata.isPrivate, line_items, customer)
      if not success:
        logging.error(f"Fulfillment of event ticket purchase was unsuccessful. session={session.id}, eventId={session_metadata.eventId}, line_items={line_items}, customer={customer.name}")
        return https_fn.Response(status=500) 
      
      record_checkout_session_by_customer_email(transaction, session_metadata.eventId, session, customer)

      return https_fn.Response(status=200)

    # Handle the checkout.session.expired event
    case "checkout.session.expired":
      logging.info(f"Processing webhook event of checkout.session.expired for {event.id}.")
      # Retrieve the expired session
      session = stripe.checkout.Session.retrieve(
        event['data']['object']['id'],
        expand=['line_items'],
      )

      if session is None:
        logging.error(f"Unable to retrieve stripe checkout session from webhook event. event={event}")
        return https_fn.Response(status=500)
      
      if session.metadata is None:
        logging.error(f"Unable to retrieve session metadata from session, returned none. session={session.id}")
        return https_fn.Response(status=400)
      
      try:
        session_metadata = SessionMetadata(**session.metadata)
      except ValueError as v:
        logging.error(f"Session Metadata did not contain necessary fields of eventId or isPrivate. session.metadata={session.metadata} error={v}")
        return https_fn.Response(status=400)
      
      line_items = session.line_items

      if (line_items is None):
        logging.error(f"Unable to obtain line_items from session. session={session.id}")
        return https_fn.Response(status=500)

      # TODO Restock the tickets back into our inventory done?
      transaction = db.transaction()
      restock_tickets_after_expired_checkout(transaction, session_metadata.eventId, session_metadata.isPrivate, line_items)
      return https_fn.Response(status=200)
    
    # Default case
    case _:
      logging.error(f"Stripe sent a webhook request which does not match to any of our handled events. event={event} webhook_request={req}")
      return https_fn.Response(status=500)

