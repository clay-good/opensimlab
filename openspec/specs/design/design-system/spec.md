# design/design-system Specification

## Purpose

Defines the single visual language of Open-SimLab: one dark theme, one type family, one spacing system, one motion curve, and a fixed component inventory. Every value a builder needs is stated here as an exact token, so no screen is ever designed twice and no color is ever picked twice.

## Requirements

### Requirement: One Theme, No Theme Switcher

The application SHALL ship exactly one visual theme, named **Theater Dark**. There SHALL be no light mode, no theme picker, and no user-selectable color scheme. Accessibility adjustments are modifiers applied within Theater Dark, not alternative themes.

#### Scenario: No theme switching surface exists

- **WHEN** the settings surface and the codebase are inspected
- **THEN** there is no theme toggle, no `prefers-color-scheme` branch that changes the palette, and exactly one set of color token definitions

#### Scenario: Accessibility modifiers layer onto the one theme

- **WHEN** the learner enables the colorblind-safe trace palette or the contrast boost
- **THEN** only the affected tokens are overridden on the root element, the layout, type, spacing, and component structure are unchanged, and the theme is still Theater Dark

### Requirement: Color Is A Clinical Signal, Never Decoration

Interface chrome SHALL be rendered entirely from the neutral ramp. Saturated color SHALL be reserved for exactly three purposes: physiological traces and their numerics, alarm severity, and the single focus accent. No button, panel, tab, icon, illustration, or empty state SHALL introduce a decorative hue.

#### Scenario: A decorative hue fails review

- **WHEN** a component introduces a saturated color outside the trace, alarm, and focus token sets
- **THEN** the token-lint check fails the build, naming the file and the offending value

#### Scenario: A learner can find physiology by color alone

- **WHEN** a learner glances at the full interface
- **THEN** every colored element on screen is either a vital sign, an alarm, or the focused control, and nothing else competes for that attention

### Requirement: Neutral Ramp Tokens

The application SHALL define the neutral ramp as CSS custom properties on `:root` with exactly these values:

```css
--void:            #06080B;  /* monitor canvas ground, app backdrop */
--surface-0:       #0B0F14;  /* page background */
--surface-1:       #11161D;  /* panel background */
--surface-2:       #171E27;  /* raised: cards, popovers, tray */
--surface-3:       #1F2833;  /* overlay: modals, menus */
--surface-input:   #0E141B;  /* form field wells */
--line-subtle:     #1C242E;  /* hairlines inside a panel */
--line:            #27313D;  /* panel borders, dividers */
--line-strong:     #384453;  /* emphasized borders, slider tracks */
--text-primary:    #E9EEF5;  /* headings, numerics, primary labels */
--text-secondary:  #A3B1C2;  /* supporting copy, units, axis labels */
--text-tertiary:   #8593A4;  /* units, timestamps, alarm limits, placeholders */
--text-on-accent:  #06080B;  /* text sitting on the focus accent */
```

#### Scenario: Contrast minimums are met on every permitted surface

- **WHEN** contrast is measured for `--text-primary`, `--text-secondary`, and `--text-tertiary` against `--surface-0`, `--surface-1`, `--surface-2`, and `--surface-3`
- **THEN** every combination meets at least 4.5:1 — the tightest being `--text-tertiary` on `--surface-3` at 4.76:1 — and the measurements are asserted by an automated contrast test that fails the build on regression

#### Scenario: Disabled text is exempt but still announced

- **WHEN** a control is disabled
- **THEN** it renders at `--text-tertiary` with 40% opacity, is exempt from the contrast minimum per WCAG, and carries `aria-disabled` so the state never depends on contrast alone

#### Scenario: Surfaces step legibly without shadows

- **WHEN** a raised element sits on a panel
- **THEN** it is separated by a surface step and a 1 px `--line` border, and no `box-shadow` is used for elevation anywhere in the application

### Requirement: Physiological Trace Tokens

The application SHALL define exactly five trace hues, each with a line color, a dim variant for background and grid use, and a fill variant for area shading:

```css
--ecg:        #3DDC84;  --ecg-dim:    #1B5C39;  --ecg-fill:   rgba(61,220,132,0.14);
--arterial:   #FF5C5C;  --arterial-dim:#6B2020; --arterial-fill:rgba(255,92,92,0.14);
--capno:      #FFD426;  --capno-dim:  #6B5A10;  --capno-fill: rgba(255,212,38,0.14);
--spo2:       #22D3EE;  --spo2-dim:   #0E5766;  --spo2-fill:  rgba(34,211,238,0.14);
--neuro:      #B388FF;  --neuro-dim:  #4A3673;  --neuro-fill: rgba(179,136,255,0.14);
```

`--ecg` carries the electrocardiogram, `--arterial` carries invasive and non-invasive pressure, `--capno` carries capnography, `--spo2` carries pulse oximetry, and `--neuro` carries both depth of anesthesia and neuromuscular blockade. A sixth trace hue SHALL NOT be introduced; a new signal SHALL join an existing family or use line style to differentiate.

