import assert from "node:assert/strict";
import { test } from "node:test";
import { sessionMaxAgeSeconds } from "./sessionCookie";

test("caps the session cookie at the remaining token lifetime", () => {
  const now = 1_700_000_000;
  assert.equal(sessionMaxAgeSeconds(now + 120, now), 120);
  assert.equal(sessionMaxAgeSeconds(now + 60 * 60 * 5, now), 60 * 60);
  assert.equal(sessionMaxAgeSeconds(now, now), 0);
  assert.equal(sessionMaxAgeSeconds(now - 1, now), 0);
});
