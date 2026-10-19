# Design: a floor, a test, and computed counts

## 1. The ratified count as history

The catalog records `ratified: { count: 256, date, commit }` in the registry. The playable count
is computed by the existing gate and may exceed it. It may fall below it only when a scenario is
withdrawn, and a withdrawal already requires a corrections-log entry; the gate reads the log and
refuses a sub-ratified count without one. "Exactly 256" in the multidomain catalog delta is
superseded by this rule at the moment that change is archived; until then this capability states
the rule and the two are reconciled in the archive step, which the tasks name.

## 2. The module breadth test

A module is proposed by a document in `docs/module-proposals/<id>.md` with:

| Field | Requirement |
| --- | --- |
| Learner roles and setting | named, with the environment shell it composes or the new shell it specifies |
| Scenario proposals | at least eight, each with a one-paragraph training-value statement passing the scenario rule: three meaningful actions, two distinct choices or timings, observable consequences, engine-grounded debrief |
| Shared capabilities | which existing versioned capabilities it composes and which it needs built, in the order the multidomain tasks already define |
| Formulary | every agent with a source locator or a declared teaching model |
| Review domains | named, so the governance coverage rule can apply |
| Negative-transfer analysis | what a learner could carry into real practice wrongly from a screen in this setting, and the mitigation |
| Regional variation | where guidance differs between supported regions |
| Status | `proposed`, `breadth-test-passed`, `planned`, or `declined` with reason |

Eight is chosen because the smallest existing module is nine (nursing) and a module below that
reads as a folder, not a specialty. A module reaches `planned` — and only then appears as planned
on the landing page — when the breadth test is passed and its first evidence briefs exist. It
reaches available when its scenarios pass every scenario gate, as now.

## 3. Candidates, stated as proposals

| Candidate | Why it looks strong | What it would need |
| --- | --- | --- |
| Prehospital and emergency medical services | time-critical, monitored, scene-to-handoff decisions; rare pediatric cases; the literature calls simulation promising for paramedic readiness | a prehospital shell (limited monitoring, limited formulary, transport clock), handoff capability, paramedic and EMT learner roles, EMS review domain |
| Office-based procedural sedation | sedation emergencies occur where no anaesthetist is present; the anesthesia engine already models the physiology | a clinic shell, a bounded sedation formulary by region, dental and procedural learner roles, strong negative-transfer analysis against dosing inference |
| Acute care of older adults | delirium, falls, polypharmacy, and atypical presentations are common and poorly simulated; several existing capabilities apply | a ward shell exists; needs cognition-state and medication-reconciliation capabilities, geriatrics review domain |
| Psychiatric emergencies with medical physiology | agitation, lithium and serotonin toxicity, catatonia, and neuroleptic malignant syndrome have engine-observable physiology; toxicology already covers part | a bounded behavioural-state capability declared as teaching model, psychiatry and emergency review domains, explicit exclusion of restraint technique and communication scoring |

Each is a proposal document, not a card. The landing page's planned list is empty until a
candidate passes the test, and the About page lists candidates under "proposed, not planned."

## 4. Computed counts

Every count a reader can see — the landing one-liner, the module cards, the About page, the
review-status headline, the `SoftwareApplication` structured data, the README table — is either
rendered from the registry or asserted against it by a test. The README is a repository file and
cannot render; its table is checked by a test that parses it and compares to the registry, so a
stale README fails CI rather than publishing a wrong number.

## 5. Alternatives considered

- **Raise the target to a new round number.** Rejected: any target invites filling it.
- **Allow growth by scenario only, never by module.** Rejected: the strongest candidates are
  settings, and a setting needs a shell and a formulary a scenario cannot carry alone.
- **Keep "exactly 256" and open a new change per addition.** Rejected: the rule would be wrong
  between the first addition and its change's archive.
