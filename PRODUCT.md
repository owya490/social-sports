# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript frontend in `frontend/`; Tailwind CSS + Material Tailwind; Firebase (Auth, Firestore, Functions); Stripe Connect for organiser payouts; Google Maps for locations. Monorepo also includes Firebase Functions (`functions/`), Hugo-based blogs/docs (`sportshub-blogs-docs/`), and internal CLI (`sportshub-cli/`). Dev: `npm run dev` in `frontend/` (localhost:3000).

## Users

**Players (primary discovery audience)** — People looking for casual social sports sessions near them. They browse, compare events, book tickets, and manage bookings. Often mobile, deciding quickly from availability, location, sport, and price.

**Organisers (primary hosting audience)** — Clubs, coaches, and community hosts who create events, manage attendees, collect payments, and run recurring programs. They need low-friction setup (Stripe, forms, comms) and clear operational dashboards—not enterprise sports-club software complexity.

**Verified organisers** — Organisers vetted by SPORTSHUB (`isVerifiedOrganiser`); surfaced in UI as a trust signal on profiles and event pages.

## Product Purpose

SPORTSHUB simplifies finding, booking, and hosting social sports events. Success means players can discover and pay for sessions in minutes, and organisers can publish, fill, and run events without spreadsheet chaos or fragmented tooling.

The product is **not-for-profit** and community-oriented: impact and participation matter alongside sustainable operations (README and site metadata).

## Positioning

Built by active players who felt the pain of clunky booking and limited local options. SPORTSHUB combines **discovery + booking + organiser operations + Stripe payouts** in one platform aimed at **social/recreational** sports—not league management suites or gym SaaS. Integrated payments, recurring templates, custom forms, and organiser analytics are first-class, not bolt-ons.

## Operating Context

- **Geography:** Australia only—predominantly Sydney, with some activity in Melbourne (`sportshub.net.au`, AUD pricing in UI).
- **Sports:** Volleyball, badminton, pickleball, cricket, basketball, soccer, tennis, oztag, baseball, and related social formats (README).
- **Workflows:** Player search → event page → Stripe checkout → tickets/email; organiser create event → Stripe Connect setup → attendee management → optional forms, collections, custom links, recurring templates.
- **Organiser hub:** Dedicated `/organiser/*` area with sidebar navigation; v2 dashboard at `/organiser/v2/dashboard` under active redesign (analytics-first, mobile-centric).
- **Onboarding:** Persona choice (organiser vs attendee), Stripe Connect setup, profile completion—tracked on user records, separate from legacy dashboard checklist.

## Capabilities and Constraints

**Confirmed capabilities (repository evidence):**

- Event create/edit with capacity, vacancy, pricing, images, rich descriptions, tags, privacy, waitlist, booking approval
- Stripe checkout, promotional codes, fee-to-customer options
- Organiser event dashboard, drilldowns (attendees, forms, images, settings, share)
- Recurring event templates, event collections, custom event links
- Form builder and responses
- Image gallery for organisers
- Order/ticket management, manual attendee tools
- SPORTSHUB Wrapped year-in-review for organisers
- Search/filter on player-facing discovery
- User profiles, verified organiser badge

**Technical constraints:**

- Firestore-backed data; client-side metrics on organiser dashboard aggregate events/orders/tickets (no dedicated organiser-metrics API yet)
- Page views (`accessCount`) are lifetime per event—not monthly buckets without backend changes
- Mixed UI generations: legacy Tailwind/organiser tokens coexist with emerging app-wide design tokens in `globals.css` / `tailwind.config.ts`

**Terminology:** Uses **organiser** (not organizer) in routes and code.

**Open product decisions:**

- Timeline and scope for rolling the new organiser design system across the full player-facing site
- Whether monthly view analytics will be added at platform level

## Brand Commitments

- **Name:** SPORTSHUB (always all caps in product copy and UI)
- **Tagline / mission theme:** “Simplifying sports booking”
- **Voice:** Direct, community-minded, practical—not corporate sports-tech jargon
- **Visual assets (confirmed in repo):** `frontend/public/images/BlackLogo.svg`, `BlackLogo-Invert.svg`, icon assets, Satoshi font files under `frontend/public/fonts/satoshi/`
- **Accent color in active design work:** Yellow `#F2B705` on black/white/grey system *(from in-progress design token work; not yet site-wide)*
- **Typography direction (in progress):** Satoshi for UI and display—intended as the primary app-wide typeface
- **Social:** Instagram `sportshub.net.au`, LinkedIn company presence (README)

## Evidence on Hand

| Asset | Location / notes |
|-------|------------------|
| Product README with mission, features, stack | `README.md` |
| Marketing landing | `frontend/app/(footer)/landing/page.tsx` |
| About copy | `frontend/components/AboutHero.tsx` |
| Legal / terms | `frontend/app/(footer)/terms-data-policy/page.tsx` |
| Contact | `frontend/app/(footer)/contact/page.tsx` |
| Blogs & organiser docs (Hugo) | `sportshub-blogs-docs/` |
| Logos & brand images | `frontend/public/images/` |
| No fabricated testimonials or benchmark claims in codebase for init—do not invent in future marketing |

## Product Principles

1. **Participation over complexity** — Prefer flows that get people playing, not configuring software.
2. **Mobile reality** — Design for phones first; organisers check fill rates and attendees on the go.
3. **Honest operations** — Show real metrics with clear labels; do not imply data the platform does not store.
4. **Trust in community sport** — Verified organisers, clear pricing, reliable payments.
5. **One platform, two jobs** — Discovery/booking for players and operations/hosting for organisers share one product, not two disconnected apps.

## Accessibility & Inclusion

- Site metadata and layout reference accessibility (skip navigation component, input font-size guard for mobile zoom in `globals.css`)
- No additional product-specific accessibility standard recorded—default to WCAG-minded patterns for public web
