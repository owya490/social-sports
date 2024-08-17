export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return parseFloat((cents / 100).toFixed(2));
}

export function displayPrice(price: number): number {
  // The price in the datastore and in our memory is all cents
  return centsToDollars(price);
}
