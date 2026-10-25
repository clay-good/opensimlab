# Design: radiology as a non-interpretive candidate module

This design is the body of the future `docs/module-proposals/radiology.md`. It is stated here in full
so the change is self-contained and so the proposal can be lifted into the module-proposals directory,
mirrored in `src/platform/modules/proposals.ts`, and rendered on the About page in a later
implementation change, without its content being reinvented.

Status for this candidate: **proposed**. Nothing here is planned, promised, or dated.

## 1. The boundary that defines the module: decisions, never perception

Radiology on this engine teaches what a radiologist, resident, or technologist *does* around an image,
not the reading of the image itself. The distinction is load-bearing, not cosmetic:

- **In scope (fits the engine):** recognizing and managing an acute event in the suite, communicating a
  finding under a clock, choosing or withholding contrast, owning the follow-up of an incidental
  finding, and running a safe procedure — all time-evolving, all with an observable consequence.
- **Out of scope (does not fit, and is never attempted):** detecting, localizing, or characterizing a
  finding from pixels. Where a finding matters to a scenario, it is supplied as an authored fact in the
  record the learner is handed — "the report describes a 7 mm solid nodule" — never as an image to
  interpret. The AOBR and ABR interpretation subspecialties are deliberately absent.

This is the module's central negative-transfer control and the reason it is honest. The ABR itself
separates non-interpretive skills from interpretation; this module is the non-interpretive half, built
where the engine adds value and stopping where it would only pretend to.

## 2. Learner roles and setting

Diagnostic and interventional radiology residents, radiologic technologists, and the reading
radiologist. The clinical settings are the CT scanner suite, the MRI suite with its safety zones, the
interventional-radiology procedure room, and the reading room.

Needs a new **radiology-suite shell**: a scanner/procedure-room environment with a monitored patient, a
screening and communication surface, and a clock that runs from the inciting event to handoff. The
reading-room scenarios need a **result-communication surface** (reach a responder, read back, escalate
on non-response) rather than a physiologic monitor.

## 3. Scenario proposals

Twelve are stated; eight is the floor. Each names its actions, two distinct choices or timings, an
observable consequence, an engine-grounded debrief, and what it excludes. None is a calculator, a
lookup, or a checklist answer: every sourced criterion is supplied by the fictional patient and tested
for its limits inside the encounter.

### Acute contrast reaction — anaphylactoid hypotension in the CT suite

Actions: call for help and the code team, start high-flow oxygen, give intramuscular epinephrine at the
adult dose, open intravenous fluids, and position the patient.
Choices: the route and timing of epinephrine (the common error is intravenous or delayed), and whether
the picture is a severe reaction needing epinephrine now or a mild one that is over-treated.
Consequences: blood pressure and oxygen saturation follow the delivered action on the shared
cardiorespiratory model; delay and wrong route are visible in the trajectory.
Debrief: attributes the recovery or deterioration to the recognition-to-epinephrine interval, grounded
in the ACR Manual on Contrast Media acute-reaction algorithm and the ACR contrast-reaction card.
Excludes: airway procedures, the complete ACLS algorithm, and weight-based pediatric dosing (own
scenario). Screen success is not resuscitation skill.

### Pediatric contrast reaction — weight-based epinephrine and the code call first

Actions: call the code team as the first action, start oxygen, give weight-based intramuscular
epinephrine for one bounded authored weight, and open fluids.
Choices: whether to summon help before or after reaching for a drug, and the weight-based dose versus a
reflexive adult dose.
Consequences: the modeled child deteriorates on a delay the monitor shows; calling for help late costs
observable time.
Debrief: grounds the "help first" lesson in the RSNA 2007 finding (Gaca et al., *Radiology*,
2007;245(1):236–244) that calling the code team was the first intervention in only 5 of 38 simulated
pediatric runs, and the dose in weight-based resuscitation guidance.
Excludes: a general pediatric patient model, airway procedures, and refractory management. One authored
weight, not a weight calculator.

### Contrast extravasation at the power injector

