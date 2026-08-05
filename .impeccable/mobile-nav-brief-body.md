# Organiser v2 mobile chrome (integrated top bar)

## Scope & mode
Operate — mobile-only navigation chrome for organiser v2 routes (`lg` and below). Desktop sidebar unchanged.

## Audience / job
Organiser on phone between sessions needs hub navigation without a floating orphan control that breaks the clubhouse plane.

## Direction
Approved: Brand-led bar (`.impeccable/mocks/mobile-nav-comp-a-brand-led.png`). Flush sticky white top bar: SPORTSHUB mark + ORGANISER HUB left; quiet menu glyph + avatar right; hairline bottom border. Left sheet reuses full sidebar content. No bordered burger tile, no `pt-16` dead spacer.

## Memorable moment
The menu lives inside the page chrome — same plane as the dashboard — not a floating card above it.

## Inventory
| Ingredient | Medium |
|---|---|
| Sticky top bar shell | HTML/CSS |
| SPORTSHUB logo | Existing `BlackLogo.svg` |
| ORGANISER HUB wordmark | Satoshi text |
| Menu glyph | Heroicons `Bars3Icon` (ghost, no tile) |
| Avatar | User profile picture / muted well |
| Left nav sheet + dim overlay | Existing drawer pattern, restyled |
| Sheet nav content | Existing `SidebarContent` |

## Unresolved
None for this pass — desktop collapse/expand stays as-is.
