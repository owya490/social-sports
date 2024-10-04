import os
import uuid
from dataclasses import dataclass
from firebase_functions import https_fn, options
from google.protobuf.timestamp_pb2 import Timestamp
from functions.lib.sendgrid.commons import cents_to_dollars
from lib.constants import db  
from lib.logging import Logger  
from lib.sendgrid.constants import DELETE_EVENT_ATTENDEE_EMAIL_TEMPLATE_ID, SENDGRID_API_KEY
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
def send_email_on_delete_event_for_organiser(req: https_fn.CallableRequest):
    uid = str(uuid.uuid4())
    logger = Logger(f"sendgrid_delete_event_logger_{uid}")
    logger.add_tag("uuid", uid)

    body_data = req.data

    try:
        request_data = SendGridDeleteEventRequest(**body_data)
    except ValueError as v:
        logger.warning(f"Request body did not contain necessary fields. Error was thrown: {v}. Returned status=400")
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
    # Retrieve the event data
    event_metadata_data = maybe_event_metadata.to_dict()
    event_delete_data = maybe_delete_event_data.to_dict()

    event_name = event_delete_data.get("eventName")
    event_price = event_delete_data.get("eventPrice")
    event_status = event_delete_data.get("eventStatusAtDeletion")
    organiser_email = event_delete_data.get("userEmail")


    purchaser_map = event_metadata_data.get("purchaserMap", {})


    if event_name is None or event_price is None or organiser_email is None or event_status is None:
        logger.warning(f"Event deletion notification has missing details: "
                   f"event_name='{event_name}', event_price='{event_price}'. "
                   f"Event ID: {request_data.eventId}. Purchaser Map: {purchaser_map}."
                   f"organiser_email='{organiser_email}'."
                   f"event_status='{event_status}'.")
    if event_status == False:
        return https_fn.Response(status=200)
    event_price = cents_to_dollars(event_price)
    # If purchaserMap is empty, log and return
    if not purchaser_map:
        logger.warning(f"No purchasers found for event: {request_data.eventId}. Nothing to send.")
        return https_fn.Response(status=200, headers={'Access-Control-Allow-Origin': '*'})

    # Send an email to each purchaser in the purchaserMap
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        for purchaser_id, purchaser_info in purchaser_map.items():
            # Skip if email is missing
            if not purchaser_info.get("email"):
                logger.error(f"No email found for order: {purchaser_id}.")
                continue

            purchaser_email = purchaser_info.get("email")
            
            if not purchaser_info.get("totalTicketCount"):
                logger.error(f"No tickets found for order: {purchaser_id}.")
                continue
            ticket_count = purchaser_info.get("totalTicketCount")
            # Compose the email message for the purchaser
            subject = f"Notification: {event_name} has been deleted"
            message = Mail(
                from_email="team.sportshub@gmail.com",
                to_emails=purchaser_email,
                subject=subject,
            )
            message.dynamic_template_data = {
                "event_name": event_name,
                "event_price": event_price,
                "ticket_count": ticket_count,
                "organiser_email": organiser_email,
            }

            message.template_id = DELETE_EVENT_ATTENDEE_EMAIL_TEMPLATE_ID

            # Send the email using SendGrid
            response = sg.send(message)

            # Log the response status
            if 200 <= response.status_code < 300:
                logger.info(f"Email successfully sent to {purchaser_email} for event: {event_name}")
            else:
                logger.error(f"Failed to send email to {purchaser_email}. Response: {response.body}")

          
        return https_fn.Response(status=200, headers={'Access-Control-Allow-Origin': '*'})
    except Exception as e:
        logger.error(f"Error sending event deleted email. eventId={request_data.eventId}", e)
        return https_fn.Response(status=500)
    

    