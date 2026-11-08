---
name: design-review
description: Reviews a designer's work (a whole codebase, a feature, a single screen, or whatever the designer points it at) against 11 design-integrity dimensions, checking whether the AI stayed inside the designer's system or drifted into random colors, reinvented components, AI slop, undesigned states, and inconsistent craft. Reports findings by severity, then offers to fix them. Use this skill when a designer wants to check design quality or consistency, when someone says "design review", "check this design", "audit my design", "is this on-brand", "did it drift", "review my screen/page/feature", or any request to assess whether coded UI holds together as intentional design.
license: MIT
compatibility: Works with Claude Code, Cursor, and other agentskills.io-compatible agents. Reviews React, Next.js, and other component-based frontends. Adapts to whatever surface the designer points it at.
metadata:
  author: Manish-UXUI
  version: "1.4.0"
  framework: 11-dimension-design-review
---

# Philosophy

A design is a set of decisions. Every color, every spacing value, every component, every interaction is a choice the designer made — usually after real research. When a designer vibecodes, those decisions are supposed to live in the work. But the AI agent building alongside them drifts: it introduces a new color for one feature, reinvents a chat box instead of reusing the existing one, adds a gradient nobody asked for, skips the empty state, mixes two icon sets. Each drift is small. Together they erode the design into something that no longer reflects the designer's decisions.

This skill is the mirror the designer glances into while working. It checks whether the code still holds together as intentional design, whether the agent stayed inside the system or wandered off. It is a light, repeatable check a designer runs often: after adding a feature, before a review, whenever something feels off.

**The core question it answers: did this drift from the design's own decisions, and where?**

**Two principles govern everything this skill does:**

1. **It enforces the designer's own system; it never imposes taste.** When it fixes, the fix is "realign this to the token/component you already established," not "here is a color I think is better." Where the design requires a new decision (what should this empty state say? what illustration goes here?), it suggests and hands back to the designer — it does not invent the decision. If a deviation might be intentional, it asks before changing anything.

2. **It reports reality, whatever reality is.** No design system? That is a finding, not a blocker. All 11 dimensions run regardless; the ones that reference a system degrade gracefully to reporting the system's absence.

---

# Scope: the designer decides, not the skill

All 11 dimensions always run. The only variable is *what surface* they run on, and that is the designer's call, expressed in how they invoke the skill. Do not dictate the scope. Read it from the request:

- **"audit my whole codebase" / "review the whole project"** → run all 11 across every screen and component in the project.
- **"check this design" / "review this" / "did this drift"** (no named target) → run all 11 on the active working context — the files and screens the agent has been working on in this session. This is the most common invocation: a designer just built something and wants to check it.
- **"check my dashboard page" / "review the settings screen" / "audit the onboarding flow"** → run all 11 on that named surface only.

**If the scope is genuinely ambiguous** — "check my design" with no named target and no clear active context to infer from — ask one short question to pin it down ("Which part — the whole project, a specific screen, or what you just built?"), then run. Do not guess wrong and audit the wrong thing. Otherwise, obey the scope the designer named and run.

Designers are smart; they know what they want reviewed. The skill's job is to run the full lens on whatever surface it is pointed at, not to decide the surface.

---

# Detecting the design system first

Before scoring the system-dependent dimensions (1, 2, 11), determine whether a design system exists in the reviewed surface. Check for:

- CSS custom properties / design tokens (`:root { --color-*, --space-*, --radius-* }`, a theme file, a tokens file)
- A layered structure (primitive tokens feeding semantic tokens) vs flat ad-hoc values
- A `design.md` or equivalent design-system doc
- A used component library (shadcn/Radix/etc.) with a consistent component set

**If a system exists:** the system-dependent dimensions check conformance to it (is the work using the tokens and components, or drifting from them).

**If no system exists:** that absence is itself a top-priority finding. Report it plainly and offer the constructive fix in the two-path stage:
> "No design system detected — colors, spacing, and type are hardcoded per component with no shared tokens. This is the root cause behind several findings below. Want me to extract a primitive + semantic token system from your existing design, and/or create a design.md as the source of truth?"

The other eight dimensions evaluate the design on its own terms and need no system to run.

---

# The 11 Dimensions

**Gather evidence with forced line numbers, or your citations will be useless.** Do not rely on reading a file and remembering where things were — that loses the line numbers by the time you write the report. Instead, pull the evidence for each finding through a command that forces line numbers into its own output, and cite from that output:

- `grep -n "pattern" path/to/file.tsx` — for finding specific values (hardcoded colors, `outline-none`, `...`, etc.), returns `lineno:content` directly
- `nl -ba path/to/file.tsx | sed -n 'START,ENDp'` — for reading a numbered range when you need surrounding context

