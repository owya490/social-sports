###############################
# STRIPE WEBHOOKS INTEGRATION #
###############################

import hashlib
import json
import sys
import uuid
from dataclasses import dataclass

import stripe
from firebase_admin import firestore
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import Transaction
from lib.constants import db, posthog
from lib.logging import Logger
from lib.stripe.commons import STRIPE_WEBHOOK_ENDPOINT_SECRET
from stripe import Event, LineItem, ListObject


@dataclass
class SessionMetadata:
  eventId: str
  isPrivate: bool

  def __init__(self, eventId, isPrivate):
    self.eventId = eventId
    if isinstance(isPrivate, str):
      self.isPrivate = isPrivate.lower() == "true"
    else:
      self.isPrivate = isPrivate

  def __post_init__(self):
    if not isinstance(self.eventId, str):
      raise ValueError("Event Id must be provided as a string.")
    if not isinstance(self.isPrivate, bool):
      raise ValueError("Is Private must be provided as a boolean.")


def check_if_session_has_been_processed_already(logger: Logger, checkout_session_id: str, event_id: str) -> bool:
  event_metadata_ref = db.collection(f"EventsMetadata").document(event_id)

  maybe_event_metadata = event_metadata_ref.get()

  if (not maybe_event_metadata.exists):
    logger.error(f"Unable to find event provided in datastore to fulfill purchase. eventId={event_id}, isPrivate={is_private}")
    return False
  
  event_metadata = maybe_event_metadata.to_dict()

  if checkout_session_id in event_metadata.get("completedStripeCheckoutSessionIds"):
    return True
  
  return False


def add_stripe_event_and_checkout_tags(logger: Logger, event: Event):
  logger.add_tags({
    "eventType": event["type"], 
    "eventId": event.id,
    "checkoutSessionId": event['data']['object']['id'],
    "stripeAccount": event['account']
  })


@firestore.transactional
def fulfill_completed_event_ticket_purchase(transaction: Transaction, logger: Logger, checkout_session_id: str, event_id: str, is_private: bool, line_items: ListObject[LineItem], customer): # Typing of customer is customer details
  # Update the event to include the new attendees
  private_path = "Private" if is_private else "Public"
  event_ref = db.collection(f"Events/Active/{private_path}").document(event_id)
  event_metadata_ref = db.collection(f"EventsMetadata").document(event_id)

  maybe_event = event_ref.get(transaction=transaction)

  if (not maybe_event.exists):
    logger.error(f"Unable to find event provided in datastore to fulfill purchase. eventId={event_id}, isPrivate={is_private}")
    return False
  
  event = maybe_event.to_dict()

  try:
    # For data shape, @see https://docs.stripe.com/api/checkout/sessions/line_items
    item = line_items.data[0] # we only offer one item type per checkout (can buy multiple quantities)
  except IndexError as e:
    logger.error(f"Unable to access the first index of the line_items raising error {e}. It is probably empty... line_items={line_items}")
    return False
  
  # We want to hash the email first as firestore doesn't like @ or . as characters in keys
  email_hash = str(int(hashlib.md5(str(customer.email).encode('utf-8')).hexdigest(), 16))

  maybe_event_metadata = event_metadata_ref.get(transaction=transaction)
  event_metadata = {
    "attendees": {},
    "completedStripeCheckoutSessionIds": []
  }
  # If event metadata already exists, use the exisitng data and increment
  if (maybe_event_metadata.exists):
    event_metadata = maybe_event_metadata.to_dict()

  logger.info(f"event-metadata {event_metadata}")

  if event_metadata.get("attendees") == None:
    event_metadata["attendees"] = {}


  # If the attendee doesn't exist, add base template so we don't null pointer
  if event_metadata["attendees"].get(email_hash) == None:
    event_metadata["attendees"][email_hash] = {
      "email": "",
      "ticketCount": 0,
      "names": [],
      "phones": []
    }
  
  # Get names and phones already added, if it doesn't exist, start new list
  current_attendee_names = [] if event_metadata["attendees"][email_hash].get("names") == None else event_metadata["attendees"][email_hash]["names"]
  current_attendee_phones = [] if event_metadata["attendees"][email_hash].get("phones") == None else event_metadata["attendees"][email_hash]["phones"]

  transaction.update(event_metadata_ref, {
    f"attendees.{email_hash}": {
      "email": customer.email,
      "ticketCount": event_metadata["attendees"][email_hash]["ticketCount"] + item.quantity,
      # Gets the Union without duplicates
      "names": list(set(list(current_attendee_names) + [customer.name])),
      "phones": list(set(list(current_attendee_phones) + [customer.phone]))
    }
  })

  # # Increment will set the field to the given value if the field does not exist/ not numeric value
  # transaction.update(event_ref, {f"attendees.{email_hash}": firestore.Increment(item.quantity)})
  # logger.info("Successfully updated the attendee email ticket count.")

  # # Update our attendee metadata with their names and phone numbers
  # transaction.update(
  #   event_ref, 
  #   {
  #     f"attendeesMetadata.{email_hash}": {
  #       "email": customer.email,
  #       # TODO: fix this, it doesn't work adding names ontop of each other
  #       "names" : firestore.ArrayUnion([customer.name]),
  #       "phones": firestore.ArrayUnion([customer.phone])
  #     } 
  #   }
  # )
  logger.info(f"Updated attendee list to reflect newly purchased tickets. email={customer.email}, name={customer.name}")

  # Quickly reconcile vacancy while we are at it to ensure there wasn't any discrepancy
  total_attendees = item.quantity # start the total at the new sold tickets
  for metadata in event_metadata["attendees"].values():
    total_attendees += metadata["ticketCount"]

  # If there are more vacant spots than capacity - total attendees, make the vacancy the lower number
  if event["vacancy"] > event["capacity"] - total_attendees:
    transaction.update(event_ref, {"vacancy": event["capacity"] - total_attendees})
    logger.warning(f"WARNING!! After reconciling vacancy with new ticket count sold, we detected there was a decrepancy, so setting it to the lower of the two. total_attendees={total_attendees}, event_vacancy={event['vacancy']}, event_capacity={event['capacity']}")

  # Lastly, we want to record the checkout session id of this webhook event, so we have an idempotency in our operations
  transaction.update(
    event_metadata_ref, 
    {
      "completedStripeCheckoutSessionIds": firestore.ArrayUnion([checkout_session_id])
    }
  )

  return True


