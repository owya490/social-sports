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
  console.log(formattedMinutes);
  return `${formattedHours}:${formattedMinutes}`;
}
