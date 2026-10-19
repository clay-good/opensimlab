# learning/deliberate-practice Delta Specification

## ADDED Requirements

### Requirement: A Blind Draw Withholds What The Learner Would Otherwise Know

The catalog SHALL offer a blind draw from a chosen pool — one module, one preparation path, or
every playable scenario installed on the device — that starts a scenario while withholding its
title, module name, card summary, competency tags, and search terms until the scenario's own
reveal condition or the debrief, whichever comes first. The content note, estimated duration,
environment, fidelity class, and maturity label SHALL still be shown before the clock starts.

#### Scenario: The diagnosis is not on the screen before the clock runs

- **WHEN** a blind draw selects a scenario with a recognition objective
- **THEN** no learner-facing element before and during the session names the title, the module,
  the diagnosis, or any hidden-diagnosis term before the reveal condition, verified by a test
  over every scenario that declares a recognition objective

#### Scenario: A learner can still decline a case they should not take now

- **WHEN** the drawn scenario carries a content note or an estimated duration above 20 simulated
  minutes
- **THEN** the note and the duration are shown before start with a control to draw again, and
  drawing again records nothing about the declined scenario in local history

#### Scenario: The draw is reproducible and recorded

- **WHEN** a blind-draw session is exported
- **THEN** the transcript records that the session was a blind draw and the pool it was drawn
  from, and replaying the transcript reproduces the same selection from the same seed

#### Scenario: Unseen work is drawn first

- **WHEN** the pool contains scenarios the learner has completed on this device and the
  "unseen only" option is on, which is the default
- **THEN** the draw selects only from scenarios with no completed local attempt, and states when
  the pool is exhausted rather than silently repeating one

### Requirement: The Expert Worked Example Can Be Overlaid On The Learner's Own Run

The debrief SHALL offer an overlay of the scenario's checked-in expert transcript on the
learner's own run: both state traces on the same axes, each accepted action marked on both, and
for every objective with a timing window the simulated tick of the learner's qualifying action,
the tick of the expert's, and the difference in simulated seconds. The overlay SHALL report
order agreement only for actions the objective declares order-sensitive and SHALL produce no
sum, mean, score, or distance figure.

#### Scenario: Two traces, one patient

- **WHEN** the learner's seed differs from the expert fixture's seed
- **THEN** the expert transcript is replayed through the engine under the learner's seed, engine
  version, and content version, so both traces describe the same patient, and the replay is
  computed on-device with no network

#### Scenario: The overlay refuses to draw two different patients

- **WHEN** the expert transcript cannot be replayed under the learner's seed within the fixture's
  declared tolerance
- **THEN** the overlay states that the reference course is unavailable for this patient and
  withholds the expert trace rather than drawing a mismatched one

#### Scenario: Each line names one behaviour and one consequence

- **WHEN** the overlay lists a difference
- **THEN** the line names the action, the learner's tick, the expert's tick, and the modeled
  consequence of the difference drawn from engine attribution, and no line evaluates the learner
  as a person or aggregates differences into a figure

#### Scenario: Equivalent paths are offered, not ranked

- **WHEN** the scenario declares more than one acceptable action sequence
- **THEN** each declared reference transcript is selectable as the overlay, the default is the one
  whose first accepted action matches the learner's, and none is labelled better than another

### Requirement: Rapid-Cycle Rehearsal Is Declared, Bounded, And Honest About Its Evidence

A scenario MAY declare one or more decision points as rapid-cycle, each naming the timed
protocol objective it serves, the acceptance window in simulated seconds, an authored directive
line of at most 160 characters with its source locator, and a cycle cap between 3 and 6. The
rehearsal SHALL restore the exact decision-point state from the transcript for each cycle, run
until the window closes or the action is accepted, and end either when the action lands inside
the window or when the cap is reached. Recognition objectives SHALL NOT be rapid-cycle eligible.

#### Scenario: A cycle is the same patient and the same controls

- **WHEN** a rapid-cycle rehearsal restores a decision point
- **THEN** the canonical state hash equals the state hash at that tick in the original transcript,
  the available actions are identical, and the clock runs at the learner's chosen speed

#### Scenario: Feedback is one authored line, after the window

- **WHEN** a cycle's window closes without the expected action
- **THEN** exactly one directive line is shown, naming the simulated action and the window, with a
  link to its source, and the next cycle is offered rather than started

#### Scenario: Landing the step ends the rehearsal with its consequence

- **WHEN** the expected action is accepted inside the window
- **THEN** the rehearsal ends, the debrief names the behaviour and the modeled consequence, and the
  original run is left unmodified in local history

#### Scenario: The cap ends the rehearsal without judgment

