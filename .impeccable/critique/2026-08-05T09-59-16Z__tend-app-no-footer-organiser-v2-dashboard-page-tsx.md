---
target: organiser v2 dashboard page
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-05T09-59-16Z
slug: tend-app-no-footer-organiser-v2-dashboard-page-tsx
---
Method: dual-agent (A: eba38532-e904-480b-bbc7-4b9bbf6bd3d1 · B: 3400ccca-404b-41d7-9400-c6aacda65319)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeletons work; header drops to generic "Dashboard" while loading; no aria-live when metrics resolve |
| 2 | Match System / Real World | 2 | Chart labels W1–W4 are ops jargon; Conversion (Approx.) unexplained for volunteer organisers |
| 3 | User Control and Freedom | 3 | Sidebar collapse, mobile drawer Esc, chart range toggle, error Retry + fallback link |
| 4 | Consistency and Standards | 2 | Shell bg-background vs page bg-surface; Create event triplicated; v1 navbar vs v2 sidebar mental models |
| 5 | Error Prevention | 3 | Read-only dashboard with solid loading/error guards |
| 6 | Recognition Rather Than Recall | 2 | Sidebar + quick nav duplicate destinations; chart week labels require decoding |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts or power paths for repeat organisers |
| 8 | Aesthetic and Minimalist Design | 3 | Calm B&W hierarchy; bottom quick-nav row adds redundant header |
| 9 | Error Recovery | 4 | Error card with Retry and "manage events" escape is reassuring and actionable |
| 10 | Help and Documentation | 2 | No inline help on Conversion, page views, or chart semantics |
| **Total** | | **26/40** | **Good — solid foundation, clear refinement targets** |

## Design Specificity Verdict

**Moderately specific in language and one widget; structurally interchangeable SaaS.**

The dashboard earns partial SPORTSHUB identity through domain copy ("sessions," "players"), AU dollar formatting, capacity fill bars in Coming up, and disciplined Honest Clubhouse tokens (Satoshi, grey canvas, yellow only on Create event CTAs and the current-week chart bar). The surface brief targets "category-standard canon… refined SaaS dashboard at Stripe/Linear craft level," and the built artifact delivers that: icon-led KPI grid, segmented bar chart, ranked list, five-tile shortcut strip. Nothing in layout or interaction would signal community sports organiser if you swapped the nouns for "customers" and "orders." The memorable moment (fill bars at a glance) lives only in Coming up and Top events—not enough to escape generic dashboard territory.

