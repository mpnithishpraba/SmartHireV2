---
name: SmartHire
description: An offline recruiter's index file. Each candidate is a record card, and each phase is a colour-coded tab on it.
colors:
  rail: "#15223f"
  rail-raised: "#1d2d52"
  rail-text: "#e8ecf4"
  rail-muted: "#a3afc8"
  ground: "#e8ebf0"
  ground-deep: "#dde1e8"
  card: "#ffffff"
  card-tint: "#f6f7f9"
  line: "#d4d9e2"
  line-strong: "#b9c0cd"
  red-rule: "#cf3a2f"
  ink: "#17203a"
  ink-soft: "#3a4560"
  muted: "#5b6579"
  resume: "#2f63c4"
  identity: "#6a7387"
  aptitude: "#c99a0c"
  coding: "#23845a"
  interview: "#c3325d"
  ok: "#1d7a4f"
  ok-bg: "#e6f3ec"
  warn: "#8a5a00"
  warn-bg: "#fbf1d9"
  bad: "#b42318"
  bad-bg: "#fbe9e7"
  primary: "#1c2b4f"
  primary-hover: "#263a69"
  focus: "#2f63c4"
typography:
  display:
    fontFamily: "Libre Franklin, Segoe UI, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.02em"
    fontFeature: "ss01"
  headline:
    fontFamily: "Libre Franklin, Segoe UI, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Libre Franklin, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 650
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Libre Franklin, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "ss01"
  label:
    fontFamily: "Libre Franklin, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  figure:
    fontFamily: "JetBrains Mono, Consolas, ui-monospace, monospace"
    fontSize: "15px"
    fontWeight: 400
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  figure-total:
    fontFamily: "JetBrains Mono, Consolas, ui-monospace, monospace"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
  code:
    fontFamily: "JetBrains Mono, Consolas, ui-monospace, monospace"
    fontSize: "13.5px"
    lineHeight: 1.6
rounded:
  band: "1px"
  tag: "3px"
  r: "4px"
  tab: "6px 6px 0 0"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.card}"
    rounded: "{rounded.r}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.card}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r}"
    padding: "8px 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.card-tint}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.r}"
    padding: "8px 16px"
  button-small:
    padding: "5px 11px"
    height: "32px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r}"
    padding: "8px 11px"
    height: "40px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.r}"
    padding: "24px"
  rail-step:
    backgroundColor: "transparent"
    textColor: "{colors.rail-muted}"
    rounded: "{rounded.r}"
    padding: "10px 12px"
  rail-step-active:
    backgroundColor: "{colors.rail-text}"
    textColor: "{colors.rail}"
  phase-tab:
    backgroundColor: "{colors.ground-deep}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.tab}"
    padding: "13px 14px 9px"
    width: "128px"
  phase-tab-selected:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    padding: "19px 14px 10px"
  tag-ok:
    backgroundColor: "{colors.ok-bg}"
    textColor: "{colors.ok}"
    rounded: "{rounded.tag}"
    padding: "2px 8px"
  tag-review:
    backgroundColor: "{colors.warn-bg}"
    textColor: "{colors.warn}"
    rounded: "{rounded.tag}"
    padding: "2px 8px"
  toast:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.rail-text}"
    rounded: "{rounded.r}"
    padding: "12px 12px 12px 14px"
---

# Design System: SmartHire

## Overview

**Creative North Star: "The Index File"**

SmartHire is a recruiter's card drawer. A deep fountain-pen-ink rail holds the workflow on the left. The work area is a cool drawer-grey ground, and on it lie white record cards, each with a single thin red header rule like a printed index card. Every candidate is one record. Each phase of that record is a coloured index tab on the card's top edge, and the colour of the tab stock tells you which phase you are looking at.

The system is dense but quiet. Hairline rules divide content, corners are nearly square (4px), and depth is one soft neutral drop under each card. Colour has a job or it does not appear. The ink rail and the primary ink button do the structural work, the red rule marks card headers, and the five phase stocks mark phases. State is never carried by hue alone: the form of a tab's band (solid, dashed, hatched, struck) says whether a phase is done, pending, needs review, or flagged. This is the product's honesty principle made visible. Pending and uncertain states get their own first-class form and are never dressed up as results.

Libre Franklin sets all interface text. JetBrains Mono appears only where a value is counted or timed: scores, points, timers, step numbers, list markers, and code. Both fonts are self-hosted, so the app stays fully offline. The look rejects the grey SaaS dashboard with one accent, gradients, glass and glow, which was the previous identity and is explicitly not binding.

