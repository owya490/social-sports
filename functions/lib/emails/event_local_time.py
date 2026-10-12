from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

FALLBACK_ZONE_ID = "Australia/Sydney"

# Same Australia box as EventTimeZone. New Zealand sits east of it and stays Sydney.
_MIN_LAT = -55.0
_MIN_LNG = 96.0
_MAX_LAT = -9.0
_MAX_LNG = 168.5


def zone_for(timezone_id: str | None) -> ZoneInfo:
    if _valid_iana(timezone_id):
        return ZoneInfo(timezone_id.strip())
    return ZoneInfo(FALLBACK_ZONE_ID)


def format_event_local(moment: datetime, timezone_id: str | None) -> str:
    """Clock time in the venue zone. Naive values are UTC instants from Firestore."""
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=ZoneInfo("UTC"))
    return moment.astimezone(zone_for(timezone_id)).strftime("%m/%d/%Y, %H:%M")


def _valid_iana(timezone_id: str | None) -> bool:
    if not timezone_id or "/" not in timezone_id or timezone_id.strip().startswith("Etc/"):
        return False
    try:
        ZoneInfo(timezone_id.strip())
    except ZoneInfoNotFoundError:
        return False
    return True


def _usable_coordinates(lat: float | None, lng: float | None) -> bool:
    if lat is None or lng is None:
        return False
    if lat != lat or lng != lng:  # NaN
        return False
    if lat < -90 or lat > 90 or lng < -180 or lng > 180:
        return False
    if (lat == 0 and lng == 0) or (lat == -1 and lng == -1):
        return False
    return True


def lookup_timezone_id(lat: float | None, lng: float | None) -> str | None:
    """IANA id for a pin inside the Australia box. Keep thresholds aligned with venueTimeZone.ts."""
    if not _usable_coordinates(lat, lng) or lat is None or lng is None:
        return None
    if lat < _MIN_LAT or lat > _MAX_LAT or lng < _MIN_LNG or lng > _MAX_LNG:
        return None
    return _australian_zone(lat, lng)


def resolve_event_timezone(
    timezone_id: str | None, lat: float | None = None, lng: float | None = None
) -> str:
    """Coordinates, then a stored IANA id, then Sydney. Same order as EventTimeZone.resolve."""
    looked_up = lookup_timezone_id(lat, lng)
    if looked_up:
        return looked_up
    if _valid_iana(timezone_id):
        return timezone_id.strip()
    return FALLBACK_ZONE_ID


def resolve_event_dict_timezone(event: dict | None) -> str:
    if not event:
        return FALLBACK_ZONE_ID
    lat_lng = event.get("locationLatLng") or {}
    lat = lat_lng.get("lat") if isinstance(lat_lng, dict) else None
    lng = lat_lng.get("lng") if isinstance(lat_lng, dict) else None
    return resolve_event_timezone(event.get("timezone"), _as_float(lat), _as_float(lng))


def format_event_dict_local(moment: datetime, event: dict | None) -> str:
    return format_event_local(moment, resolve_event_dict_timezone(event))


def starts_on_venue_tomorrow(start: datetime, event: dict | None, job_now: datetime) -> bool:
    """True when the event's venue-local date is the day after the job's venue-local date."""
    zone = zone_for(resolve_event_dict_timezone(event))
    if start.tzinfo is None:
        start = start.replace(tzinfo=ZoneInfo("UTC"))
    if job_now.tzinfo is None:
        job_now = job_now.replace(tzinfo=ZoneInfo(FALLBACK_ZONE_ID))
    venue_today = job_now.astimezone(zone).date()
    return start.astimezone(zone).date() == venue_today + timedelta(days=1)


def venue_local_date(moment: datetime, timezone_id: str | None) -> date:
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=ZoneInfo("UTC"))
    return moment.astimezone(zone_for(timezone_id)).date()


def _as_float(value) -> float | None:
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    return None


def _australian_zone(lat: float, lng: float) -> str:
    if -12.3 <= lat <= -11.8 and 96.7 <= lng <= 97.1:
        return "Indian/Cocos"
    if -10.6 <= lat <= -10.3 and 105.5 <= lng <= 105.8:
        return "Indian/Christmas"
    if -29.2 <= lat <= -28.9 and 167.9 <= lng <= 168.1:
        return "Pacific/Norfolk"
    if -31.7 <= lat <= -31.4 and 158.8 <= lng <= 159.3:
        return "Australia/Lord_Howe"
    if lat < -53.5 and 158 <= lng <= 160:
        return "Antarctica/Macquarie"
    if -32.6 <= lat <= -31.4 and 125.5 <= lng <= 129.1:
        return "Australia/Eucla"
    if -32.4 <= lat <= -31.6 and 141.1 <= lng <= 141.7:
        return "Australia/Broken_Hill"
    if lat > -26 and 129 <= lng < 138:
        return "Australia/Darwin"
    if lng < 129:
        return "Australia/Perth"
    if lng < 141 and lat <= -26:
        return "Australia/Adelaide"
    if lat < -39.5 and lng > 143:
        return "Australia/Hobart"
    if lat < -36.5 and 140.9 <= lng < 149.2:
        return "Australia/Melbourne"
    if lat > -28.15 and lng >= 138:
        return "Australia/Brisbane"
    return FALLBACK_ZONE_ID
