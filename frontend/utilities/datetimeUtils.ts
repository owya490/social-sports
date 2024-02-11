import { Timestamp } from "firebase/firestore";
import moment from "moment";

export function timestampToTimeOfDay(timestamp: Timestamp) {
  // Format the Date object to display the time of day
  let date = timestamp.toDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  // Convert to 12-hour time format
  const formattedTime = `${hours % 12 || 12}:${
    minutes < 10 ? "0" : ""
  }${minutes} ${ampm}`;

  return formattedTime;
}

export function timestampToTimeOfDay24Hour(timestamp: Timestamp) {
  let date = timestamp.toDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours < 10 ? `0${hours}` : hours}:${
    minutes < 10 ? `0${minutes}` : minutes
  }`;
}

export function timestampToDateString(timestamp: Timestamp) {
  let date = timestamp.toDate();
  return date.toDateString();
}

export function timestampToEventCardDateString(timestamp: Timestamp) {
  return `${timestampToDateString(
    timestamp
  ).toUpperCase()} · ${timestampToTimeOfDay24Hour(timestamp)} AEST`;
}

export function convertDateAndTimeStringToTimestamp(
  date: string,
  time: string
): Timestamp {
  let dateObject = new Date(date);
  const timeArr = time.split(":");
  dateObject.setHours(parseInt(timeArr[0]));
  dateObject.setMinutes(parseInt(timeArr[1]));
  return Timestamp.fromDate(dateObject);
}

export function convertTimestampToYYYYMMDDString(timestamp: Timestamp) {
  let date = timestamp.toDate();
  return moment(date).format("YYYY-MM-DD");
}