@firestore.transactional
def record_checkout_session_by_customer_email(transaction: Transaction, event_id: str, checkout_session, customer):
  # We want to hash the email first as firestore doesn't like @ or . as characters in keys
  email_hash = int(hashlib.md5(str(customer.email).encode('utf-8')).hexdigest(), 16)

  # Update our table for Attendees by email with the new checkout session details.
  attendee_ref = db.collection(f"Attendees/emails/{email_hash}").document(event_id)
  transaction.set(attendee_ref, {"checkout_sessions": firestore.ArrayUnion([checkout_session])}, merge=True)


@firestore.transactional
def restock_tickets_after_expired_checkout(transaction: Transaction, checkout_session_id: str, event_id: str, is_private: bool, line_items):
  private_path = "Private" if is_private else "Public"
  event_ref = db.collection(f"Events/Active/{private_path}").document(event_id)
  event_metadata_ref = db.collection(f"EventsMetadata").document(event_id)

  item = line_items["data"][0] # we only offer one item type per checkout (can buy multiple quantities)

  transaction.update(event_ref, {"vacancy": firestore.Increment(item.quantity)})

  # Add current checkout session to the processed list
  transaction.update(
    event_metadata_ref, 
    {
      "completedStripeCheckoutSessionIds": firestore.ArrayUnion([checkout_session_id])
    }
  )


