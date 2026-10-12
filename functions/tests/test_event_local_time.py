import unittest
from datetime import datetime
from zoneinfo import ZoneInfo

from lib.emails.event_local_time import format_event_local


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


if __name__ == "__main__":
    unittest.main()
