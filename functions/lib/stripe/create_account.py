#########################
# STRIPE CREATE ACCOUNT #
#########################

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
from lib.stripe.commons import ERROR_URL

REFRESH_URL = "http://localhost:3000/stripe/refreshAccountLink"

@dataclass
class CreateStandardStripeAccountRequest:
  refreshUrl: str
  returnUrl: str
  organiser: str
  
  def __post_init__(self):
    if not isinstance(self.refreshUrl, str):
      raise ValueError("Refresh Url must be provided as a string.")
    if not isinstance(self.returnUrl, str):
      raise ValueError("Return Url must be provided as a string.")
    if not isinstance(self.organiser, str):
      raise ValueError("Organiser Id must be provided as a string.")
      

@firestore.transactional
def check_and_update_organiser_stripe_account(transaction: Transaction, logger: Logger, organiser_ref: DocumentReference, return_url: str, refresh_url: str):

  # Check if organiser exists and attempt to get details
  maybe_organiser = organiser_ref.get(transaction=transaction)
  if (not maybe_organiser.exists):
    logger.error(f"Provided Organiser {organiser_ref.path} was not found in the database.")
    return json.dumps({"url": ERROR_URL})
  
  organiser = maybe_organiser.to_dict()

  # If stripe account id exists and is active, return to previous page
  if (organiser.get("stripeAccount") != None and organiser.get("stripeAccountActive") == True):
    logger.info(f"Provided Organiser {organiser_ref.path} already has an active stripe account.")
    return json.dumps({"url": return_url})

  # 1. first check if the calling organiser already has a stripe account
  organiser_stripe_account_id = organiser.get("stripeAccount")
  if organiser_stripe_account_id is None:
    # 2a. if they dont, make a new stripe account and call account link
    account = stripe.Account.create(type="standard")
    transaction.update(organiser_ref, {"stripeAccount": account.id, "stripeAccountActive": False})
    link = stripe.AccountLink.create(
      account=account,
      refresh_url=refresh_url,
      return_url=return_url,
      type="account_onboarding",
    )
    logger.info(f"Created a new standard stripe account onboarding workflow for the provided organiser {organiser_ref.path}.")
    return json.dumps({"url": link.url})
  
  else:
    # 2b. if they do, check if they need to sign up more
    account = stripe.Account.retrieve(organiser_stripe_account_id)
    if not account.charges_enabled or not account.details_submitted:
      # 3a. if they have don't have charges enabled or details submitted, then bring back to register page
      link = stripe.AccountLink.create(
        account=account,
        refresh_url=refresh_url,
        return_url=return_url,
        type="account_onboarding",
      )
      logger.info(f"Reactivating the onboarding workflow for provided organiser {organiser_ref.path} as they didn't complete earlier.")
      return json.dumps({"url": link["url"]})

    else:
      # 3b. they have everything done, so flick switch for stripeAccount done and bring to organiser dashboard 
      transaction.update(organiser_ref, {"stripeAccountActive": True})
      logger.info(f"Provided organiser {organiser_ref.path} already has all charges enabled and details submitted. Activiating their sportshub stripe account.")
      return json.dumps({"url": return_url})


@https_fn.on_call(region="australia-southeast1")
def create_stripe_standard_account(req: https_fn.CallableRequest):
  uid = str(uuid.uuid4())
  logger = Logger(f"stripe_create_account_logger_{uid}")
  logger.add_tag("uuid", uid)

  body_data = req.data
  
  # Validate the incoming request to contain the necessary fields
  try:
    request_data = CreateStandardStripeAccountRequest(**body_data)
  except ValueError as v:
    logger.warning(f"Request body did not contain necessary fields. Error was thrown: {v}. Returned status=400")
    return json.dumps({"url": ERROR_URL})

  logger.add_tag("organiser", request_data.organiser)
  
  transaction = db.transaction()
  organiser_ref = db.collection("Users").document(request_data.organiser)
  return check_and_update_organiser_stripe_account(transaction, logger, organiser_ref, request_data.returnUrl, request_data.refreshUrl)
