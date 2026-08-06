---
name: SPORTSHUB
description: Simplifying sports booking — calm black-and-white UI with sports-yellow accent
colors:
  background: "#ffffff"
  surface: "#f7f7f7"
  surface-muted: "#ebebeb"
  surface-hover: "#f0f0f0"
  border: "#e0e0e0"
  foreground: "#0a0a0a"
  foreground-secondary: "#525252"
  foreground-muted: "#8a8a8a"
  accent: "#f2b705"
  accent-contrast: "#0a0a0a"
  danger: "#dc2626"
  focus: "#f2b705"
typography:
  display:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  headline:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Satoshi, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  unified: "0.75rem"
  inner: "0.5rem"
  sheet-top: "1rem"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-contrast}"
    typography: "title"
    rounded: "{rounded.unified}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-contrast}"
  button-ghost:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.unified}"
    padding: "8px 12px"
  nav-item-active:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.unified}"
    padding: "6px 10px"
  card-outlined:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.unified}"
    padding: "16px 20px"
  kpi-cell:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.unified}"
    padding: "12px 16px"
  fill-bar-track:
    backgroundColor: "{colors.surface-muted}"
    rounded: "{rounded.unified}"
    height: "4px"
  fill-bar-fill:
    backgroundColor: "{colors.foreground-secondary}"
    rounded: "{rounded.unified}"
    height: "4px"
  preference-switch-on:
    backgroundColor: "{colors.accent}"
    rounded: "9999px"
    height: "28px"
    width: "48px"
  preference-switch-off:
    backgroundColor: "{colors.surface-muted}"
    rounded: "9999px"
    height: "28px"
    width: "48px"
  upload-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.unified}"
    padding: "16px"
  settings-panel:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.unified}"
    padding: "16px 20px"
  catalogue-list-panel:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.unified}"
    padding: "0"
  entity-hover-preview:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.unified}"
    padding: "14px"
    width: "360px"
  hover-metrics:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "0"
    padding: "0"
  event-hub-stage:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "0"
    padding: "0"
  event-hub-filter-active:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "0"
    padding: "10px"
  event-hub-overview-card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.unified}"
    padding: "16px 20px"
  event-hub-panel:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sheet-top}"
    padding: "16px 20px"
    width: "32rem"
  event-hub-panel-wide:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sheet-top}"
    padding: "16px 20px"
    width: "36rem"
  event-hub-edit-title:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "headline"
    rounded: "0"
    padding: "8px 0"
  event-hub-edit-field:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.unified}"
    padding: "10px 12px"
  event-hub-share-channel:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground-secondary}"
    rounded: "9999px"
    size: "36px"
  event-hub-date-chip-month:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-contrast}"
    rounded: "0"
    padding: "6px 0"
---

# Design System: SPORTSHUB

## Overview

**Creative North Star: "The Honest Clubhouse"**

SPORTSHUB looks like the digital front desk of a well-run local sports club—not enterprise SaaS, not a neon fitness app. The interface is calm, compact, and legible on a phone between sessions. White cards sit on a soft grey canvas; near-black text stays readable without harsh pure-black slabs. Sports yellow appears only where action or focus is needed: primary CTAs, the current-week chart bar, focus rings, and the Comp A When & Where month stamp on the event hub date chip.

**Elegance reference: Airbnb.** The overall design language should feel as simple and restrained as Airbnb—one accent on a neutral field, UI that steps back so content (events, photos, metrics) leads, and hierarchy built from size and weight rather than decoration. SPORTSHUB is warmer and more compact than Airbnb (community sport, not travel), but shares the same discipline: nothing extra, nothing loud.

Density is **compact-operate**: tight padding on dashboards and organiser chrome, icon-led KPI cells in a responsive grid, sidebar navigation that can collapse to icons. The organiser v2 dashboard is the reference surface for metrics and lists; the event hub at `/organiser/v2/event/[id]` is the Luma overview-led operate surface—quiet chrome, peer tabs, Details overview, and deep work in `EventHubPanel` drawers/sheets. Edit Event is a calm sectioned sheet (Basic Info / Time / Location / Booking) with TipTap bubble-on-selection and a single yellow Update event footer—not document chrome.

**Key Characteristics:**

- Black, white, and a short grey ladder—no decorative gradients in app chrome
- One corner radius (`12px` / `rounded-xl`) across panels, cards, and controls; `8px` (`rounded-lg`) for nested icon wells and segmented-control pills; sheet top `16px` (`rounded-t-2xl`) on mobile panels
- Satoshi for all typography roles (UI, headings, metrics)
- Yellow accent (`#F2B705`) with black text on filled accent surfaces; yellow only on primary CTAs, focus, current-week chart bars, and the event hub date-chip month stamp
- Neutral fill bars (`surface-muted` track, `foreground-secondary` fill) for progress—not accent colour
- Borders over shadows for resting separation; elevation for floating layers only (hover dossier, operate panels)
- Event hub: Luma overview-led Details + flush list tabs; Registrations rows expand for order/ticket IDs; Forms flush response table; deep work opens a right drawer / bottom sheet—never cover-in-chrome
- Edit Event panel: sectioned operate sheet (Basic Info / Time / Location / Booking); TipTap bubble-on-selection; single yellow Update event in the panel footer
- Mobile-first organiser flows; honest metric labels; inline error recovery when data fails to load

