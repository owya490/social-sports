import { Timestamp } from "firebase/firestore";

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
    return `${hours}:${minutes}`;
}

export function timestampToDateString(timestamp: Timestamp) {
    let date = timestamp.toDate();
    return date.toDateString();
}
