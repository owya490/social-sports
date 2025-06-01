import uuid
from datetime import date, datetime

import pytz
from firebase_admin import firestore
from firebase_functions import https_fn, options, scheduler_fn
from google.cloud import firestore
from google.cloud.firestore import DocumentReference, Transaction
from google.protobuf.timestamp_pb2 import Timestamp
from lib.auth import *
from lib.constants import *
from lib.constants import (
    ACTIVE_PRIVATE,
    ACTIVE_PUBLIC,
    INACTIVE_PRIVATE,
    INACTIVE_PUBLIC,
    SYDNEY_TIMEZONE,
)
from lib.logging import Logger


@firestore.transactional
def move_event_to_inactive(
    transaction: Transaction,
    old_event_ref: DocumentReference,
    new_event_ref: DocumentReference,
):

    # Get the event in the transaction to ensure operations are atomic
    event_snapshot = old_event_ref.get(transaction=transaction)
    event_dict = event_snapshot.to_dict()
    event_dict.update({"isActive": False})

    # Set the document in InActive
    transaction.set(new_event_ref, event_dict)

    # Delete from the active partition
    transaction.delete(old_event_ref)


# Function to move an event from the upcoming organiser events to past
def remove_event_from_upcoming_organiser_events(
    logger: Logger, today: date, event_id: str, organiser_id: str
):
    if organiser_id == "":
        ValueError(f"invalid organiserId for eventId {event_id}")

    # Reference to the Public organiser data
    public_ref = db.collection("Users/Active/Public").document(organiser_id)

    # Read the public organiser document data
    public_doc = public_ref.get()
    if not public_doc.exists:
        raise ValueError(
            f"Public organiser data not found for organiserId: {organiser_id}"
        )

    public_data = public_doc.to_dict()
    upcoming_events: list = public_data.get("publicUpcomingOrganiserEvents", [])

    # Check if the eventId exists in the upcoming events list and remove it
    if event_id in upcoming_events:
        upcoming_events.remove(event_id)
        logger.info(
            f"Removed eventId {event_id} from publicUpcomingOrganiserEvents of {organiser_id}"
        )
    else:
        logger.warning(
            f"eventId {event_id} not found in publicUpcomingOrganiserEvents for organiserId: {organiser_id}"
        )

    # might as well scan upcoming events to see if we missed any
    for upcoming_event_id in upcoming_events[:]: # build a shallow copy to not cause concurrent modification issues
        upcoming_event = db.collection(ACTIVE_PUBLIC).document(upcoming_event_id).get()
        if not upcoming_event.exists:
            upcoming_events.remove(upcoming_event_id)
            continue
        event_dict = upcoming_event.to_dict()
        event_end_date: Timestamp = event_dict.get("endDate").timestamp_pb()

        if event_end_date.ToDatetime().astimezone(SYDNEY_TIMEZONE).date() < today:
            logger.info(
                f"today is after end date for ${upcoming_event_id} and is in upcoming events so removing"
            )
            upcoming_events.remove(upcoming_event_id)

    public_ref.update({"publicUpcomingOrganiserEvents": upcoming_events})


def get_and_move_public_inactive_events(today: date, logger: Logger):
    # Get all Active Events in Public
    public_events_ref = db.collection(ACTIVE_PUBLIC)
    public_events = public_events_ref.stream()

    # Scan through and if the endDate is past todays date then move it to Events/Inactive/Public
    for event in public_events:
        logger.info(event.id)
        event_id = event.id
        event_dict = event.to_dict()
        event_end_date: Timestamp = event_dict.get("endDate").timestamp_pb()
        organiser_id = event_dict.get("organiserId", "")
        logger.info(event_end_date)

        if event_end_date.ToDatetime().astimezone(SYDNEY_TIMEZONE).date() < today:
            logger.info(f"today is after end date for ${event.id}")
            transaction = db.transaction()
            # The events datetime is earlier so it has already passed, hence we should move it
            move_event_to_inactive(
                transaction=transaction,
                old_event_ref=db.collection(ACTIVE_PUBLIC).document(event_id),
                new_event_ref=db.collection(INACTIVE_PUBLIC).document(event_id),
            )
            try:
                remove_event_from_upcoming_organiser_events(
                    logger, today, event_id=event_id, organiser_id=organiser_id
                )
            except ValueError as e:
                logger.error(f"An error has occured: {e}")


def get_and_move_private_inactive_events(today: date):

    # Get all Active Private Events
    private_events_ref = db.collection(ACTIVE_PRIVATE)
    private_events = private_events_ref.stream()

    # Repeat for Private events, checking if endDate has passed and move to Events/Inactive/Private
    for event in private_events:
        event_id = event.id
        event_dict = event.to_dict()
        event_end_date: Timestamp = event_dict.get("endDate").timestamp_pb()

        if event_end_date.ToDatetime().astimezone(SYDNEY_TIMEZONE).date() < today:
            transaction = db.transaction()
            # The events datetime is earlier so it has already passed, hence we should move it
            move_event_to_inactive(
                transaction=transaction,
                old_event_ref=db.collection(ACTIVE_PRIVATE).document(event_id),
                new_event_ref=db.collection(INACTIVE_PRIVATE).document(event_id),
            )


@scheduler_fn.on_schedule(
    schedule="every day 00:05",
    region="australia-southeast1",
    timezone=scheduler_fn.Timezone("Australia/Sydney"),
)
def move_inactive_events(event: scheduler_fn.ScheduledEvent) -> None:
    uid = str(uuid.uuid4())
    logger = Logger(f"move_inactive_events_logger_{uid}")
    logger.add_tag("uuid", uid)

    today = datetime.now(SYDNEY_TIMEZONE).date()

    logger.info(
        "Moving inactive events for date " + today.strftime("%d/%m/%Y, %H:%M:%S")
    )

    get_and_move_public_inactive_events(today, logger)
    get_and_move_private_inactive_events(today)

    return https_fn.Response(
        f"Moved all Public and Private Active Events which are past their end date to Inactive."
    )