## Reference Points

These are **craft benchmarks**, not visual templates. SPORTSHUB keeps the Honest Clubhouse identity—black/white/grey, sports yellow, Satoshi. Borrow **patterns and discipline** from these products; never their palettes, typefaces, or brand moments.

**Primary elegance model: Airbnb.** When in doubt, ask “would this feel at home on Airbnb?”—simple surfaces, generous clarity, one decisive accent, no visual noise.

| Benchmark | What to study | What SPORTSHUB adopts | What we do not copy |
|-----------|---------------|----------------------|---------------------|
| **Airbnb** *(primary)* | Single-family type hierarchy, restrained accent on neutral field, content-forward layouts, soft rounded cards, flat depth, mobile booking flows | One typeface (Satoshi) for all roles; yellow only on primary action (plus the dated Comp A month stamp); event imagery and data lead, chrome recedes; sentence-case labels; whitespace as structure—not filler | Cereal typeface, coral Rausch accent, travel-marketplace patterns, hero photography on operate dashboards |
| **Linear** | Operate-mode dashboards, collapsible sidebar, compact list density, keyboard-nav feel | Sidebar chrome on organiser v2; icon-led KPI cells; neutral hierarchy through weight and spacing; fast scan paths between tasks | Purple accent, dark-mode aesthetic, issue-tracker vocabulary |
| **Stripe** | Financial trust, Connect onboarding, settings/forms clarity, honest data tables, inline errors | Metric labels that say what the data actually is (“All time per event”, “Approx.”); payment/setup flows; bordered cards over decorative chrome; retry-on-failure patterns | Stripe violet, documentation-site typography scale, enterprise dashboard sprawl |
| **Luma** *(event hub operate)* | Overview-led session page, quiet title chrome, peer tabs, deep edit in a right drawer / bottom sheet, sectioned edit sheet | Details owns preview + hosts + read-only visibility; Registrations expand for order/ticket IDs; Edit / Change photo / form / ticket panels share one `EventHubPanel` grammar; Edit Event = Basic/Time/Location/Booking + bubble TipTap; circular share channels | Luma brand palette, marketing typography, cover-in-chrome session heroes, Appearance themes, sticky rich-text toolbars |

### Airbnb-informed design language

Translate Airbnb’s restraint into SPORTSHUB’s world:

- **One accent, one job.** Yellow marks the primary action or current focus—nowhere else (except the approved date-chip month stamp on Details). Like Rausch on Airbnb, it should feel electric because it is rare.
- **Content leads, chrome recedes.** Event photos, session titles, fill rates, and prices are the hero—not borders, gradients, or decorative icons. Player discovery is browse-and-book; organiser views are scan-and-act.
- **Single typeface, weight hierarchy.** Satoshi at every size. Differentiate roles with weight (400 body, 600 titles, 700 display) and modest scale steps—not a second font or uppercase shouting.
- **Flat and soft.** White cards on grey canvas, `12px` radius, `1px` borders, almost no shadow on resting surfaces. Depth comes from surface steps; floating panels and hover dossiers earn a soft lift.
- **Restrained scale.** Headlines earn their size. Section titles at 16–20px, greetings at 24–30px—save large type for marketing, not dense dashboards.
- **Tight tracking at scale.** Display headings use `tracking-tight` (≈ `-0.02em`) as size increases—letters compress slightly, like Airbnb’s display treatment.
- **Friendly, not flashy.** Rounded corners and Satoshi’s geometric warmth keep the product approachable for community sport—elegant simplicity, not cold enterprise or neon fitness.

### How to use these references

- **Default tone (all surfaces):** Airbnb simplicity. If a screen feels busy, remove before you add.
- **Player discovery (Persuade):** Airbnb browse rhythm. Card grids, filters, and booking flows should feel effortless—imagery and key facts first.
- **Organiser v2 dashboard (Operate):** Airbnb calm + Linear density + Stripe honesty. Compact, but never cluttered; metrics labeled honestly.
- **Event hub (Operate):** Luma overview-led composition inside Honest Clubhouse tokens—quiet chrome, Details overview card, panel grammar for deep work.
- **Payments & onboarding:** Stripe craft inside Airbnb calm. Connect setup and checkout stay clear and unhurried.
- **The litmus test:** If a screen could be mistaken for Airbnb, Linear, Stripe, or Luma with a palette swap, pull back. The clubhouse should still read as SPORTSHUB.

## Colors

A restrained neutral field with a single warm sports accent. Colour communicates hierarchy and action, not decoration.

### Primary

- **Sports Yellow** (`#F2B705`): Primary CTAs, the current-week bar in the ticket-sales chart, focus rings, checked controls, and the month band on the Details When & Where date chip. Always pair with **Near Black** text on filled yellow—not white.

### Neutral

