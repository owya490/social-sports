import json
import time
import uuid
from dataclasses import dataclass
from datetime import date, datetime, timedelta

import pytz
import requests
from firebase_admin import firestore
from firebase_functions import https_fn, options, scheduler_fn
from google.cloud import firestore
from google.cloud.firestore import DocumentReference, Transaction
from google.protobuf.timestamp_pb2 import Timestamp
from lib.auth import *
from lib.constants import *
from lib.constants import (ACTIVE_PRIVATE, ACTIVE_PUBLIC, EVENT_METADATA,
                           SYDNEY_TIMEZONE)
from lib.emails.constants import LOOPS_API_KEY
from lib.logging import Logger


@dataclass 
class Purchaser:
  names: list[str]
  email: str


@dataclass
class EventReminderVariables:
  eventId: str
  eventName: str
  startDate: str
  endDate: str
  location: str
  purchasers: list[Purchaser]


def get_purchasers(logger: Logger, event_id: str) -> list[Purchaser]:
  try: 
    event_metadata = db.collection(EVENT_METADATA).document(event_id).get()
    event_metadata_dict = event_metadata.to_dict()
    purchasers: list[Purchaser] = []
    
    for purchaser in dict(event_metadata_dict.get("purchaserMap", {})).values():
      names = list(dict(purchaser.get("attendees", {})).keys())
      purchasers.append(Purchaser(names=names, email=purchaser.get("email")))

    return purchasers

  except Exception as e:
    logger.error(f"Error getting event details. eventId={event_id} error={e}")


def get_active_events_starting_tomorrow(logger: Logger, tomorrow: date, collection: str) -> list[EventReminderVariables]:

  all_events_starting_tomorrow: list[EventReminderVariables] = []

  # Get all Active Events in Public
  events_ref = db.collection(collection)
  events = events_ref.stream()

  for event in events:
    event_id = event.id
    event_dict = event.to_dict()
    event_start_date: Timestamp = event_dict.get("startDate").timestamp_pb()

    if (event_start_date.ToDatetime().astimezone(SYDNEY_TIMEZONE).date() == tomorrow):
      start_date: Timestamp = event_dict.get("startDate").timestamp_pb()
      end_date: Timestamp = event_dict.get("endDate").timestamp_pb()
      start_date_string =  start_date.ToDatetime().astimezone(SYDNEY_TIMEZONE).strftime("%m/%d/%Y, %H:%M")
      end_date_string =  end_date.ToDatetime().astimezone(SYDNEY_TIMEZONE).strftime("%m/%d/%Y, %H:%M")

      logger.info(f"{event_id} is starting tomorrow")
      all_events_starting_tomorrow.append(EventReminderVariables(
        eventId=event_id, 
        eventName=event_dict.get("name", ""),
        startDate=start_date_string,
        endDate=end_date_string,
        location=event_dict.get("location", ""),
        purchasers=get_purchasers(logger, event_id)
      ))

  return all_events_starting_tomorrow


def send_email_with_loop(logger: Logger, email, name, event_name, event_id, start_date, end_date, location):
  headers = {"Authorization": "Bearer " + LOOPS_API_KEY}
  body = {
    "transactionalId": "cm5dwlbsj034sasyzg1w6sg39",
    "email": email,
    "dataVariables": {
        "name": name,
        "eventName": event_name,
        "eventId": event_id, 
        "startDate" : start_date,
        "endDate": end_date,
        "location": location
    }
  }

  logger.info(f"Sending Loops transactional email with id cm5dwlbsj034sasyzg1w6sg39 to {email} for eventId {event_id}")

  response = requests.post("https://app.loops.so/api/v1/transactional", data=json.dumps(body), headers=headers)

  # Retry once more on rate limit after waiting 1 second
  if (response.status_code == 429):
    logger.info(f"We got rate limited, retrying after 1 second. eventId={event_id}, body={response.json()}")
    time.sleep(1)
    response = requests.post("https://app.loops.so/api/v1/transactional", data=json.dumps(body), headers=headers)

  if (response.status_code != 200):
    logger.error(f"Failed to send event reminder for eventId={event_id}, body={response.json()}")

  # Sleep for 300ms to avoid getting rate limited. Loops offer 10 emails a second: https://loops.so/docs/api-reference/intro#rate-limiting
  time.sleep(0.3)

@scheduler_fn.on_schedule(schedule="every day 12:00", region="australia-southeast1", timezone=scheduler_fn.Timezone("Australia/Sydney"), timeout_sec=540)
def email_reminder(event: scheduler_fn.ScheduledEvent) -> None:
  uid = str(uuid.uuid4())
  logger = Logger(f"email_reminder_logger_{uid}")
  logger.add_tag("uuid", uid)
  
  tomorrow = (datetime.now(SYDNEY_TIMEZONE) + timedelta(days=1)).date()

  logger.info("Sending reminder emails for events for date " + tomorrow.strftime("%d/%m/%Y, %H:%M:%S"))
  all_events_starting_tomorrow = get_active_events_starting_tomorrow(logger, tomorrow, ACTIVE_PUBLIC) + get_active_events_starting_tomorrow(logger, tomorrow, ACTIVE_PRIVATE)

  logger.info(f"Events starting tomorrow: {[event.eventId for event in all_events_starting_tomorrow]}")

  for event in all_events_starting_tomorrow:
    event: EventReminderVariables = event
    for purchaser in event.purchasers:
      combined_name = ""
      for name in purchaser.names:
        combined_name += f" and {name}"
      
      send_email_with_loop(logger, purchaser.email, combined_name.removeprefix(" and "), event.eventName, event.eventId, event.startDate, event.endDate, event.location)

  return https_fn.Response(f"Sent all reminders for upcoming events.")