import { Environment } from "../../utilities/environment";
import { firebaseConfigDev, firebaseConfigProd, getFirebaseConfigForEnvironment } from "../src/firebaseConfig";

describe("getFirebaseConfigForEnvironment", () => {
  it("uses the prod Firebase project in production", () => {
    expect(getFirebaseConfigForEnvironment(Environment.PRODUCTION)).toBe(firebaseConfigProd);
  });

  it("uses the dev Firebase project in development and preview", () => {
    expect(getFirebaseConfigForEnvironment(Environment.DEVELOPMENT)).toBe(firebaseConfigDev);
    expect(getFirebaseConfigForEnvironment(Environment.PREVIEW)).toBe(firebaseConfigDev);
  });

  it("does not silently fall back to dev when the environment is missing", () => {
    expect(() => getFirebaseConfigForEnvironment(undefined)).toThrow("Unknown environment for Firebase config");
  });
});
