---
title: Coupon Codes
weight: 2
prev: /docs/organisers/stripe/stripe-setup
next: /docs/organisers/stripe
---

![coupon-codes](/images/docs/organisers/stripe/coupon-codes.jpg)

Coupon codes allow you to offer discounts to your event participants. Follow these steps to create and manage coupons in Stripe.

## Creating a Coupon in Stripe

1. **Navigate to Stripe Dashboard**

   - Go to [Stripe Coupons](https://dashboard.stripe.com/coupons/create)
   - Alternatively, search for "coupons" in the Stripe dashboard search bar

2. **Configure Your Coupon**
   - **Discount Type**: Choose between:
     - **Percentage off**: e.g., 20% off
     - **Fixed amount off**: e.g., $10 off
   - **Coupon Code**: Create a customer-facing code (e.g., "EARLY20", "WELCOME10")
   - **Expiry Date**: Set when the coupon expires
   - **Usage Limits**: Control how many times the coupon can be used

## Enabling Coupons in SPORTSHUB

![promotional-codes-enabled](/images/docs/organisers/stripe/promotional-codes-enabled.png)

To use your Stripe coupons for SPORTSHUB events:

1. **During Event Creation**: Enable "Promotional Codes" in the event creation form
2. **Existing Events**: Go to Event Settings and enable promotional codes

## Important Notes

- **Cross-Event Usage**: Coupons work across all your events, not just specific ones

> [!WARNING] > **100% Discount Bug**: If you pass application fees to customers, you cannot offer 100% discounts as Stripe doesn't allow this configuration.
