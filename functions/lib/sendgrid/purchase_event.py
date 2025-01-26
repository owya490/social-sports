import json
import os
import uuid
from dataclasses import dataclass
from datetime import datetime

import pytz
import requests
from google.protobuf.timestamp_pb2 import Timestamp
from lib.constants import db
from lib.logging import Logger
from lib.sendgrid.constants import (LOOP_API_KEY,
                                    PURCHASE_EVENT_EMAIL_TEMPLATE_ID,
                                    SENDGRID_API_KEY)
from lib.utils.priceUtils import centsToDollars
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


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


def send_email_with_loop(logger, email, name, event_name, order_id, date_purchased, quantity, price, start_date, end_date, location):
  headers = {"Authorization": "Bearer " + LOOP_API_KEY}
  body = {
    "transactionalId": "cm4r78nk301ehx79nrrxaijgl",
    "email": email,
    "dataVariables": {
        "name": name,
        "eventName": event_name,
        "orderId": order_id, 
        "datePurchased": date_purchased,
        "quantity": quantity,
        "price": price,
        "startDate" : start_date,
        "endDate": end_date,
        "location": location
    }
  }

  response = requests.post("https://app.loops.so/api/v1/transactional", data=json.dumps(body), headers=headers)
  if (response.status_code != 200):
    logger.error(f"Failed to send payment confirmation for orderId={order_id}, body={response.json()}")



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
    message = Mail(
      from_email='team.sportshub@gmail.com',
      to_emails=request_data.email,
      subject=subject
    )

    start_date: Timestamp = event_data.get("startDate").timestamp_pb()
    end_date: Timestamp = event_data.get("endDate").timestamp_pb()
    aest = pytz.timezone('Australia/Sydney')
    start_date_string =  start_date.ToDatetime().astimezone(aest).strftime("%m/%d/%Y, %H:%M")
    end_date_string =  end_date.ToDatetime().astimezone(aest).strftime("%m/%d/%Y, %H:%M")
    date_purchased: Timestamp = order_data.get("datePurchased").timestamp_pb()
    date_purchased_string = date_purchased.ToDatetime().astimezone(aest).strftime("%m/%d/%Y, %H:%M")

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

    send_email_with_loop(logger, request_data.email, request_data.first_name, event_data.get("name"), request_data.orderId, date_purchased_string, str(len(order_data.get("tickets"))), str(centsToDollars(event_data.get("price"))), start_date_string, end_date_string, event_data.get("location"))

    message.template_id = PURCHASE_EVENT_EMAIL_TEMPLATE_ID

    # TODO possibly either move this to common or make sendgrid service/ client in python
    # sg = SendGridAPIClient(SENDGRID_API_KEY)
    # response = sg.send(message)
    # logger.info(response.status_code)

    # Normally sendgrid return 202, reqeust in progress, but any 2XX response is acceptable.
    # if (not (response.status_code >= 200 and response.status_code < 300)):
    #   raise Exception(f"Sendgrid failed to send message. e={response.body}")

    return True
  except Exception as e:
    logger.error(f"Error sending create event email. eventId={request_data.eventId} error={e}")
    return False

