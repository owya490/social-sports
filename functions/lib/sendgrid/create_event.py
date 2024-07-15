import json
import time
import uuid
from dataclasses import dataclass

import os
import stripe
from firebase_admin import firestore
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import Transaction
from lib.constants import db
from lib.logging import Logger
from lib.stripe.commons import ERROR_URL
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from lib.sendgrid.commons import get_user_email


@dataclass
class SendGridCreateEventRequest:
  eventId: str
  visibility: str

  def __post_init__(self):
    if not isinstance(self.eventId, str):
      raise ValueError("Event Id must be provided as a string.")
    if not isinstance(self.visibility, str):
      raise ValueError("Visibility must be provided as a string.")


@https_fn.on_call(cors=options.CorsOptions(cors_origins=["localhost", "www.sportshub.net.au", "*"], cors_methods=["post"]), region="australia-southeast1")
def send_email_on_create_event(req: https_fn.CallableRequest):
  uid = str(uuid.uuid4())
  logger = Logger(f"sendgrid_create_event_logger_{uid}")
  logger.add_tag("uuid", uid)

  body_data = req.data

  try:
    request_data = SendGridCreateEventRequest(**body_data)
  except ValueError as v:
    logger.warning(f"Request body did not contain necessary fields. Error was thrown: {v}. Returned status=400")
    return https_fn.Response(status=400)
  

  # TODO add fields for public private + maybe add retries as maybe consistency issues due to firebase update, but email is send prior
  maybe_event_data = db.collection(f"Events/Active/{request_data.visibility}").document(request_data.eventId).get()
  if (not maybe_event_data.exists):
    logger.error(f"Unable to find event provided in datastore to send email. eventId={request_data.eventId}")
    return https_fn.Response(status=400)

  event_data = maybe_event_data.to_dict()
  organiser_id = event_data.get("organiserId")

  try: 
    email = get_user_email(organiser_id)
  except Exception as e:
    logger.error(f"Error occured in getting organiser email.", e)
    return https_fn.Response(status=400)

  maybe_organiser_data = db.collection("Users/Active/Private").document(organiser_id).get()
  if (not maybe_organiser_data.exists):
    logger.error(f"Unable to find organiser provided in datastore to send email. organiserId={organiser_id}")
    return https_fn.Response(status=400)
  
  try:
    message = Mail(
      from_email='team.sportshub@gmail.com',
      to_emails=email,
      subject=f"Thank you for creating {event_data.get("name")}",
    )

    message.dynamic_template_data = {
      "name": event_data.get("name"),
      "location": event_data.get("location"),
      "sport": event_data.get("sport"),
      "price": event_data.get("price"),
      "startDate": event_data.get("startDate"),
      "endDate": event_data.get("endDate")
    }

    # TODO possibly either move this to common or make sendgrid service/ client in python
    sg = sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    response = sg.send(message)
    if (not response.status_code == 200):
      raise Exception(f"Sendgrid failed to send message. e={response.body}")
    
    return https_fn.Response(status=200)
  except Exception as e:
    logger.error(f"Error sending create event email. eventId={request_data.eventId} error={e}")

