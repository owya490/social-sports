# Integrating with Stripe to Accept Payments in SPORTSHUB

SPORTSHUB allows you to seamlessly accept payments by integrating with Stripe, a secure and reliable payment processor. This guide will walk you through the setup process, ensuring a smooth payment experience for your customers.

By the end of this guide, you will have:

1. A Stripe account set up and verified for payments.
2. An active `Payments Allowed` organiser in SPORTSHUB.
3. Able to activate payments via the UI for all new events.

## Setting up a Stripe Account

SPORTSHUB uses Stripe's Connected Accounts feature to securely transfer payments directly into your bank account. To start receiving payments, you'll need to create or connect a Stripe account and complete the verification process.

1.  #### Navigate to Stripe Creation

    Head on over to `Organiser Hub` and navigate to the Profile Section. If you are not integrated with Stripe, you should `Connect your Stripe Account now!` panel. Click `Register` button to be redirected to the Create Stripe Account webpage.
    ![organiser-hub-connect-stripe](/images/how-to-accept-payments-through-stripe/organiser-hub-connect-stripe.png)

2.  #### Complete Stripe Creation Workflow

    Please give it a second to process the request, it may be slow on the first click as it sets up your initial data. Once redirected to the Create Stripe Account webpage, you should see a screen similar to this:
    ![stripe-create-account](/images/how-to-accept-payments-through-stripe/stripe-create-account.png)
    Please provide your email address and password. It will then prompt you to set up 2FA, please complete as directed. Stripe will then walk you through filling out the create account workflow.

    > ⚠️ _If you are unsure, please contact us for guidance.
    > If you do not have a business entity, please just select `Individual/ Sole Trader` and no ABN. Continue to fill out all the required fields._

    Please fill out each field as directed, such as personal information and bank details. Ensure to select a payout rate which suits you. (You can get paid out as frequent as every day).
    ![stripe-review-submit](/images/how-to-accept-payments-through-stripe/stripe-review-submit.png)

3.  #### Update SPORTSHUB with Stripe Integration

    Once submitted, you will be redirected back into SPORTSHUB's organiser hub. Please navigate back to the profile page and please click `Register` button one more time, to retrigger a Stripe evaluation on the integration.
    ![organiser-hub-connect-stripe](/images/how-to-accept-payments-through-stripe/organiser-hub-connect-stripe.png)
    This should be a quick redirect to update our backend servers to enable your SPORTSHUB account with the stripe integration.
    Now perform a Google Chrome refresh on the tab to pull the latest data for your account. Now from the profile page in Organiser Hub, you should no longer see the `Register` button.

    > ⚠️ _This procedure of clicking `Register` and refreshing the page should be temporary as we build a better integration bridge between Stripe and SPORTSHUB._

4.  #### Verify Stripe Integration
To verify your SPORTSHUB account is indeed Stripe enabled, navigate to create event via the `Create event` button in the top right. Confirm that you are seeing the field `Is your event accepting payments?` and can select that field as `True`. 
![alt text](/images/how-to-accept-payments-through-stripe/stripe-enabled-event.png)
Enabling it, will allow attendees to pay for that event through Stripe, which will be routed to your Stripe account. (Stripe Account ID is visible via Organiser Hub profile page.)

## Stripe Enabled Events
Now your events should be enabled for Stripe payments, and you will be able to receive payments from your attendees. They will see the following UI for purchasing an Event.
![alt text](/images/how-to-accept-payments-through-stripe/stripe-purchase-tickets.png)
After clicking `Book Now`, they will be redirected into the Stripe checkout which they can pay. 
![alt text](/images/how-to-accept-payments-through-stripe/stripe-checkout.png)

