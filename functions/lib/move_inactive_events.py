import uuid
from datetime import date, datetime

from firebase_functions import https_fn, scheduler_fn
from google.cloud import firestore
from google.cloud.firestore import DocumentReference, Transaction

from lib.constants import (
    ACTIVE_PRIVATE,
    ACTIVE_PUBLIC,
    INACTIVE_PRIVATE,
    INACTIVE_PUBLIC,
    SYDNEY_TIMEZONE,
    db,
)
from lib.logging import Logger


class EventArchivalError(Exception):
    pass


def has_ended(event_data: dict, today: date) -> bool:
    end_date = event_data.get("endDate")
    if not isinstance(end_date, datetime) or end_date.utcoffset() is None:
        raise EventArchivalError("endDate must be a timezone-aware timestamp")
    return end_date.astimezone(SYDNEY_TIMEZONE).date() < today


@firestore.transactional
def move_event_to_inactive(
    transaction: Transaction,
    old_event_ref: DocumentReference,
    new_event_ref: DocumentReference,
    today: date,
) -> bool:
    event_snapshot = old_event_ref.get(transaction=transaction)
    if not event_snapshot.exists:
        return False

    event_data = event_snapshot.to_dict()
    if not has_ended(event_data, today):
        return False
    if new_event_ref.get(transaction=transaction).exists:
        raise EventArchivalError("inactive event already exists")

    is_public = old_event_ref.path.rsplit("/", 1)[0] == ACTIVE_PUBLIC
    if is_public:
        organiser_id = event_data.get("organiserId")
        if (
            not isinstance(organiser_id, str)
            or not organiser_id.strip()
            or "/" in organiser_id
        ):
            raise EventArchivalError("organiserId must identify one organiser")
        public_ref = db.collection("Users/Active/Public").document(organiser_id)
        public_snapshot = public_ref.get(transaction=transaction)
        if not public_snapshot.exists:
            raise EventArchivalError("public organiser document is missing")
        upcoming_events = public_snapshot.to_dict().get(
            "publicUpcomingOrganiserEvents", []
        )
        if not isinstance(upcoming_events, list) or not all(
            isinstance(event_id, str) for event_id in upcoming_events
        ):
            raise EventArchivalError("publicUpcomingOrganiserEvents must be an ID list")

    event_data["isActive"] = False
    transaction.create(new_event_ref, event_data)
    transaction.delete(old_event_ref)
    if is_public:
        transaction.update(
            public_ref,
            {"publicUpcomingOrganiserEvents": firestore.ArrayRemove([old_event_ref.id])},
        )
    return True


def get_and_move_inactive_events(
    today: date, logger: Logger, active_path: str, inactive_path: str
):
    for event in db.collection(active_path).stream():
        try:
            if not has_ended(event.to_dict(), today):
                continue
            moved = move_event_to_inactive(
                db.transaction(),
                event.reference,
                db.collection(inactive_path).document(event.id),
                today,
            )
        except EventArchivalError as error:
            logger.error(f"Could not archive event {event.id}: {error}")
            continue
        if moved:
            logger.info(f"Archived event {event.id} from {active_path}")


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
    logger.info("Moving inactive events for date " + today.strftime("%d/%m/%Y"))

    get_and_move_inactive_events(today, logger, ACTIVE_PUBLIC, INACTIVE_PUBLIC)
    get_and_move_inactive_events(today, logger, ACTIVE_PRIVATE, INACTIVE_PRIVATE)

    return https_fn.Response(
        "Moved all Public and Private Active Events which are past their end date to Inactive."
    )
