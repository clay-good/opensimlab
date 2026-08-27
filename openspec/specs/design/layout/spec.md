# design/layout Specification

## Purpose

Defines the one screen every learner sees: the four regions of the operating-room cockpit, how they resize from a 360 px phone to a 2560 px lecture display, and what gets sacrificed first when space runs out. One layout, specified precisely enough to build without a mockup.

## Requirements

### Requirement: Four-Region Cockpit

The `/anesthesia` cockpit SHALL be composed of exactly four regions in a fixed relationship: a **Status Bar** across the top, a **Monitor** region, a **Analysis** region, and an **Action Cockpit** across the bottom. A fifth region SHALL NOT be added; new surfaces open as a Drawer or Modal over these four.

#### Scenario: Region proportions at the reference desktop width

- **WHEN** the cockpit renders at 1440 by 900 CSS pixels and the learner has set no preference
- **THEN** the Status Bar is 56 px tall, the Action Cockpit takes 32% of viewport height bounded to between 160 px and 560 px, and the remaining vertical space is split between Analysis on the left at 42% of width and Monitor on the right at 58%, separated by a 1 px `--line` divider

#### Scenario: The layout is sized in the viewport, not in fixed pixels

- **WHEN** the same cockpit renders on a small laptop and on a large display
- **THEN** every region scales with the available space rather than holding a fixed pixel height, the waveform canvas takes the height its region has rather than a declared number, and no region is given a size that leaves another one unusable at either extreme

#### Scenario: The monitor is never the region that shrinks

- **WHEN** available height decreases at any breakpoint
- **THEN** the Monitor region retains its height priority, and the Analysis and Action Cockpit regions absorb the reduction, because the waveforms are the primary clinical surface

#### Scenario: The divider is draggable and remembered

- **WHEN** the learner drags the Analysis and Monitor divider
- **THEN** the split adjusts within bounds of 30% and 60%, snaps back if released outside them, and the chosen split persists on that device

#### Scenario: The action region is resizable too

- **WHEN** the learner drags the separator above the Action Cockpit
- **THEN** its height adjusts between 160 px and 560 px, the Monitor absorbs the change, and the chosen height persists on that device

#### Scenario: Both separators are operable without a pointer

- **WHEN** a learner reaches a separator by keyboard
- **THEN** it exposes itself as a separator with its current value and its bounds, the arrow keys move it by 16 px a press, and Home returns it to the default — because a learner who cannot drag still has to be able to give the drug tray more room

### Requirement: Status Bar Contents

The Status Bar SHALL contain, left to right: the patient identity summary (age, sex, weight, ASA class), the procedure name, the elapsed simulated clock, the transport controls, the speed selector, and the overflow menu. It SHALL also carry the persistent simulator marker required by the safety capability.

#### Scenario: Patient context is always readable

- **WHEN** the learner is anywhere in the cockpit
- **THEN** the patient summary and elapsed clock remain visible without scrolling at every breakpoint at or above 360 px

#### Scenario: The clock is the most prominent element after the vitals

- **WHEN** the Status Bar renders
- **THEN** the elapsed clock uses `--type-vital-m` with tabular numerals, and every other Status Bar element uses `--type-label` or `--type-body`

### Requirement: Monitor Region Composition

The Monitor region SHALL be a single WaveformCanvas occupying the left 72% of the region with stacked traces, and a VitalTile column occupying the right 28%, each tile vertically aligned with its trace. The AlarmRail SHALL sit above both, full width, and collapse to zero height when no alarm is active.

#### Scenario: Trace and tile are visually linked

- **WHEN** five traces render
- **THEN** each trace's vertical center aligns with its VitalTile's value baseline within 4 px, so the eye connects them without a legend

#### Scenario: Alarm rail expands without displacing traces

- **WHEN** the first alarm fires
- **THEN** the AlarmRail expands to 48 px over `--motion-standard`, the traces compress rather than scroll, and no waveform history is lost