**Key Characteristics:**
- Ink rail beside a drawer-grey ground. White record cards with a 1px red header rule.
- Index-stock phase colours: resume blue, identity slate, aptitude canary, coding green, interview cherry.
- State shown by line form, never by hue alone: solid done, dashed pending, hatched needs review, struck flagged.
- The phase tab strip is the signature: assessment stage tabs, dashboard progress bands, and analysis phase tabs.
- Monospace only for figures, timers and code. Tabular numerals everywhere a number is compared.
- Irreversible actions sit in their own row, set apart by a rule and space.
- One authored motion moment: the analysis card pulls up out of the drawer.

## Colors

A cool ink-and-paper neutral base carries the whole interface, and five saturated index-stock colours each belong to exactly one phase.

### Primary
- **Fountain-Pen Ink** (rail): the left rail, toast background, camera and video stage, and the code editor surface. This is the darkest field in the system and the only large dark area.
- **Deep Ink Button** (primary): the fill for the primary button, checked segmented control and checkbox accent. Hover deepens it to the **Raised Ink** shade (primary-hover).
- **Index-Card Red Rule** (red-rule): the 1px bottom border of every card head and record head, the short bar under the wordmark, and the underline of the selected dashboard row link. It marks headers only. It is never a fill, a button colour or an error colour.

### Secondary
Index stock: each phase owns one colour, applied through a per-phase variable, and uses it only for its tab band, progress fill, and phase-local accents.
- **Resume Blue** (resume): resume match tab, band and criteria progress. It also serves as the link and focus colour (focus), so keyboard focus reads as the system's own blue.
- **Identity Slate** (identity): face-check stage tab. Identity is a stage tab but not a scored phase, so it has no dashboard band.
- **Aptitude Canary** (aptitude): aptitude tab and band, and the border of a checked answer option. Use it as a line or fill only. It is too light for text.
- **Coding Green** (coding): coding tab, band and fill.
- **Interview Cherry** (interview): interview tab and band, voice-level bars, and the question numbers in recorded answers.

### Tertiary
Status pairs, always a dark text colour on its own pale field: **Ledger Green** (ok on ok-bg), **Ochre Ink** (warn on warn-bg), **Correction Red** (bad on bad-bg). They are used for notices, tags, face-check status and the low-time timer. Correction Red is also the cross-hatch in the flagged band.

### Neutral
- **Drawer Grey** (ground): the page ground behind all cards, the empty track, and the skeleton base.
- **Deep Drawer** (ground-deep): unselected tab stock and progress track.
- **Card Stock** (card): cards, inputs, and the selected tab, which merges into its card.
- **Card Tint** (card-tint): table header row, hover fills, preformatted blocks, the interviewer strip.
- **Hairline** (line) and **Strong Hairline** (line-strong): dividers and card borders, then input borders, dashed empty states and table header underlines.
- **Ink** (ink), **Soft Ink** (ink-soft), **Muted Ink** (muted): body text, labels and secondary text, then meta and help text.
- **Rail Text** (rail-text) and **Rail Muted** (rail-muted): text on the ink rail and toasts. Rail Text also fills the active rail step.

### Named Rules
**The Colour Has A Job Rule.** Each phase colour appears only on its own phase: its tab band, its progress fill, and phase-local accents. A phase colour is never used for decoration or on another phase's surface.

**The One Red Line Rule.** The red rule is a 1px header line on card stock. It never becomes a background, a button, or an error signal; errors use Correction Red.

## Typography

**Display Font:** Libre Franklin (with Segoe UI, system-ui, sans-serif), variable 100 to 900, self-hosted, stylistic set ss01 on
**Body Font:** Libre Franklin
**Label/Mono Font:** JetBrains Mono (with Consolas, ui-monospace, monospace), variable, self-hosted, tabular numerals

**Character:** A sturdy American grotesque set at working sizes, with weight 650 for headings rather than a separate display face. A typewriter-precise mono sits beside it wherever the user compares a number.

### Hierarchy
- **Display** (650, 32px, 1.15, -0.02em): page headings, one per page.
- **Headline** (650, 20px, -0.01em): the record head (candidate name), analysis head, interview question text (550, 20px, 1.4, max 60ch).
- **Title** (650, 17px): card-head titles. Stage titles are 18px/650.
- **Body** (400, 15px, 1.5; 14.5px under 640px): running text. Prose measures are capped at 68 to 80ch.
- **Label** (600, 13px, ink-soft): form labels, legends (14px/650), and tab names (14px/650). Small field labels are 12px/600 with +0.02em tracking, in sentence case.
- **Figure** (mono, tabular, -0.01em): every score, point value, timer (18px/600), step number and step count. Phase scores are 24px/600 and the overall total is 30px/600.
- **Code** (mono 13.5px/1.6): the code editor on the ink surface. Preformatted samples are 13px/1.5.

