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
- **Breakpoints:** Tailwind defaults—`lg` (1024px) for persistent sidebar and multi-column dashboard grids.

## Elevation & Depth

**Flat-by-default.** Depth is conveyed with surface grey steps and borders, not stacked shadows. White cards on a grey canvas (`bg-background` on `bg-surface`) provide the primary layering model on the v2 dashboard.

### Shadow Vocabulary

- **Search lift** (`0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)`): Legacy searchbar only (`boxShadow.searchbar` in Tailwind config).

**The No Stack Rule.** Do not combine filled grey panels, heavy borders, and shadows on the same component.

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

### Don't:

- **Don't** introduce new greys or radii outside the token ladder without updating `:root`.
- **Don't** introduce secondary display fonts—Satoshi only (per brand commitment).
- **Don't** copy Linear purple, Stripe violet, or Airbnb coral—or treat benchmark products as permission to abandon the Honest Clubhouse palette.
- **Don't** stack shadow + thick border + grey fill on one element.
- **Don't** use legacy `organiser-light-gray`, raw `gray-*`, or hardcoded `#BABABA` on new organiser surfaces.
- **Don't** use accent yellow on fill bars, KPI icon wells, or status dots—neutral encoding only.
- **Don't** fabricate social proof, benchmarks, or analytics the product cannot source.
