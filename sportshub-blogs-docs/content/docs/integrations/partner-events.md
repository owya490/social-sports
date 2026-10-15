---
title: Partner event API
description: Display your public SPORTSHUB events and open the hosted booking flow from your website.
weight: 1
draft: false
date: 2026-10-14
lastmod: 2026-10-15
contractVersion: 1
canonicalURL: https://www.sportshub.net.au/docs/integrations/partner-events/
---

**Contract:** v1. **Updated:** 15 October 2026.

Your website displays events and lets customers select a ticket type and quantity. SPORTSHUB handles the booking after you open its hosted flow.

| Step | Operation | Result |
| --- | --- | --- |
| 1. Load events | `GET_PARTNER_EVENTS` | Public event and ticket information for your calendar. |
| 2. Start a booking | `INIT_FULFILMENT_SESSION` | A guest booking session ID. |
| 3. Find the entry step | `GET_NEXT_FULFILMENT_ENTITY` | The step ID to use in the SPORTSHUB booking URL. |

## Send requests

Send all three operations to the same URL with `POST` and `Content-Type: application/json`:

**API URL**

```text
https://australia-southeast1-socialsportsprod.cloudfunctions.net/globalAppController
```

These operations are public. You do not need an API key, a SPORTSHUB account token, or domain registration. For browser requests, set `credentials: "omit"`.

Each request contains `endpointType` and `data`. Check the HTTP status before reading the successful response's `data`.

**Error response**

```json
{
  "errorMessage": "Example error message"
}
```

Invalid request envelopes return HTTP 400. Methods other than `POST` return HTTP 405; browsers may use `OPTIONS` for preflight.

