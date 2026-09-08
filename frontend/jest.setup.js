if (typeof structuredClone === "undefined") {
  global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
}