### Requirement: Analysis Region Is Tabbed

The Analysis region SHALL host tabs for **Concentrations** (the PK/PD plot), **Log** (the event log), **Patient** (the full profile and comorbidities), and **Learn** (the in-context knowledge layer). The Concentrations tab SHALL be default.

#### Scenario: Tab state persists across pause and speed changes

- **WHEN** the learner is on the Log tab and changes speed
- **THEN** the Log tab stays selected, and its scroll position is preserved

#### Scenario: A tab can raise attention without stealing focus

- **WHEN** a critical entry is appended to the Log while another tab is active
- **THEN** the Log tab shows an unread indicator in `--alarm-critical`, and focus does not move

### Requirement: Action Cockpit Composition

The Action Cockpit SHALL be a tab strip with **Syringes**, **Infusions**, **Airway & Vent**, **Fluids & Blood**, and **Resuscitation**, each rendering a tray of inventory components. The active infusion summary SHALL be pinned and visible regardless of the selected tab.

#### Scenario: The most-used tray is one tap away

- **WHEN** the cockpit loads
- **THEN** the Syringes tray is selected, its presets are visible without scrolling at 1024 px width and above, and administering a preset dose requires exactly two interactions

#### Scenario: Running infusions cannot be hidden

- **WHEN** two infusions are running and the learner opens the Resuscitation tab
- **THEN** both infusions remain visible in the pinned summary with drug, rate, units, and elapsed time

### Requirement: Breakpoints And Reflow

The application SHALL define exactly five breakpoints — `xs: 360`, `sm: 768`, `md: 1024`, `lg: 1440`, `xl: 1920` CSS pixels — and SHALL reflow as follows: at `md` and above the four-region layout applies; at `sm` the Analysis region moves below the Monitor; at `xs` the Analysis region becomes a Drawer and the Action Cockpit becomes a bottom sheet.

#### Scenario: A phone can run a full scenario

- **WHEN** a complete induction scenario is run at 360 by 780 CSS pixels
- **THEN** all five traces remain visible with at least 56 px of vertical space each, the Action Cockpit bottom sheet opens over the Analysis area only, and no control is unreachable

#### Scenario: A lecture display uses the extra space for data, not whitespace

- **WHEN** the cockpit renders at 2560 by 1440
- **THEN** content is capped at 2200 px wide and centered, the extra Monitor height shows a longer waveform history rather than taller traces, and the Analysis region shows the plot and the log simultaneously instead of tabbed

#### Scenario: Landscape phone prioritizes the monitor

- **WHEN** a phone is rotated to landscape below 500 px height
- **THEN** the Status Bar compacts to 48 px so its 44 px controls remain fully visible, the Action Cockpit becomes a floating action button opening a sheet, and the Monitor occupies the remaining area

### Requirement: Sacrifice Order Is Explicit

When space is constrained, the application SHALL degrade in this fixed order: trend sparklines, then alarm limit text, then the Analysis region, then the patient summary detail, then trace count reduced to the three that the active scenario declares primary. Traces SHALL NOT be reduced below three.

#### Scenario: Degradation is predictable

- **WHEN** available height falls below the threshold for a full render
- **THEN** elements are removed in the stated order, each removal is reversible when space returns, and the learner can always re-open removed content from the overflow menu

### Requirement: No Layout Shift During Simulation

Once a scenario is running, region geometry SHALL be stable. Values changing, alarms firing, and log entries appending SHALL NOT move any other element.

#### Scenario: Cumulative layout shift stays at zero mid-session

- **WHEN** a 10-minute scenario runs with multiple alarms and 50 log entries
- **THEN** measured cumulative layout shift after the initial render is 0, verified by an automated run

#### Scenario: Long text does not reflow a tray

- **WHEN** a drug name in a translated locale is twice the English length
- **THEN** the syringe tile truncates with an accessible full name, and the tray geometry is unchanged
