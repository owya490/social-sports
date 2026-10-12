import { resolveVenueTimeZoneId } from "../src/venueTimeZone";

describe("venue timezone lookup", () => {
  it("matches the venue for Australian city pins and ignores placeholders", () => {
    expect(resolveVenueTimeZoneId(undefined, -27.4698, 153.0251)).toBe("Australia/Brisbane");
    expect(resolveVenueTimeZoneId(undefined, -34.9285, 138.6007)).toBe("Australia/Adelaide");
    expect(resolveVenueTimeZoneId(undefined, -33.8688, 151.2093)).toBe("Australia/Sydney");
    expect(resolveVenueTimeZoneId("Australia/Sydney", -31.9539, 141.4539)).toBe("Australia/Broken_Hill");
    expect(resolveVenueTimeZoneId(undefined, -31.9505, 115.8605)).toBe("Australia/Perth");
    expect(resolveVenueTimeZoneId(undefined, 0, 0)).toBe("Australia/Sydney");
    expect(resolveVenueTimeZoneId(undefined, -1, -1)).toBe("Australia/Sydney");
    expect(resolveVenueTimeZoneId("Australia/Adelaide", null, null)).toBe("Australia/Adelaide");
    // New Zealand is outside the Australia box and stays on the Sydney fallback.
    expect(resolveVenueTimeZoneId(undefined, -36.8509, 174.7645)).toBe("Australia/Sydney");
  });
});
