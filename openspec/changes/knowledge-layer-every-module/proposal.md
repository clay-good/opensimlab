# Give every module the knowledge layer anesthesia has

## Summary

The in-context teaching surface — the Why panel, the concept explainers, the drug cards, and
the sandbox — was specified for the anesthesia module and exists only there. Ten explainers and
three drug cards cover one of sixteen modules. The other fifteen modules ship 217 labs with a
debrief but with no way to ask, at the moment something surprising happens, why the patient is
doing that, and no short reviewed explanation of the idea the lab exercises.

This change extends the `learning/knowledge-layer` capability to every module and every fidelity
class, and sets a minimum knowledge set per module that the build enforces. It also implements
the sandbox the capability already requires, and extends it from pharmacology to the shared
physiological capabilities, so a learner can hold one variable and move another in respiratory
or hemodynamic physiology as well as in drug kinetics.

## Why

- **The explanation is the product.** A learner who watches saturation fall during a tension
  pneumothorax lab and does not understand why pressure fell with it has had an experience, not
  a lesson. The Why panel exists so the explanation is one interaction away and specific to this
  patient. It is absent from the fifteen modules where most of the catalog lives.
- **State-transition scenarios need a different Why.** Only `closed_loop_physiology` scenarios
  have continuous attribution. A `state_transition` scenario moves between sourced states on
  declared evidence; its honest Why is "the patient moved from A to B because the sourced
  transition was triggered by C", with the source named. The current Why panel cannot say that,
  so the catalog's largest fidelity class has no Why at all.
- **Explainers are where the review model pays off.** An explainer is under 250 words, cites its
  source, and carries its own maturity label. It is the cheapest unit of clinical content to get
  reviewed, and it is linked from the scenario that demonstrates it. Fifteen modules have none.
- **The sandbox is required and unbuilt.** The capability requires a sandbox where any drug can
  be given to any patient. It does not exist. Building it for pharmacology alone would leave the
  respiratory, hemodynamic, and metabolic capabilities — which most modules rely on — with no
  exploratory surface.

## What changes

- Extend the Why panel to `state_transition` and `branching_encounter` scenarios: it names the
  current sourced state, the transition that brought the patient here, the evidence that
  triggered it, and the source, and it says when a transition is an authored teaching convention.
- Require every module to ship a knowledge set: at least six concept explainers each under 250
  words with one diagram, one source, and a one-tap "show me" into a scenario or sandbox state,
  plus intervention cards for every shared-formulary agent the module's scenarios can give.
- Build the sandbox for pharmacology as specified, and extend it to the shared respiratory,
  hemodynamic, fluid, and electrolyte capabilities: hold one variable, vary one, overlay the
  curves, envelope enforced, no scenario and no scoring.
- Enforce the set in the build: a module with fewer than six explainers, an unlinked explainer,
  or a formulary agent without a card fails the catalog gate, and the review-status page lists
  knowledge items with the same maturity labels as scenarios.

## Explicit non-goals

- No generated explanations at runtime. Every explainer and every Why template is authored,
  sourced, and labelled.
- No explainer that is a reference article. 250 words, one idea, one demonstration.
- No sandbox surface that accepts real-patient covariates, computes a dose for a target, or runs
  outside the forward-only kernel. The sandbox is the engine with the scenario removed.
- No change to the anesthesia knowledge set beyond bringing it under the same gate.

## Success measures

- Every one of sixteen modules ships at least six explainers, each linked to a playable scenario
  or a sandbox state, verified by the catalog gate.
- Every `state_transition` and `branching_encounter` scenario answers "why" at every state with
  its source named, verified by a test over the full catalog.
- Every agent in every module's shared formulary has an intervention card, verified at build.
- The sandbox reproduces the published reference points the pharmacology tests assert, and the
  Benumof apnea times, from its own controls, verified by replaying the sandbox state through
  the same engine tests.
