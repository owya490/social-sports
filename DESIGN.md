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
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.unified}"
    padding: "8px 14px"
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
  event-hub-expand-row:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.inner}"
    padding: "14px 0"
---

# Design System: SPORTSHUB

## Overview

**Creative North Star: "The Honest Clubhouse"**

SPORTSHUB looks like the digital front desk of a well-run local sports club—not enterprise SaaS, not a neon fitness app. The interface is calm, compact, and legible on a phone between sessions. White cards sit on a soft grey canvas; near-black text stays readable without harsh pure-black slabs. Sports yellow appears only where action or focus is needed: primary CTAs, the current-week chart bar, and focus rings.

**Elegance reference: Airbnb.** The overall design language should feel as simple and restrained as Airbnb—one accent on a neutral field, UI that steps back so content (events, photos, metrics) leads, and hierarchy built from size and weight rather than decoration. SPORTSHUB is warmer and more compact than Airbnb (community sport, not travel), but shares the same discipline: nothing extra, nothing loud.

Density is **compact-operate**: tight padding on dashboards and organiser chrome, icon-led KPI cells in a responsive grid, sidebar navigation that can collapse to icons. The organiser v2 dashboard is the reference surface for this world—metrics, chart, ranked lists, and announcements share one card language.

**Key Characteristics:**

- Black, white, and a short grey ladder—no decorative gradients in app chrome
- One corner radius (`12px` / `rounded-xl`) across panels, cards, and controls; `8px` (`rounded-lg`) for nested icon wells and segmented-control pills
- Satoshi for all typography roles (UI, headings, metrics)
- Yellow accent (`#F2B705`) with black text on filled accent surfaces; yellow only on CTAs and current-week chart bars
- Neutral fill bars (`surface-muted` track, `foreground-secondary` fill) for progress—not accent colour
- Borders over shadows for separation; elevation is rare
- Event hub operate bodies are a continuous workbench: flush lists + expand-in-place on the surface canvas—no nested card stacks
- Mobile-first organiser flows; honest metric labels; inline error recovery when data fails to load

## Reference Points

These are **craft benchmarks**, not visual templates. SPORTSHUB keeps the Honest Clubhouse identity—black/white/grey, sports yellow, Satoshi. Borrow **patterns and discipline** from these products; never their palettes, typefaces, or brand moments.

**Primary elegance model: Airbnb.** When in doubt, ask “would this feel at home on Airbnb?”—simple surfaces, generous clarity, one decisive accent, no visual noise.

| Benchmark | What to study | What SPORTSHUB adopts | What we do not copy |
|-----------|---------------|----------------------|---------------------|
| **Airbnb** *(primary)* | Single-family type hierarchy, restrained accent on neutral field, content-forward layouts, soft rounded cards, flat depth, mobile booking flows | One typeface (Satoshi) for all roles; yellow only on primary action; event imagery and data lead, chrome recedes; sentence-case labels; whitespace as structure—not filler | Cereal typeface, coral Rausch accent, travel-marketplace patterns, hero photography on operate dashboards |
| **Linear** | Operate-mode dashboards, collapsible sidebar, compact list density, keyboard-nav feel | Sidebar chrome on organiser v2; icon-led KPI cells; neutral hierarchy through weight and spacing; fast scan paths between tasks | Purple accent, dark-mode aesthetic, issue-tracker vocabulary |
| **Stripe** | Financial trust, Connect onboarding, settings/forms clarity, honest data tables, inline errors | Metric labels that say what the data actually is (“All time per event”, “Approx.”); payment/setup flows; bordered cards over decorative chrome; retry-on-failure patterns | Stripe violet, documentation-site typography scale, enterprise dashboard sprawl |

### Airbnb-informed design language

Translate Airbnb’s restraint into SPORTSHUB’s world:

