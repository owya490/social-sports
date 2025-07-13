###############################
# STRIPE CHECKOUT INTEGRATION #
###############################

import json
import math
import time
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

import stripe
from firebase_admin import firestore
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import Transaction
from google.protobuf.timestamp_pb2 import Timestamp
from lib.constants import db
from lib.logging import Logger
from lib.stripe.commons import ERROR_URL
from typing import Optional

@dataclass
class StripeCheckoutRequest:
  eventId: str
  isPrivate: bool
  quantity: int
  cancelUrl: str
  successUrl: str
  ticketTypeId: Optional[str] = None  # Optional so doesn't break, will need to clean up later

  def __post_init__(self):
    if not isinstance(self.eventId, str):
      raise ValueError("Event Id must be provided as a string.")
    if not isinstance(self.isPrivate, bool):
      raise ValueError("Is Private must be provided as a boolean.")
    if not isinstance(self.quantity, int):
      raise ValueError("Quantity must be provided as a integer.")
    if not isinstance(self.cancelUrl, str):
      raise ValueError("Cancel Url must be provided as a string.")
    if not isinstance(self.successUrl, str):
      raise ValueError("Success Url must be provided as a string.")
    if self.ticketTypeId is not None and not isinstance(self.ticketTypeId, str):
      raise ValueError("TicketTypeId must be a string if provided.")

def calculate_stripe_fee(price: float) -> int:
  # Stripe fee is 30c + 1.7% of total price as price passed in is in cents already
  # can just do the calculation and return a whole integer
  return int(math.ceil(30 + (price * 0.017)))

