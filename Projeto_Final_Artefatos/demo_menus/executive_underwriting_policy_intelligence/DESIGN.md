---
name: Executive Underwriting & Policy Intelligence
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#07006c'
  on-tertiary-container: '#7073ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  data-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 1rem
    fontWeight: '500'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  data-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1.25rem
  data-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 1rem
  label-md:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system targets commercial insurance underwriters, legal risk officers, and brokers managing high-liability Directors & Officers (D&O) exposures. The product atmosphere balances high-velocity precision with executive-level institutional trust. 

The aesthetic is modern corporate minimalism infused with analytical density:
- **Tone:** Methodical, unyielding, authoritative, and frictionless.
- **Visual Weight:** Light, structured interfaces with razor-sharp structural dividers, avoiding decorative excess to spotlight complex policy comparisons and risk metrics.
- **Emotional Response:** Inspires absolute certainty, analytical clarity, and rigorous compliance oversight.

## Colors

The palette leverages high-contrast corporate depths alongside purposeful semantic and AI-specific indicators:

- **Dominant Base:** Slate Navy (`#0F172A`) commands the highest visual order (primary headings, active navigation states, authoritative surfaces). Canvas surfaces rely on an ultra-clean Slate 50 (`#F8FAFC`) with pure white (`#FFFFFF`) interior card fills.
- **Enterprise Interaction:** Cobalt Blue (`#2563EB`) guides actions, focus indicators, and interactive links, shifting to Deep Blue (`#1D4ED8`) on hover.
- **AI Intelligence Signal:** Subtle Violet-Indigo (`#6366F1`) designates synthetic reasoning, autonomous clause extraction, and predictive policy benchmarks, accompanied by a muted tint (`#EEF2FF`) for container backgrounds.
- **System Diagnostics & Status:**
  - *Compliant / Verified:* Emerald (`#10B981`) with soft field tint (`#ECFDF5`).
  - *Advisory / Exposure Risk:* Amber (`#F59E0B`) with soft field tint (`#FFFBEB`).
  - *Policy Exclusion / High Exposure:* Crimson (`#EF4444`) with soft field tint (`#FEF2F2`).
- **Structural Lines:** Deliberate border strokes defined at Slate 200 (`#E2E8F0`) and muted dividers at Slate 100 (`#F1F5F9`).

## Typography

Typography focuses on rigorous scannability and structural alignment:

- **Primary Interface Font:** Inter provides geometric clarity, tight tracking for titles, and high open counters for dense dashboard surfaces.
- **Tabular & Numeric Font:** JetBrains Mono is strictly utilized for policy limits, retention tiers, clause indices, confidence percentages, and audit log timestamps. This prevents eye fatigue during vertical figure comparisons.
- **Hierarchy Rules:**
  - Section and column labels leverage uppercase `label-md` with widened tracking (`0.04em`) in muted Slate (`#64748B`).
  - Legal contract analysis segments and clause extractions render at `body-md` with `lineHeight: 1.5rem` to optimize multi-paragraph reading comfort.

## Layout & Spacing

The system enforces a high-density, multi-panel structural layout configured for high-resolution underwriting screens:

- **Grid Architecture:** Uses a fluid 12-column foundation supported by fixed vertical application anchors (a 64px collapsed / 240px expanded navigation sidebar).
- **Split-Pane Standard:** Document analysis relies on a master 50/50 or 40/60 split pane layout (left: parsed policy intelligence & risk checklist; right: native PDF canvas with bi-directional highlight anchors).
- **Density Scaling:**
  - Compact mode: Form inputs, table cells, and summary pills scale down padding by 25% using `space-xs` and `space-sm` for enterprise risk monitors.
  - Standard mode: Uses `space-md` for standard card interiors and `space-lg` for dashboard macro modules.
- **Breakpoints:**
  - Mobile (`< 768px`): Fluid single-column reflow, sidebars collapse to slide-over drawers, split panes convert to tabbed viewers.
  - Tablet (`768px - 1199px`): 8-column canvas, sidebar pinned collapsed (64px icons), data tables gain horizontal scrolling.
  - Desktop (`≥ 1200px`): Full 12-column experience with simultaneous side-by-side legal document audit workspace.

## Elevation & Depth

Visual hierarchy relies on structural architectural planes, delicate perimeter strokes, and minimal ambient lighting rather than heavy drop shadows:

- **Flat Foundation (Level 0):** Application canvas set at `#F8FAFC`. Grid lines, splitters, and headers define spatial boundaries through solid 1px borders of `#E2E8F0`.
- **Raised Containers (Level 1):** Workspace cards, policy comparison modules, and table headers sit at `#FFFFFF` bound by a 1px solid stroke (`#E2E8F0`) and an ambient, whisper-light drop shadow (`box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04)`).
- **Floating Modals & Flyouts (Level 2):** Audit history slide-outs, clause detail inspectors, and contextual risk explanations use `#FFFFFF` elevated with `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.03)`.
- **Bi-Directional Highlighting:** When interacting with the AI clause analyzer, active target clauses apply an ambient highlight wash of `rgba(99, 102, 241, 0.12)` with a 2px left border in `#6366F1`, bypassing elevation shadows completely to preserve readability.