**Deterministic scan:** CLI scans of the page and all seven dashboard components returned zero findings. Browser overlay (detect.js on live page) reported 15 anti-patterns—predominantly `low-contrast` on `text-foreground-muted` (#8a8a8a on #ffffff at 3.5:1) across KPI subtitles ("Last 30 days," "All time per event," "Approx."), loading copy, and section meta. One `skipped-heading` hit is a false positive from global mobile search markup, not dashboard code. Four `layout-transition` hits trace to sidebar collapse animation in organiser shell.

**Visual overlays:** detect.js injection succeeded; overlays highlight low-contrast muted text on KPI cells and loading states. MCP browser tab was unavailable; evidence collected via Puppeteer fallback at desktop (1280×800) and mobile (390×844).

## Overall Impression

The v2 dashboard is a credible Operate surface: honest metrics, calm visual system, and the Coming up fill bars deliver real sports-operational value. The biggest gap is not craft quality but product identity—the layout reads as refined generic SaaS, and redundant navigation plus opaque chart labels add extraneous cognitive load on mobile. Fixing contrast on muted labels and humanizing the chart axis would be fast wins; rethinking quick-nav vs sidebar would be the structural improvement.

## What's Working

1. **Honest metric labeling** in DashboardKpiGrid—"Last 30 days," "All time per event," "Approx." on conversion—builds organiser trust instead of vanity analytics.
2. **Coming up fill bars + status dots** encode capacity at a glance; the most product-native element on the page and the brief's memorable moment.
3. **Accent discipline** matches Honest Clubhouse: yellow on Create event buttons and the current-week bar in WeeklyTicketsChart only; neutral fill bars elsewhere.

## Priority Issues

**[P1] Mobile quick nav crushes at 5 columns**
- **What:** DashboardQuickNav uses grid-cols-5 with text-xs labels at all breakpoints; tiles likely under 44×44pt effective targets.
- **Why:** One-handed organisers between games get illegible labels and mis-taps.
- **Fix:** Collapse to 3 primary shortcuts on mobile, horizontal scroll with larger tiles, or remove entirely given drawer nav.
- **Suggested command:** `/impeccable adapt frontend/components/organiser/v2/dashboard/DashboardQuickNav.tsx`

**[P1] Muted text fails WCAG AA contrast (detector + design agree)**
- **What:** foreground-muted (#8a8a8a) on white backgrounds scores 3.5:1—below 4.5:1 required for small text. Hits KPI subtitles, loading copy, section meta.
- **Why:** Sam and all users in bright sunlight struggle to read period labels that establish metric honesty.
- **Fix:** Darken muted token to ~#767676 or bump label size/weight; verify across KPI grid, chart, and list meta.
- **Suggested command:** `/impeccable audit frontend/components/organiser/v2/dashboard`

**[P1] Chart axis labels are opaque (W1–W4)**
- **What:** WeeklyTicketsChart renders bucket labels W1–W4 from buildWeeklyTicketBuckets.
- **Why:** Volunteer organisers cannot map W3 to "two weeks ago."
- **Fix:** Use human labels ("This wk", "Last wk", date ranges); keep aria-label in sync.
- **Suggested command:** `/impeccable clarify frontend/components/organiser/v2/dashboard/WeeklyTicketsChart.tsx`

**[P2] Redundant navigation triples cognitive noise**
- **What:** OrganiserSidebar (5 destinations) + DashboardQuickNav (same 5) + header Create event (also first quick-nav tile).
- **Why:** Extraneous load; end-of-page quick nav adds no IA value where sidebar exists.
- **Fix:** Remove DashboardQuickNav on desktop; on mobile replace with 2–3 contextual actions or omit given drawer nav.
- **Suggested command:** `/impeccable distill frontend/app/(no-footer)/organiser/v2/dashboard/page.tsx`

**[P2] Event thumbnails fail accessibility**
- **What:** UpcomingEventsSection EventRowCompact thumbnail uses role="img" with aria-label="".
- **Why:** Screen readers get silent decorative noise; link name lacks fill-state context shown via status dot.
- **Fix:** alt="" on decorative thumb; include fill state in link accessible name.
- **Suggested command:** `/impeccable audit frontend/components/organiser/v2/dashboard/UpcomingEventsSection.tsx`

## Persona Red Flags

**Alex (power user):** No keyboard shortcuts to Create event or toggle chart range. Must scroll past KPI grid + chart + Coming up to reach DashboardQuickNav—sidebar helps on desktop but mobile requires hamburger → drawer.

**Sam (accessibility-dependent):** Event thumbnail aria-label="" in Coming up rows. Status dot state not in link accessible name. Five dense quick-nav links at page bottom extend tab order significantly after main content.

**Casey (distracted mobile user):** Fixed hamburger + pt-16 competes with greeting in left gutter. Five-column quick nav at page end: labels wrap/truncate at ~320px; touch targets cramped.

## Minor Observations

- DashboardHeader loading fallback "Dashboard" loses warmth vs skeleton greeting.
- Conversion KPI may alarm organisers (page views all-time vs tickets 30-day)—honest but cognitively mismatched periods.
- OrganiserShell bg-background vs page bg-surface creates a subtle canvas seam at layout edge.
- Top events rank bars are correctly neutral per design system but feel inert for new organisers with zero sales.

## Questions to Consider

- If the sidebar already exposes Create · Events · Forms · Gallery · Settings, what job does DashboardQuickNav perform that justifies five more equal-weight choices at the scroll terminus?
- Would a community organiser rather see "spots to fill this week" as a fifth KPI than Conversion (Approx.)?
- Is "category-standard SaaS dashboard" the right canon—or should the first viewport lead with Coming up fill pressure instead of four financial KPIs?
