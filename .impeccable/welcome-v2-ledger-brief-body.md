# Organiser Hub v2 Welcome

## Scope
Persuade welcome at `/organiser/v2/welcome` — first land for organiser v2; Gemini-star nav tab above Dashboard. `/organiser/v2` redirects here.

## Visitor mode
Persuade

## Audience / job / action
Verified and new organisers opening Organiser Hub v2. Believe the hub is a clear upgrade across the whole product, not one screen. Primary action: Enter Events. Secondary: Dashboard.

## Proof / content
Real v1-vs-v2 screenshots of the dashboard and the event page, revealed by a shared Then→Now seam. Three text-only "Also new" entries (Forms, Series and collections, Settings). No fabricated metrics.

## Constraints
Honest Clubhouse tokens (Satoshi, B/W/grey, yellow #F2B705). Reveal frames stay compact (max 27rem, 5:3) — the user explicitly refused a large screenshot stage. Permanent Welcome tab.

## Chosen direction
Release ledger spine. Seed key bfc12aaf · grounded candidate 3 of 7. Supersedes the earlier scattered "Peel Reveal · Title-led" build (seed 58e6299d, comp-b-title-led.png), which the user rejected outright and which is now the anti-reference for this surface — do not restore it.

## Memorable moment
One master Then→Now scrubber under the masthead drives every reveal frame on the page in unison; on load the seam sweeps out and back so all the yellow stars travel together down the spine.

## Approved comp
None — the user forbade the question and comp rounds for this build. `.impeccable/mocks/welcome-v2/comp-b-title-led.png` documents the superseded design only.

## Ingredient inventory
| Ingredient | Medium |
|---|---|
| Sidebar Welcome + Gemini sparkle icon | SVG (authored, outline + solid) + existing NavLink |
| Two-tone display masthead, mask-wipe entrance | Satoshi semantic HTML + CSS keyframes |
| Enter Events / Dashboard pair | `WelcomeActions`; yellow button token |
| Master Then—Now rail (documented fill-bar grammar) | CSS + pointer scrub |
| Ledger spine: hairline + filled/hollow nodes | CSS (Edit Event timeline grammar) |
| Dashboard and event-page v1/v2 images | Raster public assets |
| Reveal seam, yellow glow, peel-edge shadow | CSS clip-path + gradients |
| Yellow sparkle scrub handles (master + per frame) | SVG + shared slider state |

## Unresolved
Whether the v1/v2 rasters should be re-cropped to a more legible region — at 27rem they read as layout change, not readable UI.