Actions: stop the injection, assess the limb for swelling, pain, pulses, and sensation, elevate, apply
the chosen compress, and decide whether the findings cross the surgical-consultation threshold.
Choices: observe-and-document versus escalate to surgery, driven by the authored examination findings,
and the timing of stopping the injector.
Consequences: the modeled swelling and perfusion signs evolve with the volume already delivered and the
delay before the injection stopped.
Debrief: separates the large majority of extravasations that resolve with conservative care from the
compartment-syndrome threshold, grounded in ACR extravasation guidance.
Excludes: any surgical procedure, imaging of the extravasation, and a universal volume cutoff. The
threshold is the authored examination, not a rule the learner carries to every patient.

### MR safety — a projectile hazard at Zone IV

Actions: enforce the zone boundary, stop the ferromagnetic object or unscreened person at the Zone III
control point, move a resuscitation out of Zone IV rather than bringing equipment in, and escalate to
the MR safety officer; quench only as a declared last resort.
Choices: evacuate the patient from the magnet room versus bring the code to the magnet, and quench
versus do not quench.
Consequences: the projectile-risk state rises or falls with what is allowed to approach the bore; a
wrong choice is an observable near-miss, not a spectacle.
Debrief: grounds the four-zone model, two-person screening, and ferromagnetic detection as a supplement
to screening in the ACR Manual on MR Safety.
Excludes: magnet physics, a standalone implant-conditionality lookup (own scenario), and any depiction
of injury. The lesson is access control under time pressure.

### MR safety — the uncertain implant before the scan

Actions: halt at screening, obtain the device record the case supplies, read its MR-conditional
conditions (field strength, specific-absorption-rate limit, exclusion), and decide to proceed under the
stated conditions, defer, or use an alternative modality.
Choices: proceed under conditions versus reschedule, and MR versus a CT alternative when conditionality
cannot be confirmed.
Consequences: the safety state resolves to safe, deferred, or unsafe based on whether the authored
conditions were actually met before scanning.
Debrief: grounds MR-conditional reasoning in the ACR Manual on MR Safety and the device record; names
that "MR conditional" is a set of conditions, not a yes.
Excludes: a device-lookup calculator — the patient supplies the implant and its record, and the later
state tests whether the conditions were honored; no standalone conditionality surface exists.

### Critical-result communication — the unexpected large pneumothorax

Actions: classify the finding's communication tier, reach the responsible provider by a method matched
to urgency, obtain and record a read-back, and escalate through the authored chain when the first
contact does not answer.
Choices: the tier (critical versus merely actionable) and how fast to escalate when the ordering team is
unreachable.
Consequences: a running clock, and whether the ordering team acts in time; an undocumented or
unacknowledged call leaves the loop open and the clock running.
Debrief: grounds timeliness and closed-loop communication in the ACR Practice Parameter for
Communication of Diagnostic Imaging Findings and the Joint Commission critical-result requirement.
Excludes: image interpretation (the finding is given) and the clinical treatment of the pneumothorax.

### Actionable incidental finding — the nodule that must not be lost at discharge

Actions: read the authored nodule size and the patient's risk factors, choose the follow-up interval,
write the recommendation into the report, and route it through the actionable-finding pathway so it
survives discharge.
Choices: the follow-up interval across the size and risk bands, and the communication channel for a
non-emergent but actionable finding.
Consequences: whether the recommendation reaches the patient and ordering clinician, or is lost in a
report nobody reads before discharge.
Debrief: grounds the interval in the Fleischner Society 2017 guideline (MacMahon et al., *Radiology*,
2017; PMID 28240562) and the communication in ACR actionable reporting.
Excludes: immunocompromised patients and known primary cancers, which the Fleischner guidance itself
excludes; and any image interpretation. Size and risk are supplied by the case; there is no nodule
calculator.

### Iodinated contrast and the kidney — the delayed CT and the metformin question