- **WHEN** the cycle cap is reached without the action inside the window
- **THEN** the rehearsal ends with the same directive line, a link to the step's source, and no
  language evaluating the learner, and the scenario remains openable for ordinary play

#### Scenario: A recognition objective cannot be rapid-cycled

- **WHEN** a scenario declares a rapid-cycle decision point against an objective of kind
  recognition
- **THEN** the build fails naming the scenario, the objective, and the rule, because directive
  feedback on recognition is cue leakage

#### Scenario: Unassisted mode offers no rehearsal cycles

- **WHEN** the guidance level is Unassisted
- **THEN** rapid-cycle rehearsal is absent from the debrief and the rehearsal menu, and the
  ordinary rehearsal branch remains available

#### Scenario: The evidence is stated at the strength it has

- **WHEN** a rapid-cycle rehearsal is briefed
- **THEN** one sentence states that rapid cycle deliberate practice shortened time to
  defibrillation and to epinephrine in simulated resuscitation in the 2024 ILCOR systematic
  review at very low certainty of evidence, with the citation, and claims nothing about this
  product's own effect

### Requirement: Reasoning Notes Are Captured In The Moment And Never Scored

The cockpit SHALL provide an unprompted control to attach a free-text note of at most 280
characters to the action being confirmed or to the current pause. Notes SHALL be stored locally
in the transcript sidecar, SHALL NOT alter the transcript or its hash, SHALL be shown in the
debrief analysis phase beside the action and its attributed consequence, and SHALL NOT be scored,
keyword-matched, used by the tutor, or included in problem-report context.

#### Scenario: A note sits beside what then happened

- **WHEN** a learner attaches a note to a fluid bolus and later opens the debrief
- **THEN** the note appears beside that bolus with the engine's attribution for the state change
  that followed, in the analysis phase and after the reactions phase

#### Scenario: The control never prompts

- **WHEN** an alarm is active or any action confirmation is pending
- **THEN** the note control is present but unprompted and never gains focus on its own, and no
  prompt to write a note is shown at any time in any guidance level

#### Scenario: Notes stay off the wire

- **WHEN** the problem-report collector runs with notes present
- **THEN** no note is addressable by the collector, verified by the same structural test that
  excludes reflections

#### Scenario: Notes are exported only on the full transcript and after preview

- **WHEN** a learner exports the debrief summary alone
- **THEN** no note is included; **AND WHEN** they export the full transcript, every note is listed
  in the export preview before the file is written

### Requirement: Return Practice Spans Every Module From Local Evidence Only

The spaced return suggestion required by the curriculum capability SHALL draw on local objective
evidence across all sixteen modules, rank competencies weakest-then-oldest, and surface at most
one suggestion naming the scenario, what it practises, its estimated duration, and the reason.
Intervals SHALL begin at 7 days after one observation, double with each further separate-day
observation, and cap at 56 days, labelled as an educational convention.

#### Scenario: The weakest evidence wins

- **WHEN** a learner has in-progress evidence in two modules and evidenced status in a third
- **THEN** the suggestion targets a scenario exercising the weakest competency, and selecting it
  opens that scenario's briefing

#### Scenario: A dismissal is respected

- **WHEN** the learner dismisses the suggestion
- **THEN** no suggestion for that competency appears for 7 days on that device, and no more than
  one suggestion is shown at any time

#### Scenario: Nothing leaves the device to compute it

- **WHEN** suggestions are computed
- **THEN** network recording shows zero requests, and clearing tutor history removes the
  suggestion and its inputs together

### Requirement: Practice History Is A Portable File The Learner Controls

The application SHALL export a progress file containing local objective evidence, scenario and
path history, dismissals, selected goals, reasoning notes, and the content and tutor-rule versions
each was recorded under, carrying the not-for-clinical-use statement and the statement that it
records simulated practice and not clinical time. It SHALL contain no identifier, no device
information, and no timestamp finer than the calendar day. Import SHALL offer replace or merge,
recompute competency status under the current map, and report every status that changed.

#### Scenario: A round trip is lossless

- **WHEN** a progress file is exported on one device and imported on another running the same
  content version
- **THEN** every competency reports identical status and evidence, verified by a round-trip test

#### Scenario: A newer map is applied honestly

- **WHEN** the importing device runs a newer competency map
- **THEN** status is recomputed under the new map and the learner is shown which statuses changed
  and why, as the curriculum capability requires

#### Scenario: The file says what it is not

- **WHEN** the exported file is inspected
- **THEN** it carries both statements, names no case number or procedure log, and an automated
  test fails on any identifier, device field, or sub-day timestamp
