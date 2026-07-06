const bookingApprovalEnabledUserIdList = [
  "ZzuRS5v8hhWonnp2qdIOZG8R7f12", // sportshub prod
];

export function isBookingApprovalEnabled(userId: string): boolean {
  return bookingApprovalEnabledUserIdList.includes(userId);
}
