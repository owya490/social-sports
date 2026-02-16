import { Timestamp } from "firebase/firestore";

export function timestampToTimeOfDay(timestamp: Timestamp) {
  // Format the Date object to display the time of day
  let date = timestamp.toDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  // Convert to 12-hour time format
  const formattedTime = `${hours % 12 || 12}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`;

  return formattedTime;
}

export function timestampToTimeOfDay24Hour(timestamp: Timestamp) {
  let date = timestamp.toDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes}`;
}

export function timestampToDateString(timestamp: Timestamp): string {
  let date = timestamp.toDate();
  return date.toDateString();
}

let cachedTimezoneShort: string | null = null;

/**
 * Returns the short timezone name for the browser's current timezone (e.g., "AEST", "AEDT", "PST")
 * Result is cached after first call.
 */
export function getCurrentTimezoneShort(): string {
  if (cachedTimezoneShort === null) {
    cachedTimezoneShort =
      new Intl.DateTimeFormat("en-AU", { timeZoneName: "short" })
        .formatToParts(new Date())
        .find((part) => part.type === "timeZoneName")?.value || "AEST";
  }
  return cachedTimezoneShort;
}

export function timestampToEventCardDateString(timestamp: Timestamp) {
  return `${timestampToDateString(timestamp).toUpperCase()} · ${timestampToTimeOfDay24Hour(
    timestamp
  )} ${getCurrentTimezoneShort()}`;
}

export function formatTimeTo12Hour(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const adjustedHours = hours % 12 || 12;
  const formattedMinutes = minutes.toString().padStart(2, "0");
  return `${adjustedHours}:${formattedMinutes} ${period}`;
}

export function formatTimeTo24Hour(time: string) {
  const [timePart, period] = time.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);
  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }
  const formattedHours = hours < 10 ? `0${hours}` : hours;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${formattedHours}:${formattedMinutes}`;
}

//Sat Apr 24 2024 to yyyy-mm-dd
export function formatStringToDate(date: string) {
  const monthMap: { [key: string]: string } = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  function formatDate(date: string) {
    const parts = date.split(" ");
    const day = parts[2];
    const month = monthMap[parts[1]];
    const year = parts[3];
    return `${year}-${month}-${day}`;
  }

  return formatDate(date);
}
//yyyy-mm-dd to Sat Apr 24 2024
export function formatDateToString(date: string): string {
  const monthMap: { [key: string]: string } = {
    "01": "Jan",
    "02": "Feb",
    "03": "Mar",
    "04": "Apr",
    "05": "May",
    "06": "Jun",
    "07": "Jul",
    "08": "Aug",
    "09": "Sep",
    "10": "Oct",
    "11": "Nov",
    "12": "Dec",
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function formatToLongDate(dateStr: string): string {
    const [year, month, day] = dateStr.split("-");

    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    const dayOfWeek = daysOfWeek[dateObj.getDay()];
    const monthName = monthMap[month];

    return `${dayOfWeek} ${monthName} ${day} ${year}`;
  }

  return formatToLongDate(date);
}

export const parseDateTimeStringToTimestamp = (dateTimeString: string): Timestamp => {
  const parsedDate = new Date(dateTimeString);
  return Timestamp.fromDate(parsedDate);
};

export function duration(startDate: Timestamp, endDate: Timestamp) {
  const startDateMillis = startDate.toMillis();
  const endDateMillis = endDate.toMillis();
  const durationInMillis = endDateMillis - startDateMillis;

  const hours = Math.floor(durationInMillis / (1000 * 60 * 60));
  const minutes = Math.floor((durationInMillis % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}

/**
 * Returns number of days between two firebase Timestamps - rounds up the difference.
 */
export function durationInDaysCeil(startDate: Timestamp, endDate: Timestamp): number {
  const { hours } = duration(startDate, endDate);
  return Math.ceil(hours / 24);
}

export function setDateToStartOfDay(date: Date): Date {
  date.setHours(0, 0, 0, 0);
  return date;
}

export function setDateToEndOfDay(date: Date): Date {
  date.setHours(23, 59, 59, 999);
  return date;
}

// Helper functions for mobile date/time formatting
export function formatMobileSameDayDateTime(startDate: Timestamp, endDate: Timestamp): string {
  const date = startDate.toDate();
  const endDateObj = endDate.toDate();

  // Day name: Fri
  const dayName = date.toLocaleDateString("en-AU", { weekday: "short" });

  // Date: 9 Jan 2026
  const day = date.getDate();
  const month = date.toLocaleDateString("en-AU", { month: "short" });
  const year = date.getFullYear();

  // Start time: 4pm
  const startHours = date.getHours();
  const startMinutes = date.getMinutes();
  const startTime = formatMobileTime(startHours, startMinutes);

  // End time: 10pm
  const endHours = endDateObj.getHours();
  const endMinutes = endDateObj.getMinutes();
  const endTime = formatMobileTime(endHours, endMinutes);

  // Timezone
  const timezone = getCurrentTimezoneShort();

  return `${dayName}, ${day} ${month} ${year}, ${startTime} - ${endTime} ${timezone}`;
}

export function formatMobileDifferentDayDateTime(startDate: Timestamp, endDate: Timestamp): string {
  const startDateObj = startDate.toDate();
  const endDateObj = endDate.toDate();

  // Start date: Fri, 9 Jan 2026, 4pm
  const startDayName = startDateObj.toLocaleDateString("en-AU", { weekday: "short" });
  const startDay = startDateObj.getDate();
  const startMonth = startDateObj.toLocaleDateString("en-AU", { month: "short" });
  const startYear = startDateObj.getFullYear();
  const startHours = startDateObj.getHours();
  const startMinutes = startDateObj.getMinutes();
  const startTime = formatMobileTime(startHours, startMinutes);

  // End date: Sat, 10 Jan 2026, 10pm
  const endDayName = endDateObj.toLocaleDateString("en-AU", { weekday: "short" });
  const endDay = endDateObj.getDate();
  const endMonth = endDateObj.toLocaleDateString("en-AU", { month: "short" });
  const endYear = endDateObj.getFullYear();
  const endHours = endDateObj.getHours();
  const endMinutes = endDateObj.getMinutes();
  const endTime = formatMobileTime(endHours, endMinutes);

  return `${startDayName}, ${startDay} ${startMonth} ${startYear}, ${startTime} - ${endDayName}, ${endDay} ${endMonth} ${endYear}, ${endTime}`;
}

export function formatMobileTime(hours: number, minutes: number): string {
  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;

  // Only show minutes if not on the hour
  if (minutes === 0) {
    return `${displayHours}${period}`;
  }
  return `${displayHours}:${minutes.toString().padStart(2, "0")}${period}`;
}
