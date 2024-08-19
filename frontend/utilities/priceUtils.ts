export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return parseFloat((cents / 100).toFixed(2));
}


/**
 * This function is used extensively throughout our code base to display pricing in a human readable format.
 * Namely currently dollars and cents to 2 decimal places.
 * 
 * As the price is stored purely as cents in our database, we need to convert it to dollars and cents for humans
 * to read on the frontend.
 * 
 * E.g. price of 1527 cents in the database will be displayed as $15.27 on the frontend.
 * 
 * @param price price of the item from the database, which will be in cents
 * @returns returns a number which represents the display format of the price
 */
export function displayPrice(price: number): number {
  // The price in the datastore and in our memory is all cents
  return centsToDollars(price);
}