- **One accent, one job.** Yellow marks the primary action or current focus—nowhere else. Like Rausch on Airbnb, it should feel electric because it is rare.
- **Content leads, chrome recedes.** Event photos, session titles, fill rates, and prices are the hero—not borders, gradients, or decorative icons. Player discovery is browse-and-book; organiser views are scan-and-act.
- **Single typeface, weight hierarchy.** Satoshi at every size. Differentiate roles with weight (400 body, 600 titles, 700 display) and modest scale steps—not a second font or uppercase shouting.
- **Flat and soft.** White cards on grey canvas, `12px` radius, `1px` borders, almost no shadow. Depth comes from surface steps, not elevation stacks.
- **Restrained scale.** Headlines earn their size. Section titles at 16–20px, greetings at 24–30px—save large type for marketing, not dense dashboards.
- **Tight tracking at scale.** Display headings use `tracking-tight` (≈ `-0.02em`) as size increases—letters compress slightly, like Airbnb’s display treatment.
- **Friendly, not flashy.** Rounded corners and Satoshi’s geometric warmth keep the product approachable for community sport—elegant simplicity, not cold enterprise or neon fitness.

### How to use these references

- **Default tone (all surfaces):** Airbnb simplicity. If a screen feels busy, remove before you add.
- **Player discovery (Persuade):** Airbnb browse rhythm. Card grids, filters, and booking flows should feel effortless—imagery and key facts first.
- **Organiser v2 (Operate):** Airbnb calm + Linear density + Stripe honesty. Compact, but never cluttered; metrics labeled honestly.
- **Payments & onboarding:** Stripe craft inside Airbnb calm. Connect setup and checkout stay clear and unhurried.
- **The litmus test:** If a screen could be mistaken for Airbnb, Linear, or Stripe with a palette swap, pull back. The clubhouse should still read as SPORTSHUB.

## Colors

A restrained neutral field with a single warm sports accent. Colour communicates hierarchy and action, not decoration.

### Primary

- **Sports Yellow** (`#F2B705`): Primary CTAs, the current-week bar in the ticket-sales chart, focus rings, checked controls. Always pair with **Near Black** text on filled yellow—not white.

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

**The One Accent Rule.** Yellow appears on primary actions, focus, and the current-week chart bar—not on fill bars, status dots, KPI icons, or nav hover fills.

**The Neutral Bar Rule.** Progress and ranking bars use `surface-muted` tracks with `foreground-secondary` fills. Accent yellow never encodes fill percentage.

## Typography

**Display / Body / Label Font:** Satoshi (variable, `frontend/public/fonts/satoshi/`) with system-ui fallback

**Character:** Geometric, friendly, Australian-community-practical. No serif, no display grotesk split—one family carries hub titles and body copy alike.

### Hierarchy

- **Display** (700, `text-2xl`–`text-3xl` on v2 header, line-height ~1.1, `tracking-tight`): Greeting headline on organiser dashboard. Restrained scale—Airbnb shows most section titles at 20–22px; reserve 30px+ for marketing heroes only.
- **Headline** (700, `text-xl`–`text-2xl`): KPI values in icon-led cells.
- **Title** (600, `text-base` / 16px): Section titles (“Ticket sales”, “Coming up”, “Top events”), event names in lists.
- **Body** (400–600, `text-sm` / 14px): Supporting lines, empty states, error copy.
- **Label** (500–600, `text-xs` / 12px): KPI labels and detail lines (sentence case, not uppercase), chart axis labels, announcement supporting lines, meta rows.

**The 16px Input Rule.** Form controls on mobile use ≥16px font size (`globals.css`) to prevent iOS zoom-on-focus.

**Tailwind:** `font-sans` and `font-display` both resolve to Satoshi (`--font-satoshi`). Use `font-display` with weight/tracking for marketing-scale headings (`.type-display`, `.type-section`).

## Layout