@firestore.transactional
def create_stripe_checkout_session_by_event_id(transaction: Transaction, logger: Logger, event_id: str, quantity: int, is_private: bool, cancel_url: str, success_url: str, ticket_type_id: Optional[str] = None):
  logger.info(f"Creating stripe checkout session for {event_id} for {quantity} tickets.")
  private_path = "Private" if is_private else "Public"

  event_ref = db.collection(f"Events/Active/{private_path}").document(event_id)
  maybe_event = event_ref.get(transaction=transaction)

  # Check if the event exists, if not error out
  if (not maybe_event.exists):
    logger.error(f"Provided event {event_ref.path} does not exist in the database. Returning status=404")
    return json.dumps({"url": ERROR_URL})
  
  event = maybe_event.to_dict()
  logger.info(f"Event info of event {event_ref.path} retrieved: {event}")

  # Check if event has not concluded or paused, otherwise error out
  paused: bool = event.get("paused")
  event_end_date: Timestamp = event.get("endDate").timestamp_pb()
  event_registration_end_date: Timestamp = event.get("registrationDeadline").timestamp_pb()
  event_end_date = event_end_date.ToDatetime(UTC)
  event_registration_end_date = event_registration_end_date.ToDatetime(UTC)
  if (datetime.now(UTC) > event_end_date or datetime.now(UTC) > event_registration_end_date or paused):
    logger.warning(f"Trying to get checkout url for event that has already concluded, paused or is past its registration deadline. eventId={event_id} time={datetime.now(UTC)} registrationEndDate={event_registration_end_date} endDate={event_end_date} paused={paused}")
    return json.dumps({"url": ERROR_URL})
  
  # 1. check for event is stripe enabled
  if (not event.get("paymentsActive")):
    logger.error(f"Provided event {event_ref.path} does not have payments enabled. Returning status=500")
    return json.dumps({"url": cancel_url})

  organiser_id = event.get("organiserId")
  logger.info(f"Event with id {event_id} has organiser with id {organiser_id}.")
  organiser_ref = db.collection("Users/Active/Private").document(organiser_id)
  maybe_organiser = organiser_ref.get(transaction=transaction)
  
  # Check if the organiser exists, if not error out
  if (not maybe_organiser.exists):
    logger.error(f"Provided event {event_ref.path} has an organiser {organiser_ref.path} who does not exist in the database. Returning status=404")
    return json.dumps({"url": ERROR_URL})

  organiser = maybe_organiser.to_dict()

  # 2a. check for event organiser has stripe account
  if (organiser.get("stripeAccount") == None):
    logger.error(f"Provided event {event_ref.path} has an organiser {organiser_ref.path} who does not have a stripe account. Returning status=500")
    return json.dumps({"url": ERROR_URL})
  
  # 2b. check if the stripe account is active
  if (organiser.get("stripeAccountActive") == False):
    account = stripe.Account.retrieve(organiser.get("stripeAccount"))
    # if its not active, double check to see if this is the n+1 iteration, hence if they have charges enabled and details submitted for stripe, open their account, else error out
    if account.charges_enabled and account.details_submitted:
      transaction.update(organiser_ref, {"stripeAccountActive": True})
      logger.info(f"Provided organiser {organiser_ref.path} already has all charges enabled and details submitted. Activating their sportshub stripe account.")
    else:
      logger.error(f"Provided event {event_ref.path} has an organiser {organiser_ref.path} who does not have a active stripe account. charges_enabled={account.charges_enabled} details_submitted={account.details_submitted} Returning status=500")
      return json.dumps({"url": ERROR_URL})

  # ===== START DUAL WORKFLOW LOGIC FOR PRICE AND VACANCY =====
  price1 = None
  vacancy1 = None
  price2 = None
  vacancy2 = None

  if ticket_type_id:
    try:
      ticket_type_ref = event_ref.collection("ticketTypes").document(ticket_type_id)
      maybe_ticket_type = ticket_type_ref.get(transaction=transaction)
      if maybe_ticket_type.exists:
        ticket_type = maybe_ticket_type.to_dict()
        price1 = ticket_type.get("price")
        vacancy1 = ticket_type.get("availableQuantity")
        if not isinstance(price1, int) or price1 < 1:
          logger.warning(f"[ticketTypeId={ticket_type_id}] Invalid price: {price1}")
          price1 = None
        if not isinstance(vacancy1, int) or vacancy1 < 0:
          logger.warning(f"[ticketTypeId={ticket_type_id}] Invalid vacancy: {vacancy1}")
          vacancy1 = None
      else:
        logger.warning(f"ticketTypeId={ticket_type_id} not found under event {event_ref.path}")
    except Exception as e:
      logger.error(f"Error reading ticketType {ticket_type_id}: {e}")

  try:
    price2 = event.get("price")
    vacancy2 = event.get("vacancy")
    if not isinstance(price2, int) or price2 < 1:
      logger.warning(f"Legacy event price is invalid: {price2}")
      price2 = None
    if not isinstance(vacancy2, int) or vacancy2 < 0:
      logger.warning(f"Legacy event vacancy is invalid: {vacancy2}")
      vacancy2 = None
  except Exception as e:
    logger.error(f"Error reading legacy event fields: {e}")

  if vacancy1 is not None and vacancy1 >= quantity:
    vacancy = vacancy1
    price = price1
    source = "ticketType"
    transaction.update(ticket_type_ref, {"availableQuantity": vacancy - quantity})
  elif vacancy2 is not None and vacancy2 >= quantity:
    vacancy = vacancy2
    price = price2
    source = "event"
    transaction.update(event_ref, {"vacancy": vacancy - quantity})
  else:
    logger.warning(f"Not enough tickets available. ticketType={vacancy1}, event={vacancy2}, requested={quantity}")
    return json.dumps({"url": cancel_url})

  logger.info(f"Secured {quantity} tickets from {source} at ${price}. Remaining: {vacancy - quantity}")
  # ===== END DUAL WORKFLOW LOGIC FOR PRICE AND VACANCY =====

  # 6. check if stripe fee is passed to customer, if so, create shipping object with an additional respective fees
  shipping_options = None
  if(event.get("stripeFeeToCustomer") is True):
    stripe_surcharge_fee = calculate_stripe_fee(price * quantity) # We need to overall order price for surcharge. not just singular ticket price
    logger.info(f"Application fee calculated to be {stripe_surcharge_fee} for event {event_id} with price {price} with quantity {quantity}.")
    shipping_options = [{
        "shipping_rate_data": {
          "display_name": "Stripe Card Surcharge Fees",
          "fixed_amount": {
            "amount": stripe_surcharge_fee,
            "currency": "aud"
          },
          "type": "fixed_amount"
        }
      }]
  
  # 7. check if promotional codes is enabled for this event
  promotional_codes_enabled = False
  if (event.get("promotionalCodesEnabled") is True):
    promotional_codes_enabled = True

  # 8. create checkout session with connected account and return link
  checkout = stripe.checkout.Session.create(
    mode="payment",
    line_items=[{
      "price_data": {
        "currency": "aud",
        "product_data": {
          "name": event.get("name"),
          "metadata": {
            "eventId": event_id,
            "isPrivate": is_private
          }
        },
        "unit_amount": price
      },
      "quantity": quantity
    }],
    metadata={
      "eventId": event_id,
      "isPrivate": is_private
    },
    custom_fields=[
      {
        "key": "attendeeFullName",
        "label": {"type": "custom", "custom": "Full name for booking"},
        "type": "text",
      },
      {
        "key": "attendeePhone",
        "label": {"type": "custom", "custom": "Phone number"},
        "type": "text",
      },
    ],
    # payment_intent_data={"application_fee_amount": 123},
    shipping_options=shipping_options,
    success_url=success_url, # TODO need to update to a static success page
    cancel_url=cancel_url,
    stripe_account= organiser.get("stripeAccount"),
    expires_at=int(time.time() + 1800), # Checkout session expires in 30 minutes (stripe minimum)
    allow_promotion_codes=promotional_codes_enabled
  )

  logger.info(f"Creating checkout session {checkout.id} for event {event_ref.path}, linked to {organiser_ref.path} and their stripe account {organiser.get('stripeAccount')}. Secured {quantity} tickets at ${price}.")
  return json.dumps({"url": checkout.url})



@https_fn.on_call(cors=options.CorsOptions(cors_origins=["https://www.sportshub.net.au", "*"], cors_methods=["post"]), region="australia-southeast1")
def get_stripe_checkout_url_by_event_id(req: https_fn.CallableRequest):
  uid = str(uuid.uuid4())
  logger = Logger(f"stripe_checkout_logger_{uid}")
  logger.add_tag("uuid", uid)

  body_data = req.data

  # Validate the incoming request to contain the necessary fields
  try:
    request_data = StripeCheckoutRequest(**body_data)
  except ValueError as v:
    logger.warning(f"Request body did not contain necessary fields. Error was thrown: {v}. Returned status=400")
    return json.dumps({"url": ERROR_URL})

  logger.add_tag("eventId", request_data.eventId)
  transaction = db.transaction()
  return create_stripe_checkout_session_by_event_id(transaction, logger, request_data.eventId, request_data.quantity, 
                                                    request_data.isPrivate, request_data.cancelUrl, request_data.successUrl, request_data.ticketTypeId)