#### Scenario: Every trace hue is legible on the canvas ground

- **WHEN** each trace line color is measured against `--void`
- **THEN** every one meets at least 4.5:1, exceeding the 3:1 graphical minimum, and the measurement is asserted in the test suite

#### Scenario: Numerics inherit their trace hue

- **WHEN** the heart rate numeric is displayed
- **THEN** it is rendered in `--ecg`, matching its waveform, so the association between number and trace requires no legend

#### Scenario: The colorblind-safe palette preserves distinguishability

- **WHEN** the colorblind-safe modifier is active
- **THEN** the five hues are replaced with a set verified to remain mutually distinguishable under deuteranopia, protanopia, and tritanopia simulation, each still meeting 4.5:1 against `--void`, and the substitution is asserted by a confusion-line test

### Requirement: Alarm And Focus Tokens

The application SHALL define alarm and focus tokens as:

```css
--alarm-critical:      #FF3B3B;  /* fills and borders only */
--alarm-critical-text: #FF8080;  /* same severity, as text on a dark surface */
--alarm-critical-bg:   rgba(255,59,59,0.12);
--alarm-warning:       #FFB020;  /* fills, borders, and text */
--alarm-warning-bg:    rgba(255,176,32,0.12);
--alarm-advisory:      #A3B1C2;
--alarm-advisory-bg:   rgba(163,177,194,0.10);
--focus:               #7FB8FF;
```

A critical alarm banner SHALL be a solid `--alarm-critical` fill with `--text-on-accent` text, because a filled banner reads as more urgent than colored text; where critical severity must appear as text on a dark surface it SHALL use `--alarm-critical-text`. Alarm color SHALL appear only in the alarm rail, the alarm banner, and the alarmed numeric's own treatment. Sensor artifact SHALL NOT receive a hue; it is expressed as a 45-degree hatch overlay at 8 px pitch in `--text-tertiary` at 20% opacity.

#### Scenario: Artifact reads as "not physiology"

- **WHEN** a signal is under sensor artifact
- **THEN** its trace region carries the hatch overlay and a text label, its hue is unchanged, and no alarm color is applied, so a learner learns to read the texture as a monitoring problem

#### Scenario: Focus is always visible

- **WHEN** any interactive element receives keyboard focus
- **THEN** it shows a 2 px `--focus` outline offset 2 px from the element, exceeding 3:1 against every surface it can appear on (7.24:1 at the tightest, on `--surface-3`), and the outline is never removed without an equivalent replacement

#### Scenario: Alarm color never leaks into chrome

- **WHEN** the interface is inspected with no alarm active
- **THEN** no alarm token appears anywhere on screen

#### Scenario: Alarm treatment matches the clinical standard

- **WHEN** alarm priorities render
- **THEN** high priority uses `--alarm-critical` flashing at 1.4–2.8 Hz, medium priority uses `--alarm-warning` flashing at 0.4–0.8 Hz, and low priority uses a steady `--alarm-advisory` indication, following the IEC 60601-1-8 conventions so the visual language transfers to real equipment

#### Scenario: Alarm flashing respects reduced motion without losing priority

- **WHEN** the operating system requests reduced motion
- **THEN** flashing is replaced by a static treatment that still distinguishes the three priorities by fill, border weight, and an explicit priority word, and the priority remains identifiable in an automated check

### Requirement: Typography

The application SHALL use exactly two self-hosted variable font families, subset and preloaded: **Inter** for all interface text and numerics, and **JetBrains Mono** for the event log and any tabular code. All numerics SHALL set `font-variant-numeric: tabular-nums` so digits do not shift as values change. The type scale SHALL be exactly:

| Token | Size | Line height | Weight | Tracking | Use |
| --- | --- | --- | --- | --- | --- |
| `--type-vital-xl` | 56px | 1.0 | 600 | -0.02em | Primary vital numerics |
| `--type-vital-l` | 40px | 1.0 | 600 | -0.02em | Secondary vital numerics |
| `--type-vital-m` | 28px | 1.05 | 600 | -0.01em | Tertiary numerics, tray totals |
| `--type-title` | 20px | 1.3 | 600 | -0.01em | Panel and modal titles |
| `--type-subtitle` | 16px | 1.4 | 500 | 0 | Section headings |
| `--type-body` | 15px | 1.55 | 400 | 0 | Paragraph and control text |
| `--type-label` | 13px | 1.3 | 500 | 0.06em | Control labels, uppercase |
| `--type-micro` | 11px | 1.3 | 500 | 0.04em | Axis ticks, timestamps, units |

#### Scenario: Numerics do not jitter

- **WHEN** heart rate changes from 68 to 111
- **THEN** the numeric's horizontal extent and the position of adjacent elements are unchanged, because digits are tabular