- **Paper White** (`#FFFFFF`): Card and panel backgrounds on the v2 dashboard (`bg-background`).
- **Clubhouse Grey** (`#F7F7F7`): Page canvas behind white cards (`bg-surface` on v2 dashboard), icon wells, chart empty states, segmented-control track.
- **Bench Grey** (`#EBEBEB`): Fill-bar tracks, inactive chart bars, status-dot empty state, image placeholders.
- **Hover Wash** (`#F0F0F0`): Hover states on list rows, announcement rows, and grey surfaces.
- **Line Grey** (`#E0E0E0`): Card and panel borders—quiet, not hairline-black.
- **Near Black** (`#0A0A0A`): Primary text, icons on light backgrounds, text on yellow buttons, sold-out status dots, inverted segmented-control active pill.
- **Court Grey** (`#525252`): Secondary copy, fill-bar fills, chart-bar labels on prior weeks, icon tint in KPI wells.
- **Chalk Grey** (`#8A8A8A`): Meta labels, timestamps, KPI detail lines, rank numbers, section subtitles.

### Tertiary

- **Stop Red** (`#DC2626`): Errors, destructive emphasis (not used on v2 dashboard status dots).

**The One Accent Rule.** Yellow appears on primary actions, focus, the current-week chart bar, and the Details date-chip month stamp—not on fill bars, status dots, KPI icons, peer tabs, share channels, or nav hover fills.

**The Neutral Bar Rule.** Progress and ranking bars use `surface-muted` tracks with `foreground-secondary` fills. Accent yellow never encodes fill percentage.

## Typography

**Display / Body / Label Font:** Satoshi (variable, `frontend/public/fonts/satoshi/`) with system-ui fallback

**Character:** Geometric, friendly, Australian-community-practical. No serif, no display grotesk split—one family carries hub titles and body copy alike.

### Hierarchy

- **Display** (700, `text-2xl`–`text-3xl` on v2 header, line-height ~1.1, `tracking-tight`): Greeting headline on organiser dashboard. Restrained scale—Airbnb shows most section titles at 20–22px; reserve 30px+ for marketing heroes only.
- **Headline** (700, `text-xl`–`text-2xl`): KPI values in icon-led cells; event hub chrome title (`text-xl sm:text-2xl`).
- **Title** (600, `text-base` / 16px): Section titles (“Ticket sales”, “When & Where”, “Hosts”), event names in lists, panel titles.
- **Body** (400–600, `text-sm` / 14px): Supporting lines, empty states, error copy, overview meta.
- **Label** (500–600, `text-xs` / 12px): KPI labels and detail lines (sentence case, not uppercase), chart axis labels, announcement supporting lines, meta rows, share “Share” label.

**The 16px Input Rule.** Form controls on mobile use ≥16px font size (`globals.css`) to prevent iOS zoom-on-focus.

**Tailwind:** `font-sans` and `font-display` both resolve to Satoshi (`--font-satoshi`). Use `font-display` with weight/tracking for marketing-scale headings (`.type-display`, `.type-section`).

## Layout

- **Spacing ladder:** 4 / 8 / 16 / 24 / 32 / 48px (`1` / `2` / `4` / `6` / `8` / `12` in Tailwind).
- **Content width:** Organiser dashboard content capped at `max-w-6xl` with `px-4`–`px-8` gutters.
- **Vertical rhythm:** Section stacks use `space-y-5`–`space-y-6` between major blocks; Details overview uses `space-y-8` between overview card, Hosts, and Visibility.
- **KPI grid:** `grid-cols-2` on phone, `lg:grid-cols-4`; gap `10px`–`12px`.
- **Chart + coming-up:** `lg:grid-cols-5`—chart spans 3 columns, upcoming panel spans 2; stacks on mobile.
- **Setup + announcements:** Checklist (`lg:col-span-5`) beside announcement panel (`lg:col-span-7`); stacks on mobile. Announcements render as a divided technical list (mono tags), not accent tiles.
- **Organiser sidebar:** Expanded `200px`, collapsed `64px` (`--organiser-sidebar-width-*`); main content `lg:pl-[var(--organiser-sidebar-width)]`.
- **Event hub shell:** Page canvas `bg-surface`. Quiet chrome + peer tabs share one white band (`bg-background border-b border-border`)—title, date · location meta, Event page ghost, Pause text control; **no cover in chrome**. Tab bodies sit in `max-w-6xl` with `px-4`–`px-8` and `pt-6`–`pt-8` on the surface. Section switches fade ~120–200ms opacity. Tabs: Details · Registrations · Forms · Settings (no Images tab—photos via Change photo panel).
- **Details overview:** Single outlined card with `lg:grid-cols-2` (preview column | When & Where), footer row for circular share channels + Edit details / Change photo ghosts. Hosts and Visibility follow as separate outlined cards.
- **Operate panel:** Right drawer `md:max-w-lg` (default, `32rem`) or `md:max-w-xl` (`wide`, `36rem`—Edit Event, Change photo, Add answers); full-height on `md+`. Bottom sheet on phone (`max-h-[92vh]`, top radius `16px`). Scrim `bg-black/40`.
- **Edit Event sheet:** Form body `space-y-8` between Basic Info → Time → Location → Booking. Title is borderless underline input (`text-xl font-semibold`); description sits seamless beneath; Time uses a bordered timeline card; Booking is a 1→2 column field grid. Primary save lives only in the panel footer.
- **Breakpoints:** Tailwind defaults—`md` (768px) for drawer vs sheet; `lg` (1024px) for persistent sidebar and multi-column dashboard / Details grids.

