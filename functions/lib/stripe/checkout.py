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


@dataclass
class StripeCheckoutRequest:
  eventId: str
  isPrivate: bool
  quantity: int
  cancelUrl: str
  successUrl: str

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

def calculate_stripe_fee(price: float) -> int:
  # Stripe fee is 30c + 1.7% of total price as price passed in is in cents already
  # can just do the calculation and return a whole integer
  return int(math.ceil(30 + (price * 0.017)))


@firestore.transactional
def create_stripe_checkout_session_by_event_id(transaction: Transaction, logger: Logger, event_id: str, quantity: int, is_private: bool, cancel_url: str, success_url: str):
  logger.info(f"Creating stripe checkout session for {event_id} for {quantity} tickets.")
  private_path = "Private" if is_private else "Public"

  event_ref = db.collection(f"Events/Active/{private_path}").document(event_id)
  maybe_event = event_ref.get(transaction=transaction)

  # Check if the event exists, if not error out
  if (not maybe_event.exists):
    logger.error(f"Provided event {event_ref.path} does not exist in the database. Returning status=404")
    return json.dumps({"url": ERROR_URL})
  
  event = maybe_event.to_dict()

  # Check if event has not concluded, otherwise error out
  event_end_date: Timestamp = event.get("endDate").timestamp_pb()
  event_end_date = event_end_date.ToDatetime(UTC)
  if (datetime.now(UTC) > event_end_date):
    logger.warning(f"Trying to get checkout url for event that has already concluded. eventId={event_id}.")
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

  # 3. check again with database in transction in the backend if quantity is still available
  vacancy = event.get("vacancy")

  if vacancy < quantity:
    logger.warning(f"Provided event {event_ref.path} does not have enough tickets to fulfill this order. quantity_requested={quantity} vacancy={vacancy}")
    return json.dumps({"url": cancel_url})
  
  # 4. obtain price and organiser stripe account id again from db
  price = event.get("price")
  organiser_stripe_account_id = organiser.get("stripeAccount")

  # 4a. check if the price exists for this event
  if (price == None or not isinstance(price, int) or price < 1): # we don't want events to be less than stripe fees
    logger.error(f"Provided event {event_ref.path} does not have a valid price. Returning status=500")
    return json.dumps({"url": ERROR_URL})

  # 5. set the tickets as sold and reduce vacancy (prevent race condition/ over selling, we will release tickets back after cancelled sale)
  transaction.update(event_ref, {"vacancy": vacancy - quantity })
  logger.info(f"Securing {quantity} tickets for event {event_ref.path} at ${price}. There are now {vacancy - quantity} tickets left.")

  # 7. check if stripe fee is passed to customer, if so, create shipping object with an additional respective fees
  shipping_options = None
  if(event.get("stripeFeeToCustomer") is True):
    stripe_surcharge_fee = calculate_stripe_fee(price)
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

  # 6. create checkout session with connected account and return link
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
    stripe_account= organiser_stripe_account_id,
    expires_at=int(time.time() + 1800) # Checkout session expires in 30 minutes (stripe minimum)
  )
  
  logger.info(f"Creating checkout session {checkout.id} for event {event_ref.path}, linked to {organiser_ref.path} and their stripe account {organiser_stripe_account_id}. Secured {quantity} tickets at ${price}.")
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
                                                    request_data.isPrivate, request_data.cancelUrl, request_data.successUrl)
