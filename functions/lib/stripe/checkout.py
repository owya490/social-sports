###############################
# STRIPE CHECKOUT INTEGRATION #
###############################

import json
import math
import time
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Dict, List, Optional

import stripe
from firebase_admin import firestore
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import Transaction
from google.protobuf.timestamp_pb2 import Timestamp
from lib.constants import (MIN_INSTANCE,
                           MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS, db)
from lib.logging import Logger
from lib.stripe.commons import ERROR_URL


@dataclass
class StripeCheckoutRequest:
  eventId: str
  isPrivate: bool
  quantity: int
  cancelUrl: str
  successUrl: str
  completeFulfilmentSession: bool
  fulfilmentSessionId: Optional[str]
  endFulfilmentEntityId: Optional[str]

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

SPORTSHUB_FEE_ACCOUNTS = [
  "l8V4y8iHR8WUQJFAYSLNU9s1G522", # Acers Prod
  "c5vFAZ3NlSXVuHGrwlkCjJr3RXX2" # Owen Dev
  ]
SPORTSHUB_FEE_PERCENTAGE = 0.01

def calculate_stripe_fee(price: float, organiser_id: str) -> int:
  # Stripe fee is 30c + 1.7% of total price as price passed in is in cents already
  # can just do the calculation and return a whole integer
  # if the organiser is part of the FEE accounts, add the application percentage to the fee
  fee_percentage = 0.017
  if organiser_id in SPORTSHUB_FEE_ACCOUNTS:
    fee_percentage = fee_percentage + SPORTSHUB_FEE_PERCENTAGE
  return int(math.ceil(30 + (price * fee_percentage)))

def calculate_sportshub_fee(price: float, organiser_id: str) -> int:
  # if the organiser is part of the FEE accounts, add the application percentage to the fee
  if organiser_id in SPORTSHUB_FEE_ACCOUNTS:
    return int(math.ceil(price * SPORTSHUB_FEE_PERCENTAGE))
  return 0

