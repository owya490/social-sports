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
from lib.logging import Logger

from functions.lib.emails.constants import LOOPS_API_KEY

ACTIVE_PUBLIC = "Events/Active/Public"
ACTIVE_PRIVATE = "Events/Active/Private"
EVENT_METADATA = "EventsMetadata"

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

    for purchaser in event_metadata_dict.get("purchaserMap", {}):
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
    aest = pytz.timezone('Australia/Sydney')

    if (event_start_date.ToDatetime().astimezone(aest).date() == tomorrow):
      start_date: Timestamp = event_dict.get("startDate").timestamp_pb()
      end_date: Timestamp = event_dict.get("endDate").timestamp_pb()
      aest = pytz.timezone('Australia/Sydney')
      start_date_string =  start_date.ToDatetime().astimezone(aest).strftime("%m/%d/%Y, %H:%M")
      end_date_string =  end_date.ToDatetime().astimezone(aest).strftime("%m/%d/%Y, %H:%M")

      logger.info(f"{event_id} is starting tomorrow")
      all_events_starting_tomorrow.append(EventReminderVariables(
        eventid=event_id, 
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
def move_inactive_events(event: scheduler_fn.ScheduledEvent) -> None:
  uid = str(uuid.uuid4())
  logger = Logger(f"email_reminder_logger_{uid}")
  logger.add_tag("uuid", uid)
  
  aest = pytz.timezone('Australia/Sydney')
  tomorrow = (datetime.now(aest) + timedelta(days=1)).date()

  logger.info("Sending reminder emails for events for date " + tomorrow.strftime("%d/%m/%Y, %H:%M:%S"))
  all_events_starting_tomorrow = get_active_events_starting_tomorrow(logger, tomorrow, ACTIVE_PUBLIC) + get_active_events_starting_tomorrow(logger, tomorrow, ACTIVE_PRIVATE)

  for event in all_events_starting_tomorrow:
    event: EventReminderVariables = event
    for purchaser in event.purchasers:
      combined_name = ""
      for name in purchaser.names:
        combined_name += f"and {name}"
      combined_name.removeprefix("and ")

      send_email_with_loop(logger, purchaser.email, combined_name, event.eventName, event.eventId, event.startDate, event.endDate, event.location)

  return https_fn.Response(f"Sent all reminders for upcoming events.")