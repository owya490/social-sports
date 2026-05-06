########################
# DEPRECATED DO NO USE #
########################

import os
from time import sleep
import uuid
from dataclasses import dataclass
from collections import defaultdict
from firebase_functions import https_fn, options
from google.protobuf.timestamp_pb2 import Timestamp
from lib.emails.commons import cents_to_dollars
from lib.constants import db
from lib.logging import Logger
from lib.sendgrid.constants import (
    DELETE_EVENT_ORGANISER_EMAIL_TEMPLATE_ID,
    DELETE_EVENT_ATTENDEE_EMAIL_TEMPLATE_ID,
    SENDGRID_API_KEY,
)
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


@dataclass
class SendGridDeleteEventRequest:
    eventId: str

    def __post_init__(self):
        if not isinstance(self.eventId, str):
            raise ValueError("Event Id must be provided as a string.")


def get_attendees_from_orders(
    logger: Logger, event_id: str, event_metadata_data: dict
) -> tuple[list[dict], list[dict]]:
    """
    Build attendee rows and per-email notification rows from Orders/Tickets.
    """
    attendees: list[dict] = []
    attendee_notification_rows: list[dict] = []
    email_ticket_counts: dict[str, int] = defaultdict(int)

    order_ids = event_metadata_data.get("orderIds", [])
    for order_id in order_ids:
        maybe_order_doc = db.collection("Orders").document(order_id).get()
        if not maybe_order_doc.exists:
            logger.warning(
                f"Order missing while collecting attendees. eventId={event_id} orderId={order_id}"
            )
            continue

        order_data = maybe_order_doc.to_dict() or {}
        if order_data.get("status") != "APPROVED":
            continue

        purchaser_email = order_data.get("email")
        purchaser_name = order_data.get("fullName", "")
        ticket_ids = order_data.get("tickets", []) or []
        approved_ticket_count = 0

        for ticket_id in ticket_ids:
            maybe_ticket_doc = db.collection("Tickets").document(ticket_id).get()
            if not maybe_ticket_doc.exists:
                logger.warning(
                    f"Ticket missing while collecting attendees. eventId={event_id} ticketId={ticket_id}"
                )
                continue

            ticket_data = maybe_ticket_doc.to_dict() or {}
            if (
                ticket_data.get("eventId") == event_id
                and ticket_data.get("status") == "APPROVED"
            ):
                approved_ticket_count += 1

        if approved_ticket_count <= 0:
            continue

        attendees.append(
            {
                "name": purchaser_name or purchaser_email or "Attendee",
                "email": purchaser_email,
                "tickets": approved_ticket_count,
            }
        )
        if purchaser_email:
            email_ticket_counts[purchaser_email] += approved_ticket_count

    for email, ticket_count in email_ticket_counts.items():
        attendee_notification_rows.append({"email": email, "tickets": ticket_count})

    return attendees, attendee_notification_rows


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["https://www.sportshub.net.au", "*"], cors_methods=["post"]
    ),
    region="australia-southeast1",
    timeout_sec=540,
)
def send_email_on_delete_event(req: https_fn.CallableRequest):
    uid = str(uuid.uuid4())
    logger = Logger(f"sendgrid_delete_event_logger_{uid}")
    logger.add_tag("uuid", uid)

    body_data = req.data
    logger.info("Received delete event request.")
    try:
        request_data = SendGridDeleteEventRequest(**body_data)
        logger.info(f"Parsing delete event request. eventId={request_data.eventId}")
        logger.info(f"Parsed request data: {request_data}.")
    except ValueError as v:
        logger.warning(
            f"Request body did not contain necessary fields. Error: {v}. Returned status=400"
        )
        return {"status": 400, "message": "Invalid request data"}

    # Get the deleted event data from the database
    maybe_event_metadata = (
        db.collection("EventsMetadata").document(request_data.eventId).get()
    )
    if not maybe_event_metadata.exists:
        logger.error(
            f"Unable to find deleted event in EventsMetadata. eventId={request_data.eventId}"
        )
        return {"status": 400, "message": "Event metadata not found"}

    maybe_delete_event_data = (
        db.collection("DeletedEvents").document(request_data.eventId).get()
    )
    if not maybe_delete_event_data.exists:
        logger.error(
            f"Unable to find deleted event in DeletedEvents. eventId={request_data.eventId}"
        )
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
        return {
            "status": 400,
            "message": f"Missing event details: {', '.join(missing_fields)}",
        }

    if event_status == False:
        logger.info(
            f"Event {event_name} was already inactive at deletion. No email will be sent."
        )
        return {"status": 200, "message": "Event already inactive"}

    # Convert price to dollars
    event_price = cents_to_dollars(event_price)
    logger.info(f"Converted event price to dollars: {event_price}")

    sg = SendGridAPIClient(SENDGRID_API_KEY)

    # Prepare attendees from Orders/Tickets as source of truth.
    attendees, attendee_notification_rows = get_attendees_from_orders(
        logger, request_data.eventId, event_metadata_data
    )

    # Send organizer email
    try:
        organiser_message = Mail(
            from_email="team.sportshub@gmail.com",
            to_emails=organiser_email,
            subject=f"Your event '{event_name}' has been deleted",
        )
        organiser_message.template_id = DELETE_EVENT_ORGANISER_EMAIL_TEMPLATE_ID
        organiser_message.dynamic_template_data = {
            "organiser_name": "",
            "event_name": event_name,
            "event_date": date_string,
            "attendees": attendees,
        }
        sg.send(organiser_message)
        logger.info(
            f"Organizer email sent to {organiser_email} for event: {event_name}"
        )
    except Exception as e:
        logger.error(f"Failed to send email to organizer. Exception: {e}")

    MAX_RETRIES = 3
    RETRY_DELAY_SECONDS = 1
    for purchaser_info in attendee_notification_rows:
        purchaser_email = purchaser_info.get("email")
        ticket_count = purchaser_info.get("tickets")
        for attempt in range(1, MAX_RETRIES + 1):
            sleep(0.5)  # 0.5 sec jitter
            try:
                attendee_message = Mail(
                    from_email="team.sportshub@gmail.com",
                    to_emails=purchaser_email,
                    subject=f"Notification: {event_name} has been deleted",
                )
                attendee_message.dynamic_template_data = {
                    "event_name": event_name,
                    "event_price": event_price,
                    "ticket_count": ticket_count,
                    "organiser_email": organiser_email,
                }
                attendee_message.template_id = DELETE_EVENT_ATTENDEE_EMAIL_TEMPLATE_ID

                response = sg.send(attendee_message)
                if 200 <= response.status_code < 300:
                    logger.info(
                        f"Attendee email sent to {purchaser_email} for event: {event_name}"
                    )
                    break  # Exit the retry loop on success
                else:
                    logger.error(
                        f"Attempt {attempt}: Failed to send email to {purchaser_email}. Response: {response.body}"
                    )

            except Exception as e:
                logger.error(
                    f"Attempt {attempt}: Failed to send email to {purchaser_email}. Exception: {e}"
                )

            if attempt < MAX_RETRIES:
                logger.info(
                    f"Retrying email to {purchaser_email} in {RETRY_DELAY_SECONDS} seconds..."
                )
                sleep(RETRY_DELAY_SECONDS)
            else:
                logger.error(
                    f"Failed to send email to {purchaser_email} after {MAX_RETRIES} attempts."
                )

    logger.info(
        f"All emails sent for event: {event_name}, eventId={request_data.eventId}"
    )
    return {"status": 200, "message": "Emails sent successfully"}
