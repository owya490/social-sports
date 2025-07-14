import json
import time
import uuid
from dataclasses import dataclass
from google.protobuf.timestamp_pb2 import Timestamp

import requests
from firebase_functions import https_fn, options
from lib.constants import SYDNEY_TIMEZONE, db
from lib.emails.constants import LOOPS_API_KEY
from lib.logging import Logger
from lib.utils.priceUtils import centsToDollars

@dataclass
class CreateEventRequest:
    eventId: str
    visibility: str

def send_create_event_email_with_loops(logger: Logger, email, organiser_name, event_data, request_data):
    headers = {"Authorization": "Bearer " + LOOPS_API_KEY}
    body = {
        "transactionalId": "cmd2y9sms12mxux0i3tcmdp9v",
        "email": email,
        "dataVariables": {
            "first_name": organiser_name,
            "event_name": event_data.get("name"),
            "event_location": event_data.get("location"),
            "event_startDate": (
                event_data.get("startDate").timestamp_pb().ToDatetime().astimezone(SYDNEY_TIMEZONE).strftime("%m/%d/%Y, %H:%M")
                if event_data.get("startDate") else ""
            ),
            "event_endDate": (
                event_data.get("endDate").timestamp_pb().ToDatetime().astimezone(SYDNEY_TIMEZONE).strftime("%m/%d/%Y, %H:%M")
                if event_data.get("endDate") else ""
            ),
            "event_sport": event_data.get("sport"),
            "event_price": centsToDollars(event_data.get("price")),
            "event_capacity": event_data.get("capacity"),
            "event_isPrivate": request_data.visibility,
            "event_id": request_data.eventId,
        }
    }

    logger.info(f"Sending Loops transactional email with id {body['transactionalId']} to {email} for eventId {request_data.eventId}")

    response = requests.post("https://app.loops.so/api/v1/transactional", data=json.dumps(body), headers=headers)

    # Retry once more on rate limit after waiting 1 second
    if response.status_code == 429:
        logger.info(f"We got rate limited, retrying after 1 second. eventId={request_data.eventId}, body={response.json()}")
        time.sleep(1)
        response = requests.post("https://app.loops.so/api/v1/transactional", data=json.dumps(body), headers=headers)

    if response.status_code != 200:
        logger.error(f"Failed to send create event email for eventId={request_data.eventId}, body={response.json()}")

    # Sleep for 300ms to avoid getting rate limited
    time.sleep(0.3)

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["https://www.sportshub.net.au", "*"], cors_methods=["post"]
    ),
    region="australia-southeast1",
)
def send_email_on_create_event(req: https_fn.CallableRequest):
    uid = str(uuid.uuid4())
    logger = Logger(f"loops_create_event_logger_{uid}")
    logger.add_tag("uuid", uid)

    body_data = req.data

    try:
        request_data = CreateEventRequest(**body_data)
    except Exception as v:
        logger.warning(
            f"Request body did not contain necessary fields. Error was thrown: {v}. Returned status=400"
        )
        return https_fn.Response("Invalid request body", status=400)

    event_ref = db.collection(f"Events/Active/{request_data.visibility}").document(request_data.eventId)
    event_snapshot = event_ref.get()
    if not event_snapshot.exists:
        logger.error(
            f"Unable to find event provided in datastore to send email. eventId={request_data.eventId}"
        )
        return https_fn.Response("Event not found", status=400)

    event_data = event_snapshot.to_dict()
    organiser_id = event_data.get("organiserId")
    organiser_snapshot = db.collection("Users").document(organiser_id).get()
    organiser_data = organiser_snapshot.to_dict()
    email = organiser_data.get("email")
    organiser_name = organiser_data.get("firstName")

    logger.info(f"Sending Loops email to {email} for event {request_data.eventId}.")
    try:
        send_create_event_email_with_loops(logger, email, organiser_name, event_data, request_data)
        return https_fn.Response("Email sent successfully.", status=200)
    except Exception as e:
        logger.error(
            f"Error sending create event email. eventId={request_data.eventId}", e
        )
        return https_fn.Response("Internal error while sending email", status=500)