## Elevation & Depth

**Flat-by-default.** Depth is conveyed with surface grey steps and borders, not stacked shadows. White cards on a grey canvas (`bg-background` on `bg-surface`) provide the primary layering model on the v2 dashboard and Details overview.

### Shadow Vocabulary

- **Search lift** (`0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)`): Legacy searchbar only (`boxShadow.searchbar` in Tailwind config).
- **Hover dossier** (`0 8px 28px rgba(10,10,10,0.12)`): Floating `EntityHoverPreview` card only—soft offset lift so the portaled mini-dossier reads above the list. Never on resting catalogue rows or dashboard panels.
- **Panel sheet** (`0 -8px 28px rgba(10,10,10,0.12)`): Mobile bottom-sheet lift on `EventHubPanel`.
- **Panel drawer** (`0 0 40px rgba(10,10,10,0.08)`): Desktop right-drawer soft edge on `EventHubPanel`.
- **TipTap bubble** (`0 8px 28px rgba(10,10,10,0.12)`): Same soft lift as the hover dossier—floating formatting menu on text selection only.

**The No Stack Rule.** Do not combine filled grey panels, heavy borders, and shadows on the same component.

**The Surface Stage Rule.** Event hub list tabs (Registrations, Forms, Settings) sit flush on the surface canvas under chrome—hairline dividers and tonal washes separate rows. Details may use outlined overview cards on that same stage. Registrations may expand a row for order/ticket identity; deep work never covers the chrome with a full-bleed hero—it opens `EventHubPanel`.

## Shapes

- **Unified radius:** `0.75rem` (`12px`) — `rounded-xl`, CSS `--radius`. Panels, cards, buttons, list rows, date chip.
- **Inner radius:** `0.5rem` (`8px`) — `rounded-lg`. KPI icon wells, segmented-control pills, chart bar tops, ranked-list row hover targets, panel close wells.
- **Sheet top:** `1rem` (`16px`) — `rounded-t-2xl` on mobile `EventHubPanel` only; desktop drawer is square-edged (`md:rounded-none`).
- **Fill bars:** `4px` height (`h-1`), fully rounded caps (`rounded-full`).
- **Status dots:** `10px` circles (`h-2.5 w-2.5 rounded-full`).
- **Share channels:** `36px` circles (`h-9 w-9 rounded-full`) with `1px` border.
- **Borders:** `1px` `border-border` on outlined cards and KPI cells; filled surfaces often omit borders.
- **Icons:** Heroicons outline, `stroke-[1.5]`, typically `16px` in KPI wells; announcement rows use a trailing `16px` arrow instead of icon wells.

## Components

### Buttons

- **Shape:** Unified radius (`12px`).
- **Primary:** `bg-accent`, `text-accent-contrast`, `font-semibold`, compact padding (`py-2`–`py-2.5 px-3.5`–`px-4`). Hover: slight brightness reduction (`hover:brightness-95`). Event hub panel footers: Update event (Edit Event), Save photos, Add attendee, Approve, Save response.
- **Secondary / Ghost:** White with `border-border`; hover `bg-surface-hover`. Event hub: Edit details, Change photo, Event page, Decline.
- **Focus:** `focus-visible:outline-2 outline-offset-2 outline-focus` (yellow).

### Navigation (Organiser sidebar)

- **Item:** `text-xs`, icon + label, `rounded-xl`, `px-2.5 py-1.5`.
- **Active:** `bg-surface-muted`, `text-foreground`.
- **Inactive:** `text-foreground-secondary`, hover `bg-surface-hover`.

### Cards / Containers

- **Outlined panel:** White fill, `border-border`, `rounded-xl`, padding `16px`–`20px` (`p-4 sm:p-5`). Used for chart, top events, error recovery, Details overview / Hosts / Visibility.
- **KPI cell:** Icon-led horizontal layout—not a stacked hero metric. White fill, border, icon in `rounded-lg bg-surface p-2` well, sentence-case label, bold tabular value, muted detail line.
- **Filled inset:** `bg-surface` without border for chart empty states and panel empty states.

### Fill Bars (shared pattern)

- **Track:** `h-1 rounded-full bg-surface-muted`.
- **Fill:** `rounded-full bg-foreground-secondary` with inline `width` percentage.
- **Meta:** Tabular-nums count beside the bar (`text-xs text-foreground-muted`).
- Used in **Top events** (ranked by tickets sold), **Coming up** (capacity fill), and **Registrations** going/capacity strip.

### Status Dots (upcoming events)

- **Sold out** (ratio ≥ 1): `bg-foreground`.
- **Nearly full** (ratio ≥ 0.75): `bg-foreground-secondary`.
- **Available:** `bg-surface-muted border border-border`.
- Placed at the trailing edge of compact event rows; `aria-label` describes fill state.

### Dashboard (Organiser v2)

