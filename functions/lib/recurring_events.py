import uuid
from datetime import date, datetime
from dateutil.relativedelta import relativedelta
from enum import Enum
from dataclasses import dataclass

from firebase_functions import https_fn, scheduler_fn
from google.protobuf.timestamp_pb2 import Timestamp
from lib.constants import db
from lib.logging import Logger
from lib.create_events import create_event, NewEventData
from google.cloud.firestore import DocumentReference, Transaction

RECURRING_ACTIVE = "RecurringEvents/Active"

class Frequency(Enum):
    WEEKLY = 0
    FORTNIGHTLY = 1
    MONTHLY = 2

@firestore.transactional
def create_events_from_recurrence_templates(today: date, logger: Logger, transaction: Transaction) -> None:
    active_recurring_events_ref = db.collection(RECURRING_ACTIVE)
    active_recurring_events = active_recurring_events_ref.get(transaction=transaction)
    # active_recurring_events = active_recurring_events_ref.stream()

    # Scan through and if today's date is past the date of the event minus the number of days before to create the event, 
    # then create a new event from the recurrence template.
    for recurring_event_id, recurring_event in active_recurring_events.items():
        logger.info(recurring_event_id)
        recurring_event_dict = recurring_event.to_dict()
        event_data_template: NewEventData = recurring_event_dict.get("eventDataTemplate")
        recurrence_data = recurring_event_dict.get("recurrenceData")

        create_days_before = int(recurrence_data.get("createDaysBefore"))
        
        # Create new event from recurrence template if target date of creation has been passed.
        next_start_date: Timestamp = recurrence_data.get("nextStartDate")
        next_end_date: Timestamp = recurrence_data.get("nextEndDate")
        target_creation_date = next_start_date - relativedelta(days=create_days_before)
        if today >= target_creation_date:
            # Update the startDate and endDate in the event data template to the next dates.
            event_data_template["startDate"] = next_start_date
            event_data_template["endDate"] = next_end_date
            # batch = db.batch()
            create_event(event_data_template, transaction)

            # Update the nextStartDate and nextEndDate in the recurrence data based on frequency.
            frequency = recurrence_data["frequency"]
            if frequency == Frequency.WEEKLY:
                recurrence_data["nextStartDate"] = next_start_date + relativedelta(days=7)
            elif frequency == Frequency.FORTNIGHTLY:
                recurrence_data["nextStartDate"] = next_start_date + relativedelta(weeks=2)
            elif frequency == Frequency.MONTHLY:
                recurrence_data["nextStartDate"] = next_start_date + relativedelta(months=1)
            # Update nextEndDate accordingly.
            ms_time_diff = next_end_date.ToMilliseconds() - next_start_date.ToMilliseconds()
            recurrence_data["nextEndDate"] = Timestamp.FromMilliseconds(next_start_date.ToMilliseconds() + ms_time_diff)
                
            recurring_event_dict["eventDataTemplate"] = event_data_template
            recurring_event_dict["recurrenceData"] = recurrence_data
            recurring_event_dict_ref = db.collection(RECURRING_ACTIVE).document(recurring_event_id)
            transaction.set(recurring_event_dict_ref, recurring_event_dict)


@scheduler_fn.on_schedule(schedule="every day 00:00", region="australia-southeast1")
def create_recurring_events_cron(event: scheduler_fn.ScheduledEvent) -> None:
    uid = str(uuid.uuid4())
    logger = Logger(f"create_events_from_recurrence_{uid}")
    logger.add_tag("uuid", uid)

    today = date.today()

    logger.info("Creating new events from recurrence templates for date " + today)

    transaction = db.transaction()
    create_events_from_recurrence_templates(today, logger, transaction)

    return https_fn.Response(f"Created all events from recurrence templates which have reached their date of creation.")
    
@scheduler_fn.on_schedule(schedule="every day 00:00", region="australia-southeast1")
def move_ianctive_recurring_events_cron(event: scheduler_fn.ScheduledEvent) -> None:
    uid = str(uuid.uuid4())
