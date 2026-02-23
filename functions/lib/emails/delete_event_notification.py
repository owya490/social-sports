import base64
import json
import time
import traceback
import uuid
from dataclasses import dataclass
from datetime import datetime

import requests
from firebase_functions import https_fn, options
from google.protobuf.timestamp_pb2 import Timestamp
from lib.constants import SYDNEY_TIMEZONE, db
from lib.emails.commons import get_user_data_public
from lib.emails.constants import (LOOPS_API_KEY,
                                  LOOPS_DELETE_EVENT_ATTENDEE_TEMPLATE_ID,
                                  LOOPS_DELETE_EVENT_ORGANISER_TEMPLATE_ID)
from lib.logging import Logger
from lib.utils.priceUtils import centsToDollars


@dataclass
class DeleteEventRequest:
    eventId: str

    def __post_init__(self):
        if not isinstance(self.eventId, str):
            raise ValueError("Event Id must be provided as a string.")

def generate_attendee_list_txt(attendees: list) -> str:
    """Generate a text file with attendee details and return it as a base64 string."""
    
    # Create the text content
    txt_content = "Event Attendees List\n"
    txt_content += "=" * 50 + "\n\n"
    
    for i, attendee in enumerate(attendees, 1):
        txt_content += f"Attendee #{i}\n"
        txt_content += f"Name: {attendee.get('name', 'N/A')}\n"
        txt_content += f"Email: {attendee.get('email', 'N/A')}\n"
        txt_content += f"Tickets: {attendee.get('tickets', 'N/A')}\n"
        txt_content += "-" * 30 + "\n\n"
    
    txt_content += f"Total Attendees: {len(attendees)}\n"
    txt_content += f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
    
    # Convert to base64
    txt_bytes = txt_content.encode('utf-8')
    return base64.b64encode(txt_bytes).decode('utf-8')

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
    organiser_id = event_delete_data.get("organiserId")
    event_date = event_delete_data.get("startDate") 
    date_string = event_date.strftime("%Y-%m-%d %H")
    order_ids = event_metadata_data.get("orderIds", [])

    missing_fields = [
        field_name
        for field_name, value in {
            "event_name": event_name,
            "event_price": event_price,
            "event_status": event_status,
            "organiser_email": organiser_email,
            "organiser_id": organiser_id,
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

    # Fetch orders and build attendees list
    attendees = []
    for order_id in order_ids:
        order_doc = db.collection("Orders").document(order_id).get()
        if not order_doc.exists:
            logger.warning(f"Order not found: {order_id}")
            continue
        order_data = order_doc.to_dict()
        order_status = order_data.get("status", "")
        if order_status != "APPROVED":
            continue
        ticket_ids = order_data.get("tickets", [])
        attendees.append({
            "name": order_data.get("fullName", ""),
            "email": order_data.get("email", ""),
            "tickets": len(ticket_ids),
        })

    # Send organizer email
    try:
        headers = {"Authorization": "Bearer " + LOOPS_API_KEY}
        logger.info(f"Attendees data: {json.dumps(attendees, default=str)}")
        
        # Get organiser data
        try:
            organiser_data_public = get_user_data_public(organiser_id)
            logger.info(f"Fetched organiser_data_public: {json.dumps(organiser_data_public, default=str)}")
            organiser_name = organiser_data_public.get("firstName", "")
            logger.info(f"Organiser name: {organiser_name}")
        except Exception as e:
            logger.error(f"Error getting organiser info for organiserId={organiser_id}: {e}")
            organiser_name = ""  # Fallback to empty string

        # Generate attendee list as base64 text file
        attendee_list_b64 = generate_attendee_list_txt(attendees)
        logger.info(f"Generated attendee list file (base64 length): {len(attendee_list_b64)}")

        organiser_body = {
            "transactionalId": LOOPS_DELETE_EVENT_ORGANISER_TEMPLATE_ID,
            "email": organiser_email,
            "dataVariables": {
                "organiser_name": organiser_name,
                "event_name": event_name,
                "event_date": date_string,
            },
            "attachments": [
                {
                "filename": "attendees_list.txt",
                "contentType": "text/plain",
                "data": attendee_list_b64
                }
            ]
            }
        logger.info(f"Organiser email payload: {json.dumps(organiser_body, default=str)}")
        response = requests.post("https://app.loops.so/api/v1/transactional", data=json.dumps(organiser_body), headers=headers)
        logger.info(f"Loops API response status: {response.status_code}")
        logger.info(f"Loops API response body: {response.text}")
        
        if response.status_code != 200:
            logger.error(f"Failed to send organizer email. Status: {response.status_code}, Body: {response.text}")
        else:
            logger.info(f"Organizer email sent successfully to {organiser_email}")
            
    except Exception as e:
        logger.error(f"Failed to send email to organizer. Exception: {e}")
    
    MAX_RETRIES = 3  
    for purchaser_info in attendees:
        purchaser_email = purchaser_info.get("email")
        ticket_count = purchaser_info.get("tickets")
        for attempt in range(1, MAX_RETRIES + 1):
            time.sleep(0.5) # 0.5 sec jitter
            try:
                headers = {"Authorization": "Bearer " + LOOPS_API_KEY}
                attendee_body = {
                    "transactionalId": LOOPS_DELETE_EVENT_ATTENDEE_TEMPLATE_ID,
                    "email": purchaser_email,
                    "dataVariables": {
                        "event_name": event_name,
                        "event_price": event_price,
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
                # Exponential backoff: 1s, 2s for retries (after initial 0.5s jitter)
                delay = 2 ** (attempt - 1)  # 1s, 2s
                logger.info(f"Retrying email to {purchaser_email} in {delay}s...")
                time.sleep(delay)
            else:
                logger.error(f"Failed to send email to {purchaser_email} after {MAX_RETRIES} attempts.")

    logger.info(f"All emails sent for event: {event_name}, eventId={request_data.eventId}")
    return {"status": 200, "message": "Emails sent successfully"}