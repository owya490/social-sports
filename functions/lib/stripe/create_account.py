#########################
# STRIPE CREATE ACCOUNT #
#########################

import json
import logging
from dataclasses import dataclass

import stripe
from firebase_admin import firestore
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import DocumentReference, Transaction
from lib.constants import db
from lib.stripe.commons import ERROR_URL

REFRESH_URL = "http://localhost:3000/stripe/refreshAccountLink"

@dataclass
class CreateStandardStripeAccountRequest:
  returnUrl: str
  organiser: str
  
  def __post_init__(self):
    if not isinstance(self.returnUrl, str):
      raise ValueError("Return Url must be provided as a string.")
    if not isinstance(self.organiser, str):
      raise ValueError("Organiser Id must be provided as a string.")
      

@firestore.transactional
def check_and_update_organiser_stripe_account(transaction: Transaction, organiser_ref: DocumentReference, return_url: str, refresh_url: str) -> https_fn.Response:

  # Check if organiser exists and attempt to get details
  maybe_organiser = organiser_ref.get(transaction=transaction)
  if (not maybe_organiser.exists):
    logging.error(f"Provided Organiser {organiser_ref.path} was not found in the database.")
    return https_fn.Response(json.dumps({"url": ERROR_URL}), status=404)
  
  organiser = maybe_organiser.to_dict()

  # If stripe account id exists and is active, return to previous page
  if (organiser.get("stripeAccount") != None and organiser.get("stripeAccountActive") == True):
    logging.info(f"Provided Organiser {organiser_ref.path} already has an active stripe account.")
    return https_fn.Response(json.dumps({"url": return_url}), status=200)

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
    logging.info(f"Created a new standard stripe account onboarding workflow for the provided organiser {organiser_ref.path}.")
    return https_fn.Response(json.dumps({"url": link["url"]}), status=200) 
  
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
      logging.info(f"Reactivating the onboarding workflow for provided organiser {organiser_ref.path} as they didn't complete earlier.")
      return https_fn.Response(json.dumps({"url": link["url"]}), status=200) 

    else:
      # 3b. they have everything done, so flick switch for stripeAccount done and bring to organiser dashboard 
      transaction.update(organiser_ref, {"stripeAccountActive": True})
      logging.info(f"Provided organiser {organiser_ref.path} already has all charges enabled and details submitted. Activiating their sportshub stripe account.")
      return https_fn.Response(json.dumps({"url": return_url}), status=200)


@https_fn.on_request(cors=options.CorsOptions(cors_origins=["localhost", "www.sportshub.net.au", "*"], cors_methods=["post"]))
def create_stripe_standard_account(req: https_fn.Request) -> https_fn.Response:
  body_data = req.get_json()
  
  # Validate the incoming request to contain the necessary fields
  try:
    request_data = CreateStandardStripeAccountRequest(**body_data)
  except ValueError as v:
    logging.warning(f"Request body did not contain necessary fields. Error was thrown: {v}. Returned status=400")
    return https_fn.Response(json.dumps({"url": ERROR_URL}), status=400)

  transaction = db.transaction()
  organiser_ref = db.collection("Users").document(request_data.organiser)

  return check_and_update_organiser_stripe_account(transaction, organiser_ref, request_data.returnUrl, REFRESH_URL)
