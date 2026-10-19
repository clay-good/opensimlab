# Close the deliberate-practice loop

## Summary

Every one of the 256 labs already ends with a PEARLS debrief, a counterfactual, and a rehearsal
branch from a decision point. What is missing is the part of deliberate practice that happens
between runs: choosing a case without already knowing its answer, seeing exactly where one's own
run parted from the authored expert run, repeating a protocol step until it is done on time, and
being brought back to a weak area weeks later. This change adds those four mechanisms as one
`learning/deliberate-practice` capability, and finishes two requirements the curriculum
capability already states but the product does not yet implement: spaced return to weak areas,
and a portable progress file.

Nothing here adds a score, a rank, a server, or an account. Every mechanism reads the learner's
own local transcripts and the scenario's checked-in fixtures, and every one is opt-in.

## Why

- **The catalog spoils itself.** A learner who opens "Hyperkalemia with ECG change" has already
  done the recognition work the lesson exists to rehearse. The catalog hides the diagnosis in the
  title when recognition is an objective, but the learner still chose the module and the path,
  and a learner choosing from a list of fifteen toxicology titles knows roughly what is coming.
  Undifferentiated presentation is the thing clinical placements give students least of, and it
  is the thing a simulator can give cheaply.
- **The expert transcript is already in the repository and the learner cannot see it.** Each
  scenario ships an expert, a common-error, and a recovery transcript as regression fixtures.
  The worked example plays the expert path live. But after a learner's own run, the debrief
  compares the run only to the rubric, never to the authored course on the same axes.
- **Rehearsal branches stop one step short of rapid-cycle practice.** A learner can replay from
  a decision point, but nothing closes the loop: no immediate directive feedback, no repeat
  until the step is performed inside its window, no bounded cycle count. Rapid cycle deliberate
  practice is the recognised form of this for resuscitation training; the 2024 ILCOR systematic
  review found shorter time to defibrillation and to epinephrine with it, at very low certainty.
  The product should offer it, state the certainty honestly, and confine it to the scenarios
  whose objective is a timed protocol step.
- **Reasoning is invisible until the debrief, and by then it has been revised.** Self-explanation
  during case work improved diagnostic performance and far transfer in Chamberland and
  colleagues' randomised study (Medical Education 2015). The product records what the learner
  did and when, and nothing about why. A short note typed while the clock is paused, shown back
  in the debrief against what then happened, is the smallest version of that intervention.
- **Two curriculum requirements are unimplemented.** `learning/curriculum` requires a spaced
  return suggestion and a progress export/import file. Neither exists in source. Both belong in
  this loop, so this change carries them rather than leaving them as orphans.

## What changes

- Add a **blind draw**: from a module, a preparation path, or the whole catalog, the learner
  starts a scenario whose title, module, and card are withheld until the briefing has been read
  and the clock has started, with the content note still shown first.
- Add the **expert overlay** to the debrief: the learner's trace and action marks drawn on the
  same axes as the scenario's checked-in expert transcript, with timing differences reported per
  objective and no composite figure.
- Add **rapid-cycle rehearsal** for scenarios whose objectives include a timed protocol step:
  short bounded cycles from the declared decision point, each ending in one directive line and a
  restart, until the step lands inside its window or the cycle cap is reached.
- Add **reasoning notes**: an optional free-text note the learner can attach to any action or
  pause, stored locally, surfaced in the debrief next to the attributed outcome, never scored.
- Implement **spaced return** across all sixteen modules from local objective evidence, and the
  **portable progress file**, both as the curriculum capability already specifies them.

## Explicit non-goals

- No scoring of notes, overlays, or cycles. No composite figure, percentile, or pass/fail.
- No comparison with any learner other than oneself, and no comparison with the expert transcript
  that reads as a ranking: the overlay reports differences in time and order, not a distance.
- No automatic enrolment. Every mechanism is a control the learner operates.
- No change to patient behaviour under any mechanism. The engine is untouched.
- No runtime generative model for feedback. Rapid-cycle feedback lines are authored per decision
  point, like tutor rules, and carry the same maturity label.

## Success measures

- Every scenario whose objectives include a timed protocol step declares at least one rapid-cycle
  decision point with an authored feedback line, verified by a build test.
- The expert overlay renders for every one of the 256 scenarios from its checked-in expert
  fixture with no network, verified by an automated run.
- A blind draw from any path never shows the diagnosis, title, or module name before the clock
  starts, verified by a test over every scenario with a recognition objective.
- Spaced return suggests at most one scenario, from local evidence only, and a dismissed
  suggestion stays away for 7 days, verified by replay tests over synthetic histories.
- A progress file exported on one device and imported on another reproduces identical evidence
  status for every competency, verified by a round-trip test.