- **Header:** Time-based greeting (`text-2xl sm:text-3xl`), supporting line in `foreground-secondary`, primary “Create event” CTA top-right on desktop / full-width on phone.
- **KPI grid:** Four icon-led cells—net sales, tickets sold, page views, conversion—with honest period labels (“Last 30 days”, “All time per event”, “Approx.”).
- **Ticket sales chart:** Flat vertical bars; accent only on `isCurrent` week, `surface-muted` on prior weeks; min bar height 10%. Segmented range toggle (“This week” / “4 weeks”) in a `bg-surface` track—active pill inverts to `bg-foreground text-background`. Chart area fades to `opacity-70` for 300ms during range change.
- **Coming up panel:** Up to four compact rows with thumbnail, date/location meta, fill bar, and status dot; “All events” text link.
- **Top events:** Ranked ordered list with neutral fill bars and ticket counts—no accent on bars.
- **Setup + announcements:** Auto-complete checklist (picture, bio, Stripe, first event) with fill-bar progress; dismissible when done. Announcement rows from `dashboardAnnouncements.ts` (SPORTSHUB → organiser feed: mono tags like Feature/Wrapped, hairline dividers, external blog links open in a new tab).
- **Error recovery:** When metrics fetch fails, inline card replaces dashboard body: error title, connection hint, accent “Retry” button, fallback “manage events” link—no full-page error shell.

### Organiser catalogue pages (v2 operate)

List-only Hub surfaces that share one shell with Event collections and Custom links: Forms, Image gallery, and Settings. Same tokens as the dashboard—no new palette or radius.

- **Page canvas:** `bg-surface` full height; content `max-w-6xl` with `px-4`–`px-8` gutters (same as dashboard).
- **Catalogue header:** `text-2xl sm:text-3xl` bold title (`tracking-tight`); one `text-sm text-foreground-secondary` subtitle that reflects load/count/empty state; optional primary yellow CTA (`Create form`, etc.) full-width on phone, trailing on `sm+`. No kicker or eyebrow above the title.
- **Divided list panel:** Single outlined white panel (`rounded-xl border-border bg-background overflow-hidden`) with `divide-y divide-border` rows—not a card grid of previews.
- **Catalogue row:** Compact padding (`p-2.5 sm:p-3`); hover `bg-surface-hover`. Leading mark is either a bordered icon well (`rounded-lg bg-surface`, ~44–48px) or a cover thumb. Title `text-sm font-semibold`; optional meta chip (`rounded-lg bg-surface px-2 py-0.5 text-xs`); description and timestamps `text-xs text-foreground-muted`. Trailing icon actions (`rounded-lg p-2`) for edit/preview—not a second primary CTA per row.
- **Empty / error:** Centered copy inside the same outlined panel language; accent Retry or Create when recovery/create is the next step. Same inline error card pattern as the dashboard.
- **Skeleton:** Row skeletons mirror live row geometry inside the divided panel—not a separate loading shell.

**The List-Not-Preview Rule.** Catalogue pages are scannable rows (or a media library). Do not ship miniature document/form previews or multi-card dashboards as the list layout itself.

### Entity hover preview

Cover-led mini-dossier for organiser catalogue rows where a glance answers “open or not?” Shared shell: `EntityHoverPreview`. Used on **events, recurring templates, collections, and forms**. Custom links and dashboard top-events stay row-only—no hover card.

- **Trigger:** Fine-pointer hover or keyboard focus on the row, after a ~650ms open delay (~160ms close). Touch / coarse pointer: compact row only—no floating card.
- **Card:** Portaled `fixed` panel at **360px** wide. Opens near the **cursor** (14px gap), then **pins**—does not follow further movement. Flips left/above near viewport edges (12px pad). If it would cover the list row, nudges above/below while keeping cursor-side X. Closes on scroll/resize. Soft open (~180ms, slight blur/scale; respect `prefers-reduced-motion`). `pointer-events: none` on the card; `role="tooltip"`.
- **Chrome:** White card (`bg-background`), `rounded-xl` (12px), `border-border`, soft hover-dossier shadow—elevation for the floating layer only.
- **Cover-led stack (top → bottom):**
  1. **Cover band** — full-width edge-to-edge photo (`EntityHoverCover`, `7.5rem` tall, `bg-cover`) or icon-on-muted fallback (`EntityHoverCoverIcon`, `5.5rem`) for entities without imagery (e.g. forms). Prefer cover over a leading thumb—the dossier identity.
  2. **Title block** — `p-3.5` pad; title `text-sm font-semibold` (2-line clamp); optional one-line subtitle (`text-xs text-foreground-muted`).
  3. **KPI strip** — optional. Events keep a flush three-cell strip (reg close / ends / views). Recurring, collections, and forms skip metrics and put glance content in the body instead.
  4. **Body** — short prose and/or a small labelled list (`HoverList`): recurring shows schedule settings + next 2 dates; collections list the first 2 members; forms list the first 2 questions. Cover uses `event.image` (not thumbnail) for events and series.
  5. **Flags** — middot-joined exception/status line under a hairline `border-t border-border`. Omit when redundant.
