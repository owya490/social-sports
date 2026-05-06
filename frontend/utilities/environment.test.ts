import { Environment, parseEnvironment } from "./environment";

describe("parseEnvironment", () => {
  it("parses supported environments", () => {
    expect(parseEnvironment("DEVELOPMENT")).toBe(Environment.DEVELOPMENT);
    expect(parseEnvironment("PREVIEW")).toBe(Environment.PREVIEW);
    expect(parseEnvironment("PRODUCTION")).toBe(Environment.PRODUCTION);
  });

  it("returns undefined for missing or unknown environments", () => {
    expect(parseEnvironment(undefined)).toBeUndefined();
    expect(parseEnvironment("production")).toBeUndefined();
  });
});
