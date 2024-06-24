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
  return `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${hours}` : hours}`;
}

export function timestampToDateString(timestamp: Timestamp) {
  let date = timestamp.toDate();
  //   let date = new Date(timestamp).toDateString();
  return date.toDateString();
}

export function timestampToEventCardDateString(timestamp: Timestamp) {
  return `${timestampToDateString(timestamp).toUpperCase()} · ${timestampToTimeOfDay24Hour(timestamp)} AEST`;
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