### Named Rules
**The Counted-Things-In-Mono Rule.** JetBrains Mono is reserved for values that are counted, timed or compiled. Words, including the word "Pending" in a score slot, return to Libre Franklin.

**The Sentence Case Rule.** All labels, tabs, headers and buttons are sentence case. Nothing in the system is set in uppercase tracking.

## Layout

The shell is a two-column grid: a 248px sticky ink rail and a fluid work column, padded clamp(16px, 3.5vw, 48px) and capped at 1320px. Each page opens with a heading row (heading and one-line description on the left, page controls bottom-aligned on the right), then the working card. Roles and candidates use a split layout: the main card plus a 340px sticky side card. The split stacks into one column at 1180px.

Spacing follows a 4px base scale (s1 to s7: 4, 8, 12, 16, 24, 32, 48). Card padding is 24px. Fieldsets are separated by a hairline and 24px of space. A commit row sits 32px below the content it closes.

At 900px the rail becomes a top bar and the steps become a horizontally scrolling row. Analysis phase tabs go from four columns to two at 900px and to one at 640px. At 640px cards pad 16px, form grids collapse to one column, and the dashboard hides secondary columns, moving the review tag under the overall score.

## Elevation & Depth

Depth is physical and shallow: cards are paper resting on a drawer floor. There is one neutral, soft, ink-tinted drop for every card and one deeper drop for toasts. There are no glows, no coloured shadows, and no hard offset shadows. Selected tabs rise by gaining height and merging into the card below them, not by casting a shadow.

### Shadow Vocabulary
- **Card rest** (`box-shadow: 0 1px 2px rgb(21 34 63 / .08), 0 12px 28px -12px rgb(21 34 63 / .22)`): every card, at rest, always.
- **Toast lift** (`box-shadow: 0 8px 24px -6px rgb(21 34 63 / .35)`): floating toasts only.
- **Focus halo** (`box-shadow: 0 0 0 3px rgb(47 99 196 / .18)`): text inputs on focus, together with a Resume Blue border.

### Named Rules
**The Paper On A Drawer Rule.** Only cards and toasts cast shadows. Everything else is separated by hairlines and tonal steps.

## Shapes

The geometry is nearly square. The general radius is 4px, for cards, inputs, buttons, notices and the camera stage. Tags and small controls use 3px. Bands and tracks use 1px, so they read as printed lines rather than pills. Index tabs alone carry a 6px top-only radius, and their bottom edge is open where they meet the card. Borders are 1px hairlines throughout. Empty states use a dashed Strong Hairline border, which is the same dashed form that means "pending" in a band. Circles appear only in the stage-complete check mark.

## Components

### Buttons
Plain, firm, and ink-coloured.
- **Shape:** gently squared (4px), 40px tall, 8px 16px padding, weight 600, 8px icon gap.
- **Primary:** Deep Ink fill, white text. Hover goes to Raised Ink, and press nudges the button down 1px.
- **Secondary:** Card Stock with a Strong Hairline border and Ink text. Hover tints the fill and darkens the border to Soft Ink.
- **Ghost:** transparent background, Soft Ink text, tinted on hover.
- **Small / icon-only:** 32px tall (5px 11px), and square 40px or 32px when icon-only.
- **Focus:** a 2px Resume Blue outline offset 2px, the same for every control.
- **Disabled:** 45% opacity with a not-allowed cursor.
- **Recording:** the border and text switch to Correction Red, and the mic icon blinks in steps.

### Commit Row
Irreversible actions (submit test, run code, submit answer, save ratings, continue to next stage) live in their own row. That row is set off by a hairline and 32px of space, and its primary button is pushed to the right edge. Any warning about consequences sits in the same row, to the left of the button.

### Tags and Notices
- **Tags:** 3px corners, 2px 8px, 12.5px/600, a status text colour on its pale field (ok or review).
- **Notices:** 4px corners, 10px 14px, 14px, an inline 16px stroke icon plus text on the status field.