- **Slots:** Rows compose `cover` / `title` / `metrics?` / `body` / `flags`. Shared primitives: `HoverMetrics`, `HoverMetric`, `HoverList`, `HoverFacts`/`HoverFact`.
- **Shared shell:** One `EntityHoverPreview` owns open/close, cursor pin, portal, and motion. Rows only compose props.

**The No Second Row Rule.** The dossier adds cover + KPIs + prose + flags the compact row does not already show. Do not restate fill rate, price, section-count chips, or other row-visible facts as the hover’s main content.

**The List-Not-Preview Rule** still bans grid-of-preview-cards as the catalogue layout. Cover-led hover dossiers are progressive disclosure on top of rows—not a substitute list layout.

### Event hub — Luma overview-led + panel grammar

Session operate surface at `/organiser/v2/event/[id]`. Same Honest Clubhouse tokens as catalogue and dashboard; body grammar is overview-led Details plus flush list tabs (Forms = flush response table), with deep work in `EventHubPanel`.

#### Quiet chrome

White band under the page canvas. No cover thumb, no capacity bar, no status-dot cluster in chrome—cover lives in Details.

- **Back:** `← Events` muted text link.
- **Title:** `text-xl sm:text-2xl` bold, `tracking-tight`.
- **Meta:** Date · location as one muted `text-xs` line.
- **Actions:** Ghost “Event page” (bordered, opens public event) + Pause/Resume as quiet text (`text-foreground-muted`)—not yellow.

#### Peer tabs

Hairline `border-t border-border` under chrome. Underline tabs (`border-b-2`): active = `border-foreground` + semibold; inactive = transparent border, `foreground-secondary`, hover toward foreground. Horizontal scroll on narrow viewports. Yellow never marks the active tab. Sections: **Details · Registrations · Forms · Settings**.

#### Details overview (Comp A)

Outlined white card (`rounded-xl border-border bg-background overflow-hidden`):

- **Left column:** 4:3 cover (`rounded-xl`), event title (`text-lg font-semibold`), calendar/map meta (`text-xs muted`), copy-link strip on `bg-surface`.
- **Right column:** “When & Where” title; date chip (`h-14 w-12 rounded-xl`) with **yellow month stamp** (`bg-accent text-accent-contrast text-xs`) over white day numeral; clock + map lines.
- **Footer:** Circular share channels (`EventHubShareControl`) leading; ghost **Edit details** / **Change photo** trailing.
- **Below card:** Hosts row (avatar + name + role chip) and read-only Visibility & Discovery card—not editable here.

#### Stage toolbar + hairline filters

Shared primitives in `EventHubStage` for Registrations / Forms:

- **Toolbar:** Leading meta (`text-sm text-foreground-muted`) + trailing primary yellow CTA when needed (`Add attendee`, `Add answers`). Compact `pb-3`.
- **Filters:** Hairline `border-b` strip; same underline grammar as peer tabs; optional tabular counts. Used for Approved / Pending / Declined on Registrations.
- **Primary / ghost buttons:** Same as catalogue—yellow primary (`rounded-xl`, black text); ghost = white + `border-border`.
- **Empty:** Centered muted copy (`py-14`), no outlined empty card.

#### Flush lists → expand / panels (Registrations)

Edge-to-edge divided rows on the stage (`divide-y divide-border`)—catalogue row density without an outlined list-panel shell.

- **Registrations row:** Initials avatar (`40px` muted circle), name `text-sm font-semibold`, full email `text-xs muted`, optional ticket/status chip, trailing chevron that rotates on expand. Click expands the row in place for order ID, ticket IDs, and actions (Form responses / Edit tickets / Remove). Hover `surface-hover`; expanded wash `surface-muted/50`.
- **Deep actions:** Per-attendee form responses, Edit tickets, Add attendee, Add answers open `EventHubPanel`—not a second expand stack.
- **Registrations strip:** Going count + neutral fill bar above filters.

#### Forms — flush response table

Browse all answers on the stage in a scrollable table (shared `FormResponsesTable` with `flush`). Same column/sort/merge/expand logic as organiser hub v1; Honest Clubhouse tokens (`border-border`, `bg-surface` sticky header, Satoshi, near-black links). No response side panel—answers live in table cells; expand/collapse chevrons scroll with the table (not sticky). `#` and Submission Time link out to the full response page. **Change form** and **Add answers** open `EventHubPanel` (wide). Initial attach (no form yet) keeps `FormSelector` on stage.

#### EventHubPanel (drawer / sheet)

One Headless UI `Dialog` — right drawer on `md+`, bottom sheet on phone.

- **Motion:** Enter 200ms ease-out; leave 150ms ease-in. Sheet slides from bottom; drawer from the right.
- **Chrome:** Title bar with close (desktop: chevron-double-right; mobile: X) + optional footer strip for primary CTA. Mobile drag pill (`h-1 w-10 rounded-full bg-surface-muted`).
- **Width:** `md:max-w-lg` default (`32rem`); `wide` → `md:max-w-xl` (`36rem`—Edit Event, Change photo, Add answers).
- **Scrim:** `bg-black/40`.
- **Footer CTAs:** Yellow primary only (Update event, Save photos, Save response, Add)—left-aligned in the footer strip, not a second accent elsewhere in the body.

