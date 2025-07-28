import json
import time
import uuid
from dataclasses import dataclass
from google.protobuf.timestamp_pb2 import Timestamp

import requests
from firebase_functions import https_fn, options
from lib.constants import SYDNEY_TIMEZONE, db
from lib.emails.constants import LOOPS_API_KEY, LOOPS_DELETE_EVENT_ATTENDEE_TEMPLATE_ID, LOOPS_DELETE_EVENT_ORGANISER_TEMPLATE_ID
from lib.logging import Logger
from lib.utils.priceUtils import centsToDollars
import traceback

@dataclass
class DeleteEventRequest:
    eventId: str

    def __post_init__(self):
        if not isinstance(self.eventId, str):
            raise ValueError("Event Id must be provided as a string.")

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["https://www.sportshub.net.au", "*"],
        cors_methods=["post"]
    ),
    region="australia-southeast1",
    timeout_sec=540
)
def send_email_on_delete_event_v2(req: https_fn.CallableRequest):
    uid = str(uuid.uuid4())
    logger = Logger(f"loops_delete_event_logger_{uid}")
    logger.add_tag("uuid", uid)

    body_data = req.data
    logger.info("Received delete event request.")
    try:
        request_data = DeleteEventRequest(**body_data)
        logger.info(f"Parsing delete event request. eventId={request_data.eventId}")
        logger.info(f"Parsed request data: {request_data}.")
    except ValueError as v:
        logger.warning(f"Request body did not contain necessary fields. Error: {v}. Returned status=400")
        return {"status": 400, "message": "Invalid request data"}

    # Get the deleted event data from the database
    maybe_event_metadata = db.collection("EventsMetadata").document(request_data.eventId).get()
    if not maybe_event_metadata.exists:
        logger.error(f"Unable to find deleted event in EventsMetadata. eventId={request_data.eventId}")
        return {"status": 400, "message": "Event metadata not found"}

    maybe_delete_event_data = db.collection("DeletedEvents").document(request_data.eventId).get()
    if not maybe_delete_event_data.exists:
        logger.error(f"Unable to find deleted event in DeletedEvents. eventId={request_data.eventId}")
        return {"status": 400, "message": "Deleted event data not found"}

    logger.info(f"Retrieved event data for eventId={request_data.eventId}")

    # Retrieve the event data
    event_metadata_data = maybe_event_metadata.to_dict()
    event_delete_data = maybe_delete_event_data.to_dict()

    event_name = event_delete_data.get("name")
    event_price = event_delete_data.get("price")
    event_status = event_delete_data.get("isActive")
    organiser_email = event_delete_data.get("userEmail")
    event_date = event_delete_data.get("startDate") 
    date_string = event_date.strftime("%Y-%m-%d %H")
    purchaser_map = event_metadata_data.get("purchaserMap", {})

    missing_fields = [
        field_name
        for field_name, value in {
            "event_name": event_name,
            "event_price": event_price,
            "event_status": event_status,
            "organiser_email": organiser_email,
            "event_date": event_date,
        }.items()
        if value is None
    ]

    if missing_fields:
        logger.warning(
            f"Missing event details for eventId={request_data.eventId}. Missing fields: {', '.join(missing_fields)}."
        )
        return {"status": 400, "message": f"Missing event details: {', '.join(missing_fields)}"}

    if event_status == False:
        logger.info(f"Event {event_name} was already inactive at deletion. No email will be sent.")
        return {"status": 200, "message": "Event already inactive"}

    # Convert price to dollars
    event_price = centsToDollars(event_price)
    logger.info(f"Converted event price to dollars: {event_price}")

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
        headers = {"Authorization": "Bearer " + LOOPS_API_KEY}
        organiser_body = {
            "transactionalId": LOOPS_DELETE_EVENT_ORGANISER_TEMPLATE_ID,  # Replace with actual template ID
            "email": organiser_email,
            "dataVariables": {
                "organiser_name": "",
                "event_name": event_name,
                "event_date": date_string,
                "attendees": attendees
            }
        }
        response = requests.post("https://app.loops.so/api/v1/transactional", data=json.dumps(organiser_body), headers=headers)
        logger.info(f"Organizer email sent to {organiser_email} for event: {event_name}")
    except Exception as e:
        logger.error(f"Failed to send email to organizer. Exception: {e}")
    
    MAX_RETRIES = 3  
    RETRY_DELAY_SECONDS = 1
    for purchaser_info in attendees:
        purchaser_email = purchaser_info.get("email")
        ticket_count = purchaser_info.get("tickets")
        for attempt in range(1, MAX_RETRIES + 1):
            time.sleep(0.5) # 0.5 sec jitter
            try:
                headers = {"Authorization": "Bearer " + LOOPS_API_KEY}
                attendee_body = {
                    "transactionalId": LOOPS_DELETE_EVENT_ATTENDEE_TEMPLATE_ID,  # Replace with actual template ID
                    "email": purchaser_email,
                    "dataVariables": {
                        "event_name": event_name,
                        "ticket_count": ticket_count,
                        "organiser_email": organiser_email,
                    }
                }
                
                response = requests.post("https://app.loops.so/api/v1/transactional", data=json.dumps(attendee_body), headers=headers)
                if 200 <= response.status_code < 300:
                    logger.info(f"Attendee email sent to {purchaser_email} for event: {event_name}")
                    break  # Exit the retry loop on success
                else:
                    logger.error(f"Attempt {attempt}: Failed to send email to {purchaser_email}. Response: {response.text}")

            except Exception as e:
                logger.error(f"Attempt {attempt}: Failed to send email to {purchaser_email}. Exception: {e}")

            if attempt < MAX_RETRIES:
                logger.info(f"Retrying email to {purchaser_email} in {RETRY_DELAY_SECONDS} seconds...")
                time.sleep(RETRY_DELAY_SECONDS)
            else:
                logger.error(f"Failed to send email to {purchaser_email} after {MAX_RETRIES} attempts.")

    logger.info(f"All emails sent for event: {event_name}, eventId={request_data.eventId}")
    return {"status": 200, "message": "Emails sent successfully"}