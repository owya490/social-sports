import { Timestamp } from "firebase/firestore";
import { filterEventsByDateRange } from "./filterService";

test("test filter events gets all available events", async () => {
  const startDate = Timestamp.fromDate(new Date("0"));
  const eventData = await filterEventsByDateRange(startDate);
  console.log("all eventData", eventData);
});

test("test filter events filters events from now", async () => {
  const startDate = Timestamp.now();
  const eventData = await filterEventsByDateRange(startDate);
  console.log("now eventData", eventData);
});