- **Spacing ladder:** 4 / 8 / 16 / 24 / 32 / 48px (`1` / `2` / `4` / `6` / `8` / `12` in Tailwind).
- **Content width:** Organiser dashboard content capped at `max-w-6xl` with `px-4`–`px-8` gutters.
- **Vertical rhythm:** Section stacks use `space-y-5`–`space-y-6` between major blocks.
- **KPI grid:** `grid-cols-2` on phone, `lg:grid-cols-4`; gap `10px`–`12px`.
- **Chart + coming-up:** `lg:grid-cols-5`—chart spans 3 columns, upcoming panel spans 2; stacks on mobile.
- **Setup + announcements:** Checklist (`lg:col-span-5`) beside announcement panel (`lg:col-span-7`); stacks on mobile. Announcements render as a divided technical list (mono tags), not accent tiles.
- **Organiser sidebar:** Expanded `200px`, collapsed `64px` (`--organiser-sidebar-width-*`); main content `lg:pl-[var(--organiser-sidebar-width)]`.
- **Event hub shell:** Page canvas `bg-surface`. Chrome + peer tabs share one white band (`bg-background border-b border-border`). Tab bodies sit in `max-w-6xl` with `px-4`–`px-8` and `pt-6`–`pt-8` on the surface—flush stage, not a second white panel. Section switches fade ~120–200ms opacity.
- **Breakpoints:** Tailwind defaults—`lg` (1024px) for persistent sidebar and multi-column dashboard grids.

## Elevation & Depth

**Flat-by-default.** Depth is conveyed with surface grey steps and borders, not stacked shadows. White cards on a grey canvas (`bg-background` on `bg-surface`) provide the primary layering model on the v2 dashboard.

### Shadow Vocabulary

- **Search lift** (`0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)`): Legacy searchbar only (`boxShadow.searchbar` in Tailwind config).
- **Hover dossier** (`0 8px 28px rgba(10,10,10,0.12)`): Floating `EntityHoverPreview` card only—soft offset lift so the portaled mini-dossier reads above the list. Never on resting catalogue rows or dashboard panels.

**The No Stack Rule.** Do not combine filled grey panels, heavy borders, and shadows on the same component.

**The Flush Stage Rule.** Event hub tab bodies (Attendees, Listing, Forms, Images, Settings) sit flush on the surface canvas under chrome. Hairline dividers and tonal washes (`surface-hover` / `surface-muted`) separate rows—not nested white cards, side inspectors, or 1D stacked panels.

## Shapes

- **Unified radius:** `0.75rem` (`12px`) — `rounded-xl`, CSS `--radius`. Panels, cards, buttons, list rows.
- **Inner radius:** `0.5rem` (`8px`) — `rounded-lg`. KPI icon wells, segmented-control pills, chart bar tops, ranked-list row hover targets.
- **Fill bars:** `4px` height (`h-1`), fully rounded caps (`rounded-full`).
- **Status dots:** `10px` circles (`h-2.5 w-2.5 rounded-full`).
- **Borders:** `1px` `border-border` on outlined cards and KPI cells; filled surfaces often omit borders.
- **Icons:** Heroicons outline, `stroke-[1.5]`, typically `16px` in KPI wells; announcement rows use a trailing `16px` arrow instead of icon wells.

## Components

### Buttons

- **Shape:** Unified radius (`12px`).
- **Primary:** `bg-accent`, `text-accent-contrast`, `font-semibold`, compact padding (`py-2`–`py-2.5 px-3.5`–`px-4`). Hover: slight brightness reduction (`hover:brightness-95`).
- **Secondary / Ghost:** `bg-surface` or white with `border-border`; hover `bg-surface-hover`.
- **Focus:** `focus-visible:outline-2 outline-offset-2 outline-focus` (yellow).

### Navigation (Organiser sidebar)

- **Item:** `text-xs`, icon + label, `rounded-xl`, `px-2.5 py-1.5`.
- **Active:** `bg-surface-muted`, `text-foreground`.
- **Inactive:** `text-foreground-secondary`, hover `bg-surface-hover`.

### Cards / Containers

- **Outlined panel:** White fill, `border-border`, `rounded-xl`, padding `16px`–`20px` (`p-4 sm:p-5`). Used for chart, top events, error recovery.
- **KPI cell:** Icon-led horizontal layout—not a stacked hero metric. White fill, border, icon in `rounded-lg bg-surface p-2` well, sentence-case label, bold tabular value, muted detail line.
- **Filled inset:** `bg-surface` without border for chart empty states and panel empty states.

### Fill Bars (shared pattern)

