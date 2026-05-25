# Design — CarletonCourseMap

Locked design system for this app. Every redesign reads this file before
emitting code. Amend here when the system needs to grow; do not override locally.

## Genre
modern-minimal

## Macrostructure family
- Marketing pages: Narrative Workflow (numbered step sections, typography-led hero)
- App pages: Workbench (product chrome is function, minimal decoration)

## Theme
Custom palette anchored on Carleton red (#E31837).

- `--color-paper`            oklch(99% 0.003 85)       — near white, very slight warm
- `--color-paper-2`          oklch(96.5% 0.004 85)     — light warm grey (headers, chip bg)
- `--color-paper-3`          oklch(93.5% 0.004 85)     — hover states
- `--color-ink`              oklch(11% 0.003 270)       — near black
- `--color-ink-2`            oklch(38% 0.005 270)       — body text, secondary
- `--color-ink-3`            oklch(57% 0 0)             — placeholders, tertiary
- `--color-rule`             oklch(87% 0.004 85)        — dividers
- `--color-accent`           oklch(49.5% 0.222 26)      — Carleton red #E31837
- `--color-accent-hover`     oklch(42% 0.195 26)        — darker red on hover
- `--color-accent-soft`      oklch(97% 0.018 26)        — light red tint (badges, eyebrows)
- `--color-accent-ink`       oklch(99% 0 0)             — white text on red
- `--color-focus`            oklch(55% 0.222 26)        — focus ring

Course-type colours:
- `--color-required`         oklch(11% 0 0)
- `--color-science`          oklch(43% 0.14 144)
- `--color-science-bg`       oklch(97% 0.012 144)
- `--color-elective`         oklch(56% 0.14 50)
- `--color-elective-bg`      oklch(97% 0.012 50)
- `--color-complementary`    oklch(49.5% 0.222 26)
- `--color-complementary-bg` oklch(97.5% 0.015 26)

## Typography
- Display: Roboto Slab, weight 700 / 600 (wordmark, hero, panel headers, step numbers)
- Body:    Geist (next/font), -apple-system fallback, weight 400 / 600
- Display tracking: -0.01em to -0.02em on large sizes
- Scale anchor: `--text-display` = clamp(2.5rem, 5vw, 4rem)

## Spacing
4-point named scale — all components use `var(--space-*)` tokens.
See `app/globals.css :root` for values.

## Motion
- Easings: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`
- Duration short: 180ms (colour transitions, reveals)
- Duration medium: 280ms (panel slide-ins)
- Reduced-motion: `prefers-reduced-motion: reduce` collapses all to 1ms in globals.css
- No spatial motion except panel slide-in (right ↔ off-canvas)

## Microinteractions stance
- Silent success (no toasts)
- Panels open on click, close via ✕ — no confirmation dialogs
- Notes tab slides in/out at 280ms
- Hover: box-shadow lift on course cards (CSS only, no JS)

## CTA voice
- Primary: filled Carleton red, borderRadius var(--radius-input) = 4px, fontWeight 600
- Copy pattern: imperative verb + noun ("View Course Maps", "Open Map")
- No rounded pill CTAs on app chrome; pill shape reserved for the course-count badge only

## Per-page allowances
- Marketing pages MAY use enrichment (Tier-A, Tier-B). Current landing: typography only.
- App pages MUST NOT use enrichment — the ReactFlow canvas carries the page.

## What pages MUST share
- The wordmark: `<span style="color:var(--color-accent)">Carleton</span>CourseMap`
  in Roboto Slab 700
- The accent colour placement (≤ 5% per viewport — badge, wordmark prefix, step numbers)
- Roboto Slab display + Geist body pairing
- CTA shape (4px radius, filled red, 600 weight)
- Section heading rhythm (no uppercase chapter numbers on app pages;
  numbered steps only on marketing/Narrative Workflow pages)

## What pages MAY differ on
- Macrostructure within the page-type family
- Hero layout
- Background dot pattern vs plain canvas

## Exports

### tokens.css
```css
/* Hallmark · macrostructure-family: Narrative Workflow (marketing) / Workbench (app)
 * theme: custom · vibe: "institutional Carleton red white charcoal"
 * paper: oklch(99% 0.003 85) · accent: oklch(49.5% 0.222 26) warm-red
 * display: Roboto Slab · body: Geist · designed-as-app
 */
:root {
  --color-paper:            oklch(99% 0.003 85);
  --color-paper-2:          oklch(96.5% 0.004 85);
  --color-paper-3:          oklch(93.5% 0.004 85);
  --color-ink:              oklch(11% 0.003 270);
  --color-ink-2:            oklch(38% 0.005 270);
  --color-ink-3:            oklch(57% 0 0);
  --color-rule:             oklch(87% 0.004 85);
  --color-accent:           oklch(49.5% 0.222 26);
  --color-accent-hover:     oklch(42% 0.195 26);
  --color-accent-soft:      oklch(97% 0.018 26);
  --color-accent-ink:       oklch(99% 0 0);
  --color-focus:            oklch(55% 0.222 26);

  --color-required:         oklch(11% 0 0);
  --color-science:          oklch(43% 0.14 144);
  --color-science-bg:       oklch(97% 0.012 144);
  --color-elective:         oklch(56% 0.14 50);
  --color-elective-bg:      oklch(97% 0.012 50);
  --color-complementary:    oklch(49.5% 0.222 26);
  --color-complementary-bg: oklch(97.5% 0.015 26);

  --font-display: var(--font-roboto-slab), "Roboto Slab", Georgia, serif;
  --font-body:    var(--font-geist-sans), -apple-system, "Segoe UI", sans-serif;
  --font-mono:    var(--font-geist-mono), monospace;

  --text-xs:      0.75rem;
  --text-sm:      0.875rem;
  --text-md:      1rem;
  --text-lg:      1.125rem;
  --text-xl:      1.375rem;
  --text-2xl:     1.75rem;
  --text-3xl:     2.25rem;
  --text-display: clamp(2.5rem, 5vw, 4rem);

  --space-3xs: 0.25rem;  --space-2xs: 0.5rem;   --space-xs: 0.75rem;
  --space-sm:  1rem;     --space-md:  1.5rem;   --space-lg: 2rem;
  --space-xl:  3rem;     --space-2xl: 4.5rem;   --space-3xl: 7rem;

  --ease-out:     cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:  cubic-bezier(0.65, 0, 0.35, 1);
  --dur-short:    180ms;
  --dur-medium:   280ms;

  --radius-card:  6px;
  --radius-pill:  999px;
  --radius-input: 4px;
}
```
