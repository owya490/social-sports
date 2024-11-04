import os
import uuid
from dataclasses import dataclass
from firebase_functions import https_fn, options
from google.protobuf.timestamp_pb2 import Timestamp
from lib.sendgrid.commons import cents_to_dollars
from lib.constants import db  
from lib.logging import Logger  
from lib.sendgrid.constants import DELETE_EVENT_ORGANISER_EMAIL_TEMPLATE_ID, DELETE_EVENT_ATTENDEE_EMAIL_TEMPLATE_ID, SENDGRID_API_KEY
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

@dataclass
class SendGridDeleteEventRequest:
    eventId: str

    def __post_init__(self):
        if not isinstance(self.eventId, str):
            raise ValueError("Event Id must be provided as a string.")

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["https://www.sportshub.net.au", "*"],
        cors_methods=["post"]
    ),
    region="australia-southeast1"
)
def send_email_on_delete_event(req: https_fn.CallableRequest):
    uid = str(uuid.uuid4())
    logger = Logger(f"sendgrid_delete_event_logger_{uid}")
    logger.add_tag("uuid", uid)

    body_data = req.data
    logger.info("Received delete event request.")

    try:
        request_data = SendGridDeleteEventRequest(**body_data)
        logger.info(f"Parsed request data: {request_data}.")
    except ValueError as v:
        logger.warning(f"Request body did not contain necessary fields. Error: {v}. Returned status=400")
        return https_fn.Response(status=400)

    # Get the deleted event data from the database
    maybe_event_metadata = db.collection("EventsMetadata").document(request_data.eventId).get()
    if not maybe_event_metadata.exists:
        logger.error(f"Unable to find deleted event in EventsMetadata. eventId={request_data.eventId}")
        return https_fn.Response(status=400)

    maybe_delete_event_data = db.collection("DeletedEvents").document(request_data.eventId).get()
    if not maybe_delete_event_data.exists:
        logger.error(f"Unable to find deleted event in DeletedEvents. eventId={request_data.eventId}")
        return https_fn.Response(status=400)

    logger.info(f"Retrieved event data for eventId={request_data.eventId}")

    # Retrieve the event data
    event_metadata_data = maybe_event_metadata.to_dict()
    event_delete_data = maybe_delete_event_data.to_dict()

    event_name = event_delete_data.get("eventName")
    event_price = event_delete_data.get("eventPrice")
    event_status = event_delete_data.get("eventStatusAtDeletion")
    organiser_email = event_delete_data.get("userEmail")
    organiser_name = event_delete_data.get("userName")  
    event_date = event_delete_data.get("eventDate") 
    purchaser_map = event_metadata_data.get("purchaserMap", {})

    if event_name is None or event_price is None or organiser_email is None or event_status is None:
        logger.warning(f"Missing event details for eventId={request_data.eventId}.")
        return https_fn.Response(status=400)

    if event_status == False:
        logger.info(f"Event {event_name} was already inactive at deletion. No email will be sent.")
        return https_fn.Response(status=200)

    # Convert price to dollars
    event_price = cents_to_dollars(event_price)
    logger.info(f"Converted event price to dollars: {event_price}")

    sg = SendGridAPIClient(SENDGRID_API_KEY)

    # Prepare attendees list for the email template
    attendees = [
        {
            "name": name,
            "email": purchaser_info.get("email"),
            "tickets": purchaser_info.get("totalTicketCount", 0)
        }
        for purchaser_info in purchaser_map.values()
        for name, attendee_info in purchaser_info.get("attendees", {}).items()
    ]

    # Send organizer email
    try:
        organiser_message = Mail(
            from_email="team.sportshub@gmail.com",
            to_emails=organiser_email,
            subject=f"Your event '{event_name}' has been deleted",
        )
        organiser_message.template_id = DELETE_EVENT_ORGANISER_EMAIL_TEMPLATE_ID
        organiser_message.dynamic_template_data={
            "organiser_name": organiser_name,
            "event_name": event_name,
            "event_date": event_date,
            "attendees": attendees
        }
        sg.send(organiser_message)
        logger.info(f"Organizer email sent to {organiser_email} for event: {event_name}")
    except Exception as e:
        logger.error(f"Failed to send email to organizer. Exception: {e}")
        return https_fn.Response(status=500)

    # Send attendee emails
    for purchaser_info in attendees:
        purchaser_email = purchaser_info.get("email")
        ticket_count = purchaser_info.get("tickets")

        try:
            attendee_message = Mail(
                from_email="team.sportshub@gmail.com",
                to_emails=purchaser_email,
                subject=f"Notification: {event_name} has been deleted",
            )
            attendee_message.dynamic_template_data={
                "event_name": event_name,
                "event_price": event_price,
                "ticket_count": ticket_count,
                "organiser_email": organiser_email,
            }
            attendee_message.template_id=DELETE_EVENT_ATTENDEE_EMAIL_TEMPLATE_ID
            response = sg.send(attendee_message)
            if 200 <= response.status_code < 300:
                logger.info(f"Attendee email sent to {purchaser_email} for event: {event_name}")
            else:
                logger.error(f"Failed to send email to {purchaser_email}. Response: {response.body}")
        except Exception as e:
            logger.error(f"Failed to send email to attendee. Exception: {e}")

    logger.info(f"All emails sent for event: {event_name}, eventId={request_data.eventId}")
    return https_fn.Response(status=200)
