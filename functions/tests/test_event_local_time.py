import unittest
from datetime import datetime
from zoneinfo import ZoneInfo

from lib.emails.event_local_time import (
    format_event_dict_local,
    format_event_local,
    resolve_event_timezone,
    starts_on_venue_tomorrow,
)


class TestEventReminderClock(unittest.TestCase):
    def test_sydney_nine_am_stays_nine_after_daylight_saving(self):
        # Monday 5 Oct 2026 09:00 Australia/Sydney (AEDT, UTC+11).
        start = datetime(2026, 10, 4, 22, 0, tzinfo=ZoneInfo("UTC"))
        self.assertEqual("10/05/2026, 09:00", format_event_local(start, "Australia/Sydney"))

    def test_brisbane_nine_am_does_not_follow_sydney_summer_time(self):
        # Monday 5 Oct 2026 09:00 Australia/Brisbane (AEST, UTC+10).
        start = datetime(2026, 10, 4, 23, 0, tzinfo=ZoneInfo("UTC"))
        self.assertEqual("10/05/2026, 09:00", format_event_local(start, "Australia/Brisbane"))
        self.assertEqual("10/05/2026, 10:00", format_event_local(start, "Australia/Sydney"))

    def test_day_before_nine_am_stays_nine_am_in_the_venue_zone(self):
        # Sunday 4 Oct 2026 09:00 Australia/Sydney, the local morning before a Monday 09:00 start.
        reminder_day = datetime(2026, 10, 3, 22, 0, tzinfo=ZoneInfo("UTC"))
        self.assertEqual("10/04/2026, 09:00", format_event_local(reminder_day, "Australia/Sydney"))

    def test_missing_or_unknown_zone_falls_back_to_sydney(self):
        start = datetime(2026, 10, 4, 22, 0, tzinfo=ZoneInfo("UTC"))
        self.assertEqual("10/05/2026, 09:00", format_event_local(start, None))
        self.assertEqual("10/05/2026, 09:00", format_event_local(start, "Not/AZone"))

    def test_brisbane_summer_nine_am_emails_as_nine(self):
        # Monday 5 Oct 2026 09:00 Australia/Brisbane. Sydney would show 10:00.
        start = datetime(2026, 10, 4, 23, 0, tzinfo=ZoneInfo("UTC"))
        event = {
            "timezone": None,
            "locationLatLng": {"lat": -27.4698, "lng": 153.0251},
        }
        self.assertEqual("Australia/Brisbane", resolve_event_timezone(None, -27.4698, 153.0251))
        self.assertEqual("10/05/2026, 09:00", format_event_dict_local(start, event))

    def test_coordinates_match_the_venue_and_placeholders_do_not(self):
        self.assertEqual("Australia/Adelaide", resolve_event_timezone(None, -34.9285, 138.6007))
        self.assertEqual("Australia/Sydney", resolve_event_timezone(None, -33.8688, 151.2093))
        self.assertEqual("Australia/Broken_Hill", resolve_event_timezone("Australia/Sydney", -31.9539, 141.4539))
        self.assertEqual("Australia/Perth", resolve_event_timezone(None, -31.9505, 115.8605))
        self.assertEqual("Australia/Sydney", resolve_event_timezone(None, 0, 0))
        self.assertEqual("Australia/Sydney", resolve_event_timezone(None, -1, -1))
        # Auckland is outside the Australia box, so it stays on the Sydney fallback.
        self.assertEqual("Australia/Sydney", resolve_event_timezone(None, -36.8509, 174.7645))

    def test_perth_and_brisbane_nine_am_are_reminded_the_venue_day_before(self):
        # Job runs Sunday 4 Oct 2026 12:00 Australia/Sydney, during Sydney daylight saving.
        job_now = datetime(2026, 10, 4, 12, 0, tzinfo=ZoneInfo("Australia/Sydney"))
        later = datetime(2026, 10, 5, 12, 0, tzinfo=ZoneInfo("Australia/Sydney"))
        perth_monday = {
            "timezone": "Australia/Perth",
            "locationLatLng": {"lat": -31.9505, "lng": 115.8605},
        }
        brisbane_monday = {
            "timezone": "Australia/Brisbane",
            "locationLatLng": {"lat": -27.4698, "lng": 153.0251},
        }
        # Monday 5 Oct 2026 09:00 in each venue.
        perth_start = datetime(2026, 10, 5, 1, 0, tzinfo=ZoneInfo("UTC"))
        brisbane_start = datetime(2026, 10, 4, 23, 0, tzinfo=ZoneInfo("UTC"))
        tuesday_start = datetime(2026, 10, 5, 23, 0, tzinfo=ZoneInfo("UTC"))

        self.assertTrue(starts_on_venue_tomorrow(perth_start, perth_monday, job_now))
        self.assertTrue(starts_on_venue_tomorrow(brisbane_start, brisbane_monday, job_now))
        self.assertFalse(starts_on_venue_tomorrow(perth_start, perth_monday, later))
        self.assertFalse(starts_on_venue_tomorrow(brisbane_start, brisbane_monday, later))
        self.assertFalse(starts_on_venue_tomorrow(tuesday_start, brisbane_monday, job_now))


if __name__ == "__main__":
    unittest.main()