Actions: read the authored kidney function, decide contrast versus non-contrast versus an alternative,
set a hydration plan, and make a metformin hold-or-continue decision.
Choices: give contrast at an eGFR above the risk threshold rather than default to withholding it, and
hold metformin only at the stated threshold, with acute kidney injury, or with arterial contrast.
Consequences: proceeding yields the diagnosis the patient needs; reflexive withholding yields an
observable diagnostic delay, the harm the guidance was written to prevent.
Debrief: grounds the reasoning in the 2020 ACR–National Kidney Foundation consensus (Davenport et al.,
*Radiology* and *Kidney Medicine*, 2020), including that modern intravenous contrast risk at reduced
function has been overstated.
Excludes: dialysis management and a general nephrology model. The eGFR is the case's; there is no
clearance calculator. Regional thresholds are shown as a variant, not averaged.

### Gadolinium in renal impairment or pregnancy

Actions: confirm the indication, assess the authored kidney function or pregnancy status, select a
lower-risk (group II) agent or withhold, and document the necessity decision.
Choices: a group II gadolinium agent versus no contrast versus an alternative modality.
Consequences: an appropriate scan proceeds, or an unnecessary exposure is avoided; the record reflects
the justification.
Debrief: grounds the very low nephrogenic-systemic-fibrosis risk of group II agents and the pregnancy
caution in the ACR Manual on Contrast Media.
Excludes: gadolinium pharmacology and retention debate beyond the bounded decision. A single authored
case, not a class lookup.

### Interventional radiology — the timeout that stops a wrong-site procedure

Actions: run the pre-procedure timeout, reconcile the consented site against the imaging side and the
skin marking, stop the line when they do not agree, and verify before restarting.
Choices: proceed versus stop-the-line when one identifier does not reconcile, and who must resolve the
discrepancy.
Consequences: reconciling catches the authored laterality error; skipping the timeout carries the error
forward to a wrong-site near-miss the debrief makes visible.
Debrief: grounds the steps in the Joint Commission Universal Protocol (verification, site marking, time
out).
Excludes: the procedure itself and any psychomotor skill. The lesson is verification discipline.

### Interventional radiology — peri-procedural anticoagulation and bleeding risk

Actions: stratify the procedure's bleeding-risk tier, read the patient's agents and the case's
coagulation labs, decide to hold, bridge, or continue each agent, and set the timing.
Choices: continue anticoagulation for a low-risk procedure versus hold it, and the laboratory
thresholds that gate proceeding.
Consequences: holding unnecessarily delays care; proceeding against a real threshold raises an
observable bleeding-risk state.
Debrief: grounds the tiers and thresholds in the 2019 SIR consensus on peri-procedural management of
anticoagulation and antiplatelet medications (Parts I and II, *Journal of Vascular and Interventional
Radiology*, 2019).
Excludes: reversal-agent dosing and a general hematology model. Labs are the case's; there is no
risk-score compute surface. Regional variation (SIR versus CIRSE) is shown.

### Interventional radiology — a moderate-sedation respiratory event

Actions: recognize hypoventilation and desaturation during moderate sedation, stop further sedative,
support the airway and give oxygen, decide whether to reverse, and escalate.
Choices: support-and-wait versus pharmacologic reversal, and the timing of calling for help.
Consequences: oxygen saturation and respiratory rate follow the action on the shared respiratory model;
late recognition is visible as a deeper, longer desaturation.
Debrief: grounds the monitoring and rescue in moderate-sedation standards, composing the anesthesia
sedation and respiratory capabilities.
Excludes: deep sedation and general anesthesia, airway procedures, and reversal pharmacokinetics. The
case stops at restored ventilation.

## 4. Shared capabilities

Composes, unchanged: the shared cardiorespiratory and anaphylaxis physiology (contrast and sedation
scenarios), the respiratory-support and sedation capabilities from anesthesia (the sedation event), the
simulation clock and event log, and the debrief-attribution framework.

Needs built before any scenario: the **radiology-suite shell** (section 2) and the **result-communication
surface** with a responder model that can answer, not answer, or acknowledge a read-back. Both are
declared capabilities, versioned like every other, before a scenario depends on them.

## 5. Formulary