#### Edit Event — sectioned operate sheet (Comp A)

`EventHubEditForm` inside a `wide` `EventHubPanel` titled **Edit Event**. Ghost trigger on Details remains “Edit details.” One form (`id=event-hub-edit-details`); the footer button submits via `form=` attribute. Story: adjust any Sportshub field, tap Update event once.

- **Section rhythm:** Four sections stacked `space-y-8`. Each section opens with an uppercase muted label (`text-xs font-semibold uppercase tracking-wide text-foreground-muted`)—Basic Info · Time · Location · Booking. Luma section cadence; no Appearance / theme chrome.
- **Basic Info:** Large title input—borderless, bottom hairline only (`border-b border-border`), `text-xl font-semibold tracking-tight`. Description label `text-xs muted`, then `EventHubDescriptionEditor` in a `rounded-xl border-border` shell (min height ~7.5rem). No sticky formatting toolbar.
- **TipTap bubble-on-selection:** Bold / italic / bullet list / link appear only when text is selected (`BubbleMenu`, tippy ~120ms, placement top). Bubble chrome: white, `rounded-lg`, `border-border`, soft dossier shadow; active mark uses `bg-surface-muted`. Resting editor shows prose only.
- **Time:** Outlined card (`rounded-xl border-border p-3 sm:p-4`) with a vertical timeline—filled near-black dot for Start, open muted ring for End, hairline connector. Each row: date + time in a 2-column grid of icon fields. Registration deadline sits under a hairline inside the same card.
- **Location:** Single Maps-autocomplete field with leading map-pin icon.
- **Booking:** `grid-cols-1 sm:grid-cols-2 gap-3`—Sport (full width), Capacity + Price side-by-side, Attach form + Event link full width. Labels `text-xs font-medium text-foreground-muted`.
- **Icon fields:** `FieldWithIcon`—`rounded-xl border-border`, leading Heroicon `16px` muted, transparent input (`text-base` on phone / `text-sm` on `sm+`), focus-within yellow outline.
- **Warnings:** Inline `text-sm text-danger` under the relevant section (past start, end before start, deadline after end, capacity below attendees, location errors)—not toasts.
- **Footer:** Single yellow **Update event** with check icon; disabled while saving / inactive / blocking warning. Hidden `sr-only` submit keeps Enter-to-save.

**The Quiet Chrome Rule.** Event hub chrome is title + meta + Event page + Pause. Do not put the cover, capacity bar, or status-dot cluster in chrome—cover belongs in Details.

**The Panel Grammar Rule.** Deep work (edit details, change photo, add attendee, per-attendee form responses, edit tickets, add answers, change attached form) opens `EventHubPanel`. The Forms tab browses responses in a flush table on stage—not a response inspector panel. Registrations may expand a row for order/ticket identity and action entry points; do not invent a persistent side inspector or cover-in-chrome hero.

**The Overview-Led Details Rule.** Details lands as a two-column overview card with Edit details / Change photo ghosts. Inline document editing and advanced expand-in-place field stacks are not the Details body.

**The Sectioned Edit Rule.** Edit Event is four calm sections—Basic Info / Time / Location / Booking—in one submit. Not a sticky-toolbar document chrome, not a view/edit toggle card, and not Appearance themes.

**The Bubble-on-Selection Rule.** Description formatting appears only on text selection via TipTap BubbleMenu (bold / italic / list / link). Do not ship a sticky toolbar above the description editor.

#### Event hub settings — flush preference stack

Preference switches reuse the account Settings switch (accent on / `surface-muted` off, `28×48px`). Rows stack with `divide-y divide-border` directly on the stage—no outlined settings-panel shell, no header strip. Destructive “Delete event” is a danger text link below a hairline, not a yellow button.

### Preference switch

Binary account preference control (Settings → email preferences).

- **Shape:** Pill track `h-7 w-12` (`28×48px`), fully rounded; thumb `h-6 w-6` white with `border-border`, offset `2px` from the track edge.
- **On:** Track `bg-accent` (checked-control yellow); thumb translates toward the trailing edge.
- **Off:** Track `bg-surface-muted`; thumb at the leading edge.
- **A11y:** Native `role="switch"` + `aria-checked`; yellow focus ring. Disabled while saving (`opacity-60`).
- **Layout:** Label + supporting sentence on the left; switch trailing. Optimistic toggle with rollback on failure—no modal confirm.

### Settings panel anatomy

Stacked account sections under the catalogue header (`space-y-4`).

- **Shell:** Outlined white panel (`rounded-xl border-border bg-background overflow-hidden`)—one panel per concern (preferences, Stripe).
- **Header strip:** `px-4 sm:px-5 py-4` with `border-b border-border`; section title `text-sm font-semibold`; supporting line `text-xs text-foreground-muted`. Optional trailing text link (e.g. Open Stripe dashboard) in `foreground-secondary`.
- **Body:** `p-4 sm:p-5`. Preference rows and Connect CTAs live here—not in the header strip.
- **Connect CTA:** Same primary yellow button as catalogue create actions when Stripe is not linked.

