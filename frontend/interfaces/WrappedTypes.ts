export type SportshubWrapped = {
  organiserName: string;
  year: number;
  dateRange: {
    from: string; // ISO date
    to: string; // ISO date
  };

  eventsCreated: number;
  ticketsSold: number;
  totalSales: number; // in cents
  totalEventViews: number;

  topRegularAttendees: {
    name: string;
    email: string;
    attendanceCount: number;
  }[];

  mostPopularEvent: {
    eventId: string;
    eventImage: string;
    name: string;
    attendance: number;
    revenue: number; // in cents
  };

  minutesSavedBookkeeping: number;
  feesSavedVsEventbrite: number; // in cents

  wrappedId: string;
};

export const mockWrappedData: SportshubWrapped = {
  organiserName: "Sydney Social Sports",
  year: 2025,
  dateRange: {
    from: "2025-01-01",
    to: "2025-12-15",
  },

  eventsCreated: 147,
  ticketsSold: 3842,
  totalSales: 9685000, // $96,850.00
  totalEventViews: 28450,

  topRegularAttendees: [
    { name: "Michael Chen", email: "michael.chen@example.com", attendanceCount: 42 },
    { name: "Sarah Williams", email: "sarah.williams@example.com", attendanceCount: 38 },
    { name: "James Park", email: "james.park@example.com", attendanceCount: 35 },
    { name: "Emily Rodriguez", email: "emily.rodriguez@example.com", attendanceCount: 31 },
    { name: "David Kim", email: "david.kim@example.com", attendanceCount: 28 },
  ],

  mostPopularEvent: {
    eventImage: "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fc5vFAZ3NlSXVuHGrwlkCjJr3RXX2%2FeventThumbnails%2F0e4265ae-9387-4455-a757-c14cddd41454_1757329424559?alt=media&token=41987621-2527-4cc0-bd4b-65647530788b",
    eventId: "cr52yV7whtZnyAzVjTCF",
    name: "Summer Beach Volleyball Championship",
    attendance: 256,
    revenue: 1280000, // $12,800.00
  },

  minutesSavedBookkeeping: 4320, // 72 hours
  feesSavedVsEventbrite: 484250, // $4,842.50

  wrappedId: "1234567890",
};
