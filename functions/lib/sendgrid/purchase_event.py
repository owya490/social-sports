import os
import uuid
from dataclasses import dataclass
from datetime import datetime

from google.protobuf.timestamp_pb2 import Timestamp
from lib.constants import db
from lib.logging import Logger
from lib.sendgrid.constants import (PURCHASE_EVENT_EMAIL_TEMPLATE_ID,
                                    SENDGRID_API_KEY)
from lib.utils.priceUtils import centsToDollars
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

MICROSOFT_EMAIL_LIST = [
  "@live.com",
  "@live.com.au",
  "@outlook.com", 
  "@hotmail.com", 
  "@outlook.com.au"
]

SPORTSHUB_GMAIL_EMAIL = "team.sportshub@gmail.com"
SPORTSHUB_OUTLOOK_EMAIL = "team.sportshub@outlook.com"

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
    subject = "Thank you for purchasing " + event_data.get("name")

    # If 
    is_email_microsoft = True if True in [email in request_data.email for email in MICROSOFT_EMAIL_LIST] else False

    message = Mail(
      from_email=MICROSOFT_EMAIL_LIST if is_email_microsoft else SPORTSHUB_GMAIL_EMAIL,
      to_emails=request_data.email,
      subject=subject
    )

    start_date: Timestamp = event_data.get("startDate").timestamp_pb()
    end_date: Timestamp = event_data.get("endDate").timestamp_pb()
    start_date_string =  start_date.ToDatetime().strftime("%m/%d/%Y, %H:%M")
    end_date_string =  end_date.ToDatetime().strftime("%m/%d/%Y, %H:%M")
    date_purchased: Timestamp = order_data.get("datePurchased").timestamp_pb()
    date_purchased_string = date_purchased.ToDatetime().strftime("%m/%d/%Y, %H:%M")

    message.dynamic_template_data = {
      "first_name": request_data.first_name,
      "event_name": event_data.get("name"),
      "order_id": request_data.orderId,
      "location": event_data.get("location"),
      "quantity_bought": len(order_data.get("tickets")),
      "price": centsToDollars(event_data.get("price")),
      "start_date": start_date_string,
      "end_date": end_date_string,
      "date_purchased": date_purchased_string
    }

    message.template_id = PURCHASE_EVENT_EMAIL_TEMPLATE_ID

    # TODO possibly either move this to common or make sendgrid service/ client in python
    sg = SendGridAPIClient(SENDGRID_API_KEY)
    response = sg.send(message)
    logger.info(response.status_code)

    # Normally sendgrid return 202, reqeust in progress, but any 2XX response is acceptable.
    if (not (response.status_code >= 200 and response.status_code < 300)):
      raise Exception(f"Sendgrid failed to send message. e={response.body}")

    return True
  except Exception as e:
    logger.error(f"Error sending create event email. eventId={request_data.eventId} error={e}")
    return False