@firestore.transactional
def create_stripe_checkout_session_by_event_id(transaction: Transaction, logger: Logger, event_id: str, quantity: int, is_private: bool, cancel_url: str, success_url: str, complete_fulfilment_session: bool, fulfilment_session_id: Optional[str], end_fulfilment_entity_id: Optional[str]) -> str:
  logger.info(f"Creating stripe checkout session for {event_id} for {quantity} tickets.")
  private_path = "Private" if is_private else "Public"

  event_ref = db.collection(f"Events/Active/{private_path}").document(event_id)
  maybe_event = event_ref.get(transaction=transaction)

  # Check if the event exists, if not error out
  if (not maybe_event.exists):
    logger.error(f"Provided event {event_ref.path} does not exist in the database. Returning status=404")
    return json.dumps({"url": ERROR_URL})
  
  event: Optional[Dict[str, Any]] = maybe_event.to_dict()
  logger.info(f"Event info of event {event_ref.path} retrieved: {event}")

  # Safety check for None event
  if event is None:
    logger.error(f"Event {event_ref.path} data is None. Returning status=404")
    return json.dumps({"url": ERROR_URL})

  # Check if event has not concluded or paused, otherwise error out
  paused: bool = event.get("paused", False)  # Default to False if not set
  
  # Get timestamp objects and convert to datetime
  end_date_timestamp = event.get("endDate")
  registration_deadline_timestamp = event.get("registrationDeadline")
  
  if end_date_timestamp is None or registration_deadline_timestamp is None:
    logger.error(f"Event {event_ref.path} is missing required date fields. Returning status=500")
    return json.dumps({"url": ERROR_URL})
  
  event_end_date: datetime = end_date_timestamp.timestamp_pb().ToDatetime(UTC)
  event_registration_end_date: datetime = registration_deadline_timestamp.timestamp_pb().ToDatetime(UTC)
  if (datetime.now(UTC) > event_end_date or datetime.now(UTC) > event_registration_end_date or paused):
    logger.warning(f"Trying to get checkout url for event that has already concluded, paused or is past its registration deadline. eventId={event_id} time={datetime.now(UTC)} registrationEndDate={event_registration_end_date} endDate={event_end_date} paused={paused}")
    return json.dumps({"url": ERROR_URL})
  
  # 1. check for event is stripe enabled
  payments_active = event.get("paymentsActive")
  if not payments_active:
    logger.error(f"Provided event {event_ref.path} does not have payments enabled. Returning status=500")
    return json.dumps({"url": cancel_url})

  organiser_id = event.get("organiserId")
  if organiser_id is None:
    logger.error(f"Event {event_ref.path} is missing organiserId. Returning status=500")
    return json.dumps({"url": ERROR_URL})
  logger.info(f"Event with id {event_id} has organiser with id {organiser_id}.")
  organiser_ref = db.collection("Users/Active/Private").document(organiser_id)
  maybe_organiser = organiser_ref.get(transaction=transaction)
  
  # Check if the organiser exists, if not error out
  if (not maybe_organiser.exists):
    logger.error(f"Provided event {event_ref.path} has an organiser {organiser_ref.path} who does not exist in the database. Returning status=404")
    return json.dumps({"url": ERROR_URL})

  organiser: Optional[Dict[str, Any]] = maybe_organiser.to_dict()

  # Safety check for None organiser
  if organiser is None:
    logger.error(f"Organiser {organiser_ref.path} data is None. Returning status=404")
    return json.dumps({"url": ERROR_URL})

  # 2a. check for event organiser has stripe account
  stripe_account = organiser.get("stripeAccount")
  if stripe_account is None:
    logger.error(f"Provided event {event_ref.path} has an organiser {organiser_ref.path} who does not have a stripe account. Returning status=500")
    return json.dumps({"url": ERROR_URL})
  
  # 2b. check if the stripe account is active
  stripe_account_active = organiser.get("stripeAccountActive")
  if stripe_account_active == False:
    account = stripe.Account.retrieve(stripe_account)
    # if its not active, double check to see if this is the n+1 iteration, hence if they have charges enabled and details submitted for stripe, open their account, else error out
    if account.charges_enabled and account.details_submitted:
      transaction.update(organiser_ref, {"stripeAccountActive": True})
      logger.info(f"Provided organiser {organiser_ref.path} already has all charges enabled and details submitted. Activating their sportshub stripe account.")

    else:
      logger.error(f"Provided event {event_ref.path} has an organiser {organiser_ref.path} who does not have a active stripe account. charges_enabled={account.charges_enabled} details_submitted={account.details_submitted} Returning status=500")
      return json.dumps({"url": ERROR_URL})

  # 3. check again with database in transaction in the backend if quantity is still available
  vacancy = event.get("vacancy")
  if vacancy is None:
    logger.error(f"Event {event_ref.path} is missing vacancy field. Returning status=500")
    return json.dumps({"url": ERROR_URL})

  if vacancy < quantity:
    logger.warning(f"Provided event {event_ref.path} does not have enough tickets to fulfill this order. quantity_requested={quantity} vacancy={vacancy}")
    return json.dumps({"url": cancel_url})
  
  # 4. obtain price and organiser stripe account id again from db
  price = event.get("price")
  if price is None:
    logger.error(f"Event {event_ref.path} is missing price field. Returning status=500")
    return json.dumps({"url": ERROR_URL})
    
  organiser_stripe_account_id = stripe_account

  # 4a. check if the price exists for this event
  if (price is None or not isinstance(price, int) or (price < MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS and price != 0)): # we don't want events to be less than stripe fees
    logger.error(f"Provided event {event_ref.path} does not have a valid price: {price}. Returning status=500")
    return json.dumps({"url": ERROR_URL})

  # 5. set the tickets as sold and reduce vacancy (prevent race condition/ over selling, we will release tickets back after cancelled sale)
  transaction.update(event_ref, {"vacancy": vacancy - quantity })
  logger.info(f"Securing {quantity} tickets for event {event_ref.path} at ${price}. There are now {vacancy - quantity} tickets left.")

  # 6. check if stripe fee is passed to customer, if so, create shipping object with an additional respective fees
  shipping_options: Optional[List[Dict[str, Any]]] = None
  stripe_fee_to_customer = event.get("stripeFeeToCustomer")
  if stripe_fee_to_customer is True and price != 0:
    stripe_surcharge_fee = calculate_stripe_fee(price * quantity, organiser_id) # We need to overall order price for surcharge. not just singular ticket price
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
  promo_codes_enabled = event.get("promotionalCodesEnabled")
  if promo_codes_enabled is True:
    promotional_codes_enabled = True

  # 8. create checkout session with connected account and return link
  checkout_params = {
    "mode": "payment",
    "line_items": [{
      "price_data": {
        "currency": "aud",
        "product_data": {
          "name": event.get("name", ""),
          "metadata": {
            "eventId": event_id,
            "isPrivate": str(is_private)
          }
        },
        "unit_amount": price
      },
      "quantity": quantity
    }],
    "metadata": {
      "eventId": event_id,
      "isPrivate": str(is_private),
      "completeFulfilmentSession": str(complete_fulfilment_session),
      "fulfilmentSessionId": str(fulfilment_session_id) if fulfilment_session_id is not None else "",
      "endFulfilmentEntityId": str(end_fulfilment_entity_id) if end_fulfilment_entity_id is not None else ""
    },
    "custom_fields": [
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
    "success_url": success_url,
    "cancel_url": cancel_url,
    "stripe_account": organiser_stripe_account_id,
    "expires_at": int(time.time() + 1800),
    "allow_promotion_codes": promotional_codes_enabled,
    "payment_intent_data":{"application_fee_amount": calculate_sportshub_fee(price * quantity, organiser_id)},
  }
  
  # Add shipping_options only if it's not None
  if shipping_options is not None:
    checkout_params["shipping_options"] = shipping_options
  
  checkout = stripe.checkout.Session.create(**checkout_params)
  
  logger.info(f"Creating checkout session {checkout.id} for event {event_ref.path}, linked to {organiser_ref.path} and their stripe account {organiser_stripe_account_id}. Secured {quantity} tickets at ${price}.")
  return json.dumps({"url": checkout.url})


@https_fn.on_call(cors=options.CorsOptions(
  cors_origins=["https://www.sportshub.net.au", "*"], 
  cors_methods=["post"]), 
  region="australia-southeast1", 
  min_instances=MIN_INSTANCE,
  memory=options.MemoryOption.MB_256,
  cpu=0.5
)
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
                                                    request_data.isPrivate, request_data.cancelUrl, request_data.successUrl,
                                                    request_data.completeFulfilmentSession, request_data.fulfilmentSessionId,
                                                    request_data.endFulfilmentEntityId)
