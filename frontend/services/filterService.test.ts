import { Timestamp } from "firebase/firestore";
import { filterEvents } from "./filterService";
import { getGeoHashQueryBounds, getLocationCoordinates } from "./locationUtils";

test("test filter events gets all available events from Timestamp(0)", async () => {
  const startDate = Timestamp.fromDate(new Date("0"));
  let filterByStartDateMap = {
    startDate: {
      startDate: startDate,
    },
  };
  const eventData = await filterEvents(filterByStartDateMap);
  console.log("all eventData", eventData);
});

test("test filter events filters events from Timestamp.now()", async () => {
  const startDate = Timestamp.now();
  let filterByStartDateMap = {
    startDate: {
      startDate: startDate,
    },
  };
  const eventData = await filterEvents(filterByStartDateMap);
  console.log("now eventData", eventData);
});

// test("test proximity filter", async () => {
//   const { lat, lng } = await getLocationCoordinates("Sydney");

//   const bounds = getGeoHashQueryBounds([lat, lng], 100);
//   for (const bound of bounds) {
//     const startBound = bound[0];
//     const endBound = bound[1];
//   }
// });
