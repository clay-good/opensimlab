# Design: the loop between runs

## 1. Where each mechanism sits in the existing learning loop

```text
choose a goal ──► [blind draw] ──► briefing ──► run ──► [reasoning notes]
                                                 │
                                                 ▼
                     debrief ◄── [expert overlay] ◄── transcript + expert fixture
                        │
                        ├─► rehearse a decision point ──► [rapid-cycle rehearsal]
                        │
                        └─► next scenario ◄── [spaced return] ◄── local evidence
```

Every bracketed mechanism is a read of data that already exists: the scenario registry, the
three checked-in reference transcripts, the learner's local transcripts, and the objective
evidence the curriculum capability already computes. None adds an engine input.

## 2. Blind draw

The draw is a catalog operation, not a scenario property. The learner chooses a pool (one
module, one preparation path, or everything playable in the installed packs) and the draw
selects uniformly from scenarios in that pool that are available offline on this device, using
the session seed so the draw is reproducible from the transcript. The withheld fields are the
title, the module name, the card summary, the competency tags, and the hidden-diagnosis-safe
search terms; the fields still shown before start are the content note (sensitive outcomes), the
estimated duration, the environment, the fidelity class, and the maturity label, because a
learner must be able to decline a distressing or long case without seeing what it is.

The withheld fields are revealed at the scenario's own reveal condition, or at debrief, whichever
comes first. The event log records that the session began as a blind draw so the debrief and any
instructor review can read the early actions as undifferentiated work.

Scenarios already in local history can be excluded from the pool by a toggle, default on, so
the draw is a draw of unseen work.

## 3. Expert overlay

The overlay is drawn from the expert fixture that every scenario must already ship
(`learning/multidomain-catalog`, "Three reference courses remain reproducible"). It is replayed
through the engine under the recorded engine and content versions, exactly as the instructor
review surface re-derives a submitted session, so the expert trace is computed rather than
stored.

What is drawn: the learner's state trace and the expert's on the same axes, with each accepted
action marked on both. What is reported: for each objective with a timing window, the tick at
which the learner's qualifying action was accepted and the tick at which the expert's was, the
difference in simulated seconds, and whether the learner's order of actions matched the expert's
for actions the objective declares order-sensitive. What is not reported: any sum, mean, score,
or "closeness" figure. The design rule is that each line of the overlay names one behaviour and
one consequence, which is the rule the private tutor already follows for motivation.

Where the scenario declares more than one acceptable path ("Equivalent safe paths remain
equivalent"), the overlay offers each declared path's transcript as a selectable reference and
defaults to the one whose first action matches the learner's.

Where the learner's seed differs from the fixture's seed (an assignment link or a blind draw), the
expert transcript is replayed under the learner's seed so the two traces share a patient. If the
expert transcript cannot be replayed under that seed within the fixture's own tolerance, the
overlay says so and withholds the trace rather than drawing two different patients.

## 4. Rapid-cycle rehearsal

Eligibility is declared, not inferred. A scenario opts in by marking one or more decision points
as `rapid-cycle` and attaching, for each, the objective it serves, the window in which the
expected action must be accepted, an authored directive line of at most 160 characters, and a
cycle cap between 3 and 6. Only objectives that are already timed protocol steps qualify: a
defibrillation, an epinephrine dose, a dantrolene dose, a help call. A recognition objective
cannot be rapid-cycled, because telling a learner what to notice is the cue leakage the hazard
analysis forbids.

A cycle is: restore the exact state at the decision point from the transcript (the existing
rehearsal branch), run until the window closes or the action is accepted, show the directive
line if the window closed, and offer the next cycle. The clock speed, the patient, and the
available actions are the same as in ordinary play. A cycle that lands the action inside the
window ends the rehearsal with the behaviour named and the consequence shown; reaching the cap
ends it with the same directive line and a link to the scenario's source for that step.

Rapid-cycle rehearsal is offered from the debrief and from the rehearsal branch menu, never
started automatically, and is unavailable in Unassisted mode, because a directive line is a
Direct-level intervention and Unassisted means none.

The briefing for the rehearsal carries one sentence of evidence: that rapid cycle deliberate
practice shortened time to defibrillation and to epinephrine in simulated resuscitation in the
2024 ILCOR systematic review, at very low certainty of evidence. The product does not claim more
than the review does.

## 5. Reasoning notes

A note is attached to an action at the moment of confirmation, or to a pause, through a control
that is present but never prompts. It is free text up to 280 characters, stored in the local
transcript sidecar (not in the transcript itself, so the transcript's hash and portability are
unchanged), and shown in the debrief in a column beside the action, with the engine's attributed
consequence beside it. It is never scored, never parsed for keywords, never used by the tutor,
and excluded from problem-report context by the same structural rule that excludes reflections.
An export of the session includes notes only when the learner chooses the full transcript and
is shown them in the preview.

The debrief's reactions phase invites the learner's account first. Notes do not replace that;
they are offered in the analysis phase as "what you wrote at the time", which is the moment the
evidence on self-explanation is about.

## 6. Spaced return and the progress file

Both are specified in `learning/curriculum` and are implemented here without changing those
requirements. Spaced return reads the objective evidence the private tutor already stores, ranks
competencies by weakest-then-oldest evidence across all sixteen modules, and surfaces one
suggestion with its reason, dismissible for 7 days. Intervals start at 7 days after a single
observation and double with each further separate-day observation, capped at 56 days, which is
an educational convention and is labelled as one.

The progress file is a JSON document containing the local objective evidence, scenario and path
history, dismissals, selected goals, reasoning notes, and the content and tutor-rule versions
each was recorded under. It carries the not-for-clinical-use statement and the "simulated
practice, not clinical time" statement. It contains no identifier, no device information, and no
wall-clock timestamp finer than the day. Import replaces or merges by explicit choice, and
recomputes competency status under the current map, reporting what changed.

## 7. Alternatives considered

- **Random seed variation as the undifferentiated mechanism.** Seeds vary the patient inside one
  scenario's envelope; they cannot hide which scenario it is. Rejected as insufficient.
- **A distance metric for the expert overlay.** Rejected: any single number invites ranking and
  violates "Scoring Is Formative, Not Ranked".
- **Generated feedback lines for rapid-cycle rehearsal.** Rejected: runtime generation is a
  product non-goal, and an authored line can be reviewed and labelled.
- **Prompting for a reasoning note at every action.** Rejected: an unprompted control is the only
  version compatible with "Prompts never block a crisis".
