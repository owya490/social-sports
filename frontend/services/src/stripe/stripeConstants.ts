// Stripe requires each checkout session have a minimum price of $0.50
// https://docs.stripe.com/api/charges#:~:text=The%20minimum%20amount%20is%20%240.50%20US%20or%20equivalent%20in%20charge%20currency.
export const MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS = 50;
