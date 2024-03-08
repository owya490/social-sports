# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

import json
import os
from datetime import date
import time

import google.cloud.firestore
import stripe
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
 

######################
# STRIPE INTEGRATION #
######################

stripe.api_key = os.environ.get("STRIPE_API_KEY")
stripe_webhook_endpoint_secret = "" # Pull from 

@firestore.transactional
def check_and_update_organiser_stripe_account(transaction: Transaction, organiser_ref: DocumentReference, return_url: str, refresh_url: str) -> str:

  # Check if organiser exists and attempt to get details
  maybe_organiser = organiser_ref.get(transaction=transaction)
  if (not maybe_organiser.exists):
    return "localhost:3000/error"
  
  organiser = maybe_organiser.to_dict()

  # If stripe account id exists and is active, return to previous page
  if (organiser.get("stripeAccount") != None and organiser.get("stripeAccountActive") == True):
    return return_url

  # 1. first check if the calling organiser already has a stripe account
  organiser_stripe_account = organiser.get("stripeAccount")
  if organiser_stripe_account == None:
    # 2a. if they dont, make a new stripe account and call account link
    account = stripe.Account.create(type="standard")
    transaction.update(organiser_ref, {"stripeAccount": account.id, "stripeAccountActive": False})
    link = stripe.AccountLink.create(
      account=account,
      refresh_url=refresh_url,
      return_url=return_url,
      type="account_onboarding",
    )
    return link["url"]
  else:
    # 2b. if they do, check if they need to sign up more
    account = stripe.Account.retrieve(organiser_stripe_account)
    if not account.charges_enabled or not account.details_submitted:
      # 3a. if they have don't have charges enabled or details submitted, then bring back to register page
      link = stripe.AccountLink.create(
        account=account,
        refresh_url=refresh_url,
        return_url=return_url,
        type="account_onboarding",
      )
      return link["url"]

    else:
      # 3b. they have everything done, so flick switch for stripeAccount done and bring to organiser dashboard 
      transaction.update(organiser_ref, {"stripeAccountActive": True})
      return return_url

@https_fn.on_request(cors=options.CorsOptions(cors_origins=["localhost", "www.sportshub.net.au", "*"], cors_methods=["post"]))
def create_stripe_standard_account(req: https_fn.Request) -> https_fn.Response:
  body_data = req.get_json()
  return_url = body_data["returnUrl"]
  refresh_url = "http://localhost:3000/stripe/refreshAccountLink"
  transaction = db.transaction()

  # Check if organiser exists and attempt to get details
  organiser_id = body_data["organiser"]
  organiser_ref = db.collection("Users").document(organiser_id)

  url = check_and_update_organiser_stripe_account(transaction, organiser_ref, return_url, refresh_url)
  
  return https_fn.Response(json.dumps({"url": url}))


@firestore.transactional
def create_stripe_checkout_session_by_event_id(transaction: Transaction, event_id: str, quantity: int, is_private: bool):

  private_path = "Private" if is_private else "Public"

  event_ref = db.collection(f"Events/Active/{private_path}").document(event_id)
  maybe_event = event_ref.get(transaction=transaction)

  if (not maybe_event.exists):
    print("Event does not exist")
    return "localhost:3000/error"
  
  event = maybe_event.to_dict()
  
  # 1. check for event is stripe enabled
  if (not event.get("paymentsActive")):
    print("Payments not active")
    return "localhost:3000/error"

  organiser_id = event.get("organiserId")
  organiser_ref = db.collection("Users").document(organiser_id)
  maybe_organiser = organiser_ref.get(transaction=transaction)
  
  if (not maybe_organiser.exists):
    print("Organiser doesn't exist")
    return "localhost:3000/error"

  organiser = maybe_organiser.to_dict()
  # 2a. check for event organiser has stripe account
  if (organiser.get("stripeAccount") == None):
    print("organiser doesnt have a stripe account")
    return "localhost:3000/error"
  
  # 2b. check if the stripe account is active
  if (organiser.get("stripeAccountActive") == False):
    account = stripe.Account.retrieve(organiser.get("stripeAccount"))
    if account.charges_enabled and account.details_submitted:
      transaction.update(organiser_ref, {"stripeAccountActive": True})
    else:
      return "localhost:3000/error"

  # 3. check again with database in transction if quantity is still available
  if event.get("vacancy") < quantity:
    print("not enough quantity for event")
    return "localhost:3000/error"
  
  # 4. obtain price and organiser stripe account id again from db
  price = event.get("price")
  organiser_stripe_account_id = organiser.get("stripeAccount")

  # 5. set the tickets as sold and reduce vacancy (prevent race condition/ over selling, we will release tickets back after cancelled sale)
  transaction.update(event_ref, {"vacancy": event.get("vacancy") - quantity })
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
    cancel_url="https://example.com/cancel",
    stripe_account= organiser_stripe_account_id,
    expires_at=int(time.time() + 300)
  )

  return checkout.url


@https_fn.on_request(cors=options.CorsOptions(cors_origins=["localhost", "www.sportshub.net.au", "*"], cors_methods=["post"]))
def get_stripe_checkout_url_by_event_id(req: https_fn.Request) -> https_fn.Response:
  body_data = req.get_json()
  # success_url = body_data["successUrl"]
  # cancel_url = body_data["cancelUrl"]
  event_id = body_data["eventId"]
  is_private = body_data["isPrivate"]
  quantity = body_data["quantity"]

  transaction = db.transaction()

  checkout_url = create_stripe_checkout_session_by_event_id(transaction, event_id, quantity, is_private)

  return https_fn.Response(json.dumps({"url": checkout_url}))


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
  sig_header = request.META["HTTP_STRIPE_SIGNATURE"]
  event = None

  try:
    event = stripe.Webhook.construct_event(
      payload, sig_header, stripe_webhook_endpoint_secret
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
      # TODO Fulfill the purchase by updating attendees on the event list to customer 
      # (no need to mark tickets as sold as we already deducted it when generating checkout link)
      success = fulfill_completed_event_ticket_purchase(transaction, event_id, is_private, line_items, customer)
      if not success:
        return https_fn.Response(status=400) 
      
      record_checkout_session_by_customer_email(transaction, event_id, session, customer)

      # Handle the checkout.session.expired event
    case "checkout.session.expired":
      # Retrieve the expired session
      session = stripe.checkout.Session.retrieve(
        event['data']['object']['id'],
        expand=['line_items'],
      )

      line_items = session.line_items
      # TODO Restock the tickets back into our inventory




  
  