This reference covers the production API. [Contact us](https://www.sportshub.net.au/docs/contact-us/) to arrange a test environment before testing bookings.

All IDs and event details in the examples below are synthetic.

## 1. Load your public events

**Request**

```json
{
  "endpointType": "GET_PARTNER_EVENTS",
  "data": {
    "partner": "example-club"
  }
}
```

Replace `example-club` with the partner slug supplied by SPORTSHUB. Use the exact string; the example slug is a placeholder.

The feed contains active, public events whose start time is at or after the request time. Events without a start time are omitted. Events that have already started are omitted, even if registration remains open. Future paused, sold-out, and registration-closed events can still appear.

Events are sorted by start time, then event ID. The response includes the full upcoming feed; v1 has no pagination. A successful empty result is `{"data":{"events":[]}}`.

**Successful response**

```json
{
  "data": {
    "events": [
      {
        "eventId": "example-event",
        "name": "Example sports session",
        "description": "A sports session for this API example.",
        "location": "Example Sports Centre",
        "startDate": "2027-01-10T22:00:00Z",
        "endDate": "2027-01-11T00:00:00Z",
        "registrationDeadline": "2027-01-10T21:00:00Z",
        "image": null,
        "thumbnail": null,
        "eventTags": ["volleyball"],
        "paused": false,
        "paymentsActive": true,
        "waitlistEnabled": true,
        "bookingApprovalEnabled": false,
        "maxTicketsPerTransaction": 4,
        "ticketTypes": [
          {
            "id": "example-ticket-type",
            "name": "General Admission",
            "priceCents": 1800,
            "soldOut": false,
            "vacancy": 12
          }
        ]
      }
    ]
  }
}
```

### Event fields

Every listed field is present. Fields marked nullable can contain JSON `null`.

| Field | Type | Meaning |
| --- | --- | --- |
| `eventId` | String | Event ID. Pass this unchanged when you start a booking. |
| `name` | String | Event name. |
| `description` | String | Display content; `""` when absent. Render as text, or sanitize it before rendering HTML. |
| `location` | String | Display location; `""` when absent. |
| `startDate`, `endDate` | String | RFC 3339 timestamps in UTC. Convert them to your calendar's display timezone, such as `Australia/Sydney`. |
| `registrationDeadline` | String, nullable | Registration deadline in the same timestamp format. Null does not mean registration is open. |
| `image`, `thumbnail` | String, nullable | Event image locations. |
| `eventTags` | String array | Event tags; `[]` when absent. |
| `paused` | Boolean | Whether the organiser has paused booking. |
| `paymentsActive` | Boolean | Whether payments are enabled for the event. |
| `waitlistEnabled` | Boolean | Whether the event allows a waitlist. |
| `bookingApprovalEnabled` | Boolean | Whether the event requires organiser approval. |
| `maxTicketsPerTransaction` | Positive integer, nullable | Configured quantity limit. Null does not specify a default limit. |
| `ticketTypes` | Array | Available ticket-type definitions, described below. |

These flags help your website explain the event. They do not guarantee that a booking will succeed. SPORTSHUB checks the current event and ticket state when the customer books.

### Ticket fields

Ticket types are sorted with General Admission first, followed by name and ID.

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | String | Ticket-type ID. Pass it unchanged as `eventTicketTypeId`. |
| `name` | String | Ticket-type name. |
| `priceCents` | Nonnegative integer | Base ticket price in AUD cents. For example, `1800` means A$18.00; `0` means free. Fees or promotions can change the final total. |
| `soldOut` | Boolean | True when the current ticket inventory is zero or less. |
| `vacancy` | Integer, nullable | Current ticket inventory. Null means the organiser hides the count; use `soldOut` for binary availability. |

Older events can return `ticketTypes: []`. You may display these events, but cannot start a booking through this contract until the organiser configures a ticket type. Do not invent an ID from the event name or price.

A sold-out ticket can lead to a waitlist when `waitlistEnabled` is true. Keep that option available; SPORTSHUB checks whether the request can proceed.

### Feed errors and refresh

| HTTP status | Meaning |
| --- | --- |
| 400 | `partner` is missing, blank, or not a string. |
| 404 | The exact partner slug is not supported. |
| 500 | The feed could not be returned. Show an error state; do not treat it as an empty calendar. |

Fetch on page load. If you refresh while the page remains visible, we recommend no more than once per minute. You may cache the public feed for that interval, with separate cache entries for each environment and partner. Availability can change between the feed request and checkout.

## 2. Start a booking

Before enabling bookings on your site, test the handoff with your event and ticket types. [Contact us](https://www.sportshub.net.au/docs/contact-us/) to arrange a test.

Call `INIT_FULFILMENT_SESSION` after a customer chooses a ticket type and quantity and presses Book. Send one request at a time. Do not prefetch booking sessions.

**Request**

```json
{
  "endpointType": "INIT_FULFILMENT_SESSION",
  "data": {
    "eventId": "example-event",
    "numTickets": 1,
    "eventTicketTypeId": "example-ticket-type"
  }
}
```

| Input | Type | Meaning |
| --- | --- | --- |
| `eventId` | String | `eventId` from the feed. |
| `numTickets` | Positive integer | Requested quantity. Respect the event's configured quantity limit. Sold-out tickets may offer a waitlist. |
| `eventTicketTypeId` | String | `id` of the selected entry in `ticketTypes`. |

These are the three supported inputs for v1.

**Successful response**

```json
{
  "data": {
    "fulfilmentSessionId": "example-session"
  }
}
```

A successful response starts a session. It does not confirm a booking or payment. SPORTSHUB hosts the remaining forms, checkout, waitlist, approval, and confirmation steps as applicable.

Do not retry INIT after a timeout or connection failure, including through a "Try again" button. It may already have created a session or reserved tickets.

- If you received a session ID, reuse it for the initial NEXT lookup.
- If you have no session ID, tell the customer the booking attempt could not be confirmed.

## 3. Open the SPORTSHUB entry step

Use the returned session ID with `currentFulfilmentEntityId: null`:

**Request**

```json
{
  "endpointType": "GET_NEXT_FULFILMENT_ENTITY",
  "data": {
    "fulfilmentSessionId": "example-session",
    "currentFulfilmentEntityId": null
  }
}
```

**Successful response**

```json
{
  "data": {
    "fulfilmentEntityId": "example-step"
  }
}
```

If `fulfilmentEntityId` is null, stop and show an error or ask the customer to contact support. Do not construct a booking URL from null.

For a nonnull step ID, open this URL on SPORTSHUB. Encode each ID as a URL path segment:

**Booking URL**

```text
https://www.sportshub.net.au/fulfilment/{fulfilmentSessionId}/{fulfilmentEntityId}?hideSportshubNavbar=true
```

`hideSportshubNavbar=true` is an optional display setting. SPORTSHUB handles the flow from this point.

Use this production website URL with the production API. Ask us for the matching website URL when testing against development.

If this entry lookup fails after INIT succeeds, keep the session ID and offer a retry of the same lookup with `currentFulfilmentEntityId: null`. Reuse that session instead of starting another one.

This reference supports the initial lookup only. Do not call NEXT repeatedly to advance checkout; later steps can change booking state. Let the hosted flow handle them.

Treat session IDs, step IDs, and booking URLs as private guest access credentials: anyone with the URL may access that session. Keep them transient and out of analytics, shared caches, and public logs.

### Booking errors

All failures use `errorMessage`. Handle every non-success status; do not rely on the message text as a stable error code.

| Operation | HTTP status | Meaning |
| --- | --- | --- |
| INIT | 400 | The booking request was not accepted. Examples include an unavailable event, invalid ticket type, excessive quantity, or insufficient inventory. |
| INIT | 500 | The request could not be completed. Some invalid payloads also return this status. Do not retry INIT while its outcome is unknown. |
| Initial NEXT | 400 | The entry step could not be determined. |
| Initial NEXT | 404 | The session is unavailable. |
| Initial NEXT | 500 | The request could not be processed. |
