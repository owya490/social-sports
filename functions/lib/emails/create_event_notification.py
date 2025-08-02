import json
import time
import uuid
from dataclasses import dataclass
from google.protobuf.timestamp_pb2 import Timestamp

import requests
from firebase_functions import https_fn, options
from lib.constants import SYDNEY_TIMEZONE, db
from lib.emails.constants import LOOPS_API_KEY, LOOPS_CREATE_EVENT_EMAIL_TEMPLATE_ID
from lib.logging import Logger
from lib.utils.priceUtils import centsToDollars
from lib.emails.commons import (
    get_user_data_private,
    get_user_data_public,
    get_user_email,
)
import traceback


@dataclass
class CreateEventRequest:
    eventId: str
    visibility: str


def send_create_event_email_with_loops(
    logger: Logger, email, organiser_name, event_data, request_data
):
    headers = {"Authorization": "Bearer " + LOOPS_API_KEY}
    body = {
        "transactionalId": LOOPS_CREATE_EVENT_EMAIL_TEMPLATE_ID,
        "email": email,
        "dataVariables": {
            "name": organiser_name,
            "eventName": event_data.get("name"),
            "startDate": (
                event_data.get("startDate")
                .timestamp_pb()
                .ToDatetime()
                .astimezone(SYDNEY_TIMEZONE)
                .strftime("%m/%d/%Y, %H:%M")
                if event_data.get("startDate")
                else ""
            ),
            "endDate": (
                event_data.get("endDate")
                .timestamp_pb()
                .ToDatetime()
                .astimezone(SYDNEY_TIMEZONE)
                .strftime("%m/%d/%Y, %H:%M")
                if event_data.get("endDate")
                else ""
            ),
            "eventLocation": event_data.get("location"),
            "eventPrice": centsToDollars(event_data.get("price")),
            "eventCapacity": event_data.get("capacity"),
            "eventSport": event_data.get("sport"),
            "eventId": request_data.eventId,
            "eventPrivacy": request_data.visibility,
            "eventLink": event_data.get("eventLink") or "",
        },
    }

    logger.info(f"Email payload: {json.dumps(body, default=str)}")

    try:
        response = requests.post(
            "https://app.loops.so/api/v1/transactional",
            data=json.dumps(body),
            headers=headers,
        )
        logger.info(f"Loops API response status: {response.status_code}")
        logger.info(f"Loops API response body: {response.text}")

        # Retry once more on rate limit after waiting 1 second
        if response.status_code == 429:
            logger.info(
                f"We got rate limited, retrying after 1 second. eventId={request_data.eventId}, body={response.json()}"
            )
            time.sleep(1)
            response = requests.post(
                "https://app.loops.so/api/v1/transactional",
                data=json.dumps(body),
                headers=headers,
            )
            logger.info(f"Loops API retry response status: {response.status_code}")
            logger.info(f"Loops API retry response body: {response.text}")

        if response.status_code != 200:
            logger.error(
                f"Failed to send create event email for eventId={request_data.eventId}, body={response.text}"
            )

        # Sleep for 300ms to avoid getting rate limited
        time.sleep(0.3)
    except Exception as e:
        logger.error(f"Exception during Loops API call: {e}")
        logger.error(traceback.format_exc())
        raise


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["https://www.sportshub.net.au", "*"], cors_methods=["post"]
    ),
    region="australia-southeast1",
)
def send_email_on_create_event_v2(req: https_fn.CallableRequest):
    uid = str(uuid.uuid4())
    logger = Logger(f"loops_create_event_logger_{uid}")
    logger.add_tag("uuid", uid)

    body_data = req.data

    # Log all body variables for debugging
    logger.info(f"Request body: {body_data}")
    for key, value in body_data.items():
        logger.info(f"Body variable: {key} = {value}")

    try:
        request_data = CreateEventRequest(**body_data)
        logger.info(f"Parsed request_data: {request_data}")
    except Exception as v:
        logger.warning(
            f"Request body did not contain necessary fields. Error was thrown: {v}. Returned status=400"
        )
        logger.error(traceback.format_exc())
        return {"status": 400, "message": "Invalid request body"}

    try:
        event_ref = db.collection(f"Events/Active/{request_data.visibility}").document(
            request_data.eventId
        )
        event_snapshot = event_ref.get()
        logger.info(f"Fetched event_snapshot: exists={event_snapshot.exists}")

        if not event_snapshot.exists:
            logger.error(
                f"Unable to find event provided in datastore to send email. eventId={request_data.eventId}"
            )

            return {"status": 400, "message": "Event not found"}

        event_data = event_snapshot.to_dict()
        logger.info(f"Fetched event_data: {json.dumps(event_data, default=str)}")

        organiser_id = event_data.get("organiserId")
        logger.info(f"Organiser ID: {organiser_id}")

        try:
            organiser_data_public = get_user_data_public(organiser_id)
            logger.info(
                f"Fetched organiser_data: {json.dumps(organiser_data_public, default=str)}"
            )
            organiser_data_private = get_user_data_private(organiser_id)
            logger.info(
                f"Fetched organiser_data: {json.dumps(organiser_data_private, default=str)}"
            )

            email = get_user_email(organiser_id, organiser_data_private)
            organiser_name = organiser_data_public.get("firstName")
            logger.info(f"Organiser email: {email} Name: {organiser_name}")
        except Exception as e:
            logger.error(
                f"Error getting organiser info for organiserId={organiser_id}: {e}"
            )
            logger.error(traceback.format_exc())
            return {"status": 400, "message": "Organiser not found"}

        logger.info(f"Sending Loops email to {email} for event {request_data.eventId}.")
        send_create_event_email_with_loops(
            logger, email, organiser_name, event_data, request_data
        )
        return {"status": 200, "message": "Emails sent successfully"}
    except Exception as e:
        logger.error(
            f"Error sending create event email. eventId={request_data.eventId}, error={e}"
        )
        logger.error(traceback.format_exc())
        return {"status": 500, "message": "Internal Error while sending Email"}