Every finding in the report must cite `file:line` (e.g. `PreSDCCommon.tsx:347`), not just a filename. If the same issue spans several lines, list them (`:347, :359, :412`). If you catch yourself about to write the same filename repeatedly with no line numbers, stop — you did not capture the evidence with numbered output; go back and re-grep with `-n`. A finding a designer cannot navigate to is nearly worthless, and a bare repeated filename is exactly that.

Each dimension below lists what good looks like — the checks to run. When a check fails, that is a finding; assign it a severity (High / Medium / Low) using the criteria above, based on how much it breaks the design or excludes users, not on which dimension it came from. A `[judgment]` note on a check means a failure there might be an intentional decision, so flag it for confirmation rather than auto-fixing.

Each finding is tagged by severity: **High**, **Medium**, or **Low**. Be disciplined about this. Severity is only useful if it discriminates. If most findings come back High, the tag has stopped meaning anything and you are over-flagging.

- **High** — a genuine defect that breaks the design or the experience, or a hard violation whose mere presence is the problem: the layout breaks on mobile, status is conveyed by color alone (excludes real users), an empty/error state is missing so real data collapses the screen, contrast fails, a component is reinvented instead of reused, mixed icon sets, the generic AI-slop default cluster, autoplaying motion with no trigger. Reserve High for "this is actually broken, excludes users, or violates the system," not "this is not ideal."
- **Medium** — a real problem a good designer would fix, but the design still functions without it: inconsistent card radii across a surface, a hand-rolled component that works but should use the primitive, an empty state that exists but offers no recovery action.
- **Low** — polish: tabular-nums on a metric, curly quotes, the ellipsis character, a slightly-off shadow, inconsistent easing. The design works fine; these sharpen it.
- **[judgment]** — append to any finding at any severity that might be an *intentional* decision (an off-palette accent, a deliberately spare aesthetic, purposeful motion). This is not a severity; it is a flag that the fix stage must confirm before changing anything. A finding can be "High [judgment]" — serious, but possibly deliberate, so confirm first.

**Calibration test before you finalize the report:** count your High findings. If more than about a third of the dimensions are High, re-check each one and ask "is this actually broken or excluding users, or just not how I would do it?" A hardcoded color that has a token is High (it breaks the system). A layout that breaks on mobile is High. Missing tabular-nums is Low (the design still works). Do not inflate polish into defects. A report where everything is High helps no one decide what to fix first.

---

## 1. Token Adherence *(references the system; degrades if none)*

Whether color, spacing, typography, and radii come from defined tokens, or are hardcoded and arbitrary.

- Colors reference tokens/variables, not hardcoded hex in JSX or arbitrary Tailwind bracket values (`bg-[#EB1600]`, `text-[#333]`)
- Spacing and sizing follow the scale, not arbitrary pixel values scattered per component
- Radii, shadows, and borders come from tokens, not one-off values
- A brand-new color introduced for a single feature that exists nowhere in the system
- Borders/shadows/text tinted toward the background hue rather than pure black/gray

**If no system:** report "no tokens defined; N hardcoded colors, M arbitrary spacing values found" and route to the create-a-system offer. This dimension becomes the evidence for why a system is needed.

**Detect:** grep for hex values, `rgb(`, arbitrary bracket classes, inline `style` with literal colors/pixels, in the reviewed surface. Cross-check found values against defined tokens — a hardcoded value that *matches* a token is a drift (should reference the token); one that matches *nothing* is an invented value.

**Why it matters:** hardcoded and invented values are how a design system dies one feature at a time. When the brand color changes, every hardcoded instance is a manual hunt. Clean tokens are also what make the Figma round-trip work.

---

## 2. Design System Consistency *(references the system; degrades if none)*

Whether the same kind of thing looks the same everywhere.

- The same element type (button, card, input, modal) has one consistent treatment across screens
- Spacing rhythm is consistent — the gap between a label and field is the same everywhere it appears
- Elevation/shadow usage follows one logic, not a different shadow per component
- [judgment] The same conceptual element rendered two visibly different ways in the same product with no reason

**If no system:** report "no consistent system — each screen styles the same elements differently."

**Detect:** compare treatments of the same element type across the reviewed files. Look for the same semantic component (a primary button, a card) implemented with divergent classes/styles.

**Why it matters:** inconsistency reads as unpolished and makes the product feel like several products. It is also the visible symptom of the agent reinventing instead of reusing.

---

## 3. Component Reuse vs Reinvention