- **Track:** `h-1 rounded-full bg-surface-muted`.
- **Fill:** `rounded-full bg-foreground-secondary` with inline `width` percentage.
- **Meta:** Tabular-nums count beside the bar (`text-xs text-foreground-muted`).
- Used in **Top events** (ranked by tickets sold) and **Coming up** (capacity fill).

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

### Event hub — continuous workbench

Session operate surface at `/organiser/v2/event/[id]`. Same Honest Clubhouse tokens as catalogue and settings; body grammar extends flush lists and preference rows—without inventing a new world.

#### Chrome (approved B)

White band under the page canvas. Constrained 16:9 cover (`rounded-xl border-border`, ~15–19rem wide on `sm+`) beside title/meta—not a full-bleed hero and not a card collage.

- **Title:** `text-xl sm:text-2xl` bold, `tracking-tight`.
- **Meta:** Date and location as `text-xs text-foreground-muted` with outline icons.
- **Actions:** Share + Pause/Resume as quiet text controls (`text-foreground-muted`)—not yellow.
- **Capacity:** Neutral fill bar (`surface-muted` track, `foreground` fill, `h-1`) with tabular `filled/capacity · %` meta.
- **Status dots:** Near-black when on, `surface-muted` + border when off—Live/Paused, Public/Private, Payments. Same neutral encoding as upcoming-event dots; never yellow.

#### Peer tabs

Hairline `border-t border-border` under chrome. Underline tabs (`border-b-2`): active = `border-foreground` + semibold; inactive = transparent border, `foreground-secondary`, hover toward foreground. Horizontal scroll on narrow viewports. Yellow never marks the active tab.

#### Stage toolbar + hairline filters

Shared primitives in `EventHubStage`:

- **Toolbar:** Leading meta (`text-sm text-foreground-muted`) + trailing primary yellow CTA when needed (`Add attendee`, `Save images`). Compact `pb-3`.
- **Filters:** Hairline `border-b` strip; same underline grammar as peer tabs; optional tabular counts in muted/near-black. Used for Approved / Pending / Declined on Attendees.
- **Primary / ghost buttons:** Same as catalogue—yellow primary (`rounded-xl`, black text); ghost = white + `border-border`.
- **Empty:** Centered muted copy (`py-14`), no outlined empty card.

#### Flush list + expand-in-place (Attendees)

Edge-to-edge divided rows on the stage (`divide-y divide-border`)—catalogue row density without the outlined list-panel shell.

- **Row:** Avatar icon (`40px` muted), name `text-sm font-semibold`, handle `text-xs muted`, optional ticket count, chevron that rotates 90° when open. Hover `surface-hover`; expanded resting wash `surface-muted/70`.
- **Inspector:** Opens under the same row (`grid-template-rows` + opacity ~200ms). Content indented under the avatar (`pl-[3.25rem]`). Approve = yellow primary; Decline = ghost; secondary links (form responses) stay muted text. Collapse other rows when switching filters.
- **Not:** Side-by-side inspector pane, nested bordered detail cards, or a second white panel around the list.

**The Expand-In-Place Rule.** Detail for a flush workbench row opens under that row on the same plane. Do not ship a persistent side inspector or nested card stack for session attendee detail.

#### Listing as document

Toolbar meta (“Public listing — tap to edit”) + Preview text link. Title edits inline at display scale (`text-2xl sm:text-3xl`); description is an “About” block with hairline separators; field rows use `EventHubMetaRow` (fixed muted label column ~96px + value). Advanced session fields expand in-place under a quiet text control—same motion grammar as attendee expand.

#### Event hub settings — flush preference stack

Preference switches reuse the account Settings switch (accent on / `surface-muted` off, `28×48px`). Rows stack with `divide-y divide-border` directly on the stage—no outlined settings-panel shell, no header strip. Destructive “Delete event” is a danger text link below a hairline, not a yellow button.

**The Workbench Extension Rule.** Event hub bodies extend catalogue list density and settings preference-row language onto a flush stage. Do not reintroduce dashboard card grids or account-settings outlined panels as the default event-hub body chrome.

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

Image gallery library (thumbnails + event images) inside one outlined panel.

