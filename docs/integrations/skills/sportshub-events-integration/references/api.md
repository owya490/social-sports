---
title: Partner event API
description: Display your public SPORTSHUB events and open the hosted booking flow from your website.
weight: 1
draft: false
date: 2026-10-14
lastmod: 2026-10-18
contractVersion: 1
canonicalURL: https://www.sportshub.net.au/docs/integrations/partner-events/
---

**Contract:** v1. **Updated:** 18 October 2026.

Your website displays events and lets customers select a ticket type and quantity. SPORTSHUB handles the booking after you open its hosted flow.

| Step | Operation | Result |
| --- | --- | --- |
| 1. Load events | `GET_PARTNER_EVENTS` | Public event and ticket information for your calendar. |
| 2. Start a booking | `INIT_PARTNER_FULFILMENT_SESSION` | A SPORTSHUB booking URL to open. |

## Before you start

[Contact SPORTSHUB](https://www.sportshub.net.au/docs/contact-us/) to enable your integration and receive a partner key. Confirm the website origins you will use, such as `https://partner.example`. Include `www` separately if your website uses both hostnames. An origin contains the scheme, hostname and port, with no page path or trailing slash.

Use the key supplied for the environment you are calling. It is intended for browser JavaScript and is visible to visitors. It identifies your registered integration.

## Send requests

Send both operations to the same URL with `POST`:

**API URL**

```text
https://australia-southeast1-socialsportsprod.cloudfunctions.net/globalAppController
```

**Request headers**

```http
Content-Type: application/json
X-Sportshub-Partner-Key: <partner-key>
```

Replace `<partner-key>` with your supplied key. For browser requests, set `credentials: "omit"`. The browser supplies the `Origin` header; do not set it yourself. Serve the integration from a registered HTTPS origin. File previews and unregistered hostnames cannot call this production API.

Each request contains `endpointType` and `data`. Check the HTTP status before reading the successful response's `data`.

**Error response**

```json
{
  "errorMessage": "Example error message"
}
```

Invalid request envelopes return HTTP 400. A missing, invalid or disabled key returns HTTP 401; a denied origin returns HTTP 403. Methods other than `POST` return HTTP 405; browsers may use `OPTIONS` for preflight.

Key or origin failures may appear as a fetch or CORS error in browser JavaScript. Check your key and registered origin with SPORTSHUB before making further requests.

This reference covers the production API. [Contact us](https://www.sportshub.net.au/docs/contact-us/) to arrange a test environment before testing bookings.

All IDs and event details in the examples below are synthetic.

### Response compatibility

Responses may contain additional fields, including within event and ticket objects. Validate the required fields for each operation and the types of fields your integration uses. Ignore unrecognized fields; do not reject a response solely because it contains them. Use the documented fields to build your own display model instead of storing, logging, or forwarding the full response.

If a field has an unrecognized named value, treat that value as unsupported and keep displaying unaffected event details. Do not infer booking availability or payment support from it. Missing required fields or incorrectly typed fields are unexpected responses; follow the operation's error and retry guidance.

We may add response fields without changing the major contract version. Within a major version, existing documented fields retain their types and meanings. Removing or renaming fields, changing their types or meanings, or adding mandatory requirements requires a new major contract version and migration instructions.

## 1. Load your public events

**Request body**

```json
{
  "endpointType": "GET_PARTNER_EVENTS",
  "data": {}
}
```

Your partner key selects your public event feed.

The feed contains active, public events whose start time is at or after the request time. Events without a start time are omitted. Events that have already started are omitted, even if registration remains open. Future paused, sold-out, and registration-closed events can still appear.

Events are sorted by start time, then event ID. The response includes the full upcoming feed, without pagination. A successful empty result is `{"data":{"events":[]}}`.

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
        "supportedPaymentProviders": ["STRIPE"],
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
| `supportedPaymentProviders` | String array | Hosted payment providers supported for the event. Currently, the recognized value is `STRIPE`. |
| `ticketTypes` | Array | Available ticket-type definitions, described below. |

These flags help your website explain the event. They do not guarantee that a booking will succeed. SPORTSHUB checks the current event and ticket state when the customer books.

Use `supportedPaymentProviders` for payment labels. Show Stripe only when the list contains `STRIPE`; ignore unrecognized provider values. The list does not guarantee payment readiness or ticket availability. An empty list does not by itself rule out a free booking or waitlist. The booking operation below uses Stripe and does not accept a payment-provider selection.

### Ticket fields

Ticket types are sorted with General Admission first, followed by name and ID.

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | String | Ticket-type ID. Pass it unchanged as `eventTicketTypeId`. |
| `name` | String | Ticket-type name. |
| `priceCents` | Nonnegative integer | Base ticket price in AUD cents. For example, `1800` means A$18.00; `0` means free. Fees or promotions can change the final total. |
| `soldOut` | Boolean | True when the current ticket inventory is zero or less. |
| `vacancy` | Integer, nullable | Current ticket inventory. Null means the organiser hides the count; use `soldOut` for binary availability. |

Some events can return `ticketTypes: []`. You may display these events, but cannot start a booking through this contract until the organiser configures a ticket type. Do not invent an ID from the event name or price.

A sold-out ticket can lead to a waitlist when `waitlistEnabled` is true. Keep that option available; SPORTSHUB checks whether the request can proceed.

### Feed errors and refresh

| HTTP status | Meaning |
| --- | --- |
| 400 | The request data is invalid. |
| 401 | The partner key is missing, invalid or disabled. |
| 403 | The website origin is not allowed. |
| 500 | The feed could not be returned. Show an error state; do not treat it as an empty calendar. |

Fetch on page load. If you refresh while the page remains visible, we recommend no more than once per minute. Keep only the data needed for the current page; responses use `Cache-Control: no-store` and must not go into shared HTTP caches. Availability can change between the feed request and checkout.

## 2. Start a booking

Before enabling bookings on your site, test the handoff with your event and ticket types.

Call `INIT_PARTNER_FULFILMENT_SESSION` after a customer chooses a ticket type and quantity and presses Book. Send one request at a time. Do not prefetch booking sessions.

**Request body**

```json
{
  "endpointType": "INIT_PARTNER_FULFILMENT_SESSION",
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

Send exactly these three inputs. Additional inputs are rejected. Use an event and ticket type from your feed; private events and other organisers' events are unavailable through this operation.

**Successful response**

```json
{
  "data": {
    "entryUrl": "https://www.sportshub.net.au/fulfilment/example-session/example-step?hideSportshubNavbar=true"
  }
}
```

A successful response starts a session and returns its booking URL. It does not confirm a booking or payment. SPORTSHUB hosts the remaining forms, checkout, waitlist, approval, and confirmation steps as applicable.

### Open the booking URL

Check that `entryUrl` is a nonempty, absolute URL with origin `https://www.sportshub.net.au`, a path starting with `/fulfilment/`, and no username or password. Then open the URL unchanged. Use the approved SPORTSHUB website origin when testing in another environment.

Treat `entryUrl` as a private guest access credential: anyone with the URL may access that session. Keep it in transient page state and out of analytics, shared caches, error messages and logs.

### Retry guidance

Do not retry INIT after a timeout, connection failure, server error (HTTP 5xx), or unreadable or unexpected success response. Do not show a "Try again" button for INIT while its outcome is unknown. It may already have created a session or reserved tickets. Tell the customer that the booking attempt could not be confirmed.

If you received a valid `entryUrl` but navigation failed, reopen that same URL. Do not start another session to recover from a navigation failure.

### Booking errors

Readable JSON errors use `errorMessage`. Handle every non-success status; do not rely on the message text as a stable error code. A network or CORS failure may have no readable response.

| HTTP status | Meaning |
| --- | --- |
| 400 | The request is invalid, or current booking rules prevent it. Examples include malformed inputs, excessive quantity or insufficient inventory. |
| 401 | The partner key is missing, invalid or disabled. |
| 403 | The website origin is not allowed. |
| 404 | The event or selected ticket type is unavailable through your integration. |
| 500 | The request could not be completed. Its outcome may be unknown; follow the retry guidance above. |