## Shapes

The design system employs a soft-cornered enterprise baseline (`0.25rem` / `4px` default radius) to retain an analytical, precise edge:

- **Data Tables, Input Fields, and Card Panels:** Styled with `rounded` (4px) to retain technical discipline.
- **Status Badges, Metric Counters, and AI Confidence Pills:** Styled with `rounded-sm` (2px) or full circular caps (`9999px`) strictly for micro-tag elements.
- **Structural Toolbars and Split Pane Dividers:** 0px radius, flush to panel edges for uninterrupted data continuity.

## Components

### Buttons
- **Primary:** Background `#0F172A`, text `#FFFFFF`, 4px radius, font weight 600, padding 8px 16px. Hover: `#1E293B`. Active: `#0A192F`. Focus: 2px ring offset of `#2563EB`.
- **Secondary / Action:** Background `#2563EB`, text `#FFFFFF`. Hover: `#1D4ED8`.
- **Outline / Neutral:** Background `#FFFFFF`, border 1px solid `#CBD5E1`, text `#0F172A`. Hover: `#F8FAFC`.
- **AI Assist Action:** Background `#EEF2FF`, border 1px solid `#C7D2FE`, text `#4F46E5`. Includes an indigo sparkle or neural icon glyph.

### AI Confidence Pills & Status Badges
- **Confidence Metric Pill:** Compact inline badge composed of a 6px status dot, a text tier (e.g., "High Match"), and monospaced percentage (`JetBrains Mono`, e.g., "98.4%"). 
  - High confidence (`≥ 90%`): `#ECFDF5` background, `#065F46` text, `#10B981` indicator.
  - Advisory / Medium (`70-89%`): `#FFFBEB` background, `#92400E` text, `#F59E0B` indicator.
  - Critical / Low (`< 70%`): `#FEF2F2` background, `#991B1B` text, `#EF4444` indicator.
- **AI Extraction Badge:** Background `#F5F3FF`, border 1px solid `#DDD6FE`, text `#5B21B6`, formatted in `label-md`.

### High-Density Data Tables
- **Header:** Height 36px, background `#F8FAFC`, bottom border 1px solid `#E2E8F0`. Typography: `label-md` in `#64748B`.
- **Rows:** Height 44px (default) or 36px (compact view), background `#FFFFFF`, bottom border 1px solid `#F1F5F9`. Hover state: `#F8FAFC`.
- **Cells:** Vertical alignment center, padding 0 12px. Numeric values (retention amounts, limits, sub-limits) strictly right-aligned with `data-mono-md`.

### Metric Summary Cards
- **Structure:** Surface white (`#FFFFFF`), border 1px solid `#E2E8F0`, padding `space-lg`.
- **Content Flow:** Header with muted micro-label (`label-md`) and tertiary icon, followed by primary monetary/ratio readout in `headline-xl` (tabular figure font features enabled), ending with a delta trend badge.

### Split-Pane Document Viewer
- **Left Panel (Clause Matrix):** Interactive checklist of policy endorsements, definitions, and warranty statements. Checkbox items display clause reference tags (e.g., `SEC-04(b)`).
- **Right Panel (Document Viewport):** Continuous PDF canvas mounted on `#64748B` neutral background. 
- **Clause Highlighting:** Inline overlays utilize low-opacity fills (`rgba(99, 102, 241, 0.15)` for AI extracted terms; `rgba(239, 68, 68, 0.15)` for exclusion clauses) synchronized with left-panel selection states.

### Underwriting Pipeline Stepper
- **Layout:** Horizontal sequential bar with distinct node phases: Ingestion → Parsing → Clause Extraction → Risk Scoring → Bound/Declined.
- **Node Geometry:** 24px circular hubs interconnected by 2px solid lines (`#E2E8F0` for future steps, `#2563EB` for active/complete). Active step displays an indigo pulsing halo (`rgba(99, 102, 241, 0.2)`).

### Form Controls & Inputs
- **Text Inputs:** Height 36px, border 1px solid `#CBD5E1`, background `#FFFFFF`, 4px radius, text `body-md` (`#0F172A`), placeholder `#94A3B8`.
- **Focus State:** Border `#2563EB`, outer ring 3px `rgba(37, 99, 235, 0.15)`.
- **Checkboxes & Radios:** 16px square/circle, border 1.5px solid `#94A3B8`, checked state `#0F172A` with white tick.