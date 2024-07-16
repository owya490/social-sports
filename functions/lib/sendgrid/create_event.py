import json
import os
import time
import uuid
from dataclasses import dataclass

import sendgrid.helpers.mail
from firebase_admin import firestore
from firebase_functions import https_fn, options
from google.cloud import firestore
from google.cloud.firestore import Transaction
from google.protobuf.timestamp_pb2 import Timestamp
from lib.constants import db
from lib.logging import Logger
from lib.sendgrid.commons import CREATE_EVENT_EMAIL_TEMPLATE_ID, get_user_email
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


@dataclass
class SendGridCreateEventRequest:
  eventId: str
  visibility: str

  def __post_init__(self):
    if not isinstance(self.eventId, str):
      raise ValueError("Event Id must be provided as a string.")
    if not isinstance(self.visibility, str):
      raise ValueError("Visibility must be provided as a string.")

#cors=options.CorsOptions(cors_origins=["localhost", "www.sportshub.net.au", "*"], cors_methods=["post"])
@https_fn.on_call(region="australia-southeast1")
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

  maybe_organiser_data = db.collection("Users/Active/Private").document(organiser_id).get()
  if (not maybe_organiser_data.exists):
    raise Exception(f"Unable to find organiser provided in datastore to send email. organiserId={organiser_id}")

  organiser_data = maybe_organiser_data.to_dict()

  try: 
    email = get_user_email(organiser_id, organiser_data)
  except Exception as e:
    logger.error(f"Error occured in getting organiser email.", e)
    return https_fn.Response(status=400)
  
  try:
    subject = "Thank you for creating " + event_data["name"]
    message = Mail(
      from_email="team.sportshub@gmail.com",
      to_emails=email,
      subject=subject,
    )
    start_date: Timestamp = event_data.get("startDate").timestamp_pb()
    end_date: Timestamp = event_data.get("endDate").timestamp_pb()
    start_date_string =  start_date.ToDatetime().strftime("%m/%d/%Y, %H:%M")
    end_date_string =  end_date.ToDatetime().strftime("%m/%d/%Y, %H:%M")
    logger.info(start_date_string)
    logger.info(end_date_string)

    message.dynamic_template_data = {
      "first_name": organiser_data.get("firstName"),
      "event_name": event_data.get("name"),
      "event_location": event_data.get("location"),
      "event_startDate": start_date_string,
      "event_endDate": end_date_string,
      "event_sport": event_data.get("sport"),
      "event_price": event_data.get("price"),
      "event_capacity": event_data.get("capacity"),
      "event_isPrivate": request_data.visibility
    }

    message.template_id = CREATE_EVENT_EMAIL_TEMPLATE_ID

    # TODO possibly either move this to common or make sendgrid service/ client in python
    sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    response = sg.send(message)
    if (not response.status_code == 200):
      raise Exception(f"Sendgrid failed to send message. e={response.body}")

    return https_fn.Response(status=200, headers={'Access-Control-Allow-Origin', '*'})
  except Exception as e:
    logger.error(f"Error sending create event email. eventId={request_data.eventId}", e)
    return https_fn.Response(status=500)
