from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

FALLBACK_ZONE_ID = "Australia/Sydney"


def zone_for(timezone_id: str | None) -> ZoneInfo:
    if timezone_id:
        try:
            return ZoneInfo(timezone_id)
        except ZoneInfoNotFoundError:
            pass
    return ZoneInfo(FALLBACK_ZONE_ID)


def format_event_local(moment: datetime, timezone_id: str | None) -> str:
    """Clock time in the venue zone. Naive values are UTC instants from Firestore."""
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=ZoneInfo("UTC"))
    return moment.astimezone(zone_for(timezone_id)).strftime("%m/%d/%Y, %H:%M")
