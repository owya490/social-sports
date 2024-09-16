import os
import uuid
from dataclasses import dataclass

from firebase_functions import https_fn, options
from google.protobuf.timestamp_pb2 import Timestamp
from lib.constants import db
from lib.logging import Logger
from lib.sendgrid.commons import get_user_data, get_user_email
from lib.sendgrid.constants import (
    CREATE_EVENT_EMAIL_TEMPLATE_ID,
    SENDGRID_API_KEY,
    SENDGRID_UNSUBSCRIBE_GROUP_ID,
)
from lib.utils.priceUtils import centsToDollars
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Asm


@dataclass
class SendGridCreateEventRequest:
    eventId: str
    visibility: str

    def __post_init__(self):
        if not isinstance(self.eventId, str):
            raise ValueError("Event Id must be provided as a string.")
        if not isinstance(self.visibility, str):
            raise ValueError("Visibility must be provided as a string.")


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["https://www.sportshub.net.au", "*"], cors_methods=["post"]
    ),
    region="australia-southeast1",
)
def send_email_on_create_event(req: https_fn.CallableRequest):
    uid = str(uuid.uuid4())
    logger = Logger(f"sendgrid_create_event_logger_{uid}")
    logger.add_tag("uuid", uid)

    body_data = req.data

    try:
        request_data = SendGridCreateEventRequest(**body_data)
    except ValueError as v:
        logger.warning(
            f"Request body did not contain necessary fields. Error was thrown: {v}. Returned status=400"
        )
        return https_fn.Response(status=400)

    maybe_event_data = (
        db.collection(f"Events/Active/{request_data.visibility}")
        .document(request_data.eventId)
        .get()
    )
    if not maybe_event_data.exists:
        logger.error(
            f"Unable to find event provided in datastore to send email. eventId={request_data.eventId}"
        )
        return https_fn.Response(status=400)

    event_data = maybe_event_data.to_dict()
    organiser_id = event_data.get("organiserId")

    try:
        organiser_data = get_user_data(organiser_id)
        email = get_user_email(organiser_id, organiser_data)
    except Exception as e:
        logger.error(f"Error occurred in getting organiser email.", e)
        return https_fn.Response(status=400)

    try:
        subject = "Thank you for creating " + event_data["name"]
        message = Mail(
            from_email="team.sportshub@gmail.com",
            to_emails=email,
            subject=subject,
        )

        start_date: Timestamp = event_data.get("startDate", Timestamp()).timestamp_pb()
        end_date: Timestamp = event_data.get("endDate", Timestamp()).timestamp_pb()

        start_date_string = (
            start_date.ToDatetime().strftime("%m/%d/%Y, %H:%M") if start_date else "N/A"
        )
        end_date_string = (
            end_date.ToDatetime().strftime("%m/%d/%Y, %H:%M") if end_date else "N/A"
        )

        message.dynamic_template_data = {
            "first_name": organiser_data.get("firstName"),
            "event_name": event_data.get("name"),
            "event_location": event_data.get("location"),
            "event_startDate": start_date_string,
            "event_endDate": end_date_string,
            "event_sport": event_data.get("sport"),
            "event_price": centsToDollars(event_data.get("price")),
            "event_capacity": event_data.get("capacity"),
            "event_isPrivate": request_data.visibility,
            "event_id": request_data.eventId,
        }

        message.template_id = CREATE_EVENT_EMAIL_TEMPLATE_ID
        message.asm = Asm(group_id=SENDGRID_UNSUBSCRIBE_GROUP_ID)

        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)

        if not (response.status_code >= 200 and response.status_code < 300):
            raise Exception(f"SendGrid failed to send message. e={response.body}")

        return https_fn.Response(
            status=200, headers={"Access-Control-Allow-Origin": "*"}
        )
    except Exception as e:
        logger.error(
            f"Error sending create event email. eventId={request_data.eventId}", e
        )
        return https_fn.Response(status=500)
