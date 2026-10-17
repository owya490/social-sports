---
name: sportshub-events-integration
description: Integrate a partner website with SPORTSHUB public event listings and the hosted booking handoff. Use for calendars, ticket selection, and Book buttons that open SPORTSHUB.
---

# SPORTSHUB event and booking integration

Help the partner connect its existing website to SPORTSHUB. The partner owns the event display and Book button. SPORTSHUB handles the booking steps after the visitor leaves the partner site.

Read [the bundled API reference](references/api.md) before implementing requests. It contains the full contract, including the API URL, operations, fields, examples, and booking limits. No access to the SPORTSHUB repository or published Docs is needed. External links provide optional updates and support.

Keep `SKILL.md` and the `references` folder together when sharing or installing this skill. If the reference is missing, ask the user for the complete package before implementing API calls. If SPORTSHUB supplies a newer contract that differs from this snapshot, resolve the difference before using the affected operation.

## Fit the existing website

Read the project's instructions and inspect its event display and service layer. Keep the current design and use existing dependencies where practical. Use the partner slug supplied by the user or SPORTSHUB; `example-club` in the reference is a placeholder. If the real slug is missing, ask the user before making API calls. Use the documented production URL unless SPORTSHUB supplies a test environment. Do not guess an organiser ID or substitute another partner's feed.

Keep API requests in the project's service layer. All three operations use JSON POST requests to the documented GAC URL. Use `credentials: "omit"`. Public operations need no API key or Firebase sign-in.

## Display events and tickets

- Fetch `GET_PARTNER_EVENTS` with the confirmed `partner`. Check the HTTP status and the `data.events` array before using the result. Keep loading, empty, and error states distinct.
- Use only the documented event and ticket fields. If unexpected personal fields appear, stop consuming the response and report the field names to the user without copying their values. Draft a message for SPORTSHUB if needed; send it only when the user authorizes that action.
- Match events by `eventId`. Display UTC timestamps in `Australia/Sydney`, including daylight saving. Format `priceCents` as AUD; the hosted booking flow determines the final total.
- Treat `vacancy: null` as a hidden count. Do not infer a count from `soldOut` or other fields. An empty `ticketTypes` array has no ticket ID for this booking handoff; do not generate one.
- An event in the feed can be paused, closed, or sold out. Treat availability as a display hint and let SPORTSHUB validate the booking. Do not turn off a waitlist solely because `soldOut` is true.
- Render event text safely. Use plain text or the project's existing HTML sanitizer. Validate image and link URLs before using them.
- Follow the reference's refresh guidance. Cache only public event results, keyed by environment and partner. Keep booking requests out of shared caches and read-query retry helpers.

## Hand off a booking

Use the sequence in the API reference: INIT, initial NEXT, then open the SPORTSHUB URL. Implement this only when the partner's task includes the Book button.

1. Use the selected event's `eventId`, a ticket `id` from that event's `ticketTypes`, and a positive whole-number quantity. Respect a supplied `maxTicketsPerTransaction`.
2. Call `INIT_FULFILMENT_SESSION` only after explicit visitor action. Allow one booking attempt at a time; disable repeated submissions through INIT, the initial NEXT lookup, and navigation. Do not call INIT during page load, prefetch, or component setup.
3. Check that the returned `fulfilmentSessionId` is a nonempty string, then keep it in transient state for this attempt. If INIT fails, times out, or returns an unreadable or unexpected response, treat the outcome as unknown. Do not retry INIT, automatically or from a retry button, while the outcome is unknown. Tell the visitor that the booking attempt could not be confirmed.
4. Call `GET_NEXT_FULFILMENT_ENTITY` with that session ID and `currentFulfilmentEntityId: null`. If this lookup fails, keep the known session ID for a bounded retry of the initial lookup. Do not retry INIT to recover from a lookup or navigation failure.
5. Validate the returned step ID. If it is null, stop and show an error as the reference directs. Treat a missing or wrongly typed ID as an unexpected response. For a nonempty string, encode both IDs as URL path components and open the matching SPORTSHUB site URL.

Stop API progression after this handoff. SPORTSHUB owns forms, waitlists, approval, payment, and confirmation. Do not call NEXT repeatedly to skip steps, send payment details through the partner site, or add unlisted booking options.

Session and step IDs grant access to a guest booking. Keep them out of analytics, shared caches, public page data, error messages, and logs. Do not store or share complete booking URLs beyond the visitor's transient booking flow.

## Check the integration

Use synthetic fixtures for populated and empty feeds, request failures, hidden vacancy, no ticket types, Sydney daylight saving, and paused or sold-out events. For booking, stub all three operations. Check double-click prevention, an unknown INIT outcome, a failed NEXT lookup that preserves the session, and a null next-step ID.

A live event-feed request is read-only. A live INIT request can reserve tickets or create payment state. Run a test booking only when the user has approved the environment and test action. Follow the partner's normal deployment process.

Report the files changed, checks completed, and any live checks still needed. Distinguish a working event feed from a completed booking test.
