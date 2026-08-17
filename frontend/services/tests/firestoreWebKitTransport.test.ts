import { getFirestoreSettingsForUserAgent } from "../src/firebase/firestoreWebKitTransport";

describe("getFirestoreSettingsForUserAgent", () => {
  it("forces long-polling and disables fetch streams on iPhone Safari", () => {
    expect(
      getFirestoreSettingsForUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      )
    ).toEqual({ useFetchStreams: false, experimentalForceLongPolling: true });
  });

  it("treats iPadOS desktop-UA as iOS", () => {
    expect(
      getFirestoreSettingsForUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15", {
        platform: "MacIntel",
        maxTouchPoints: 5,
      })
    ).toEqual({ useFetchStreams: false, experimentalForceLongPolling: true });
  });

  it("disables fetch streams on macOS Safari without forcing long-polling", () => {
    expect(
      getFirestoreSettingsForUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        { platform: "MacIntel", maxTouchPoints: 0 }
      )
    ).toEqual({ useFetchStreams: false });
  });

  it("leaves Chrome on desktop on the default Firestore transport", () => {
    expect(
      getFirestoreSettingsForUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      )
    ).toBeNull();
  });

  it("does nothing when user agent is missing", () => {
    expect(getFirestoreSettingsForUserAgent(undefined)).toBeNull();
  });
});