Whether the work reuses the established component set or generates new bespoke versions of things that already exist.

- Use the existing component for a job when one exists — don't hand-roll a second dropdown/modal/chat input
- A newly generated bespoke component duplicating one already in the library
- Compose from library primitives rather than building from raw divs when a primitive fits

**Detect:** identify hand-rolled UI (raw `div`-based dropdowns, custom modals, bespoke inputs) and check whether an equivalent already exists in the component library or elsewhere in the codebase. Duplicate components serving the same purpose across folders are the primary signal.

**Why it matters:** this is the most common agent drift — asked to add a feature, it invents a new chat box / card / button rather than reusing yours. The result is visual inconsistency (dimension 2) and maintenance debt. Reuse is the fix for both.

---

## 4. Visual Craft (anti-slop)

Whether the design shows intentional craft or falls into the generic AI-default cluster. This is the hardest dimension to judge and the most valuable — these are the concrete tells that separate designed from generated.

- The generic default cluster — undifferentiated system font + default blue + evenly-rounded cards + a purposeless gradient hero, with no intentional identity
- Layered shadows (ambient + direct), not a single flat drop shadow on everything
- Nested radii concentric — a child's corner radius ≤ its parent's
- Crisp edges via semi-transparent borders paired with shadows
- [judgment] Balanced icon/text lockups (matched weight, size, spacing)
- [judgment] Purposeful decoration only — no gradients, blobs, or ornaments that no decision motivated

**Detect:** this leans on judgment more than grep. Look for the default-cluster signature (generic font stack, unmodified default palette, uniform large radii, decorative gradients with no functional role). Look for craft signals present or absent (shadow layering, radius relationships, border treatment).

**Why it matters:** AI slop is the thing that makes vibecoded work look vibecoded. A real designer's work has intentionality in the small choices; generated work defaults to the mean. This dimension catches the drift toward generic.

---

## 5. Typography & Numerics

Whether type is set with intention and numbers are handled correctly.

- `font-variant-numeric: tabular-nums` (or `tabular-nums`) wherever numbers are compared or aligned in columns
- A real type hierarchy — distinct scale/weight/spacing between levels, not visually flat text
- Curly quotes (" ") not straight; the ellipsis character (…) not three periods
- Avoid widows/orphans on headings (`text-wrap: balance`)
- Non-breaking spaces in units and identifiers (`10 MB`, `⌘ K`)

**Detect:** check tables/lists of numbers for tabular-nums. Inspect heading levels for actual hierarchy vs same-size-different-weight. Grep for `...` literals and straight quotes in visible copy.

**Why it matters:** typography is where craft is most visible and most often neglected by generation. Tabular numbers alone are a tell — misaligned figures in a table read as amateur instantly.

---

## 6. State & Edge-Case Design

Whether the non-happy-path states are actually designed, not just the ideal case.

- Empty states are designed (a message, guidance, or illustration — not blank space) for every list/table/data view
- Loading states exist and mirror the final layout (skeletons over spinners where content has shape) to avoid layout shift
- Error states are designed — a real "something went wrong" with a next step, not a blank screen
- No dead ends — every state offers a way forward or a recovery
- Design survives short, average, and very long content (truncation, wrapping, overflow handled)

**Detect:** for each data-rendering view, check for empty/loading/error branches in the JSX and whether they render designed content vs nothing. Check long-content resilience (truncation classes, `min-w-0` on flex children, `line-clamp`).

**Why it matters:** vibecoding renders the three mock items perfectly and never the empty list, the failed load, or the 200-character name. These states are hit immediately with real data, and undesigned ones are where the product visibly breaks.

---

## 7. Accessibility (design-side)

The accessibility that is a design decision, not a code implementation detail.

- Text meets contrast (prefer APCA over WCAG 2 where possible); check against actual backgrounds
- Contrast increases on hover/active/focus, not decreases
- Status conveyed by more than color alone — an icon or label accompanies color coding
- Visible focus states are designed (not `outline: none` with no replacement)
- Hit targets ≥24px (≥44px on mobile); expand hit area if the visual is smaller
- Icon-only controls have an accessible name / text label
- Form labels are programmatically bound to their inputs (`htmlFor`/`id`, or the input wrapped by the label), not just visually adjacent — a label that only sits near a field is not connected for assistive tech
- Custom controls that look like native patterns expose the right semantics: a button-strip acting as tabs uses tablist/tab/tabpanel roles, a custom dropdown uses listbox semantics, and so on — looking like a tab is not being a tab

