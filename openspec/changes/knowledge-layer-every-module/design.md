# Design: one knowledge layer, three fidelity classes

## 1. What "why" means in each fidelity class

| Fidelity class | What the engine knows | What the Why panel says |
| --- | --- | --- |
| `closed_loop_physiology` | ranked contributions per state variable, each a named term with a share | the existing ranked-contributor explanation with this session's numbers |
| `state_transition` | the current sourced state, the transition taken, the predicate or action that triggered it, the source locator | "the patient moved from *A* to *B* because *C* was observed/accepted at *tick*; this transition comes from *source*" |
| `branching_encounter` | the branch taken, the decision or omission that selected it, the authored consequence | "this branch followed from *decision* at *tick*; the consequence is authored from *source*" |

The second and third rows are new. They are honest precisely because they do not pretend to
continuous attribution: a state-transition lab says which sourced transition fired, not what
fraction of a pressure fall was vasodilation. Where a transition is an Open Sim Lab teaching
convention rather than a sourced one, the line says so, exactly as the closed-loop Why panel
labels a teaching model.

The Why panel reads only canonical state, the accepted/refused action log, and the scenario's
declared transition table. It cannot name a hidden diagnosis before the reveal condition; where
the honest explanation would name one, the panel says the cause is not yet observable and names
what has been observed.

## 2. The minimum knowledge set

Each module declares a knowledge set in its package:

```text
explainers: ≥ 6, each { id, title, body ≤ 250 words, diagram, source locator,
                        demonstrates: scenarioId | sandboxState, maturity }
cards:      one per agent in the module's shared formulary
                      { class, mechanism, what it is for here, onset/duration,
                        what to watch, main adverse effects, contraindications,
                        source locator, maturity }
whyTemplates: one per declared transition in state_transition scenarios
```

Six is the floor, not the target; anesthesia ships ten. The floor exists so no module can ship
labs with no explanation at all. Each explainer's "show me" must resolve to a playable scenario
in the same module or to a sandbox state the sandbox can load, and the catalog gate fails on a
dangling link.

Intervention cards replace "drug cards" as the name, because several modules give things that
are not drugs: a fluid bolus, a blood component, oxygen by device, a nebulised bronchodilator,
transcutaneous pacing. The card structure is the one the pharmacology capability specifies,
with "dosing" replaced by "what it is for in this module" so that a card never reads as a dose
recommendation. Where an agent has a published PK/PD model the card links to the model detail;
where it is a teaching model the card says so.

## 3. The sandbox

The sandbox is the engine with no scenario, no crisis, no objectives, and no tutor. It exposes
two kinds of exploration:

- **Pharmacology** (as specified): any drug with a model, any patient within the envelope, dose
  and covariates held or varied, curves overlaid. Models outside their envelope are drawn dimmed
  and dashed exactly as in a scenario.
- **Physiology**: the shared respiratory, hemodynamic, fluid, and electrolyte capabilities with
  their inputs exposed — minute ventilation, inspired oxygen, apnea, circulating volume, vascular
  tone, hemoglobin, potassium — and the resulting state plotted over simulated time. Each input
  states whether it drives a published model or a teaching model.

The sandbox is forward-only. It has no target field, no "find the dose" control, and no quantile
targeting, and the architecture test that keeps inverse control out of the kernel covers it. It
accepts no covariate outside the authored patient-profile range, and the patient-setup surface
is the same scenario-authored one, with no free-text field.

Every sandbox state is addressable by a URL carrying only the model, patient preset, and
inputs — no transcript — so an explainer's "show me" and a facilitator's teaching point can both
land on it. The sandbox suggests the scenario where the explored idea matters clinically, as the
capability requires, drawn from the explainer links in reverse.

## 4. Governance

Explainers, cards, and Why templates are reviewable content kinds already covered by the preview
evidence contract (`release-evergreen-preview`). This change adds nothing to that contract; it
adds items to it. The review-status page lists knowledge items by module with the same maturity
labels and the same "no count without the list" rule.

## 5. Alternatives considered

- **Generating explainers from the evidence briefs.** Rejected: the briefs are authoring records,
  not learner-facing text, and generated prose would need the same review anyway.
- **One global explainer set rather than per module.** Rejected: an explainer earns its place by
  a demonstration in a scenario, and the demonstration lives in a module.
- **A smaller floor of three.** Rejected: three explainers cannot cover a module with fifteen labs
  without most labs having nothing to link to.
