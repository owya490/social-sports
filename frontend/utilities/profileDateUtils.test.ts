import { convertDateToInput, convertInputToDate } from "./profileDateUtils";

describe("convertDateToInput", () => {
  it("converts canonical DD/MM/YYYY to YYYY-MM-DD", () => {
    expect(convertDateToInput("18/06/2001")).toBe("2001-06-18");
  });

  it("converts legacy DD-MM-YYYY with consistent dashes", () => {
    expect(convertDateToInput("18-06-2001")).toBe("2001-06-18");
  });

  it("pads single-digit day and month", () => {
    expect(convertDateToInput("8/6/2001")).toBe("2001-06-08");
    expect(convertDateToInput("8-6-2001")).toBe("2001-06-08");
  });

  it("returns empty for empty or missing values", () => {
    expect(convertDateToInput("")).toBe("");
  });

  it("rejects malformed and incomplete values", () => {
    expect(convertDateToInput("18/06")).toBe("");
    expect(convertDateToInput("18/06/")).toBe("");
    expect(convertDateToInput("/06/2001")).toBe("");
    expect(convertDateToInput("abc")).toBe("");
    expect(convertDateToInput("18/06/20")).toBe("");
  });

  it("rejects mixed delimiters", () => {
    expect(convertDateToInput("18/06-2001")).toBe("");
    expect(convertDateToInput("18-06/2001")).toBe("");
  });

  it("rejects impossible calendar dates", () => {
    expect(convertDateToInput("31/02/2024")).toBe("");
    expect(convertDateToInput("31-02-2024")).toBe("");
    expect(convertDateToInput("29/02/2023")).toBe("");
  });

  it("accepts valid leap-day dates", () => {
    expect(convertDateToInput("29/02/2024")).toBe("2024-02-29");
  });
});

describe("convertInputToDate", () => {
  it("converts YYYY-MM-DD to canonical DD/MM/YYYY", () => {
    expect(convertInputToDate("2001-06-18")).toBe("18/06/2001");
  });

  it("returns empty for empty values", () => {
    expect(convertInputToDate("")).toBe("");
  });

  it("rejects malformed and incomplete values", () => {
    expect(convertInputToDate("2001-06")).toBe("");
    expect(convertInputToDate("2001-6-18")).toBe("");
    expect(convertInputToDate("18/06/2001")).toBe("");
    expect(convertInputToDate("abc")).toBe("");
  });

  it("rejects mixed or wrong delimiters", () => {
    expect(convertInputToDate("2001/06/18")).toBe("");
    expect(convertInputToDate("2001-06/18")).toBe("");
  });

  it("rejects impossible calendar dates", () => {
    expect(convertInputToDate("2024-02-31")).toBe("");
    expect(convertInputToDate("2023-02-29")).toBe("");
  });

  it("accepts valid leap-day dates", () => {
    expect(convertInputToDate("2024-02-29")).toBe("29/02/2024");
  });
});