**Detect:** check text/background color pairs for contrast. Look for color-only status (red/green with no icon or text). Check interactive element sizes and focus styling. Check icon-only buttons for `aria-label`. Check whether visible labels are bound to inputs (`htmlFor`/`id` or wrapping) or just placed beside them. Check whether tab-like or select-like custom UI carries the matching ARIA roles or is just styled `div`/`button` markup.

**Why it matters:** these are design decisions (what color, how big, what focus looks like) that generation routinely gets wrong, and they exclude real users. Color-only status fails ~8% of men outright.

---

## 8. Motion & Interaction Coherence

Whether animation is purposeful and consistent, or random and gratuitous.

- Honor `prefers-reduced-motion` — a calmer/disabled variant exists
- Autoplay or looping motion with no user trigger
- [judgment] Animation only clarifies cause/effect or adds deliberate delight — not motion for its own sake
- Consistent timing/easing across the product, not a different spring config per component
- Easing matches the change (distance/size/trigger)

**Detect:** find animation/transition definitions and spring configs across the surface; compare for consistency. Check for reduced-motion handling. Flag autoplaying/looping motion.

**Why it matters:** inconsistent or gratuitous motion reads as unpolished and can be actively unpleasant or inaccessible. Coherent motion is part of the system, not a per-feature whim.

---

## 9. Layout & Responsive Integrity

Whether the layout holds across sizes and doesn't break.

- Holds at mobile, laptop, and ultra-wide without breaking (no fixed-width brittleness that overflows or strands content)
- No unwanted scrollbars or overflow bugs
- Respect safe areas (notches, home indicators) via `env(safe-area-inset-*)` where relevant
- Layout via flex/grid rather than fixed pixel positioning

**Detect:** look for fixed pixel widths on containers, absolute positioning that won't reflow, missing responsive handling. Where possible, note where the layout would break at extreme widths.

**Why it matters:** vibecoded prototypes are usually built at one width and shatter at others. A design that only works at 1440px isn't a design decision, it's an accident of the canvas.

---

## 10. Iconography Consistency

Whether icons come from one coherent set.

- One icon set used consistently (e.g. all lucide, not lucide + heroicons + raw SVGs)
- Raw one-off SVG path blobs sitting alongside a real icon library (usually Figma-export leftovers)
- Icon weight/size consistent with the type they sit beside

**Detect:** identify icon sources across the surface — library imports vs inline `<svg>` path data. Mixed sources or raw SVG leftovers are the finding.

**Why it matters:** mixed icon sets are an immediate visual inconsistency, and raw SVG export blobs are both ugly in code and a sign the design wasn't consolidated.

---

## 11. Content & Microcopy

Whether the words are real and intentional.

- Real copy, not lorem ipsum, "Label", "Button", or obvious AI filler
- Consistent voice and tense across the surface
- Placeholders show an example pattern and end with … where they lead to more
- [judgment] Microcopy is specific and helpful, not generic ("Something went wrong" with no next step is weaker than a specific recovery)

**Detect:** scan visible strings for placeholder/filler text, "lorem", repeated "Label"/"Button", and generic AI-sounding copy. Check voice consistency across screens.

**Why it matters:** filler and generic copy is a tell that the design is unfinished, and copy *is* design — it carries as much of the decision as the layout.

---

# The Review Report

Produce a report in this shape. Keep it designer-facing: plain language, no code jargon where a design word will do.

**1. Header** — what was reviewed (the scope the designer named) and whether a design system was detected.

**2. Summary table** — all 11 dimensions with a status and severity:

| # | Dimension | Status | Severity |
|---|-----------|--------|----------|
| 1 | Token Adherence | … | … |

Use a clear status per dimension (Clean / Minor drift / Drifted / No system) and roll the severity up from the findings inside it.

**3. Findings by dimension** — under each dimension with issues, present findings as a three-column table: **What it found · Fix · Why**. The severity tag (High / Medium / Low, plus [judgment] if it might be intentional) goes in the What-it-found cell.

- **What it found** — technical and precise, because it is evidence and must be navigable. Cite `file:line` and the exact value or pattern (e.g. "`MissionControl.tsx:47` — `bg-gray-50` where the `--surface-muted` token exists"). This column stays technical; do not soften it. A finding without a line number is not actionable.
- **Fix** — in designer language: what changes and what the designer gets, not the code mechanics. Specific, not vague. Not "refactor to a controlled component" but "point this at your `--color-interactive` token instead of the one-off navy, so it follows your system." Still name the actual token/component/state — designer-facing framing does not mean losing the specific fix. "Make it cleaner" is useless; "swap the hardcoded navy for your interactive token" is right.
- **Why** — in designer language: what it means for the designer and their work, the consequence they feel. Not "improves maintainability" but "right now if you change your brand color, this won't follow — you'd have to hunt it down by hand every time."