- **Panel:** `rounded-xl border-border bg-background p-4 sm:p-5`; sections stacked with `space-y-8`. Section title `text-sm font-semibold` + muted description.
- **Upload tile:** First cell in each grid—`border-dashed border-border`, `bg-surface`, hover `bg-surface-hover`, unified `12px` radius, aspect ratio from image type. Centered Plus icon (`28px`, muted), bold `text-xs` “Add …” label, muted aspect hint. Focus-within yellow outline. Disabled (dimmed) while an upload is in flight.
- **Image cell:** Solid `border-border`, `bg-surface-muted`, `object-cover` fill, same radius and aspect as the upload tile—no floating badges on the media.
- **Grids:** Thumbnails denser (`grid-cols-2` → `lg:grid-cols-4`); event images wider (`grid-cols-1` → `lg:grid-cols-3`); gap `12px`.
- **Status:** Inline outlined status/alert rows for “Uploading…” and upload failures—not toasts or full-page blockers.

## Do's and Don'ts

### Do:

- **Do** write **SPORTSHUB** in all caps in UI and marketing copy.
- **Do** use semantic tokens (`bg-surface`, `text-foreground-muted`, `border-border`) from `globals.css` for new UI.
- **Do** keep yellow for primary CTAs, focus, and the current-week chart bar—not fill bars or status encoding.
- **Do** use black (`#0A0A0A`) text on yellow buttons.
- **Do** label metrics honestly (e.g. “All time per event” for page views, “Approx.” for conversion).
- **Do** use icon-led KPI cells with sentence-case labels—not uppercase hero-metric stacks.
- **Do** offer inline retry when dashboard data fails to load.
- **Do** use Linear, Stripe, and Airbnb as craft references per the Reference Points section—Airbnb simplicity is the default tone; Linear and Stripe sharpen operate and payments surfaces.
- **Do** let content (event imagery, session details, metrics) lead—chrome stays flat and quiet, Airbnb-style.
- **Do** reuse the catalogue header + divided list panel (or gallery upload grid) for new organiser list surfaces—same shell as Forms, collections, and custom links.
- **Do** treat preference switches as checked controls: accent yellow when on, `surface-muted` when off.
- **Do** use the cover-led hover dossier (`EntityHoverPreview` + `HoverMetrics`) on catalogue rows that need a glanceable open decision—events, series, collections, forms.
- **Do** build event hub tab bodies as a continuous workbench: stage toolbar, hairline filters, flush divided rows, expand-in-place inspectors, and flush preference stacks.
- **Do** keep event hub chrome capacity and status encoding neutral (near-black / muted)—yellow stays on primary CTAs only.

### Don't:

- **Don't** introduce new greys or radii outside the token ladder without updating `:root`.
- **Don't** introduce secondary display fonts—Satoshi only (per brand commitment).
- **Don't** copy Linear purple, Stripe violet, or Airbnb coral—or treat benchmark products as permission to abandon the Honest Clubhouse palette.
- **Don't** stack shadow + thick border + grey fill on one element.
- **Don't** use legacy `organiser-light-gray`, raw `gray-*`, or hardcoded `#BABABA` on new organiser surfaces.
- **Don't** use accent yellow on fill bars, KPI icon wells, or status dots—neutral encoding only.
- **Don't** fabricate social proof, benchmarks, or analytics the product cannot source.
- **Don't** add kickers/eyebrows above catalogue page titles, or replace catalogue rows with a grid of miniature form/document preview cards.
- **Don't** invent a second settings visual language—stacked outlined panels with header strip + body only (account Settings). Event hub Settings uses flush preference rows on the stage instead—do not mix the two shells on one surface.
- **Don't** duplicate the list row inside the hover card, or add hover dossiers to custom links / top-events rows.
- **Don't** put nested bordered panels or fetch-on-hover data inside the mini-dossier—cover, three KPIs, short prose, middot flags only.
- **Don't** wrap event hub Attendees/Listing/Settings bodies in nested white card stacks, side inspector panes, or 1D panel columns—flush stage only.
- **Don't** mark peer tabs or Attendees filters with yellow—active state is near-black underline + weight.
