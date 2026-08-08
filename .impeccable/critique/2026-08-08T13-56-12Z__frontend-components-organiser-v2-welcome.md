---
target: organiser v2 welcome landing modal
total_score: 16
max_score: 36
na_heuristics: 7
p0_count: 0
p1_count: 4
timestamp: 2026-08-08T13-56-12Z
slug: frontend-components-organiser-v2-welcome
---
Method: dual-agent (A: 5336d851-076f-433e-a2fe-4694c18b3617 · B: parent CLI fallback after subagent empty — browser skipped, no localhost:3000)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Loading progress exists but is theatrical (3.2s fake beats); modal never states tour length |
| 2 | Match System / Real World | 1 | “Organiser Hub v2”, “Live metrics”, Gemini mark, “Fresh layout. Faster paths.” — tech/marketing, not organiser speech |
| 3 | User Control and Freedom | 2 | Skip + backdrop exit; cannot skip loading; no Esc on modal |
| 4 | Consistency and Standards | 2 | Loading = brand logo; modal = Gemini sparkle — two products stitched |
| 5 | Error Prevention | 1 | Backdrop finish() permanently marks welcome seen |
| 6 | Recognition Rather Than Recall | 2 | Chips name unseen UI; icon ≠ brand |
| 7 | Flexibility and Efficiency | n/a | First-run gate; expert escape is Skip |
| 8 | Aesthetic and Minimalist Design | 2 | Card sparse, but loading theatre + abstract chips are decorative noise |
| 9 | Error Recovery | 1 | Skip/backdrop has no undo |
| 10 | Help and Documentation | 3 | “Take the tour” is the right help affordance |
| **Total** | | **16/36** | **Poor (~44%)** |

#### Design Specificity Verdict

**LLM assessment**: Category-interchangeable SaaS onboarding, not authored for SPORTSHUB organisers. Loading briefly uses brand truth (white mark, sports yellow, black field), then the landing modal switches to a Gemini-style sparkle, decorative scale-X bar, staggered blur entrance, and three abstract feature nouns. Copy centers internal versioning (“Organiser Hub v2”) and changelog adjectives instead of community-session language. Headline wrapping splits the product name across lines — confirms the unfinished/AI feel.

**Deterministic scan**: `detect.mjs --json frontend/components/organiser/v2/welcome` → `[]`, exit 0. Zero rule hits. Detector does not catch copy voice, brand-icon mismatch, or typographic wrap — those remain LLM/specificity findings, not false negatives of a known rule.

**Visual overlays**: Skipped. No frontend dev server on localhost:3000; Assessment B subagent returned empty twice; no reliable user-visible overlay.

#### Overall Impression

Structure is fine (tour vs skip, mobile sheet, dimmed real dashboard). Craft and voice are not. Biggest opportunity: kill the AI-SaaS reveal recipe — Gemini sparkle, “v2”, filler adjectives, fake loading theatre — and rewrite the first human line as something a coach between games would actually care about, with the product name on one line.

#### What's Working

1. Binary Tour / Skip fork with clear primary/secondary hierarchy.
2. Mobile `items-end` sheet over a dimmed live dashboard (place continuity).
3. `useReducedMotion` shortens loading and damps blur/scale.

#### Priority Issues

1. **[P1] Headline wraps “Organiser Hub” / “v2” onto separate lines** — `whitespace-nowrap` only on `v2`. Fix: keep `Organiser Hub v2` as one unit, or drop “v2”. Suggested: `/impeccable typeset` + `/impeccable clarify`
2. **[P1] Copy is filler, not organiser voice** — “Fresh layout. Faster paths.” / Sidebar / Live metrics / Real events. Fix: name the job; kill abstract chips. Suggested: `/impeccable clarify`
3. **[P1] Brand break: Gemini sparkle (and AI loading theatre)** — Modal icon is GeminiStarIcon; loading orbit/glow. Note: surface brief pins B/W chrome (no yellow on welcome) — yellow absence is intentional; Gemini icon is not. Suggested: `/impeccable distill` / `/impeccable quieter` on theatre; replace icon
4. **[P1] Backdrop dismiss = permanent skip, no undo** — `finish()` → markWelcomeSeen. Suggested: `/impeccable harden`
5. **[P2] Unskippable 3.2s fake loading** — Suggested: `/impeccable distill` / `/impeccable onboard`

#### Persona Red Flags

**Jordan**: “v2” / “Live metrics” need translation; Gemini ≠ SPORTSHUB; unclear tour cost; accidental backdrop ends onboarding.

**Casey**: Forced 3.2s black screen; fat-finger backdrop trap; returns with welcome already seen.

**Morgan (community volleyball organiser)**: Needs “where do I create Thursday’s social?” — gets version branding and layout adjectives.

#### Minor Observations

- Top black scale-X bar reads as progress but isn’t tour progress.
- Loading aria-label reinforces “v2” jargon for AT.
- Feature chips overpromise vs tour step titles.
- Surface brief pins B/W-only welcome chrome — do not “fix” missing yellow as a bug without revisiting that brief.

#### Questions to Consider

- If this card is the first human moment after black, why does the logo leave and a Gemini sparkle take its place?
- What would the headline be if “v2” were illegal?
- Would Morgan take the tour more if the CTA said “Show me where Create event lives”?
- Is the loading stage earning trust, or teaching users SPORTSHUB stalls them with fake progress?
