import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_PROD_API_KEY,
  authDomain: process.env.FIREBASE_PROD_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_PROD_DATABASE_URL,
  projectId: process.env.FIREBASE_PROD_PROJECT_ID,
  storageBucket: process.env.FIREBASE_PROD_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_PROD_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_PROD_APP_ID,
  measurementId: process.env.FIREBASE_PROD_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("togglePastFuture");
  const tableBody = document.getElementById("eventTableBody");
  const searchInput = document.getElementById("searchInput");

  let allEvents = [];

  // Function to render the table with given events
  function renderTable(events) {
    tableBody.innerHTML = "";

    events.forEach((event) => {
      const row = document.createElement("tr");

      const price = Math.round(event.price / 100);
      const ticketsPurchased = event.capacity - event.vacancy;
      const sales = price * ticketsPurchased;

      row.innerHTML = `
        <td><a href="https://www.sportshub.net.au/event/${event.id}" target="_blank" rel="noopener noreferrer">${
        event.name || "N/A"
      }</a></td>
        <td>${sales || 0}</td>
        <td>${ticketsPurchased || 0}/${event.capacity}</td>
        <td>${event.accessCount || 0}</td>
      `;

      tableBody.appendChild(row);
    });
  }

  // Function to fetch events from Firestore
  async function fetchEvents(showPast) {
    try {
      const collectionPath = showPast ? "Events/InActive/Public" : "Events/Active/Public";
      const eventsRef = collection(db, collectionPath);
      const snapshot = await getDocs(eventsRef);

      allEvents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      renderTable(allEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }

  // Event listener for the toggle switch
  toggle.addEventListener("change", () => {
    fetchEvents(toggle.checked);
  });

  // Event listener for the search input
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    if (query === "") {
      renderTable(allEvents);
    } else {
      const filteredEvents = allEvents.filter((event) => event.name.toLowerCase().includes(query));
      renderTable(filteredEvents);
    }
  });

  // Initial fetch for future events
  fetchEvents(false);
});