#### Scenario: Fonts load offline and never block first paint

- **WHEN** the application loads with no network after first visit
- **THEN** both families render from the cache, are declared `font-display: swap`, and the Latin subsets together add no more than 120 KB compressed

#### Scenario: Non-Latin scripts fall back cleanly

- **WHEN** the interface renders in a script outside the bundled subsets
- **THEN** it falls back to the platform system font stack with no layout break and no invisible text

### Requirement: Spacing, Radius, And Density

The application SHALL use a 4 px base spacing unit with the scale `4, 8, 12, 16, 24, 32, 48, 64` exposed as `--space-1` through `--space-8`. Corner radii SHALL be exactly `--radius-chip: 3px`, `--radius-control: 6px`, `--radius-panel: 10px`, `--radius-pill: 999px`. No other radius or spacing value SHALL appear in source.

#### Scenario: Off-scale values fail lint

- **WHEN** a stylesheet uses a spacing or radius value outside the scale
- **THEN** the token-lint check fails the build, naming the file, the property, and the nearest valid token

#### Scenario: Comfortable and compact densities both fit the scale

- **WHEN** the learner switches to compact density on a small screen
- **THEN** control heights step from 40 px to 32 px and panel padding from `--space-4` to `--space-3`, using only scale values, and no text is truncated

### Requirement: Motion

The application SHALL define exactly three motion durations and one easing curve: `--motion-micro: 120ms`, `--motion-standard: 200ms`, `--motion-deliberate: 280ms`, all using `--ease: cubic-bezier(0.2, 0, 0, 1)`. No interface transition SHALL exceed 280 ms. Waveform rendering is not a transition and is exempt.

#### Scenario: Motion is subordinate to the data

- **WHEN** a panel opens or a value updates
- **THEN** the transition completes within its token duration, and no animation loops, pulses, or draws attention away from the monitor except an active critical alarm

#### Scenario: Reduced motion removes transitions without removing meaning

- **WHEN** the operating system requests reduced motion
- **THEN** all durations collapse to 0 ms, the waveform sweep becomes a stepped update at 4 Hz, and every state change remains conveyed by position, text, and color

### Requirement: Component Inventory

The application SHALL implement exactly this component set, each with defined default, hover, active, focus, disabled, and where applicable error and loading states: Button (primary, secondary, ghost, danger), IconButton, Toggle, SegmentedControl, Slider, SteppedDial, NumericField, Select, Tabs, Panel, PanelHeader, Card, Chip, Badge, Tooltip, Popover, Modal, Banner, AlarmRail, VitalTile, WaveformCanvas, PlotCanvas, LogList, LogEntry, Timeline, Drawer, EmptyState, LoadingState, and CitationLink. A screen SHALL NOT introduce a bespoke control outside this inventory.

#### Scenario: The inventory is enforced and documented

- **WHEN** a new screen is built
- **THEN** it composes only inventory components, and a component gallery route renders every component in every state for visual review

#### Scenario: Every control meets the touch minimum

- **WHEN** any interactive component renders at comfortable density
- **THEN** its hit target is at least 44 by 44 CSS pixels, and at compact density at least 40 by 40, with the shortfall compensated by spacing so adjacent targets never sit closer than 8 px

### Requirement: The Vital Tile Is The Signature Component

A VitalTile SHALL present one physiological parameter with, in fixed positions: a `--type-label` name, a `--type-vital-*` value in its trace hue, its unit in `--type-micro` `--text-secondary`, its alarm limits in `--type-micro` `--text-tertiary`, and an optional trend sparkline. Its layout SHALL be identical across every parameter so a learner's eye learns one shape.

#### Scenario: Alarm state changes treatment, not layout

- **WHEN** a parameter breaches a critical limit
- **THEN** the tile gains an `--alarm-critical` 1 px border and `--alarm-critical-bg` fill, the value stays in its trace hue, the alarm word appears in the label row, and no element moves

#### Scenario: An invalid value is stated, not faked

- **WHEN** a parameter cannot be measured, such as heart rate during ventricular fibrillation or saturation with a displaced probe
- **THEN** the tile shows `--` in `--text-tertiary` with a reason label, and never shows a stale or interpolated number

### Requirement: Tokens Are The Single Source Of Truth

All design values SHALL live in one generated token module consumed by both CSS custom properties and TypeScript, so canvas rendering and DOM rendering cannot drift.

#### Scenario: Canvas and DOM agree

- **WHEN** the electrocardiogram trace is drawn on canvas and the heart rate numeric is drawn in the DOM
- **THEN** both read the identical `--ecg` value from the shared token module, verified by a test comparing the resolved values

#### Scenario: A token change propagates everywhere at once

- **WHEN** a token value is edited in the token module
- **THEN** the change appears in CSS, in canvas rendering, and in the component gallery with no other edit
