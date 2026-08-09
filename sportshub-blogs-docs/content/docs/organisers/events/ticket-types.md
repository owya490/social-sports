---
title: Ticket Types
weight: 6
prev: /docs/organisers/events/event-settings
next: /docs/organisers/events/booking-approval
description: Offer multiple ticket options on one event, each with its own price, capacity, and registration form.
---

## Overview

Ticket Types let you offer more than one booking option on a single event. Each type has its own **name**, **price**, **capacity**, and optional **registration form**. Buyers select one type per checkout, and inventory is tracked separately for each option.

New events start with a single **General Admission** ticket type. Add more types when you need different prices, separate capacities, or type-specific forms.

## Where to Manage Ticket Types

In **Organiser Hub (v1)**, ticket types are managed from the event **Settings** tab:

1. Open your event in the [Organiser Hub](https://www.sportshub.net.au/organiser)
2. Go to the **Settings** tab
3. Find the **Ticket Types** section

From there you can add, edit, and delete ticket types.

## Add a Ticket Type

1. In **Settings → Ticket Types**, click **Add Type**
2. Enter a **Name** (for example, Early Bird, Member, or Women's)
3. Set the **Price (AUD)** — use `0` for a free type
4. Set the **Capacity** — how many tickets of this type can be sold
5. Optionally choose a **Registration Form** for this type
6. Save

The new type appears on your public event page as soon as buyers open checkout (when more than one type exists).

## Edit a Ticket Type

1. Open **Settings → Ticket Types**
2. Click the edit icon on the type you want to change
3. Update name, price, capacity, or form
4. Save

When you change capacity, SPORTSHUB preserves tickets already sold. Capacity cannot be set lower than the number of approved tickets already sold for that type.

## Delete a Ticket Type

You can delete a ticket type only when:

- The event still has **at least one** other ticket type remaining
- **No tickets** have been sold for that type yet

If either condition fails, the delete action is blocked and a message explains why.

## Forms Per Ticket Type

Each ticket type can have its own registration form:

- Prefer the form attached on the ticket type itself
- For **General Admission**, if no type-level form is set, SPORTSHUB falls back to the event-level form
- Other ticket types with no form attached collect **no form** at checkout

In Organiser Hub v1, use the **Forms** tab to switch between ticket types, attach a form to the selected type, and review responses filtered to that type.

Learn more about building forms in [Creating a Form](/docs/organisers/organiser-hub/forms/create-form).

## What Buyers See

- If the event has **one** ticket type, checkout behaves as before — no extra selector
- If the event has **multiple** ticket types, buyers choose a type and see its price and remaining spots
- Sold-out types are labelled so buyers can pick another option

Listing cards still show aggregate inventory across types (minimum price, total capacity / vacancy).

## Recurring Events

For recurring event templates, manage ticket types from the template's **Settings** tab the same way. Future events generated from that template inherit the ticket type configuration.

## When to Use Multiple Ticket Types

Consider adding more than one type when:

- You need separate prices (Early Bird vs Standard, Member vs Guest)
- You need independent capacities (Men's / Women's, courtside vs general)
- Different options need different registration forms
- You want one public event page instead of splitting the session into multiple events

For simple one-price events, keep the default **General Admission** type and you're done.
