# Design: facilitation from data

## 1. The guide is a view, not a document

A facilitator guide is a render of scenario fields that already exist, in a fixed order that
follows the INACSL Healthcare Simulation Standards of Best Practice (2021) for simulation design,
prebriefing, and the debriefing process:

| Section | Source field(s) |
| --- | --- |
| At a glance | title, module, environment, duration, difficulty, fidelity class, maturity, content note |
| Learning objectives | `objectives` (learner-facing statements) |
| Framework mapping | curriculum mappings |
| Patient | profile, baseline vitals, relevant history, allergies |
| Prebrief | fiction contract, environment and controls orientation, what is and is not modeled (from limitations), confidentiality note |
| Timeline | authored timeline events with ticks or predicates |
| Expected actions | accepted actions per objective with windows, order sensitivity, region variants |
| Common error and recovery | summarised from the common-error and recovery fixtures |
| Debrief prompts | PEARLS phases: reactions prompt; description prompt; analysis prompts generated per objective from attribution; summary prompt |
| Pause points and bookmarks | declared set |
| Limitations | scenario limitations plus module limitations that apply |
| Sources | source register entries for this scenario, with locators |
| Provenance | content version, engine version, maturity label, review record, report path |

No section is free text written for the guide. If a scenario lacks a field a section needs, the
guide shows the section as absent and the catalog gate reports it, so the guide cannot silently
read as complete.

The guide renders at `/<module>/scenario/<id>/facilitator` as prerendered static HTML with print
styles, carries `noindex` (it is not for strangers), and is reachable from the briefing's
educator disclosure and from the educator pages.

## 2. Pause points

A pause point is scenario data: `{ at: tick | predicate, question, region }`. Predicates use the
existing one-comparison grammar so a pause point cannot execute anything. When classroom mode
is on, the first time the point is reached the clock pauses, the question is shown in a region
that does not cover the monitor, and the named interface region is highlighted exactly as a
worked-example beat highlights one. Resume is one action. When classroom mode is off, pause
points are inert and invisible. A pause point never fires during an active high-priority alarm
on a learner's own run because classroom mode is an instructor setting and is not combined with
tutor guidance; the two are mutually exclusive settings.

Pause points are edge-triggered and consumed, like repeatable events, and are recorded in the
transcript so a replay reproduces them.

## 3. Bookmarks and scrubbing

A bookmark is `{ id, label, tick, transcript: 'expert' | 'common-error' | 'recovery' }`.
Jumping to a bookmark replays the named fixture transcript through the engine to that tick in
the worker, then hands the session to the instructor at that state. This is the rehearsal branch
mechanism with a fixture instead of the learner's own transcript, so it inherits determinism and
costs no new engine path. Replay to a bookmark under 2 seconds on the reference device is the
budget; the worker already replays a full transcript faster than that for instructor review.

Scrubbing is a slider over a completed transcript that moves the review cursor across every
panel, which the event log already does by entry; the slider adds continuous tick selection.

## 4. The run sheet

The run sheet is the scenario's state model written for a person running it on any modality:

```text
STATE 1  "Baseline"        HR 88  BP 132/78  SpO2 97% RA  RR 18  T 37.1
  trigger → STATE 2: 5 min elapsed, or learner gives IV fluid bolus
  expected learner actions: focused assessment; oxygen if SpO2 < 94%
  cues the facilitator provides: patient reports "short of breath"
STATE 2  ...
```

For a closed-loop scenario the "states" are the authored timeline events plus the vitals the
engine produces at each event under the expert transcript, sampled at the event tick. For a
state-transition scenario they are the declared states themselves. Every value is marked as a
model output under the expert path, not a prediction for any patient. The sheet carries the
scenario's licence, the not-for-clinical-use statement, the maturity label, the content version,
and the sources. It is exported as plain text and as JSON with the same fields; no vendor format
is produced, because none is open and the sheet is for a human to adapt.

## 5. Presentation mode

Presentation mode is already specified under adoption ("Classroom And Lecture Use"). Classroom
mode here is the instructor-facing setting that enables pause points and bookmarks; it composes
presentation mode rather than duplicating it, and the tasks implement both.

## 6. Alternatives considered

- **Hand-authored guides.** Rejected: 256 documents that drift from the scenarios they describe.
- **Live classroom polling.** Rejected: collecting answers, even in-room, needs a channel between
  devices, and the product has none by design.
- **Exporting to a mannequin vendor's format.** Rejected: proprietary, undocumented, and it would
  imply the content is a validated mannequin scenario.
