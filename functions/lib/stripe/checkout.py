###############################
# STRIPE CHECKOUT INTEGRATION #
###############################

import json
import logging
import time
from dataclasses import dataclass

import stripe
from constants import db
from firebase_admin import firestore
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import Transaction
from lib.stripe.commons import ERROR_URL


@dataclass
class StripeCheckoutRequest:
  eventId: str
  isPrivate: bool
  quantity: int
  cancelUrl: str

  def __post_init__(self):
    if not isinstance(self.eventId, str):
      raise ValueError("Event Id must be provided as a string.")
    if not isinstance(self.isPrivate, bool):
      raise ValueError("Is Private must be provided as a boolean.")
    if not isinstance(self.quantity, int):
      raise ValueError("Quantity must be provided as a integer.")
    if not isinstance(self.cancelUrl, str):
      raise ValueError("Cancel Url must be provided as a string.")

# TODO: dataclass for event schema in db

@firestore.transactional
def create_stripe_checkout_session_by_event_id(transaction: Transaction, event_id: str, quantity: int, is_private: bool, cancel_url: str) -> https_fn.Response:

  private_path = "Private" if is_private else "Public"

  event_ref = db.collection(f"Events/Active/{private_path}").document(event_id)
  maybe_event = event_ref.get(transaction=transaction)

  # Check if the event exists, if not error out
  if (not maybe_event.exists):
    logging.error(f"Provided event {event_ref.path} does not exist in the database. Returning status=404")
    return https_fn.Response(json.dumps({"url": ERROR_URL}), status=404)
  
  event = maybe_event.to_dict()
  
  # 1. check for event is stripe enabled
  if (not event.get("paymentsActive")):
    print("Payments not active")
    logging.error(f"Provided event {event_ref.path} does not have payments enabled. Returning status=500")
    return https_fn.Response(json.dumps({"url": cancel_url}), status=500)

  organiser_id = event.get("organiserId")
  organiser_ref = db.collection("Users").document(organiser_id)
  maybe_organiser = organiser_ref.get(transaction=transaction)
  
  # Check if the organiser exists, if not error out
  if (not maybe_organiser.exists):
    logging.error(f"Provided event {event_ref.path} has an organiser {organiser_ref.path} who does not exist in the database. Returning status=404")
    return https_fn.Response(json.dumps({"url": ERROR_URL}), status=404)

  organiser = maybe_organiser.to_dict()

  # 2a. check for event organiser has stripe account
  if (organiser.get("stripeAccount") == None):
    logging.error(f"Provided event {event_ref.path} has an organiser {organiser_ref.path} who does not have a stripe account. Returning status=500")
    return https_fn.Response(json.dumps({"url": ERROR_URL}), status=500)
  
  # 2b. check if the stripe account is active
  if (organiser.get("stripeAccountActive") == False):
    account = stripe.Account.retrieve(organiser.get("stripeAccount"))
    # if its not active, double check to see if this is the n+1 iteration, hence if they have charges enabled and details submitted for stripe, open their account, else error out
    if account.charges_enabled and account.details_submitted:
      transaction.update(organiser_ref, {"stripeAccountActive": True})
      logging.info(f"Provided organiser {organiser_ref.path} already has all charges enabled and details submitted. Activiating their sportshub stripe account.")

    else:
      logging.error(f"Provided event {event_ref.path} has an organiser {organiser_ref.path} who does not have a active stripe account. charges_enabled={account.charges_enabled} details_submitted={account.details_submitted} Returning status=500")
      return https_fn.Response(json.dumps({"url": ERROR_URL}), status=500)

  # 3. check again with database in transction in the backend if quantity is still available
  vacancy = event.get("vacancy")

  if vacancy < quantity:
    logging.warning(f"Provided event {event_ref.path} does not have enough tickets to fulfill this order. quantity_requested={quantity} vacancy={vacancy}")
    return https_fn.Response(json.dumps({"url": cancel_url}), status=500)
  
  # 4. obtain price and organiser stripe account id again from db
  price = event.get("price")
  organiser_stripe_account_id = organiser.get("stripeAccount")

  # 4a. check if the price exists for this event
  if (price == None or not isinstance(price, int) or price <= 1): # we don't want events to be less than stripe fees
    logging.error(f"Provided event {event_ref.path} does not have a valid price. Returning status=500")
    return https_fn.Response(json.dumps({"url": ERROR_URL}), status=500)

  # 5. set the tickets as sold and reduce vacancy (prevent race condition/ over selling, we will release tickets back after cancelled sale)
  transaction.update(event_ref, {"vacancy": vacancy - quantity })
  logging.info(f"Securing {quantity} tickets for event {event_ref.path} at ${price}. There are now {vacancy - quantity} tickets left.")

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
        "unit_amount": price * 100
      },
      "quantity": quantity
    }],
    metadata={
      "eventId": event_id
    },
    # payment_intent_data={"application_fee_amount": 123},
    success_url="https://example.com/success",
    cancel_url=cancel_url,
    stripe_account= organiser_stripe_account_id,
    expires_at=int(time.time() + 300) # Checkout session expires in 5 minutes
  )

  logging.info(f"Creating checkout session {checkout.id} for event {event_ref.path}, linked to {organiser_ref.path} and their stripe account {organiser_stripe_account_id}. Secured {quantity} tickets at ${price}.")
  return https_fn.Response(json.dumps({"url": checkout.url}), status=200)


@https_fn.on_request(cors=options.CorsOptions(cors_origins=["localhost", "www.sportshub.net.au", "*"], cors_methods=["post"]))
def get_stripe_checkout_url_by_event_id(req: https_fn.Request) -> https_fn.Response:
  body_data = req.get_json()

  # Validate the incoming request to contain the necessary fields
  try:
    request_data = StripeCheckoutRequest(**body_data)
  except ValueError as v:
    logging.warning(f"Request body did not contain necessary fields. Error was thrown: {v}. Returned status=400")

  transaction = db.transaction()

  checkout_url = create_stripe_checkout_session_by_event_id(transaction, request_data.eventId, request_data.quantity, request_data.isPrivate, request_data.cancelUrl)

  return https_fn.Response(json.dumps({"url": checkout_url}))