### Cards / Containers
- **Corner Style:** 4px.
- **Background:** Card Stock on Drawer Grey.
- **Shadow Strategy:** Card rest (see Elevation & Depth).
- **Border:** 1px Hairline. The card head is bled to the card edges and closed by a 1px red rule.
- **Internal Padding:** 24px (16px under 640px).

### Inputs / Fields
- **Style:** Card Stock, 1px Strong Hairline border, 4px corners, 40px minimum height, 8px 11px padding. Placeholder text is a mid slate. The select uses an inline chevron.
- **Hover:** the border darkens one step.
- **Focus:** a Resume Blue border with the 3px blue halo. The caret is Resume Blue.
- **Segmented control:** a three-way control with a joined hairline border. The checked segment takes the Deep Ink fill.
- **Templates:** bordered choice tiles. The selected tile takes a Deep Ink border with an inner 1px ring and a pale ink tint.

### Navigation
The ink rail holds the wordmark (24px/700 with a 28px red bar under it), the full product title once as the tagline, four numbered steps, and a local-only note pinned to the bottom. Each step is a 26px mono number box, a label, and a mono count. Hover raises a step to Raised Ink. The active step inverts to a Rail Text fill with Ink text and a solid number box. Below 900px the rail collapses to a top bar with horizontally scrolling steps.

### Toasts
These are small ink slips in the bottom-right corner (max 400px), with Rail Text, a green or coral status icon, and a dismiss button. They slide up 10px on entry and fade down on exit.

### Phase Tab Strip (signature)
The index tab is the system's one recurring signature, used in three places:
- **Assessment stage tabs:** a row of tabs on the record card's top edge, one per stage (resume, identity, aptitude, coding, interview). Unselected tabs are Deep Drawer stock. The selected tab turns Card Stock, grows taller and merges into the card. Each tab shows its name, then its state in words or a mono figure, with a check icon in the phase colour when done.
- **Dashboard progress bands:** each candidate row shows four 22 by 6px bands (resume, aptitude, coding, interview), each band drawn in its phase colour, with a screen-reader sentence listing every state.
- **Analysis phase tabs:** four Card Stock tabs on the analysis card's top edge, showing the phase score in mono, a progress track, the contribution in points, and evidence.

In every placement the band is a phase colour drawn in a line form that names the state: **solid** done, **dashed** (6px on, 4px off) pending, **hatched** (135 degrees, 3px) needs review, **struck** (a 2px phase line over a Correction Red hatch) flagged.

### Analysis Pull-Up (authored motion)
Selecting a candidate pulls their record up out of the drawer. The card rises 18px and unclips from 60% to full height over 320ms on the system ease (cubic-bezier(.16, 1, .3, 1)). This is the only choreographed motion. Everything else is functional feedback: a 160 to 180ms fade on page and panel changes, the toast slide, colour transitions of about 150ms, the recording blink, voice-level bars and the skeleton shimmer. Under prefers-reduced-motion all animation and transition durations collapse to about zero.

### Named Rules
**The Line Form Rule.** State is carried by the form of the line, and the phase colour only says which phase. A new state needs a new line form, not a new hue.

**The Commit Row Rule.** A consequential action never shares a row with routine actions. It sits alone, below a hairline, at the right.

## Do's and Don'ts

### Do:
- **Do** put every phase-coloured mark on its own phase, so the tab, band and fill all agree.
- **Do** show state with the band's line form (solid, dashed 6/4, hatched 135 degrees, struck), and pair it with words or a figure on the tab.
- **Do** set every score, point value, timer and count in JetBrains Mono with tabular numerals, and put the words around them in Libre Franklin.
- **Do** head every card with a bled header closed by the 1px red rule.
- **Do** isolate irreversible actions in a commit row: a hairline above, 32px above that, and the primary button at the right.
- **Do** keep corners at 4px (3px for tags, 1px for bands, 6px top-only for index tabs).
- **Do** bundle every font and asset locally. Nothing loads from a CDN.
- **Do** collapse all motion under prefers-reduced-motion.

### Don't:
- **Don't** use gradients, glass, glow, or teal, which were the previous identity and the generic SaaS default this world replaces.
- **Don't** signal a phase's state by changing its hue. The hue belongs to the phase.
- **Don't** use the red rule as a fill, a button colour, or an error colour.
- **Don't** set Aptitude Canary as text. It is a line and fill colour only.
- **Don't** add shadows to anything but cards and toasts, and never use hard offset or coloured shadows.
- **Don't** set labels, tabs or headings in uppercase tracking, and don't add eyebrow or kicker labels above headings.
- **Don't** add a second choreographed motion. The analysis pull-up is the only one.
