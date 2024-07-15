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
from lib.sendgrid.commons import PURCHASE_EVENT_EMAIL_TEMPLATE_ID


@dataclass
class SendGridPurchaseEventRequest:
  eventId: str
  visibility: str
  email: str
  first_name: str
  orderId: str

  def __post_init__(self):
    if not isinstance(self.eventId, str):
      raise ValueError("Event Id must be provided as a string.")
    if not isinstance(self.visibility, str):
      raise ValueError("Visibility must be provided as a string.")


# @https_fn.on_call(cors=options.CorsOptions(cors_origins=["localhost", "www.sportshub.net.au", "*"], cors_methods=["post"]), region="australia-southeast1")
# Left as normal python function as only invoked from the Stripe webhook oncall function. Not exposed to outside world.
def send_email_on_purchase_event(request_data: SendGridPurchaseEventRequest):
  uid = str(uuid.uuid4())
  logger = Logger(f"sendgrid_purchase_event_logger_{uid}")
  logger.add_tag("uuid", uid)
  

  # TODO add fields for public private + maybe add retries as maybe consistency issues due to firebase update, but email is send prior
  maybe_event_data = db.collection(f"Events/Active/{request_data.visibility}").document(request_data.eventId).get()
  if (not maybe_event_data.exists):
    logger.error(f"Unable to find event provided in datastore to send email. eventId={request_data.eventId}")
    return False

  event_data = maybe_event_data.to_dict()

  maybe_order_data = db.collection(f"Orders").document(request_data.orderId).get()
  if (not maybe_order_data.exists):
    logger.error(f"Unable to find orderId provided in datastore to send email. orderId={request_data.orderId}")
    return False
  
  order_data = maybe_order_data.to_dict()
  
  try:
    message = Mail(
      from_email='team.sportshub@gmail.com',
      to_emails=request_data.email,
      subject=f"Thank you for purchasing {event_data.get("name")}",
    )

    message.dynamic_template_data = {
      "first_name": request_data.first_name,
      "event_name": event_data.get("name"),
      "order_id": request_data.orderId,
      "location": event_data.get("location"),
      "quantity_bought": len(order_data.get("tickets")),
      "price": event_data.get("price"),
      "start_date": event_data.get("startDate"),
      "end_date": event_data.get("endDate")
    }

    message.template_id = PURCHASE_EVENT_EMAIL_TEMPLATE_ID

    # TODO possibly either move this to common or make sendgrid service/ client in python
    sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    response = sg.send(message)
    if (not response.status_code == 200):
      raise Exception(f"Sendgrid failed to send message. e={response.body}")

    return True
  except Exception as e:
    logger.error(f"Error sending create event email. eventId={request_data.eventId} error={e}")
    return False