### Media upload tile & gallery panel

Image gallery library (thumbnails + event images) inside one outlined panel. Event hub photos use the same `ImageForm` inside the Change photo panel—not a peer Images tab.

- **Panel:** `rounded-xl border-border bg-background p-4 sm:p-5`; sections stacked with `space-y-8`. Section title `text-sm font-semibold` + muted description.
- **Upload tile:** First cell in each grid—`border-dashed border-border`, `bg-surface`, hover `bg-surface-hover`, unified `12px` radius, aspect ratio from image type. Centered Plus icon (`28px`, muted), bold `text-xs` “Add …” label, muted aspect hint. Focus-within yellow outline. Disabled (dimmed) while an upload is in flight.
- **Image cell:** Solid `border-border`, `bg-surface-muted`, `object-cover` fill, same radius and aspect as the upload tile—no floating badges on the media.
- **Grids:** Thumbnails denser (`grid-cols-2` → `lg:grid-cols-4`); event images wider (`grid-cols-1` → `lg:grid-cols-3`); gap `12px`.
- **Status:** Inline outlined status/alert rows for “Uploading…” and upload failures—not toasts or full-page blockers.

## Do's and Don'ts

### Do:

- **Do** write **SPORTSHUB** in all caps in UI and marketing copy.
- **Do** use semantic tokens (`bg-surface`, `text-foreground-muted`, `border-border`) from `globals.css` for new UI.
- **Do** keep yellow for primary CTAs, focus, the current-week chart bar, and the Details date-chip month stamp—not fill bars or status encoding.
- **Do** use black (`#0A0A0A`) text on yellow buttons.
- **Do** label metrics honestly (e.g. “All time per event” for page views, “Approx.” for conversion).
- **Do** use icon-led KPI cells with sentence-case labels—not uppercase hero-metric stacks.
- **Do** offer inline retry when dashboard data fails to load.
- **Do** use Linear, Stripe, Airbnb, and Luma (event hub) as craft references per the Reference Points section—Airbnb simplicity is the default tone; Linear and Stripe sharpen operate and payments; Luma shapes session overview + panel grammar.
- **Do** let content (event imagery, session details, metrics) lead—chrome stays flat and quiet, Airbnb-style.
- **Do** reuse the catalogue header + divided list panel (or gallery upload grid) for new organiser list surfaces—same shell as Forms, collections, and custom links.
- **Do** treat preference switches as checked controls: accent yellow when on, `surface-muted` when off.
- **Do** use the cover-led hover dossier (`EntityHoverPreview` + `HoverMetrics`) on catalogue rows that need a glanceable open decision—events, series, collections, forms.
- **Do** build event hub Details as an overview-led card with Edit details / Change photo opening `EventHubPanel`; build Registrations as expand-in-place rows (order/ticket IDs) with Form responses / Edit tickets opening the panel; Forms as a flush response table on stage (Change form + Add answers open the panel).
- **Do** build Edit Event as a sectioned sheet (Basic Info / Time / Location / Booking) with TipTap bubble-on-selection and a single yellow Update event in the panel footer.
- **Do** keep event hub share as circular channel icons—not a center modal.
- **Do** keep peer-tab and filter active states as near-black underline + weight—never yellow.

### Don't:

- **Don't** introduce new greys or radii outside the token ladder without updating `:root`.
- **Don't** introduce secondary display fonts—Satoshi only (per brand commitment).
- **Don't** copy Linear purple, Stripe violet, Airbnb coral, or Luma brand colour—or treat benchmark products as permission to abandon the Honest Clubhouse palette.
- **Don't** stack shadow + thick border + grey fill on one element.
- **Don't** use legacy `organiser-light-gray`, raw `gray-*`, or hardcoded `#BABABA` on new organiser surfaces.
- **Don't** use accent yellow on fill bars, KPI icon wells, status dots, peer tabs, or share channels—neutral encoding only (date-chip month stamp is the Comp A exception).
- **Don't** fabricate social proof, benchmarks, or analytics the product cannot source.
- **Don't** add kickers/eyebrows above catalogue page titles, or replace catalogue rows with a grid of miniature form/document preview cards.
- **Don't** invent a second settings visual language—stacked outlined panels with header strip + body only (account Settings). Event hub Settings uses flush preference rows on the stage instead—do not mix the two shells on one surface.
- **Don't** duplicate the list row inside the hover card, or add hover dossiers to custom links / top-events rows.
- **Don't** put nested bordered panels or fetch-on-hover data inside the mini-dossier—cover, three KPIs, short prose, middot flags only.
- **Don't** put a cover in event hub chrome or ship a persistent side inspector—use `EventHubPanel` for deep work.
- **Don't** restore an Images peer tab; photos edit through Change photo on Details.
- **Don't** mark peer tabs or Registrations filters with yellow—active state is near-black underline + weight.
- **Don't** put a sticky TipTap toolbar, view/edit toggle card, or Appearance themes inside Edit Event—sections + bubble-on-selection + one Update event only.
- **Don't** put a second primary CTA in the Edit Event body; save belongs in the panel footer.
