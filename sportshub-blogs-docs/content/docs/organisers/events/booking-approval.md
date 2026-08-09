---
title: Booking Approval
weight: 7
prev: /docs/organisers/events/ticket-types
next: /docs/organisers/events
description: Require manual approval for bookings before attendees are confirmed and charged.
---

## Overview

Booking Approval lets you review and approve attendees before their booking is confirmed. When enabled, players **request** a spot instead of booking instantly — and **their payment method is not charged unless you accept them**.

This is ideal for events where you need to verify skill level, check membership, or curate the right group of participants.

## How It Works

### For organisers

1. Enable Booking Approval on a paid event (requires Stripe)
2. Players submit booking requests through the normal checkout flow
3. Requests appear in **Organiser Hub → your event → Attendees → Pending**
4. Review each request and click **Approve** or **Reject**
5. You have **48 hours** to respond — unreviewed requests are automatically declined

### For players

- The booking button changes from **Book Now** to **Request to Book**
- A message confirms: _"Organiser approval required. Your card won't be charged until you're approved."_
- After submitting, they receive an email confirming their request is pending
- If approved, their card is charged and they receive a booking confirmation
- If rejected, the hold on their card is released and the spot is made available again

## Enable Booking Approval

Booking Approval is available on paid events with an active Stripe account.

### When creating an event

1. In the event creation form, expand **Additional Settings**
2. Set **Booking Approval Enabled** to **Yes**

> [!NOTE]
> Bookings require your approval within **48 hours** via the Organiser Hub. Requests not reviewed in time are automatically rejected.

### On an existing event

1. Open the event in your [Organiser Hub](https://www.sportshub.net.au/organiser)
2. Go to the **Settings** tab
3. Toggle **Enable Booking Approval** on

The change takes effect immediately for new bookings.

### For recurring events

Enable Booking Approval on the **recurring event template** under the **Settings** tab. All future events generated from that template will inherit the setting.

## Manage Pending Requests

1. Open your event in the Organiser Hub
2. Navigate to the **Attendees** tab
3. Select the **Pending** tab to see all requests awaiting your review

Each pending request shows the attendee's name, contact details, and ticket count. You can also view their form responses before deciding.

- **Approve** — confirms the booking and charges the player's card
- **Reject** — declines the request and releases the hold on their card

Approved and rejected requests move to their respective tabs for your records.

## When to Use Booking Approval

Consider enabling this when:

- You run skill-based or competitive sessions and need to vet participants
- Your event is members-only or requires eligibility checks
- You want to review form responses before confirming a spot
- You'd rather approve players upfront than issue refunds later

For open, casual events where anyone can join, leave Booking Approval off for the fastest booking experience.
