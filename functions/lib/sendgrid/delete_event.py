import os
import uuid
from dataclasses import dataclass
from firebase_functions import https_fn, options
from google.protobuf.timestamp_pb2 import Timestamp
from lib.constants import db
from lib.logging import Logger
from lib.sendgrid.commons import get_user_data, get_user_email
from lib.sendgrid.constants import (DELETE_EVENT_EMAIL_TEMPLATE_ID,
                                    SENDGRID_API_KEY)
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


@dataclass
class SendGridDeleteEventRequest:
    eventId: str
    visibility: str

    def __post_init__(self):
        if not isinstance(self.eventId, str):
            raise ValueError("Event Id must be provided as a string.")
        if not isinstance(self.visibility, str):
            raise ValueError("Visibility must be provided as a string.")


@https_fn.on_call(cors=options.CorsOptions(cors_origins=["https://www.sportshub.net.au", "*"], cors_methods=["post"]), region="australia-southeast1")
def send_email_on_delete_event(req: https_fn.CallableRequest):
    uid = str(uuid.uuid4())
    logger = Logger(f"sendgrid_delete_event_logger_{uid}")
    logger.add_tag("uuid", uid)

    body_data = req.data

    try:
        request_data = SendGridDeleteEventRequest(**body_data)
    except ValueError as v:
        logger.warning(f"Request body did not contain necessary fields. Error was thrown: {v}. Returned status=400")
        return https_fn.Response(status=400)

    maybe_event_data = db.collection(f"Events/Active/{request_data.visibility}").document(request_data.eventId).get()
    if not maybe_event_data.exists:
        logger.error(f"Unable to find event provided in datastore to send email. eventId={request_data.eventId}")
        return https_fn.Response(status=400)

    event_data = maybe_event_data.to_dict()
    organiser_id = event_data.get("organiserId")

    organiser_data = get_user_data(organiser_id)

    try:
        email = get_user_email(organiser_id, organiser_data)
    except Exception as e:
        logger.error("Error occurred while getting organiser email.", e)
        return https_fn.Response(status=400)

    try:
        subject = "Event Deletion Notification for " + event_data["name"]
        message = Mail(
            from_email="team.sportshub@gmail.com",
            to_emails=email,
            subject=subject,
        )

        start_date: Timestamp = event_data.get("startDate").timestamp_pb()
        start_date_string = start_date.ToDatetime().strftime("%m/%d/%Y, %H:%M")

        # Prepare dynamic template data with attendees
        attendees = event_data.get("attendees", [])  # Assuming attendees are stored in event_data
        dynamic_data = {
            "event_name": event_data["name"],
            "event_date": start_date_string,
            "attendees": [
                {
                    "name": attendee["name"],
                    "email": attendee["email"],
                    "tickets": attendee["ticketCount"]
                }
                for attendee in attendees
            ]
        }

        message.dynamic_template_data = dynamic_data
        message.template_id = DELETE_EVENT_EMAIL_TEMPLATE_ID
        logger.info("Email composed successfully, ready to send.")

        # Send the email using SendGrid
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)

        # Check response status
        if not (200 <= response.status_code < 300):
            logger.error(f"SendGrid failed to send the message. Status Code: {response.status_code}, Body: {response.body}")
            raise Exception(f"SendGrid failed to send message. e={response.body}")

        logger.info(f"Email successfully sent for eventId={request_data.eventId} with response status: {response.status_code}")

        return https_fn.Response(status=200, headers={'Access-Control-Allow-Origin', '*'})
    except Exception as e:
        logger.error(f"Error sending delete event email. eventId={request_data.eventId}", e)
        return https_fn.Response(status=500)