| Agent | Source or teaching model |
| --- | --- |
| Iodinated contrast (generic, power-injected) | Bounded teaching model; reaction behavior per ACR Manual on Contrast Media |
| Gadolinium-based contrast, group II | ACR Manual on Contrast Media (agent grouping, NSF risk) |
| Epinephrine, intramuscular (adult and weight-based) | ACR contrast-reaction card and resuscitation guidance; doses sourced, never a calculator |
| Intravenous crystalloid | Shared fluid teaching model |
| Inhaled bronchodilator (albuterol/salbutamol) | Region-aware; bounded teaching model |
| Oxygen, high-flow | Shared delivery model |
| Flumazenil / naloxone (reversal, intent only) | Moderate-sedation standards; dose-free intent, not a dosing model |
| Antihistamine / corticosteroid (premedication context) | ACR Manual on Contrast Media premedication guidance |

## 6. Review domains

Diagnostic radiology, interventional radiology, MR safety (MR medical director / MR safety officer),
medical physics and radiation safety, nephrology (contrast and kidney), emergency medicine and
anaphylaxis, pharmacy, patient safety and quality, and pediatrics (pediatric contrast reaction). These
register with governance coverage the moment radiology reaches planned.

## 7. Negative-transfer analysis

- **A learner feels they practiced reading.** Mitigation: no perception scenario exists; findings are
  authored facts in a handed record, and the module says so in its prebrief and debrief.
- **A sourced criterion becomes a calculator in the learner's head.** Fleischner intervals, eGFR
  thresholds, Bosniak classes, and bleeding-risk tiers are supplied by the fictional patient, and later
  state tests their limits; no standalone compute surface is exposed, per the scenario-quality rule.
- **A dose is memorized out of context.** Epinephrine and contrast values are taught as
  recognition-and-action inside a crisis, with the debrief naming them as sourced, and the product
  remains not a dosing tool.
- **A procedure feels like a skill.** The timeout and sedation scenarios state that screen success is
  verification and decision practice, never psychomotor competence.
- **A regional rule is taken as universal.** Contrast-and-kidney thresholds, metformin rules, and
  anticoagulation management differ between ACR, ESUR, and CIRSE guidance; the scenario shows a regional
  variant rather than inventing one rule.

## 8. Regional variation

Contrast and kidney: ACR (United States) versus ESUR (Europe) differ on eGFR thresholds and metformin
handling. Peri-procedural anticoagulation: SIR (United States) versus CIRSE/national guidance. Moderate
sedation: regulation and permitted agents vary by jurisdiction. MR safety zones are broadly harmonized
but local screening policy differs. Practice region is a first-class setting in this product, so each
scenario selects a visible variant or omits a disputed action rather than averaging guidance.

## 9. What radiology must satisfy to advance

Per `learning/catalog-growth`, radiology advances from `proposed` to `breadth-test-passed` only when
every section above is complete and at least eight scenario proposals pass the training-value rule (met
here with twelve). It advances to `planned` — the first point it may appear on the landing page — only
when the breadth test has passed and the first evidence briefs exist. It becomes available only when its
scenarios pass every scenario gate. This change asks for none of those; it records the proposal.

## 10. Alternatives considered

- **Build image-interpretation scenarios with embedded images.** Rejected: the engine has no image
  capability, perception is not a decision-flow the engine models, and a toy reading task is negative
  transfer. If an image-perception capability is ever built and reviewed, it would be its own proposal.
- **Ship radiology as a planned module now because the specialty is obviously important.** Rejected:
  importance is not the test. The breadth test and the scenario gates are, and nothing is built yet.
- **Fold these scenarios into emergency medicine or anesthesia.** Rejected: the setting (the suite, the
  reading room, the zones), the learner roles, and the review domains are radiology's own, and the
  result-communication surface is new. A scenario or two could live elsewhere, but the coherent setting
  is a module.
- **Offer an appropriateness or dose lookup as a quick win.** Rejected outright: a standalone
  appropriateness, dose, or criterion calculator is a runtime utility the catalog forbids. Appropriateness
  reasoning only appears inside a scenario with an insistent referrer and a specific patient.