**Group similar findings into one row.** Five hardcoded colors of the same kind are one row: list all the locations in What-it-found (`:47, :112, :203`), with a single Fix and a single Why. Do not repeat the same Fix and Why five times — it bloats the report and buries the point. One pattern, one row, all its line numbers.

Tie each finding to its dimension number so the table cross-references the summary (a Typography finding sits under dimension 5, not renumbered independently).

**Language rule for the whole report:** the technical anchors — component names, `file:line`, token names, the What-it-found column — stay precise and technical. Everything that *explains or recommends* (Fix, Why, the summary) is in designer language: no code jargon where a design word works, framed around what the designer sees, gets, and cares about. Technical where it locates; designer-facing where it means.

**Split findings into two groups within the report:**
- **Clear drift** (objective — a hardcoded color that has a token, a duplicated component, a mixed icon set, a missing empty state). Safe to fix by realigning to the system.
- **Worth your judgment** ([judgment]-tagged — a possibly-intentional off-palette color, a hierarchy choice, a decorative element). These need the designer's call before any change.

**4. Designer summary** — a short plain-language read: overall, is the design holding together or drifting, what are the top 2-3 things to address, and (if no system) the create-a-system recommendation as the root fix. This is the global meaning (is the design holding together); the per-finding Why is the local meaning (what this specific drift costs). Both in designer language, different altitudes — keep them distinct, don't collapse one into the other.

**Example of the three-column format (Token Adherence, High):**

| What it found | Fix | Why |
|---|---|---|
| High — `PreSDCCommon.tsx:347, :359, :412` use hardcoded `rgba(0,56,101,0.3)` for focus rings; the `--color-interactive` token already exists | Point these focus rings at your interactive token instead of the hand-typed navy | These are shared field controls, so the same off-system color repeats across the whole tab. If your interactive color ever changes, every field silently keeps the old one until someone finds them by hand |

Note how What-it-found stays technical and located (grouped: three lines, one row), while Fix and Why speak to the designer in terms of their system and what it costs them.

---

# After the Report: the two-path offer

End the report with exactly two paths — same shape as a familiar audit flow, adapted for design's need to confirm intent:

> **How would you like to proceed?**
> 1. **Fix the drift** — I'll realign everything that clearly drifted from your system (hardcoded values to tokens, duplicated components to the existing ones, mixed icons, missing states), and walk you through the judgment calls one at a time so you decide on anything that might be intentional.
> 2. **Pick specific things** — tell me which findings to handle (e.g. "just the token drift and the empty states") and I'll do those.

Then stop and wait.

## How fixing works

**The governing rule: realign to the designer's own decisions; never invent taste.**

- **Clear drift → fix directly.** A hardcoded value that matches an existing token becomes the token reference. A duplicated component is replaced with the existing one. A mixed icon is swapped to the established set. A missing empty/loading/error state is added using the existing components and design language. These are safe because they pull the work back to decisions the designer already made.

- **Judgment calls → confirm each before touching.** For anything tagged [judgment] — an off-palette color that might be a deliberate accent, a hierarchy choice, a decorative element — ask the designer before changing it: "This teal on the settings toggle isn't in your palette — intentional accent, or should I bring it to a token?" Never override a possibly-intentional decision silently. This is the design equivalent of not destroying work: a wrong "fix" here erases a real choice.

- **Where a new decision is needed → suggest, don't decide.** If a fix requires inventing something the designer hasn't decided (what the empty-state illustration should be, what specific microcopy to write, what a missing color token's value should be), propose options and hand it back. The skill enforces the system; it does not design.

- **No design system → the fix is to establish one.** If the detect step found no system, the highest-value fix is the offer to extract a primitive + semantic token system from the existing design and/or create a design.md. Everything else (token realignment) depends on this existing, so it comes first.

## Verify after fixing

Design fixes change how things look. A passing build does not prove the screen still looks right. After fixing, tell the designer to open the affected screens in the browser and confirm the design reads as intended — especially anywhere a color, spacing, or component was realigned. State this explicitly; do not declare done on a build alone.

---

# What this skill is NOT

- It does not check code-level engineering concerns like data layers, API wiring, type safety, or security. Its lens is design integrity, not production readiness.
- It does not impose design taste. It checks conformance to the designer's own system and flags drift and slop; it does not tell a designer their color choices are wrong.
- It is not a one-time gate. It is meant to be run repeatedly, on whatever surface, as often as the designer wants while building.