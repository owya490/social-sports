---
name: sportshub-events-integration
description: Integrate a partner website with SPORTSHUB public event listings and the hosted booking handoff. Use for calendars, ticket selection, and Book buttons that open SPORTSHUB.
---

# SPORTSHUB event and booking integration

Help the partner connect its existing website to SPORTSHUB. The partner owns the event display and Book button. SPORTSHUB handles the booking steps after the visitor leaves the partner site.

Read [the bundled API reference](references/api.md) before implementing requests. It contains the full contract, including the API URL, operations, fields, examples, and booking limits. No access to the SPORTSHUB repository or published Docs is needed. External links provide optional updates and support.

Keep `SKILL.md` and the `references` folder together when sharing or installing this skill. If the reference is missing, ask the user for the complete package before implementing API calls. If SPORTSHUB supplies a newer contract that differs from this snapshot, resolve the difference before using the affected operation.

## Fit the existing website

Read the project's instructions and inspect its event display and service layer. Keep the current design and use existing dependencies where practical. Ask for the partner key supplied by SPORTSHUB, the registered website origins, and confirmation that the integration is enabled for the chosen environment. Use the documented production URL unless SPORTSHUB supplies a test environment. Do not invent a key, organiser ID or partner slug.

Keep API requests in the project's service layer. Both operations use JSON POST requests to the documented API URL, with `Content-Type: application/json`, `X-Sportshub-Partner-Key` and `credentials: "omit"`. The browser supplies `Origin`; serve the site from a registered origin. The key is publishable and visible in browser code. Use the project's configuration conventions and keep real keys out of shared examples, test fixtures and logs.

Follow the reference's response compatibility rules. Contract v1 does not require a version parameter; send only the documented request inputs. Key or origin denials may appear as fetch/CORS failures. Ask the user to confirm the configured key and origin before making further requests. Use only the operations documented in the reference.

## Display events and tickets

- Fetch `GET_PARTNER_EVENTS` with `data: {}`. The supplied key selects the organiser's public feed. Check the HTTP status and the `data.events` array before using the result. Keep loading, empty, and error states distinct.
- Validate required fields and the types of fields you use. Ignore additional fields on the response envelope, data, events, and tickets; do not reject a response solely because it has extra fields. Build a display model from documented fields without storing, logging, or forwarding unknown fields. If unexpected personal fields appear, stop consuming the response and report the field names without copying their values. Draft a message for SPORTSHUB if needed; send it only when the user authorizes that action.
- Treat unrecognized named values as unsupported and keep unaffected event details. Do not infer booking availability or payment support from an unknown value. Missing required fields or incorrectly typed fields are unexpected responses; follow the reference's error and retry guidance.
- Match events by `eventId`. Display UTC timestamps in `Australia/Sydney`, including daylight saving. Format `priceCents` as AUD; the hosted booking flow determines the final total.
- Treat `vacancy: null` as a hidden count. Do not infer a count from `soldOut` or other fields. An empty `ticketTypes` array has no ticket ID for this booking handoff; do not generate one.
- An event in the feed can be paused, closed, or sold out. Treat availability as a display hint and let SPORTSHUB validate the booking. Do not turn off a waitlist solely because `soldOut` is true.
- Use `supportedPaymentProviders` for payment labels. Show Stripe only when the list contains `STRIPE`; ignore unrecognized provider values. An empty list does not by itself disable free bookings or waitlists. The booking endpoint uses Stripe and does not accept a provider selection.
- Render event text safely. Use plain text or the project's existing HTML sanitizer. Validate image and link URLs before using them.
- Follow the reference's refresh guidance and respect `Cache-Control: no-store`. Keep only the data needed for the current page. Keep responses out of shared HTTP caches and booking requests out of read-query retry helpers.

## Hand off a booking

Call the partner INIT operation, then open its returned booking URL. Implement this only when the partner's task includes the Book button.

1. Use the selected event's `eventId`, a ticket `id` from that event's `ticketTypes`, and a positive whole-number quantity. Respect a supplied `maxTicketsPerTransaction`.
2. Call `INIT_PARTNER_FULFILMENT_SESSION` with exactly `eventId`, `eventTicketTypeId` and `numTickets`, only after explicit visitor action. Allow one booking attempt at a time; disable repeated submissions through INIT and navigation. Do not call INIT during page load, prefetch or component setup.
3. Check the HTTP status and validate `data.entryUrl`. It must be a nonempty, absolute URL with the expected SPORTSHUB origin, a path starting with `/fulfilment/`, and no username or password. Production uses `https://www.sportshub.net.au`; test environments require an approved website origin. Keep the URL in transient state and open it unchanged.
4. If INIT times out, has a connection failure, returns a server error (HTTP 5xx), or has an unreadable or unexpected success response, treat the outcome as unknown. Do not retry INIT, automatically or from a retry button, while the outcome is unknown. Tell the visitor that the booking attempt could not be confirmed. Handle other non-success statuses as the reference directs.
5. If navigation fails after a valid URL was received, reopen that same URL. Do not create another session to recover from a navigation failure.

Stop API progression after this handoff. SPORTSHUB owns forms, waitlists, approval, payment and confirmation. Do not construct a booking URL, call progression endpoints, send payment details through the partner site, or add unlisted booking options. A returned URL does not confirm a booking or payment.

The returned URL grants access to a guest booking. Keep it out of analytics, shared caches, public page data, error messages and logs. Do not store or share it beyond the visitor's transient booking flow.

## Check the integration

Use synthetic fixtures for populated and empty feeds, key/origin failures, additional response fields, malformed required fields, unknown payment providers, hidden vacancy, no ticket types, Sydney daylight saving, and paused or sold-out events. Stub both operations. Check the key header, an empty feed request body, the three-input booking request, double-click prevention, an unknown INIT outcome, missing or unsafe entry URLs, and navigation failure that reuses the known URL.

A live event-feed request is read-only. A live INIT request can reserve tickets or create payment state. Run a test booking only when the user has approved the environment and test action. Follow the partner's normal deployment process.

Report the files changed, checks completed, and any live checks still needed. Distinguish a working event feed from a completed booking test.
