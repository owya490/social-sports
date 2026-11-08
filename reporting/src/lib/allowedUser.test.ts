import assert from "node:assert/strict";
import { test } from "node:test";
import { ALLOWED_REPORTING_UID, isAllowedReportingUser } from "./allowedUser";

test("allows only the internal reporting user", () => {
  assert.equal(ALLOWED_REPORTING_UID, "ZzuRS5v8hhWonnp2qdIOZG8R7f12");
  assert.equal(isAllowedReportingUser(ALLOWED_REPORTING_UID), true);
  assert.equal(isAllowedReportingUser(`${ALLOWED_REPORTING_UID} `), false);
  assert.equal(isAllowedReportingUser("someone-else"), false);
  assert.equal(isAllowedReportingUser(undefined), false);
  assert.equal(isAllowedReportingUser(""), false);
});