@https_fn.on_request(cors=options.CorsOptions(cors_origins=["localhost", "www.sportshub.net.au", "*"], cors_methods=["post"]), region="australia-southeast1")
def stripe_webhook_checkout_fulfilment(req: https_fn.Request) -> https_fn.Response:
  # Generate a UUID for each incoming request for easier tracing throughout the lifecycle of this event
  uid = str(uuid.uuid4())
  logger = Logger(f"stripe_webhook_logger_{uid}")
  logger.add_tag("uuid", uid)

  payload = req.data 

  try:
    sig_header = req.headers.get("Stripe-Signature")
  except:
    logger.error(f"Request headers did not contain Stripe Signature. headers={req.headers}")
    return https_fn.Response(status=400)
  event = None

  try:
    event = stripe.Webhook.construct_event(
      payload, sig_header, STRIPE_WEBHOOK_ENDPOINT_SECRET
    )
  except ValueError as e:
    # Invalid payload
    logger.error(f"Invalid Paylod provided error={e}. payload={payload}, returned 400.")
    return https_fn.Response(status=400)
  except stripe.SignatureVerificationError as e:
    # Invalid signature
    logger.error(f"Invalid Signature provided error={e}. payload={payload} signature={sig_header}, returned 400.")
    return https_fn.Response(status=400)
  
  # Get stripe test events enabled feature flag from posthog
  stripe_webhook_test_events_enabled = posthog.feature_enabled("stripe_webhook_test_events", "")

  # If its not enabled and the event is a test event, return early
  if not stripe_webhook_test_events_enabled and not event["livemode"]:
    logger.info("Test events are not permitted, returning 200 early.")
    return https_fn.Response(status=200)

  match event["type"]:
    # Handle the checkout.session.completed event
    case "checkout.session.completed":
      add_stripe_event_and_checkout_tags(logger, event)
      logger.info(f"Processing webhook event of checkout.session.completed for {event.id}.")

      # Retrieve the completed session
      checkout_session_id = event['data']['object']['id']
      session = stripe.checkout.Session.retrieve(
        checkout_session_id,
        expand=['line_items'],
        stripe_account=event['account']
      )

      if session is None:
        logger.error(f"Unable to retrieve stripe checkout session from webhook event. event={event}")
        return https_fn.Response(status=500)
      
      if session.metadata is None:
        logger.error(f"Unable to retrieve session metadata from session, returned none. session={session.id}")
        return https_fn.Response(status=400)

      try:
        session_metadata = SessionMetadata(**session.metadata)
      except ValueError as v:
        logger.error(f"Session Metadata did not contain necessary fields of eventId or isPrivate. session.metadata={session.metadata} error={v}")
        return https_fn.Response(status=400)
      
      line_items = session.line_items
      customer_details = session.customer_details

      # Check if this checkout_session_id has already been processed.
      if (check_if_session_has_been_processed_already(logger, checkout_session_id, session_metadata.eventId)):
        logger.info(f"Current webhook event checkout session has been already processed. Returning early. session={checkout_session_id}")
        return https_fn.Response(status=200) 

      if (line_items is None):
        logger.error(f"Unable to obtain line_items from session. session={session.id}")
        return https_fn.Response(status=500)

      if (customer_details is None):
        logger.error(f"Unable to obtain customer from session. session={session.id}")
        return https_fn.Response(status=500)

      logger.info(f"Attempting to fulfill completed event ticket purchase. session={session.id}, eventId={session_metadata.eventId}, line_items={line_items}, customer={customer_details.email}")
      transaction = db.transaction()
      # TODO Fulfill the purchase by updating attendees on the event list to customer done?
      # (no need to mark tickets as sold as we already deducted it when generating checkout link)
      success = fulfill_completed_event_ticket_purchase(transaction, logger, checkout_session_id, session_metadata.eventId, session_metadata.isPrivate, line_items, customer_details)
      if not success:
        logger.error(f"Fulfillment of event ticket purchase was unsuccessful. session={session.id}, eventId={session_metadata.eventId}, line_items={line_items}, customer={customer_details.email}")
        return https_fn.Response(status=500) 
      
      record_checkout_session_by_customer_email(transaction, session_metadata.eventId, session, customer_details)
      logger.info(f"Successfully handled checkout.session.completed webhook event. session={checkout_session_id}")
      return https_fn.Response(status=200)

    # Handle the checkout.session.expired event
    case "checkout.session.expired":
      add_stripe_event_and_checkout_tags(logger, event)
      logger.info(f"Processing webhook event of checkout.session.expired for {event.id}.")
      # Retrieve the expired session
      checkout_session_id = event['data']['object']['id']
      account = event['account']
      logger.info(f"checkout_session: {checkout_session_id}  account: {account}")
      session = stripe.checkout.Session.retrieve(
        checkout_session_id,
        expand=['line_items'],
        stripe_account=event['account']
      )

      if session is None:
        logger.error(f"Unable to retrieve stripe checkout session from webhook event. event={event}")
        return https_fn.Response(status=500)
      
      if session.metadata is None:
        logger.error(f"Unable to retrieve session metadata from session, returned none. session={session.id}")
        return https_fn.Response(status=400)
      
      try:
        session_metadata = SessionMetadata(**session.metadata)
      except ValueError as v:
        logger.error(f"Session Metadata did not contain necessary fields of eventId or isPrivate. session.metadata={session.metadata} error={v}")
        return https_fn.Response(status=400)
      
      # Check if this checkout_session_id has already been processed.
      if (check_if_session_has_been_processed_already(logger, checkout_session_id, session_metadata.eventId)):
        logger.info(f"Current webhook event checkout session has been already processed. Returning early. session={checkout_session_id}")
        return https_fn.Response(status=200) 

      line_items = session.line_items

      if (line_items is None):
        logger.error(f"Unable to obtain line_items from session. session={session.id}")
        return https_fn.Response(status=500)

      transaction = db.transaction()
      restock_tickets_after_expired_checkout(transaction, checkout_session_id, session_metadata.eventId, session_metadata.isPrivate, line_items)
      
      logger.info(f"Successfully handled checkout.session.expired webhook event. session={checkout_session_id}")
      return https_fn.Response(status=200)
    
    # Default case
    case _:
      logger.error(f"Stripe sent a webhook request which does not match to any of our handled events. event={event} webhook_request={req}")
      return https_fn.Response(status=500)
