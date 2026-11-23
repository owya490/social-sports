import assert from "node:assert/strict";
import { test } from "node:test";
import { ALLOWED_REPORTING_UIDS, isAllowedReportingUser } from "./allowedUser";

test("allows the internal reporting users", () => {
  assert.deepEqual(ALLOWED_REPORTING_UIDS, ["ZzuRS5v8hhWonnp2qdIOZG8R7f12", "c5vFAZ3NlSXVuHGrwlkCjJr3RXX2"]);
  for (const uid of ALLOWED_REPORTING_UIDS) {
    assert.equal(isAllowedReportingUser(uid), true);
    assert.equal(isAllowedReportingUser(`${uid} `), false);
  }
  assert.equal(isAllowedReportingUser("someone-else"), false);
  assert.equal(isAllowedReportingUser(undefined), false);
  assert.equal(isAllowedReportingUser(""), false);
});
