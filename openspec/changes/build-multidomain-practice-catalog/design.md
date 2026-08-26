# Design: a private tutor attached to a public simulation laboratory

## 1. Product position

Open Sim Lab is rehearsal, not replacement. It prepares a learner to use supervised simulation time
well by making cognitive work repeatable: noticing change, choosing priorities, acting under time,
connecting actions to physiology, and explaining what they would do differently. It does not claim
to teach hands, team chemistry, bedside presence, or the physical constraints of a particular
mannequin or VR system.

The experience should feel invigorating because the patient is responsive, the goal is legible, the
consequences are coherent, and improvement is visible. It must not manufacture engagement through
leaderboards, public comparison, streak loss, arbitrary points, loot, or shame.

The canonical learning loop is:

```text
choose a preparation goal
        ↓
briefing + fiction contract + controls
        ↓
assess → act → observe the patient → revise
        ↓
reflect in the learner's own words
        ↓
causal debrief + counterfactual + sources
        ↓
repeat the decision point or take the next scenario
```

## 2. Architectural decision: static learning, isolated reporting

The main application remains a static, offline-capable React application. Scenario definitions,
tutor rules, citations, progress evaluation, replays, and debriefs ship in the bundle or optional
static domain packs. No ordinary learner action invokes server code.

Reporting is a narrow exception:

```text
Static Assets Worker
  └─ HTML, JS, CSS, fonts, domain packs, service worker

API route: /api/reports and /api/reports/config only
  └─ Report Worker
       ├─ origin/body/schema checks
       ├─ Turnstile Siteverify
       ├─ privacy-preserving quotas and dedupe
       └─ D1 report queue

Maintainer or scheduled read-only triage job
  └─ sanitized report → reproduce → source check → test → PR → human/review gates
```

Static asset requests do not enter the report Worker. The report Worker has no asset binding,
`workers.dev` route, preview URL, public read route, or broad `/api/*` route. If the report service is
missing, exhausted, or disabled, only report submission is unavailable.

The client shell keeps site and document-head helpers separate from the complete scenario route
catalog. The front door uses its tiny local metadata record and loads the full route table only after
navigation away from `/`; prerendering still consumes the synchronous complete table. This prevents
catalog growth from silently spending the independently enforced 150 KB landing-route budget.

This architecture deliberately revises the old absolute statement that the project has “no server.”
The accurate promise becomes: simulation and tutoring are local; only a report the user explicitly
sends reaches the report service.

## 3. Catalog model

### 3.1 Completion contract

A scenario counts toward the 256-scenario catalog only when it has all of the following:

1. stable ID, title, module, environment, estimated duration, difficulty, prerequisites, practice
   regions, content version, engine capability version, and maturity;
2. a bounded patient profile containing no real-person data;
3. 2–5 observable learner objectives, each mapped to transcript evidence;
4. a deterministic initial state and seed policy;
5. meaningful progression over simulated time;
6. at least 3 accepted learner actions and at least 2 clinically distinct choices or timings;
7. physiological or state consequences produced by shared engine capabilities, not display-only
   scripting;
8. an explicit stop condition and bounded outcome space;
9. Guided, Coached, and Unassisted behavior, with an expert demonstration where safe;
10. PEARLS-structured debrief, causal attribution where modeled, and at least one computed or
    explicitly labeled authored counterfactual;
11. primary or authoritative sources with locators, guideline dates, applicability, and review-by
    date;
12. scenario-specific limitations and a statement of what the browser cannot teach;
13. an expert transcript, a common-error transcript, and a recovery transcript used as regression
    fixtures;
14. keyboard, screen-reader, reduced-motion, color-vision, 320 px, offline, deterministic replay,
    and performance verification;
15. report-control coverage in briefing, live session, debrief, and provenance views.
16. a training-value record proving that the learning objective requires a fictional time-evolving
    state, learner action, consequence, reassessment, and debrief and is not satisfied by a
    calculator, score, classification, checklist, reference, or static decision output;
17. an authored-defaults record naming the source and rationale for every starting setting,
    preselected action, hidden patient trait, time scale, and randomization range;
18. a scenario hazard analysis covering at least premature closure, cue leakage, unsafe transfer to
    real care, unsupported precision, invalid/refused actions, catastrophic outcome handling, and
    model-boundary crossing.

A title card, static vignette, multiple-choice question, prerecorded animation, cosmetic monitor
change, or unscored script does not satisfy this contract.

### 3.2 Product boundary: rehearsal, not work execution

Open Sim Lab exists to change what a learner notices, understands, and rehearses before supervised
practice. A playable item must therefore contain all of these elements:

1. a fictional authored patient or scene, never arbitrary real-person input;
2. meaningful simulated time or ordered state progression;
3. incomplete information the learner must actively observe or uncover;
4. at least two plausible action paths whose timing or order creates different consequences;
5. a need to reassess after acting;
6. a causal debrief that connects evidence, action, patient response, uncertainty, and transfer to
   supervised practice.

The product does not ship general-purpose calculators, dosing utilities, risk-score forms,
classification pickers, unit converters, code lookups, reference tables, patient-specific checklists,
documentation generators, or decision aids for actual work. A formula, score, classification, or
guideline step may appear inside a fictional scenario only when it serves the rehearsal loop. Its
inputs come from the authored patient, its output is contextual teaching evidence, and it is not
exposed as a standalone route, API, reusable compute endpoint, or answer for a real patient.

The engine may calculate physiology internally because the calculation makes the fictional patient
respond. The boundary is crossed when a user can supply arbitrary current-work data and receive an
answer intended to guide that work. Architecture tests enforce the difference independent of any
other product or catalog.

### 3.3 Fidelity classes

- **Closed-loop physiology:** continuous patient state responds to interventions and time. Used for
  anesthesia, airway, shock, ventilation, rhythms, metabolic crises, and resuscitation.
- **State-transition simulation:** orders and decisions move a patient through sourced discrete
  states when continuous physiology would imply unsupported precision. Used for diagnostic workups,
  transfusion workflows, infection reassessment, and oncology complications.
- **Branching encounter:** authored findings become available through examination, history, or tests;
  time and unsafe omissions still matter. Used only when the value is clinical reasoning rather than
  continuous physiology. It must still have consequences and a debrief, never quiz points.

The catalog card names the fidelity class. A scenario cannot visually imply a higher class than its
engine supports.

### 3.4 Environments

The design system composes one shell from shared regions: patient identity, clock, status, primary
workspace, actions, observations, tutor, log, and debrief. Environments change the workspace and
available instruments, not the navigation or core interaction grammar.

| Environment | Primary instruments |
| --- | --- |
| Operating room | multiparameter monitor, anesthesia controls, airway, infusions, labs |
| Emergency department | bedside monitor, focused exam, orders, medications, procedures, disposition |
| ICU | monitor, ventilator, infusions, trends, labs, devices, handoff |
| Ward | intermittent observations, medication record, intake/output, escalation, handoff |
| Delivery room | maternal monitor, fetal tracing where sourced, labor events, neonatal handoff |
| Neonatal unit | neonatal monitor, respiratory support, thermoregulation, glucose, feeding state |
| Clinic | history, focused examination, point-of-care results, counseling and disposition |
| Prehospital | scene state, monitor/defibrillator, oxygen, medications, transport and radio handoff |

### 3.5 Exact release catalog

The release target is exactly 256 complete scenarios. The names below define product scope, not
clinical implementation. Each requires its own evidence brief before authoring numerical behavior.

#### Anesthesia: 39

Routine adult IV induction; routine inhalational maintenance; rapid desaturation with obesity;
hypotension after induction; bronchospasm after intubation; rapid-sequence induction; difficult
airway with supraglottic rescue; repeated laryngoscopy harm; laryngospasm after stimulation;
perioperative anaphylaxis; early malignant hyperthermia; TIVA line disconnection under paralysis;
unexpected hemorrhage; blood-bank handoff; dilutional coagulopathy; persistent VF arrest; local-
anesthetic systemic toxicity; routine pediatric IV induction; pediatric inhalational induction;
geriatric induction; obstetric general anesthesia; preeclampsia for urgent delivery; high spinal;
venous air embolism; pneumothorax under positive pressure; aspiration-risk recognition; emergence
with residual blockade; quantitative reversal selection; delayed emergence differential; extubation
readiness; post-extubation obstruction; opioid-induced ventilatory impairment; hypothermia and
rewarming; perioperative hyperglycemia; pacemaker and cautery planning; postoperative handoff;
capnography sampling-line obstruction during stable ventilation; arterial-pressure transducer
misleveling and dynamic-response artifact during otherwise stable anesthesia; circle-system
rebreathing from exhausted carbon-dioxide absorbent or unidirectional-valve failure.

#### Emergency medicine: 25

Undifferentiated shock; septic shock; hemorrhagic shock; obstructive shock from tension
pneumothorax; cardiac tamponade; anaphylaxis; adult asthma; COPD exacerbation; acute pulmonary edema;
pulmonary embolism with deterioration; STEMI; unstable narrow-complex tachycardia; unstable
bradycardia; persistent VF arrest; PEA arrest; status epilepticus; acute ischemic stroke pathway;
intracranial hemorrhage deterioration; diabetic ketoacidosis; hyperkalemia with ECG change; severe
hyponatremia with seizure; opioid toxicity; heat stroke; trauma primary survey; acute aortic
syndrome with evolving pulse, perfusion, and neurologic asymmetry before definitive imaging.

Wave A is complete at 39 registered anesthesia scenarios. Wave B is now live at the indexable
`/emergency-medicine` module boundary with all 25 playable, completion-audited scenarios.

### Wave B slice 1: undifferentiated shock and the emergency-department frame

The first emergency-medicine slice reuses the deterministic session, monitor, transcript, tutor,
and debrief grammar rather than copying the anesthesia application. The module owns its route,
catalog, scenario registry, and environment copy; the existing circulation, fluid, waveform, alarm,
and worker capabilities remain shared.

The authored adult vignette is a bounded fluid-responsive low-preload pattern. Learners must review
serial skin, brain, kidney, pressure, and lactate evidence; inspect fixed focused-cardiac-ultrasound
and passive-leg-raise findings; deliver one 500 mL balanced-crystalloid challenge; and reassess the
same perfusion evidence. The controls do not acquire an examination, ultrasound image, or specimen,
and the case does not identify or treat a real etiology. Liberal repeat fluid, vasopressors,
antimicrobials, blood, source control, procedures, and disposition remain outside this slice.

### Wave B slice 2: septic shock initial response

The second emergency-medicine slice adds the first authored infection trajectory. A fixed adult
presentation combines probable urinary infection with new organ dysfunction and impaired
perfusion. Learners record cultures and lactate without waiting for results, immediate empiric
antimicrobial intent, a 30 mL/kg initial balanced-crystalloid course, serial reassessment,
first-line norepinephrine intent toward an initial MAP of 65 mmHg, and urgent source-control and
critical-care escalation.

The only numerical patient responses are the shared bounded fluid-retention and generic
vasopressor teaching effects. The controls do not collect specimens, select an antimicrobial,
provide a vasopressor dose, perform imaging or drainage, model local resistance or allergies, or
predict outcome.

### Wave B slice 3: traumatic hemorrhagic shock

The third emergency-medicine slice adds a fixed adult blunt-pelvic-trauma trajectory with ongoing
concealed bleeding, impaired perfusion, elevated lactate, and hypothermia risk. Learners integrate
mechanism, anatomy, physiology, and response; record pelvic stabilization and immediate transfer
for definitive bleeding control; activate a major-hemorrhage response; use a bounded 2-unit adult
red-cell bridge; review coagulation and temperature; and reassess perfusion.

Bleeding-control escalation proceeds in parallel with resuscitation and never waits for the blood
bridge. The controls do not teach placement technique, TXA, calcium, component ratios, warming
delivery, imaging, procedures, local activation workflow, repeat transfusion, or outcome.

### Wave B slice 4: obstructive shock from tension pneumothorax

The fourth emergency-medicine slice reuses the bounded pleural-pressure trajectory in a distinct
spontaneously breathing penetrating-chest-trauma presentation. Learners integrate unilateral
breathing findings, hypoxia, and severe hemodynamic compromise; escalate; record high-concentration
oxygen; confirm immediate left-chest decompression intent without waiting for imaging; and reassess
the canonical oxygenation and circulation response.

The bilateral findings are authored and decompression remains an intent control. The case does not
teach examination or POCUS acquisition, technique, site or equipment selection, later chest
drainage, recurrence, the full obstructive-shock differential, local protocol, or outcome.

### Wave B slice 5: traumatic cardiac tamponade

The fifth emergency-medicine slice adds a distinct penetrating central-chest-trauma trajectory.
Learners integrate preserved bilateral air entry with worsening perfusion, narrowing pressure, and
falling end-tidal carbon dioxide; review one fixed pericardial-fluid/right-sided-collapse POCUS
statement; record immediate trauma and surgical definitive-control intent; and reassess.

The new bounded drive affects obstructive circulation without borrowing the pleural oxygenation
trajectory. POCUS is an authored statement and control is an escalation intent. The case does not
teach procedure selection or technique, simulate transport or technical success, cover concurrent
injuries or the full differential, progress to arrest, or predict outcome.

### Wave B slice 6: emergency anaphylaxis

The sixth emergency-medicine slice reuses the shared anaphylaxis physiology in a distinct community
food-exposure presentation. Learners integrate fixed airway, breathing, and circulation findings;
record recumbent positioning and emergency help; give a fixed 500-microgram adult intramuscular
epinephrine action; add high-flow oxygen and a fixed 20 mL/kg crystalloid bolus; then reassess.

The focused response excludes the perioperative intravenous-dose tray and does not expose a generic
drug or fluid calculator. Findings and actions are authored. Diagnosis, preparation and injection
technique, repeat-dose timing, refractory pathways, airway procedures, observation, recurrence,
referral, local protocol, and outcome remain outside this initial-response vignette.

### Wave B slice 7: adult asthma exacerbation

The seventh emergency-medicine slice reuses lower-airway-obstruction physiology in a distinct,
spontaneously breathing severe adult presentation. Learners review authored speech, work-of-breathing,
oxygenation, peak-flow, and immediate-mimic findings; record controlled oxygen with the current adult
target; give a conservative fixed pMDI-and-spacer bronchodilator bundle; record early systemic-
corticosteroid intent; and reassess symptoms, signs, waveforms, oxygenation, and repeat peak flow.

The focused response does not expose the perioperative anesthesia, 100% oxygen, or 5 mg nebulized
pathway. It is aligned to GINA 2026's lower oxygen threshold, 95% adult upper target, conservative
SABA direction, and explicit response review. Examination, spirometry acquisition, inhaler technique,
individualized dosing, repeat or advanced treatment, disposition, discharge treatment, prevention
planning, local protocol, and outcome remain outside the vignette.

### Wave B slice 8: COPD exacerbation

The eighth emergency-medicine slice reuses lower-airway-obstruction physiology in a distinct older
adult presentation with established COPD. Learners integrate fixed symptom, respiratory-rate,
heart-rate, oxygenation, sputum, blood-gas, and immediate-mimic findings; record controlled oxygen
to 88-92%; give an air-driven short-acting beta2-agonist plus anticholinergic intent; record the
GOLD 2026 5-day systemic-corticosteroid intent and an antibiotic indication from purulent sputum;
then reassess symptoms, signs, oxygenation, waveforms, and a repeat blood gas before deciding whether
immediate noninvasive ventilatory escalation is selected.

The screen keeps the live respiratory-rate and saturation anchors consistent with the authored ED
findings and gives the fixed bronchodilator intent a bounded directional obstruction response.
Examination, sampling, blood-gas analysis, imaging, ECG, microbiology, inhaler or nebulizer technique,
individualized or repeat treatment, antibiotic selection, noninvasive-ventilation setup, disposition,
maintenance treatment, prevention planning, local protocol, and outcome remain outside the vignette.

### Wave B slice 9: acute pulmonary edema

The ninth emergency-medicine slice adds a fixed hypertensive acute-heart-failure presentation with
severe respiratory distress, congestion, preserved peripheral perfusion, and systolic pressure well
above the vasodilator threshold. Learners integrate respiratory, congestion, pressure, perfusion,
fixed ECG, radiograph, and focused-ultrasound findings while checking immediate mimics and
precipitants; record early noninvasive positive pressure with titrated oxygen; pair loop-diuretic
intent with pressure-safe IV vasodilator intent; then reassess breathing, oxygenation, pressure,
mental status, and perfusion.

The live monitor uses explicit authored respiratory and hemodynamic anchors so it agrees with the
fixed ED findings and shows one bounded directional response. The focused controls do not expose a
generic drug calculator or routine opioid action. Examination, test acquisition, NIV setup, drug
selection, dosing or titration, urine output, renal and electrolyte response, precipitant treatment,
intubation, shock care, disposition, chronic therapy, local protocol, and outcome remain outside the
vignette.

### Wave B slice 10: pulmonary embolism with deterioration

The tenth emergency-medicine slice adds a serial, imaging-confirmed acute-PE lesson based on the
2026 AHA/ACC multisociety clinical categories. The fixed initial state combines bilateral main and
lobar clot burden, RV enlargement and dysfunction, elevated cardiac biomarkers, respiratory rate
30/min, room-air SpO2 90%, and preserved perfusion as Category C3R. Learners review that whole
pattern, record titrated oxygen and immediate therapeutic-anticoagulation intents, then reassess.

Reassessment deliberately reveals persistent hypotension and hypoperfusion compatible with
Category E1 cardiopulmonary failure. The final control activates multidisciplinary PE response and
records urgent reperfusion-strategy intent without selecting a modality. Imaging, echocardiography,
laboratory acquisition, complete risk scoring, drug selection or dosing, bleeding and reperfusion
contraindication adjudication, airway technique, thrombolysis, thrombectomy or embolectomy skill,
transfer, disposition, local protocol, complications, and outcome remain outside the vignette.

### Wave B slice 11: STEMI

The eleventh emergency-medicine slice adds a hemodynamically stable, time-critical anterior-STEMI
presentation in a declared PCI-capable hospital. Learners integrate 45 minutes of ongoing ischemic
symptoms, a fixed diagnostic 12-lead ECG, pressure, perfusion, oxygenation, and immediate mimics;
activate the STEMI system and primary-PCI intent without waiting for biomarkers; record the current
guideline aspirin loading range plus dose-free P2Y12-inhibitor and parenteral-anticoagulation intents;
then reassess symptoms, circulation, rhythm, oxygenation, and complications before handoff.

The focused tray explicitly keeps routine oxygen out when the authored SpO2 is 95% and distinguishes
the diagnostic 12-lead statement from the bedside lead-II monitor. Test acquisition, live ECG
interpretation, complete contraindication and bleeding-risk review, individualized drug selection,
nitrate or opioid decisions, non-PCI-capable reperfusion strategy, PCI technique, reperfusion,
arrhythmia, shock, mechanical complications, transfer, disposition, secondary prevention, local
protocol, and outcome remain outside the vignette.

### Wave B slice 12: unstable narrow-complex tachycardia

The twelfth emergency-medicine slice adds a fixed regular narrow-complex tachycardia causing
hypotension, altered mentation, ischemic discomfort, and shock signs. Learners integrate the rhythm
width, regularity, and rate with the whole patient; record airway and breathing assessment, help,
continuous monitoring, IV access, and synchronized-pad preparation; record prompt synchronized
cardioversion with sedation only when feasible and without delaying treatment; then reassess rhythm,
pressure, mentation, discomfort, and perfusion after one bounded response.

The focused tray explicitly withholds routine oxygen at the authored SpO2 of 94%, supplies no energy
value, and distinguishes the fixed 12-lead statement from a teaching waveform that cannot diagnose
atrial mechanism. ECG acquisition, causal diagnosis, device operation, synchronization verification,
energy selection, sedation choice or delivery, cardioversion technique, adenosine or other drug
therapy, refractory treatment, recurrence, anticoagulation questions, disposition, local protocol,
and outcome remain outside the vignette.

### Wave B slice 13: unstable bradycardia

The thirteenth emergency-medicine slice adds a fixed sinus bradycardia with a palpable pulse,
hypotension, altered mentation, ischemic discomfort, shock signs, and room-air hypoxemia. Learners
judge the rate through the whole patient; record airway and breathing assessment, oxygen, continuous
cardiorespiratory and pulse monitoring, help, and vascular access; record one fixed 1 mg IV atropine
intent after persistent compromise; then reassess rate, rhythm, pressure, mentation, discomfort,
perfusion, reversible-cause work, and escalation needs after one bounded response.

The focused tray distinguishes medication intent from delivery and never offers a patient-specific
calculation. ECG acquisition, definitive conduction or causal diagnosis, actual oxygen or vascular
access, medication preparation or delivery, repeated atropine, transcutaneous or transvenous pacing,
electrical or mechanical capture, sedation, dopamine or epinephrine infusion, recurrence,
disposition, local protocol, and outcome remain outside the vignette.

### Wave B slice 14: persistent VF arrest

The fourteenth emergency-medicine slice reuses the shared bounded cardiac-arrest capability in an
emergency-department third-cycle VF handoff after 2 unsuccessful biphasic shocks. Learners resume
fixed-rate compression intent, record one 1 mg IV/IO epinephrine action while compressions are active,
select the fictional device's declared 200 J setting, deliver one modeled shock, and recognize the
authored return of spontaneous circulation while preserving shockable/non-shockable discrimination.

The formulary-free case opens directly into one focused arrest surface. Compression and ventilation
quality, airway skill, pads, device operation, shock safety, vascular access, medication delivery,
repeated cycles, antiarrhythmics, reversible-cause treatment, team performance, individual conversion
probability, termination decisions, and post-cardiac-arrest care remain outside the vignette.

### Wave B slice 15: PEA arrest

The fifteenth emergency-medicine slice adds a witnessed pulseless-electrical-activity arrest using
the shared bounded arrest engine. Learners distinguish organized electrical activity from a
mechanical pulse, begin fixed-rate compression intent, record one 1 mg IV/IO epinephrine action
during active compressions, and keep the patient on the nonshockable pathway while reversible causes
remain explicitly in view. The authored course remains PEA and does not invent ROSC.

The focused arrest surface removes every energy-selection control for PEA and replaces the generic
shock card with a calm nonshockable-branch explanation. Compression and ventilation quality,
pulse-check skill, access, medication delivery, diagnostic acquisition, cause-specific treatment,
repeated cycles, team performance, termination, ROSC, and post-arrest care remain outside the case.

### Wave B slice 16: status epilepticus

The sixteenth emergency-medicine slice adds an adult generalized-convulsive status lesson already
beyond the 5-minute treatment threshold. Learners integrate seizure type, elapsed time, absent
recovery, airway, breathing, circulation, and glucose status; record injury protection, suction
readiness, titrated oxygen, monitoring, help, vascular access, and point-of-care glucose in parallel;
give one fixed 4 mg IV lorazepam action; then reassess the visible seizure signal and airway support.

The formulary-free case opens into a single two-card surface built around the clock and the sequence
“stop it, then prove it stopped.” The modeled convulsions stop after the fixed first-line action, but
the interface keeps persistent-or-recurrent seizure escalation explicit. Physical care, medication
preparation or delivery, repeat or alternate benzodiazepine, second-line antiseizure loading, EEG,
airway procedures, causal diagnosis, recurrence, disposition, and outcome remain outside the case.

### Wave B slice 17: acute ischemic stroke pathway

The seventeenth emergency-medicine slice adds a fixed disabling anterior-circulation stroke within
the 4.5-hour thrombolysis window. Learners integrate the witnessed deficit, 70-minute
last-known-well clock, glucose, pressure, airway, and breathing; activate the stroke system; review
authored noncontrast CT without hemorrhage and CTA with a left M1 occlusion; record one fixed
local-protocol 20 mg IV tenecteplase intent for the 80 kg patient; and activate thrombectomy transfer
without waiting for a simulated response.

The formulary-free two-card surface keeps both reperfusion tracks on one clock and closes with
focused surveillance plus a clock-explicit handoff. The case does not acquire an examination,
calculate a stroke score, interpret imaging, adjudicate eligibility, deliver medication, lower blood
pressure, arrange real transport, perform thrombectomy, model reperfusion or complications, or
predict disposition and outcome. No neurologic improvement is authored after treatment intent.

### Wave B slice 18: intracranial hemorrhage deterioration

The eighteenth emergency-medicine slice adds a warfarin-associated right thalamic hemorrhage with
intraventricular extension, early hydrocephalus, and worsening alertness. Learners review serial
whole-patient change; activate support and the ICH pathway; integrate the authored CT, last-dose
timing, and INR 3.2; record urgent 4-factor PCC plus IV vitamin K intent; record smooth systolic
pressure control toward 140 mmHg with a 130–150 mmHg maintenance boundary; and activate
neurocritical and neurosurgical transfer with a clock-explicit handoff.

The two-card surface pairs “notice the change” with “reverse the driver” while keeping airway
surveillance and hydrocephalus escalation visible. The case does not examine or score the patient,
interpret imaging, select a reversal dose, deliver a drug, titrate an infusion, perform an airway or
neurosurgical procedure, model expansion or response, or predict complications or outcome.

### Wave B slice 19: diabetic ketoacidosis

The nineteenth emergency-medicine slice adds a moderate adult DKA pathway with fixed hyperglycemia,
ketonemia, acidosis, dehydration, hypokalemia, and an insulin-infusion-set precipitant. Learners
integrate the diagnostic triad and severity; record initial fluid and serial monitoring intent;
replace potassium and withhold insulin until an authored repeat exceeds 3.5 mmol/L; record IV
insulin intent; add dextrose while continuing insulin when glucose reaches 238 mg/dL before
ketoacidosis resolves; and confirm a plasma-ketone plus acid-base resolution panel before transition.

The two-card surface turns the core lesson into “three signals name the crisis” and “treat the
ketones, not just the glucose.” It does not examine or sample the patient, calculate deficits or
doses, select or deliver fluids, electrolytes, insulin, or dextrose, operate pumps, model laboratory
kinetics or complications, or predict disposition, recurrence, and outcome.

### Wave B slice 20: hyperkalemia with ECG change

The twentieth emergency-medicine slice adds confirmed severe hyperkalemia with bradycardia, peaked
T waves, P-wave flattening, and QRS widening in an adult with CKD, dehydration, and medication
drivers. Learners review the fixed potassium and ECG; record immediate local-protocol calcium-salt
intent; review a separate later treating-team ECG report without attributing delivery to the learner;
record insulin-glucose with glucose surveillance and adjunct beta-2 agonist intent while stopping
contributors and activating renal expertise, potassium removal, and dialysis contingency in a
parallel lane; then, after elapsed time, reassess a fixed ECG, potassium, glucose, and rebound-risk
panel. Same-tick batching cannot impersonate either reported response.

The focused surface makes the temporal logic unmistakable: protect the heart, shift and remove in
parallel, and watch for return. It does not acquire a specimen or ECG, select or deliver a dose, model
potassium kinetics or hypoglycemia, choose a removal strategy, perform dialysis, or predict later
rebound, disposition, recurrence, and outcome.

### Wave B slice 21: severe hyponatremia with seizure

The twenty-first emergency-medicine slice adds severe symptomatic hypotonic hyponatremia after a
witnessed generalized seizure. Learners integrate the authored seizure, persistent somnolence,
sodium 112 mmol/L, normal glucose, and low measured osmolality; record parallel stabilization and
expert escalation; record immediate local-protocol intermittent hypertonic-saline intent; then
review a fixed first-hour sodium 117 mmol/L panel with improved alertness and rising urine output.

The focused surface turns the safety tension into “treat the brain, not the number” and “aim small,
guard the next 24 hours.” It stops rescue at the fixed +5 mmol/L response, makes correction ceilings,
cause control, serial sodium and urine surveillance, and an overcorrection contingency explicit,
and does not examine or sample the patient, select or deliver a regional bolus, treat a seizure or
airway, model sodium kinetics, adjudicate cause, perform relowering treatment, or predict outcome.

### Wave B slice 22: opioid toxicity

The twenty-second emergency-medicine slice adds suspected fentanyl toxicity with a definite pulse,
severe respiratory depression, hypoxemia, hypercapnia, depressed responsiveness, and pinpoint
pupils. Learners review the fixed pattern and immediate mimics; record airway opening, oxygen and
effective bag-mask ventilation before waiting for an antagonist; record local-protocol naloxone
intent toward normal breathing; and review an authored initial respiratory response.

The second card then reveals fixed recurrent respiratory depression at 25 minutes, requiring renewed
ventilation, repeat-antagonist intent, co-exposure and complication review, monitored observation,
and an eventual discharge-safety handoff. The case does not examine the patient, confirm a pulse,
provide ventilation, select or deliver a drug, model pharmacology, diagnose co-exposure, manage
withdrawal or complications, determine observation duration, dispense medication, or predict outcome.

### Wave B slice 23: exertional heat stroke

The twenty-third emergency-medicine slice adds exertional collapse with CNS dysfunction and an
authored rectal core temperature of 41.3°C. Learners integrate the exertion, neurologic change,
temperature, glucose, sodium, trauma, medication, and mimic screen; record parallel ABC support and
clothing removal; then prioritize whole-body cold-water immersion with continuous rectal monitoring
and cooling-centered transport coordination.

The focused surface pairs “hot brain, cool now” with “stop the cooling, not the surveillance.” A
fixed 14-minute panel reaches 38.9°C and stops active cooling, after which delayed neurologic, renal,
hepatic, coagulation, muscle, electrolyte, glucose, urine, and temperature surveillance continues.
The case does not examine, measure, immerse, cool, transport, give fluids, run labs, treat organ
injury, or predict outcome, and it explicitly excludes antipyretics and dantrolene.

### Wave B slice 24: trauma primary survey

The twenty-fourth emergency-medicine slice adds a high-energy motorcycle collision with failed
direct pressure on catastrophic limb hemorrhage, a currently patent airway under spinal-motion
precautions, no immediate chest threat, persistent shock, an authored unstable pelvis, confusion,
and early hypothermia. Learners receive a structured handoff, activate trauma and major-hemorrhage
responses, control catastrophic bleeding first, then continue a complete `<C>ABCDE` sweep.

The circulation path pairs pelvic stabilization and blood-based resuscitation with early
antifibrinolytic and definitive-control intent while limiting imaging to what directs intervention.
The learner then completes D and E, prevents heat loss, repeats the entire survey, and hands off
times, trends, interventions, and uncertainty. The case does not examine, stabilize, apply pressure
or a tourniquet, ventilate, deliver blood or drugs, bind a pelvis, image, operate, transport, or
predict outcome.

### Wave B slice 25: acute aortic syndrome before definitive imaging

The twenty-fifth emergency-medicine slice begins with abrupt maximal-at-onset chest-to-back pain,
a nondiagnostic ECG, a plausible coronary alternative, and initially symmetric bilateral pressure,
pulse, perfusion, and neurologic findings. Only ordered reassessment reveals a 36 mmHg inter-arm
systolic difference, a new radial pulse deficit, a cool hypoperfused foot, and focal arm drift.

Learners integrate the evolving multi-territory discordance, activate multidisciplinary aortic and
critical-care response, protect the patient from unsupported default coronary or isolated-stroke
pathways, record monitored analgesia and rate-first anti-impulse intent with explicit end-organ
perfusion guardrails, prioritize urgent definitive aortic imaging, and repeat the territories before
handoff. The case stops before a scan result and does not examine, diagnose, score risk, deliver
drugs, image, choose surgery, transfer, or predict outcome.

#### Critical care: 24

Septic shock resuscitation; ARDS lung-protective ventilation; escalating hypoxemia; ventilator
dyssynchrony; auto-PEEP; mucus plugging; unplanned extubation; spontaneous-breathing trial;
post-intubation hypotension; cardiogenic shock; mixed shock; right-ventricular failure; massive
pulmonary embolism; upper GI hemorrhage; status epilepticus; targeted temperature management;
intracranial hypertension; acute kidney injury with fluid overload; severe acidemia; ICU handoff with
hidden deterioration; ventilator circuit disconnection with falling oxygen reserve; delayed
vasopressor delivery from infusion dead space and startup mechanics; pulse-oximeter motion artifact
requiring cross-check of waveform, perfusion, and another oxygenation signal; endotracheal-tube
migration after repositioning with unilateral ventilation and progressive gas-exchange change.

### Wave B critical-care slice 1: ARDS lung-protective ventilation

The first critical-care slice activates the indexable `/critical-care` module with an intubated
adult whose authored moderate-severe ARDS panel combines 500 mL tidal volume, plateau pressure
32 cm H₂O, persistent hypoxemia, passive synchrony, and preserved circulation. Learners translate
height and sex into a fixed 61.5 kg predicted body weight rather than using actual weight, record a
370 mL protective setting and plateau-pressure limit, then reassess mechanics, gas exchange,
synchrony, and circulation after 30 minutes.

The focused tutor pairs “size the breath to the lung” with “every setting owes you a response.”
Persistent hypoxemia leads to protocolized PEEP/FiO₂ and experienced-team prolonged-prone intent,
while bounded hypercapnia remains a monitored tradeoff rather than a universal target. The case does
not diagnose, sample blood, program a ventilator, manage sedation or paralysis, prone, recruit,
select ECMO, liberate support, or predict outcome.

### Wave B critical-care slice 2: escalating hypoxemia

The second critical-care slice begins with an intubated adult whose saturation falls from 94% to 84%
on unchanged support. A coherent pleth and matching arterial panel make the decline credible.
Learners support oxygenation while tracing the system from source and circuit through tracheal tube,
lungs, pressures, capnography, and circulation. The fixed bedside panel excludes neither every cause
nor the need for imaging, but it makes immediate disconnection, tube obstruction or migration,
tension physiology, and pure signal artifact less likely.

The focused tutor pairs “believe the drop; verify the signal” with “trace oxygen from wall to
alveolus.” Unresolved bilateral parenchymal hypoxemia triggers senior and respiratory-therapy help,
urgent gas and imaging intent, protocolized lung-protective support, and a fixed whole-patient
reassessment. The case does not examine, manipulate equipment, sample blood, image, diagnose,
program a ventilator, perform airway or rescue procedures, or predict outcome.

### Wave B critical-care slice 3: ventilator dyssynchrony

The third critical-care slice presents an awake, intubated adult with visible inspiratory effort,
pressure-waveform scooping, premature cycling, 8 double triggers in 20 observed breaths, and fixed
stacked volume of 760 mL despite a 420 mL lung-protective command. Learners integrate the patient,
pressure, flow, and volume graphics; review pain, drive, airway, secretions, circuit, auto-PEEP, gas,
and circulation; then classify the bounded flow-starvation and premature-cycling pattern.

The focused tutor pairs “read the person and the breath” with “match support; keep protection.” A
recorded analgesia-first and respiratory-therapy adjustment intent preserves predicted-body-weight
volume and plateau limits while matching inspiratory flow and cycling, followed by a fixed 10-minute
response. The case does not examine, acquire waveforms, diagnose, program a ventilator, prescribe or
deliver drugs, paralyze, or assess airway, respiratory-therapy, procedural, disposition, or outcome
competence.

### Wave B critical-care slice 4: auto-PEEP and dynamic hyperinflation

The fourth critical-care slice presents an intubated adult with COPD, a 28/min commanded rate,
expiratory flow that has not returned to zero before the next breath, peak pressure 35 cm H₂O with
passive plateau pressure 22 cm H₂O, failed trigger efforts, hypercapnia, and low pressure. Learners
integrate the patient and expiratory-flow pattern, then use a valid authored passive expiratory-hold
panel to separate set PEEP 5, total PEEP 16, and intrinsic PEEP 11 cm H₂O.

The focused tutor pairs “watch the breath leave” with “make room for the next breath.” Learners
classify the bounded obstructive dynamic-hyperinflation pattern, record senior and respiratory-
therapy intent to treat resistance and preserve more expiratory time without inventing universal
settings, then review a fixed 10-minute response. External PEEP remains individualized because its
effect depends on effort and expiratory flow limitation. The case does not examine, acquire
graphics or mechanics, perform a hold, diagnose, manipulate an airway or ventilator, prescribe or
deliver drugs, sedate, paralyze, perform emergency procedures, or predict outcome.

### Wave B critical-care slice 5: mucus plugging

The fifth critical-care slice begins with new coarse central sounds, visible thick tracheal-tube
secretion, a sawtooth expiratory-flow graphic, peak pressure 38 cm H₂O with passive plateau
pressure 23 cm H₂O, reduced left-base air entry, and hypoxemia. Learners support oxygenation and
call experienced help, then integrate patient, airway, circuit, graphics, mechanics, gas exchange,
and circulation before recording airway-clearance intent.

The focused tutor pairs “listen to the resistance” with “clear, then prove it.” Preoxygenated,
as-needed, initially shallow suction intent avoids routine saline and requires an immediate fixed
response panel. Central resistance and oxygenation improve, but the focal finding persists and
triggers imaging plus experienced airway evaluation while alternative causes remain open. Routine
bronchoscopy is not the default. The case does not examine, inspect equipment, acquire graphics or
mechanics, suction, remove secretions, image, perform bronchoscopy, diagnose, program a ventilator,
deliver medication, perform procedures, or predict outcome.

### Wave B critical-care slice 6: unplanned extubation

The sixth critical-care slice begins after repositioning with a disconnect alarm and the tracheal
tube visibly outside the mouth. The fixed adult has a respiratory rate of 36/min, accessory-muscle
use, weak voice and cough, pooled secretions, SpO₂ 86% despite face-mask oxygen, pH 7.27, PaCO₂
58 mmHg, and declining alertness with preserved circulation. Learners announce the event, support
oxygenation, call respiratory-therapy, senior ICU, and airway help, then review airway protection,
work, gas exchange, brain, secretions, and circulation rather than treating every unplanned
extubation as automatic reintubation.

The focused tutor pairs “the tube is out; read the patient” with “don’t rent time from failure.”
Convergent failure triggers experienced-team preoxygenation and prompt reintubation intent with
hemodynamic preparation and backup; noninvasive support does not delay this failing airway. A fixed
reported response requires continuous capnography, bilateral ventilation, documented tube state,
and whole-patient improvement before a non-punitive securement, sedation, mobility, staffing,
observation, and communication review. The case does not examine, acquire monitoring or blood gas,
deliver oxygen, ventilate, select drugs or equipment, intubate, confirm placement, investigate,
assign fault, determine disposition, or predict outcome.

### Wave B critical-care slice 7: spontaneous-breathing trial

The seventh critical-care slice begins with improving pneumonia, an awake patient who initiates
breaths, manageable secretions, SpO₂ 95% on FiO₂ 0.35 and PEEP 5 cm H₂O, and stable circulation.
Learners review the improving cause, oxygenation, circulation, wakefulness, spontaneous effort,
airway protection, and secretions without requiring a rapid shallow breathing index, then record a
local 30-minute pressure-support-5 cm H₂O SBT without increasing FiO₂. The lesson explicitly notes
that supported and unsupported SBT methods can both be valid.

The focused tutor pairs “earn the trial, not a number” with “a trial can say ‘not yet.’” At 30
minutes the fixed patient has respiratory rate 36/min, tidal volume 220 mL, accessory use,
diaphoresis, distress, SpO₂ 88%, tachycardia, and lower pressure. Learners recognize convergent
intolerance, stop the trial, restore prior support, prove a fixed 10-minute recovery, and hand off a
reversible-driver review before another standardized assessment. SBT success remains distinct from
extubation readiness. The case does not examine, program a ventilator, acquire monitoring, sample,
change sedation, treat, extubate, select post-extubation support, determine disposition, or predict
outcome.

### Wave B critical-care slice 8: post-intubation hypotension

The eighth critical-care slice begins 2 minutes after ICU intubation for pneumonia and septic shock.
Invasive MAP has fallen from 68 to 46 mmHg despite a pulsatile arterial waveform; tachycardia, warm
extremities, and 5-second capillary refill coexist with continuous capnography, reported bilateral
ventilation, modest peak-to-plateau separation, complete expiration, and no reported external
bleeding, rash, wheeze, or facial swelling. Learners validate pressure, pulse, and perfusion while
calling experienced help, then review airway, ventilation, rhythm, bleeding, allergy, drug timing,
positive-pressure transition, and obstructive, pump, vasodilated, and preload-sensitive alternatives.

The focused tutor pairs “first, prove the pressure” with “support now; keep asking why.” An authored
passive-leg-raise proxy raises stroke volume from 48 to 57 mL, supporting fluid responsiveness
without proving one cause. Learners record concurrent norepinephrine intent toward an initial MAP
near 65 mmHg and a cautious 250 mL balanced-crystalloid challenge with immediate reassessment, not
a universal fluid-versus-vasopressor answer. The fixed 5-minute panel improves MAP, heart rate,
perfusion, and stroke volume while leaving septic-shock and alternate-cause work open. The case does
not examine, acquire pressure, perform ultrasound or passive leg raise, deliver fluid or drug,
choose access or dose, change sedation or ventilation, diagnose, treat infection, determine
disposition, or predict outcome.

### Wave B critical-care slice 9: cardiogenic shock

The ninth critical-care slice uses a cold, congested acute-anterior-MI shock pattern with worsening
brain, skin, kidney, lactate, and pressure evidence. Learners activate multidisciplinary shock and
catheterization help, then integrate fixed ECG, echo, lung, rhythm, and perfusion findings into an
LV-predominant phenotype while keeping mechanical, right-heart, rhythm, and noncardiac causes open.

The focused tutor pairs “pressure is a clue; perfusion is the verdict” with “bridge the pump; fix the
cause.” Learners record a perfusion-linked norepinephrine bridge without primary fluid loading,
prioritize prompt culprit-vessel revascularization, and leave inotrope, invasive-hemodynamic,
transfer, and temporary-support choices to expert trajectory-based selection. A fixed 10-minute
response improves immediate perfusion but leaves congestion, organ trajectory, and definitive care
open. The case does not examine, acquire or interpret tests, diagnose, deliver oxygen or drugs,
select access or dose, catheterize, revascularize, place support, transfer, determine disposition,
or predict outcome.

### Wave B critical-care slice 10: mixed shock

The tenth critical-care slice presents post-MI LV dysfunction plus pneumonia, fever, warm hands,
mottling, worsening perfusion, and congestion despite reported vasoactive therapy. A fixed teaching
panel combines cardiac index 1.7 L/min/m², wedge pressure 24 mmHg, CVP 11 mmHg, and SVR 720
dyn·s/cm⁵. Learners integrate output, filling pressure, tone, treatment context, echo, lungs, and
perfusion into a cardiac-vasodilatory phenotype without treating suggested ranges as universal
diagnostic cutoffs.

The focused tutor pairs “when clues disagree, believe the pattern” with “support both halves; chase
both causes.” Learners record tone support plus expert output-support review without blind fluid
loading, keep cardiac and pneumonia cause-control pathways active, and review a fixed 10-minute
trajectory. The case does not examine, acquire a catheter or tests, calculate or diagnose, deliver
oxygen, fluid, or drugs, prescribe, revascularize, treat infection, perform source control, place
support, transfer, determine disposition, or predict outcome.

### Wave B critical-care slice 11: right-ventricular failure

The eleventh critical-care slice presents acute-on-chronic pulmonary-arterial-hypertension
decompensation with systemic congestion, worsening tissue perfusion, and a fixed pressure-loaded
RV pattern. Learners activate pulmonary-hypertension, cardiac, and shock help, then integrate severe
RV dilation and systolic dysfunction, septal flattening, a small underfilled LV, high right-sided
filling pressure, and low output without turning any authored value into a diagnostic cutoff.

The focused tutor pairs “read the ventricle, not just the pressure” with “protect filling; lower the
load; prove the flow.” Learners record expert-selected systemic-perfusion and RV-protective support,
individualize preload without reflex fluid loading or reflex decongestion, keep reversible triggers
and specialist pulmonary-vascular therapy open, and review a fixed 10-minute trajectory. The case
does not examine, acquire or interpret tests, calculate or diagnose, change oxygen or ventilation,
deliver fluid, diuresis, or drugs, prescribe, perform procedures, place support, transfer, determine
disposition, or predict outcome.

### Wave B critical-care slice 12: massive pulmonary embolism

The twelfth critical-care slice begins where the emergency-department PE lab ends: confirmed acute
PE has progressed beyond Category E1 into Category E2R refractory cardiogenic shock and ventilatory
failure. Learners activate PERT, shock, resuscitation, perfusion, and ECMO-capable teams, then review
the fixed central-PE, severe-RV-failure, ventilation, perfusion, bleeding, and alternate-cause
context without delaying rescue for repeated diagnosis.

The focused tutor pairs “this is the failure state; mobilize the system” with “bridge the
circulation; keep the clot decision open.” Learners record RV-sensitive support without blind fluid
loading, activate resource- and candidacy-dependent VA-ECMO as temporary perfusion and oxygenation
support, and reassess a fixed response while keeping adjunctive reperfusion individualized because
its benefit on VA-ECMO is not established. The case does not examine, acquire or interpret tests,
diagnose, deliver oxygen, ventilation, anticoagulation, fluid, or drugs, prescribe, perform CPR,
cannulate, initiate or manage ECMO, remove clot, transfer, determine disposition, or predict outcome.

### Wave B critical-care slice 13: upper GI hemorrhage

The thirteenth critical-care slice presents recurrent nonvariceal bleeding after prior endoscopic
hemostasis for a duodenal ulcer. New hematemesis and melena accompany worsening pressure, refill,
urine output, lactate, and hemoglobin. Learners activate GI, hemorrhage, critical-care, and blood-bank
help, then integrate the fixed source, airway, perfusion, medication, comorbidity, and alternate-source
context without treating hemoglobin as a stand-alone perfusion measure.

The focused tutor pairs “the trend spoke before the pressure fell” with “resuscitate the patient;
reopen hemostasis.” Learners record individualized hemodynamic, access, laboratory, blood-bank, and
restrictive-transfusion review without turning 7 g/dL into a universal trigger, activate repeat
endoscopy for recurrent ulcer bleeding, and preserve embolization and surgical pathways after
failure. A fixed immediate response improves pressure and perfusion but does not prove hemostasis.
The case does not examine, acquire monitoring or tests, diagnose, deliver oxygen, fluid, blood
products, or drugs, manage an airway, prescribe, perform endoscopy, embolization, or surgery,
transfer, determine disposition, or predict outcome.

### Wave B critical-care slice 14: status epilepticus

The fourteenth critical-care slice begins after the emergency status-epilepticus lab ends. An
adequate benzodiazepine and urgent antiseizure load are reported, visible convulsions stopped, and
the intubated patient has not recovered consciousness while fixed continuous EEG still reports
evolving seizures. Learners recognize refractory electrographic status and activate neurocritical,
epilepsy, EEG, pharmacy, airway, and critical-care help without treating immobility as seizure control.

The focused tutor pairs “movement stopped; the seizure did not” with “suppress the seizure; protect
the patient.” Learners activate expert-selected continuous anesthetic therapy with continuous EEG,
ventilation, perfusion, temperature, and organ-support guardrails; keep metabolic, toxic,
infectious, structural, vascular, immune, and medication causes active; and review a fixed brief EEG
and systemic response without universal agent, dose, EEG-depth, burst-suppression, or duration rules.
The case does not examine, acquire or interpret monitoring or EEG, diagnose, deliver oxygen,
ventilation, fluid, or drugs, manage an airway, prescribe, image, perform lumbar puncture or another
procedure, transfer, determine disposition or prognosis, or predict outcome.

### Wave B critical-care slice 15: targeted temperature management

The fifteenth critical-care slice begins 32 minutes after ROSC from a witnessed VF arrest. The
intubated patient does not follow verbal commands, core temperature is 38.3°C and rising, and no
deliberate temperature strategy is recorded. Learners recognize the indication for protocolized
temperature control and activate post-arrest, cardiac, neurologic, nursing, pharmacy, and
temperature-control support without converting eligibility into early neuroprognosis.

The focused tutor pairs “control temperature; no early prognosis” with “choose a range; protect the
patient.” Learners review the fixed neurologic and systemic context, activate an
individualized protocol within 32–37.5°C for at least 36 hours, record whole-patient and rewarming
guardrails, and review a fixed response into range. The lab teaches neither one universally superior
target nor routine rapid cold-IV-fluid loading and avoids rewarming faster than 0.5°C/h. It does not
examine, acquire or interpret monitoring, EEG, laboratory tests, or imaging; diagnose; deliver oxygen,
ventilation, fluid, or drugs; manage an airway; prescribe; use a cooling or warming device; treat
shivering or cause; perform coronary care or neuroprognostication; transfer; determine disposition;
or predict outcome.

### Wave B critical-care slice 16: intracranial hypertension

The sixteenth critical-care slice presents an intubated adult 6 hours after severe traumatic brain
injury and lesion evacuation. A reported consistent parenchymal-monitor waveform has shown ICP
28 mmHg for 8 minutes while MAP 82 mmHg yields CPP 54 mmHg. Learners integrate the pressure trend,
unchanged pupils, reported diffuse edema, and systemic physiology; activate neurocritical,
neurosurgical, nursing, respiratory-therapy, and pharmacy help; and keep monitor fidelity, repeat
imaging, and surgical review open.

The focused tutor pairs “lower pressure; preserve perfusion” with “treat pressure; protect the
patient.” Learners restore neutral positioning and venous-drainage intent, protect systemic brain
physiology, individualize CPP within 60–70 mmHg without aggressively forcing it above 70, avoid
prolonged prophylactic aggressive hyperventilation, activate expert-selected hyperosmolar rescue
with safety guardrails, and review a fixed immediate ICP 19/CPP 65 response. The lab teaches neither
one isolated automatic threshold nor one universal osmotherapy recipe. It does not examine, acquire
or interpret ICP or other monitoring or imaging, calculate CPP, diagnose, position, deliver oxygen,
ventilation, fluid, or drugs, prescribe, use a drain, operate, transfer, determine disposition or
prognosis, or predict outcome.

### Wave B critical-care slice 17: acute kidney injury with fluid overload

The seventeenth critical-care slice presents severe oliguric AKI after septic shock with creatinine
3.4 mg/dL from 1.0, urine output 0.15 mL/kg/h, +8.2 L cumulative balance, 9 kg weight gain, worsening
pulmonary edema, SpO₂ 91% on FiO₂ 0.50, and poor reported response to an adequate loop-diuretic
challenge. Learners activate critical-care, nephrology, nursing, respiratory-therapy, and pharmacy
help and integrate kidney, fluid, weight, respiratory, perfusion, electrolyte, acid-base, uremic,
cause, treatment, recovery, goal, and preference trajectories without dialyzing one laboratory value.

The focused tutor pairs “see the burden; protect the organs” with “match demand to kidney capacity.”
Learners stop nonessential accumulation while preserving necessary therapy and perfusion, review the
poor reported diuretic response without blind escalation, and activate individualized kidney-support
planning with urgent treatment preserved for life-threatening fluid, electrolyte, or acid-base
imbalance. A fixed 6-hour response reaches −1.1 L balance and SpO₂ 95%, but oliguria and recovery
remain open. The lab teaches neither one creatinine/BUN trigger nor universal accelerated support. It
does not examine, acquire or interpret monitoring, laboratory tests, or imaging; diagnose; account
fluid; change nutrition; deliver oxygen, ventilation, fluid, or drugs; prescribe diuretics; place
access; provide kidney support; transfer; determine disposition, kidney recovery, or outcome.

### Wave B critical-care slice 18: severe acidemia

The eighteenth critical-care slice presents septic shock with pH 7.09, bicarbonate 14 mmol/L,
PaCO₂ 48 mmHg, lactate 8.1 mmol/L, potassium 5.7 mmol/L without ECG change, and creatinine
3.0 mg/dL from 1.2. The repeated gas and expected PaCO₂ of approximately 29 ±2 expose added
respiratory acidemia rather than adequate compensation. Learners activate critical-care,
respiratory-therapy, nursing, pharmacy, nephrology, and source-control help and keep perfusion,
ventilation, electrolyte, kidney, medication, and toxin causes open.

The focused tutor pairs “read the system, not pH alone” with “buy time; treat the source.” Learners
protect safe ventilatory compensation without forcing normal pH, continue cause-directed shock and
infection work, and individualize bicarbonate and kidney-support planning without promising a
hemodynamic or mortality benefit. A fixed 30-minute response reaches pH 7.23, PaCO₂ 32 mmHg,
lactate 6.9 mmol/L, and MAP 68 mmHg while metabolic acid and the septic source remain active. The
lab does not acquire or interpret samples, calculate or diagnose, examine, monitor, set ventilation,
deliver oxygen, fluid, drugs, buffer, antidotes, or kidney support, control a source, prescribe,
perform procedures, transfer, determine recovery or disposition, or predict outcome.

### Wave B critical-care slice 19: ICU handoff with hidden deterioration

The nineteenth critical-care slice begins at shift change with an outgoing “stable on low-dose
support” headline. The fixed 90-minute record contradicts it: HR rises 94→118/min, MAP falls
70→64 mmHg while reported norepinephrine rises 0.08→0.22 mcg/kg/min, refill lengthens 2→5 seconds,
lactate rises 3.1→5.8 mmol/L, urine falls 30→5 mL/h, and EtCO₂ falls 35→30 mmHg while suspected
cholangitis source control remains pending.

The focused tutor pairs “receive the story; check the patient” with “make the next move
unmistakable.” Learners establish shared attention and uninterrupted bedside coverage, receive
structured content as claims requiring verification, reconcile the patient, trends, devices,
infusions, orders, and pending work, correct illness severity to worsening shock, and escalate with
priorities, triggers, contingencies, and named owners before receiver synthesis and acceptance. A
fixed bridge reaches MAP 70 mmHg, but lactate, urine, source control, durability, and outcome remain
open. The lab does not verify identity, examine, monitor, inspect devices or records, communicate,
document, deliver treatment, control a source, transfer responsibility, determine disposition, or
predict outcome.

### Wave B critical-care slice 20: ventilator circuit disconnection

The twentieth critical-care slice begins with a fixed high-priority disconnect alarm after a
declared 10-second teaching delay. Although volume control remains commanded at 420 mL and 20/min,
exhaled tidal volume and minute ventilation are zero, airway pressure and measured PEEP collapse,
the capnogram disappears, and a coherent pleth falls from SpO₂ 96% to 88% in a fully dependent
patient. Tube depth and securement are unchanged, but the diagnosis is not announced.

The focused tutor pairs “follow the breath, not the setting” with “bridge first; then reconnect;
then prove.” Learners recognize command-delivery discordance, call respiratory-therapy and senior
help, record immediate alternative oxygenation and ventilation intent, trace the patient, airway,
circuit, ventilator, and gas source while preserving alternatives, then record restored continuity.
A fixed 2-minute response restores exhaled volume, pressure, PEEP, capnography, SpO₂ 94%, and
stable circulation. Alarm behavior and oxygen reserve are explicitly device- and patient-specific
teaching values. The lab does not hear or configure alarms, examine, monitor, inspect or handle
equipment, oxygenate, ventilate, reconnect a circuit, program a ventilator, diagnose, perform a
procedure, determine disposition, or predict outcome.

### Wave B critical-care slice 21: delayed vasopressor delivery

The twenty-first critical-care slice presents persistent septic shock after a newly connected
vasopressor pump has displayed RUNNING for 6 minutes. The fixed setup record separates the command
from delivery: a drug-free 0.6 mL downstream segment remains beyond the mixing point, carrier flow
is 2 mL/h, the dedicated central lumen is patent, no occlusion alarm is active, and catheter-tip
arrival is not documented while MAP remains 54 mmHg with worsening perfusion.

The focused tutor pairs “running is not arriving” with “move the drug, not the risk.” Learners
reconcile pump command with patient response, trace the declared syringe-to-patient path, classify
dead-space transit and startup mechanics while keeping medication, access, device, shock, and
measurement alternatives open, and activate nursing, pharmacy, critical-care, and a local
device-specific safe-start or changeover protocol. An explicit guard rejects flushing or purging
concentrated vasopressor into the patient. A fixed 5-minute response documents arrival and reaches
MAP 67 mmHg while shock, source control, dose adequacy, durability, and outcome remain open. The
lab does not inspect, measure, calculate, prime, purge, flush, bolus, program, prescribe, compound,
deliver a drug, manipulate equipment, diagnose shock, determine disposition, or predict outcome.

### Wave B critical-care slice 22: pulse-oximeter motion artifact

The twenty-second critical-care slice begins with shivering and a pulse-oximeter display of 82%
and pulse 132/min while ECG remains 86/min. The pleth is irregular and low amplitude at a cool,
low-perfusion finger, yet the authored patient is awake, speaking clearly, breathing 16/min without
visible distress, and has stable circulation and EtCO₂ 37 mmHg. Canonical modeled oxygenation
remains 97%, separating patient, probe, pleth, numeric display, pulse rate, and alarm state.

The focused tutor pairs “trust the signal, not just the number” with “corroborate, then reassess.”
Learners recognize discordance, inspect pleth and pulse-rate coherence, review the declared probe,
motion, temperature, and perfusion path, then corroborate the whole patient with a fixed arterial
panel of SaO₂ 97% and PaO₂ 94 mmHg. A clean capnogram supports ventilation but explicitly does
not exclude hypoxemia. Fixed clean-site reassessment restores a 97% display, pulse 86/min, and a
regular stronger pleth without changing patient physiology or delivering treatment. True hypoxemia,
dyshemoglobinemia, optical interference, venous pulsation, probe fault, and evolving illness remain
open. The lab does not inspect or move a probe, examine, sample blood, configure a monitor, diagnose,
deliver oxygen or treatment, determine disposition, or predict outcome.

### Wave B critical-care slice 23: endotracheal-tube migration after repositioning

The twenty-third critical-care slice begins immediately after a turn and head repositioning. A
previously documented tube mark of 22 cm is now 25 cm; commanded volume control persists while
exhaled volume falls, peak pressure rises, left ventilation becomes markedly reduced, EtCO₂ rises,
and SpO₂ falls despite continuous capnography. Securement remains intact and cuff state unchanged.

The focused tutor pairs “after every move, earn the airway again” with “support first, correct with
proof.” Learners recognize the movement-linked multi-signal change, record immediate oxygenation
and ventilation support plus experienced help, and integrate pre/post depth, bilateral ventilation,
pressures, delivered breath, capnography, and gas exchange. The fixed pattern supports right-mainstem
migration while mucus plugging, pneumothorax, atelectasis, consolidation, circuit, ventilator, and
other causes remain open. Experienced correction intent leads to a fixed 3-minute response with a
22 cm case mark, typed tracheal position, bilateral ventilation, recovered exhaled volume and
pressure, and improved gas exchange. The exact depth is a case fact, not a target. The lab does not
turn or examine a patient, auscultate, inspect equipment, handle or secure a tube, acquire imaging,
perform bronchoscopy, diagnose, determine disposition, or predict outcome.

### Wave B critical-care slice 24: persistent septic-shock resuscitation

The twenty-fourth critical-care slice begins 2 hours after probable ascending cholangitis was
recognized. Cultures, empiric antimicrobials, 30 mL/kg balanced crystalloid, and running
norepinephrine are reported, but command, delivery, effect, and patient response remain separate.
MAP is 64 mmHg with reduced attention, refill 5 seconds, mottling to the knees, urine 12 mL/h, and
lactate rising from 5.8 to 6.4 mmol/L. Urgent biliary source control has not occurred.

The focused tutor frames resuscitation as a loop rather than a liter count and gives fluid both a
target and an exit. Learners reconcile prior care claims, reassess pressure alongside multi-organ
perfusion and respiratory tolerance, and review a fixed passive-leg-raise stroke-volume change of
2% plus new diffuse B-lines. Those case facts prevent a blind repeat bolus without becoming
universal cutoffs. Individualized hemodynamic-support review and urgent source-control intent run
in parallel, followed by a modest fixed 10-minute response that leaves hypoperfusion, lactate,
oliguria, source, support, organ failure, and outcome open. The lab does not examine, measure,
sample, scan, calculate, diagnose, prescribe, deliver fluid or drugs, adjust a device, perform
drainage, determine disposition, or predict outcome.

#### Cardiology: 17

Stable chest-pain evaluation; STEMI recognition and first actions; NSTEMI risk reassessment; acute
decompensated heart failure; cardiogenic shock; atrial fibrillation with rapid response; regular
narrow-complex tachycardia; wide-complex tachycardia; symptomatic bradycardia; complete heart block;
torsades de pointes; hyperkalemic conduction disturbance; pericardial tamponade; right-ventricular
infarction; hypertensive emergency; pacemaker capture failure; transcutaneous pacing with electrical
capture but absent mechanical capture.

### Wave C cardiology slice 1: stable chest-pain evaluation

The first cardiology slice activates the indexable `/cardiology` catalog with one quiet outpatient
rehearsal. A fixed 3-month exertional pressure pattern is stable by trajectory but not dismissed as
safe. Learners verify that boundary, characterize symptoms without the label “atypical,” integrate
age, sex, risk factors, fixed examination claims, and a resting ECG report into an authored
not-very-low clinical likelihood, then record patient-specific testing intent and an acute-change
safety net. The tutor keeps the sequence simple: verify stability, describe the pattern, estimate
before investigating, and test only when the answer can change care.

The lab does not examine, acquire or interpret an ECG, calculate a score, measure exercise
capacity, order or perform testing, diagnose coronary disease or ischemia, prescribe medication,
determine disposition, or predict events or outcome. The remaining 16 cardiology titles remain
planned until their individual evidence, interaction, test, and debrief contracts pass.

### Wave C cardiology slice 2: NSTEMI risk reassessment

The second cardiology slice follows a resolved 25-minute pressure episode with a fixed
high-sensitivity-troponin rise and changing 12-lead reports. The learner reconciles the serial
trajectory, verifies the authored NSTEMI conclusion while preserving alternate causes of
myocardial injury, and re-screens for very-high-risk features rather than inheriting stability from
an earlier observation. Ischemic risk, bleeding risk, kidney function, comorbidity, preference, and
local capability then inform inpatient invasive-strategy intent, followed by explicit monitoring,
change triggers, ownership, and the next reassessment.

US and European guidance phrase invasive timing differently. The lab teaches their shared risk
structure and preserves the applicable regional pathway instead of presenting one universal clock.
It does not examine; acquire or interpret an ECG, troponin, imaging, or another test; calculate a
score; diagnose; prescribe or deliver treatment; choose or perform angiography, PCI, or surgery;
determine transfer, disposition, prognosis, complications, or outcome.

### Wave C cardiology slice 3: acute decompensated heart failure

The third cardiology slice follows a patient 24 hours into admission after reported loop-diuretic
treatment. The learner reconciles current congestion and perfusion, judges the serial response
across symptoms, weight, recorded balance, urine output, and fixed examination claims, then reviews
kidney, electrolyte, hemodynamic, and precipitant context without letting one creatinine change
decide the trajectory. Individualized continued-decongestion, oral-transition, and
guideline-directed-therapy review intent precede a discharge-readiness reassessment. Residual
orthopnea, JVP elevation, crackles, edema, and weight above a documented clinic value keep the
authored snapshot explicitly not discharge-ready, with ownership and early follow-up still visible.

This longitudinal inpatient lesson is distinct from the emergency-medicine acute-pulmonary-edema
lab, which rehearses initial respiratory support and hypertensive rescue. It does not examine;
verify administration; acquire or interpret weight, balance, urine output, laboratory tests, ECG,
ultrasound, or imaging; calculate dry weight, fluid targets, doses, or scores; diagnose; prescribe
or deliver treatment; select a regimen; determine disposition or prognosis; or predict outcome.

### Wave C cardiology slice 4: atrial fibrillation with rapid response

The fourth cardiology slice starts with a fixed diagnostic report of atrial fibrillation at
142/min in an alert, warm patient with preserved pressure and no authored ischemia, acute heart
failure, syncope, or shock. Learners reconcile rhythm and stability without using rate alone,
review uncertain AF duration, prior history, adherence, ventricular function, comorbidity, and
acute contributors, then record patient-specific rate-control intent. A separate thromboembolic,
bleeding, preference, and cardioversion-context review prevents rate improvement from erasing
stroke prevention. The fixed response remains AF at 96/min and closes with monitoring, change
triggers, ownership, risk-factor review, and follow-up.

This stable, multidomain AF lesson is distinct from the emergency-medicine regular
narrow-complex-tachycardia lab, which rehearses immediate synchronized cardioversion for authored
shock and ischemia. It does not acquire or interpret an ECG or test, calculate a score, diagnose,
select a universal target, prescribe or deliver medication or anticoagulation, determine
cardioversion eligibility, perform cardioversion or ablation, determine disposition or prognosis,
or predict recurrence or outcome.

### Wave C cardiology slice 5: STEMI recognition and first actions

The fifth cardiology slice begins in a non-PCI outpatient cardiology clinic with 22 minutes of
ongoing central pressure, diaphoresis, and nausea. A fixed 12-lead report states an inferior STEMI
pattern. The learner reconciles symptoms, timing, ECG report, and physiology, then activates EMS
and the regional STEMI system immediately while screening current stability, immediate
complications, dangerous alternatives, bleeding, allergy, and oxygenation in parallel. The fixed
ECG is transmitted and the system-selected receiving team is pre-alerted without waiting for
biomarkers, paperwork, a complete checklist, or private transport. Protocol-bounded aspirin, monitoring, defibrillation-readiness, access, and
transport intent precede reassessment and an exact receiving-team handoff.

This clinic recognition-and-routing lesson is distinct from the emergency-medicine PCI-capable
STEMI lab, which rehearses ED cath-lab activation and aspirin, P2Y12-inhibitor, and anticoagulation
preparation. It does not examine; acquire or interpret an ECG or test; diagnose a real patient;
prescribe or deliver a drug; choose P2Y12 inhibition, anticoagulation, fibrinolysis, or PCI; perform
a procedure; determine disposition; or predict complications or outcome.

### Wave C cardiology slice 6: post-infarction cardiogenic-shock escalation

The sixth cardiology slice begins 6 hours after reported culprit-vessel PCI with immediate
post-procedure patency and verified initial vasoactive support at a hospital without advanced shock
capability. MAP has risen, but brain, skin, kidney, lactate, and congestion findings worsen. Learners
recognize failure to improve from the multi-organ trajectory rather than pressure alone, reopen
ischemic, mechanical, right-heart, rhythm, bleeding, vasodilated, and obstructive contributors, and
activate the local shock team while contacting a regional advanced shock center for consultation
and potential-transfer evaluation. These two lanes proceed without waiting for a device decision.

An individualized potential-transport bridge follows both cause review and consultation. It supplies
no blind fluid load, universal target, fixed drug or dose, or routine mechanical-support device.
After elapsed simulated time, a modest pressure change coexists with unresolved hypoperfusion and
congestion; the learner hands off open causes, support adequacy, organ risk, transport readiness,
owners, and change triggers. This is distinct from the Critical Care cardiogenic-shock lab, which
starts before revascularization and rehearses initial support plus culprit-PCI prioritization. It
does not examine; acquire or interpret monitoring, tests, imaging, angiography, or hemodynamics;
diagnose; prescribe or deliver treatment; select or place a device; perform PCI or surgery;
authorize or perform transfer; determine disposition or prognosis; or predict outcome.

### Wave C cardiology slice 7: regular narrow-complex tachycardia

The seventh cardiology slice begins in a monitored hospital-based urgent rhythm unit with abrupt
palpitations and a fixed regular narrow-complex 12-lead report at 176/min. Preserved pressure, alert
mentation, warm perfusion, normal oxygenation, and no authored shock, ischemic discomfort, acute
heart failure, or syncope support a stable pathway now without using rate alone. Learners preserve
AV-nodal reentry, accessory-pathway, atrial-tachycardia, flutter, sinus, and contributor uncertainty
while reviewing continuous monitoring, access, contraindications, and resuscitation readiness.

Coached modified-Valsalva intent is followed only after elapsed simulated time by a fixed stable
nonconversion review. Protocol-bounded adenosine intent then precedes a second elapsed reassessment
with authored sinus conversion, preserved mechanism uncertainty, recurrence and instability
triggers, ownership, and cardiology/electrophysiology follow-up. This is distinct from the unstable
Emergency Medicine narrow-tachycardia lab, which begins with hypotension, altered mentation,
ischemic discomfort, and shock and rehearses prompt synchronized cardioversion. The stable lab does
not examine; acquire or interpret an ECG or test; diagnose a mechanism; perform a vagal maneuver;
select a dose; prescribe or deliver medication; perform cardioversion or ablation; determine
disposition or prognosis; predict recurrence or outcome; or assess psychomotor competence.

### Wave C cardiology slice 8: wide-complex tachycardia

The eighth cardiology slice keeps a palpable pulse and current whole-patient stability visible while
a fixed diagnostic report describes regular monomorphic WCT at 164/min with QRS 158 ms. Remote
infarct context raises concern for VT without proving it; aberrancy, pre-excitation, pacing, and
toxic or metabolic causes remain open. Learners record monitoring, access, expert consultation,
pads, and immediate synchronized-cardioversion readiness without routine oxygen.

One authored treating-team procainamide pathway follows QT and heart-failure review. No learner
dose, rate, preparation, delivery, or stacked antiarrhythmic is supplied. A real later engine tick
reveals persistent stable WCT; synchronized-cardioversion intent then precedes another elapsed fixed
sinus report. The lab excludes irregular or polymorphic WCT, torsades, pulseless VT/VF, live ECG or
test interpretation, definitive diagnosis, device operation, energy or sedation selection,
cardioversion performance, ablation, ICD decisions, disposition, recurrence, prognosis, and outcome.

### Wave C cardiology slice 9: symptomatic bradycardia

The ninth cardiology slice is a stable return rhythm visit, not another acute bradycardia
resuscitation. A fixed sinus rate of 44/min coexists with a palpable pulse, preserved pressure,
mentation, perfusion, and oxygenation, plus 3 weeks of fatigue and exertional lightheadedness without
syncope or acute compromise. Learners separate chronic symptom burden from instability, then review
reversible and physiologic context alongside a pre-authored completed patch and symptom diary.

The two diagnostic lanes may occur in either order. Both precede shared cardiology/electrophysiology
pacing-evaluation intent, symptom tracking, acute-change triggers, ownership, and follow-up. No heart
rate or pause threshold alone establishes a pacing indication, no ordinary engine tick impersonates
days of monitoring, and referral does not change the canonical rhythm. The lab excludes examination;
live ECG, monitor, laboratory, or imaging acquisition or interpretation; definitive diagnosis;
medication change; atropine, oxygen, infusion, or rescue pacing; pacemaker eligibility, selection,
implantation, or programming; disposition, prognosis, recurrence, benefit, or outcome.

### Wave C cardiology slice 10: complete heart block

The tenth cardiology slice begins in a monitored urgent rhythm unit after 2 brief presyncopal
episodes. A fixed diagnostic report states acquired complete AV block with atrial activity 82/min,
a regular wide ventricular escape 34/min, and P waves marching independently through QRS complexes.
The patient has a palpable pulse, preserved pressure, alert mentation, warm perfusion, and normal
oxygenation without current shock, ischemic discomfort, acute heart failure, or syncope.

Learners reconcile the block with the whole patient, then review reversible and structural context
while activating cardiology/electrophysiology and pacing-capable monitored care in parallel. A later
tick shows persistent complete block with unchanged perfusion and no simulated treatment or capture.
The final handoff records the guideline-supported permanent-pacing evaluation for authored acquired
third-degree block without an identified reversible or physiologic cause, shared decisions, owners,
and deterioration triggers. The lab does not examine; acquire or interpret tests; diagnose cause;
deliver oxygen, atropine, medication, infusion, or pacing; choose settings, sedation, device, mode,
or lead; assess capture; implant or program; determine disposition or prognosis; or predict outcome.

### Wave C cardiology slice 11: torsades de pointes

The eleventh cardiology slice begins in a monitored unit with sustained polymorphic VT near 220/min,
a weak palpable pulse, BP 74/42 mmHg, acute confusion, and a fixed pre-event sinus report with QTc
560 ms. The dedicated teaching waveform waxes, wanes, and reverses polarity around the baseline; it
is not a diagnostic ECG or a substitute for pulse and perfusion assessment.

Learners first reconcile the polymorphic pattern, pulse, and compromise, then record immediate
unsynchronized-shock intent. Context review, magnesium intent, synchronization, and energy selection
cannot delay that step. Shock delivery is not simulated, and a separate later tick supplies the
authored post-team sinus report. Long-QT context review and recurrence-suppression intent may then
occur in either order before elapsed reassessment and handoff. Magnesium is bounded to recurrent
long-QT polymorphic VT; electrolyte and culprit review remain explicit, and pulse loss opens the
cardiac-arrest pathway. The lab does not examine; acquire or interpret tests; diagnose cause; choose
energy or sedation; operate a defibrillator; deliver shock, CPR, oxygen, magnesium, electrolyte,
medication, infusion, pacing, or isoproterenol; assess capture; choose a device; determine disposition
or prognosis; or predict recurrence or outcome.

### Wave C cardiology slice 12: hyperkalemic conduction disturbance

The twelfth cardiology slice begins after reported emergency treatment for nonhemolyzed potassium
6.9 mmol/L with sinus bradycardia 38/min, attenuated P waves, and QRS 154 ms. The current authored
record shows a pulse, preserved pressure and perfusion, sinus 52/min with QRS 112 ms after reported
calcium, and potassium still 6.9 mmol/L. The dedicated teaching waveform is not a diagnostic ECG,
and its improvement does not establish potassium lowering or exclude another conduction cause.

Learners reconcile the serial chemistry and conduction record before reviewing calcium-associated
membrane stabilization. Shift and glucose surveillance, potassium-removal and contributor
ownership, and restraint from permanent-device conclusions during correction of a reversible
disturbance may proceed in any order. Only after those 3 lanes can a later fixed panel show potassium
5.8 mmol/L, glucose 92 mg/dL, sinus 62/min, and QRS 98 ms; a further elapsed tick records ownership,
rebound and deterioration triggers, and reassessment handoff. This is distinct from the Emergency
Medicine hyperkalemia lab, which owns initial treatment intent, and from complete heart block, which
owns pacing-capable escalation for persistent acquired block without an identified reversible cause.
The lab does not examine; acquire or interpret specimens, ECG, monitoring, or laboratory data;
diagnose cause; select or deliver calcium, insulin, glucose, beta agonist, potassium removal,
dialysis, pacing, or a device; model live kinetics; assess capture; determine disposition or
prognosis; or predict recurrence, benefit, or outcome.

### Wave C cardiology slice 13: pericardial tamponade

The thirteenth cardiology slice begins 2 hours after reported urgent image-guided drainage for
medical pericardial tamponade. A fixed pretreatment record combines progressive dyspnea and
orthopnea, impaired perfusion, BP 88/64 mmHg, pulsus paradoxus 16 mmHg, and a formal echo report
with a 30 mm circumferential effusion, right-atrial systolic and right-ventricular early-diastolic
collapse, and a plethoric IVC. The combination establishes tamponade only in this authored case;
one sign, effusion dimension, or echo feature is not a universal diagnostic rule.

The treating team reports 420 mL image-guided drainage and a retained pericardial catheter. Current
fixed findings show improved dyspnea, HR 88/min, BP 116/72 mmHg, warm perfusion, and an 8 mm residual
effusion without chamber collapse. Learners reconcile the trajectory and reported response, then
review etiology and recurrence surveillance in parallel. Active lung adenocarcinoma and
serosanguineous fluid raise concern but do not prove malignant involvement; selected studies remain
pending. A strictly later fixed report preserves brief stability, 55 mL additional reported output,
and a 9 mm residual effusion without chamber collapse before pending results, reaccumulation,
bleeding, catheter, respiratory, rhythm, complication, deterioration, Cardiology, and oncology work
is handed off. This is distinct from Emergency Medicine's penetrating-trauma collapse and immediate
trauma/surgical-control intent. The lab does not examine; acquire or interpret monitoring, ECG,
echo, catheter, output, or specimens; diagnose etiology; select or deliver fluid, medication,
drainage, surgery, or another treatment; manipulate or remove a catheter; manage complications;
determine disposition or prognosis; or predict recurrence or outcome.

### Wave C cardiology slice 14: right-ventricular infarction

The fourteenth cardiology slice starts in a PCI-capable cardiac unit with an activated primary-PCI
pathway for ongoing inferior STEMI. Fixed 12-lead, right-sided-lead, and focused-echo reports support
acute right-ventricular involvement while the patient remains pulse-present, alert, warm, modestly
hypotensive, bradycardic, and normally oxygenated on room air, with elevated JVP and clear lungs.
No single lead, pressure, venous-pressure, lung, or echo finding becomes a universal diagnostic or
treatment rule, and the supplied reports do not teach acquisition or interpretation.

Learners reconcile the whole trajectory and fixed RV phenotype, then preserve the already active
reperfusion and rhythm-conduction pathway while recording individualized support guardrails in
parallel. The case-specific hypotension makes nitrate and reflex diuresis inappropriate choices,
but the lab supplies no universal prohibition, blind fluid load, fixed bolus, pressure target, drug,
or dose. A strictly later handoff keeps ischemia, perfusion, preload, congestion, bradyarrhythmia,
atrioventricular block, mechanical alternatives, reperfusion, treatment selection, owners, and
change triggers open. This is distinct from first-contact STEMI activation, persistent post-PCI
shock escalation, and chronic pressure-loaded RV failure. The lab does not examine; acquire or
interpret ECG, echo, monitoring, or laboratory data; diagnose a real patient; prescribe or deliver
fluid, oxygen, medication, pacing, or another treatment; perform PCI or another procedure; select a
device; determine disposition or prognosis; or predict resolution or outcome.

### Wave C cardiology slice 15: hypertensive emergency

The fifteenth cardiology slice is a monitored renal-retinal hypertensive-emergency consultation.
A 3-week medication-access interruption and 3 days of headache and blurred vision accompany
correctly repeated pressures near 236/132 mmHg, but the number is not the diagnosis. Fixed bilateral
retinal hemorrhage, cotton-wool-spot, optic-disc-edema, creatinine, proteinuria, and hematuria reports
establish acute target-organ injury in this authored case. Current supplied findings do not establish
pulmonary edema, ACS, acute aortic syndrome, stroke, ICH, pregnancy, or another compelling phenotype;
those snapshots remain change triggers rather than permanent exclusions.

Learners reconcile measurement and trajectory, review acute organ injury, then review phenotype and
open causes while recording prompt monitored controlled-reduction intent in parallel. No agent,
dose, infusion rate, fixed percentage, universal pressure target, or rapid normalization is selected.
Strictly later 45-minute and 3-hour reports show directional pressure and symptom improvement while
visual symptoms and kidney injury remain unresolved. The lab does not measure pressure; examine;
perform fundoscopy; acquire or interpret ECG, imaging, monitoring, urine, or laboratory data;
diagnose a real patient; select, titrate, prescribe, or deliver drugs, fluid, oxygen, ventilation, or
another treatment; perform a procedure; determine disposition or prognosis; or predict outcome.

### Wave C cardiology slice 16: pacemaker capture failure

The sixteenth cardiology slice is an acute, pulsed pacemaker capture-failure reassessment. A
76-year-old pacemaker-dependent patient develops presyncope, mechanical pulse 32/min, and BP
84/52 mmHg while a fixed report shows ventricular pacing artifacts that intermittently lack a
following paced QRS. Pulse and pleth follow actual QRS complexes rather than isolated artifacts, so
electrical artifacts do not become proof of mechanical capture.

Learners reconcile pulse, perfusion, and the authored pacing pattern first. Acute bradycardia rescue,
backup pacing readiness, and device expertise open immediately; device-system and cause review run
in parallel and do not delay rescue. Fixed interrogation, trend, ECG, imaging, laboratory, pocket,
and medication-context reports support concern without assigning one mechanism or converting an
output, threshold, impedance, or pacing percentage into a universal cutoff. After all three lanes
and elapsed time, an experienced team reports restored electrical and mechanical capture at 70/min
and BP 114/68 mmHg without exposing a setting or implying learner programming. A second elapsed
handoff keeps capture surveillance, rescue triggers, system integrity, definitive lead or generator
choices, and electrophysiology ownership open. The lab does not examine; palpate a pulse; acquire or
interpret ECG, monitoring, imaging, laboratory, or interrogation data; apply a magnet; test,
interrogate, or program a device; select output, mode, drug, temporary pacing, lead revision,
extraction, or generator replacement; deliver pacing or treatment; determine disposition or
prognosis; or predict durable capture, repair, or outcome.

### Wave C cardiology slice 17: transcutaneous pacing mechanical-capture reassessment

The seventeenth cardiology slice begins with a pulsed complete-heart-block emergency immediately
before an experienced team starts transcutaneous pacing. The ventricular rate and central pulse are
24/min, BP is 70/40 mmHg, and the patient is confused with cool perfusion. A fixed report then shows
pacing stimuli at 70/min, each followed by a broad QRS and distinct T wave, establishing authored
electrical capture rather than artifact. The patient becomes unresponsive with agonal breaths; a
fixed 10-second assessment reports no central pulse, nonpulsatile arterial and pleth waveforms, and
no measurable BP. Electrical capture has not produced mechanical capture or circulation.

Learners reconcile the fixed electrical and mechanical evidence, immediately activate the
nonshockable pulseless response, then review open causes and future pacing-bridge needs without
interrupting arrest care. A strictly later handoff preserves active resuscitation, capture findings,
cause work, bridge questions, and named owners. The lesson intentionally reports no return of
spontaneous circulation, later perfusion, neurologic trajectory, disposition, prognosis, or outcome.
It does not examine or palpate; acquire or interpret ECG, monitoring, laboratory, or imaging data;
place pads; expose or select a pacing rate, output, current, pulse width, energy, drug, dose,
sedation, or modality; operate a pacer; deliver pacing, CPR, or treatment; perform a procedure; or
choose disposition or outcome.

#### Respiratory medicine: 15

Acute severe asthma; COPD exacerbation; community-acquired pneumonia with hypoxemia; pulmonary
embolism; acute pulmonary edema respiratory-support reassessment; spontaneous tension pneumothorax post-drainage reassessment; large unilateral pleural effusion reassessment; mucus plugging;
opioid-related hypoventilation; neuromuscular respiratory failure; obesity hypoventilation;
noninvasive-ventilation selection; high-flow oxygen escalation; oxygen-device failure; acute
tracheostomy obstruction requiring assessment, oxygenation, escalation, and a bounded device pathway.

### Wave C respiratory-medicine slice 1: acute severe asthma reassessment

The first respiratory-medicine slice begins 75 minutes into acute care, after an experienced team
has delivered controlled oxygen, 3 inhaled short-acting bronchodilator plus antimuscarinic cycles,
systemic corticosteroid, and IV magnesium for poor response. Arrival words-only speech, RR 36/min,
room-air SpO₂ 89%, and fixed PEF 28% predicted have progressed to drowsiness, confusion, inability to
speak, a quiet chest with weakening effort, RR 18/min, SpO₂ 93% in an authored nominal 35% oxygen condition, and
unperformable PEF. The lower respiratory rate is authored fatigue, not improvement. Fixed blood gas
reports change from pH 7.45/PaCO₂ 31/PaO₂ 61 mmHg to pH 7.24/PaCO₂ 58/PaO₂ 68 mmHg.

Learners reconcile verified treatment against the worsening whole-patient trajectory, recognize
evolving respiratory failure, and activate critical-care and airway-capable
support before reviewing dangerous alternatives, dynamic hyperinflation, air trapping, hypotension,
barotrauma, mucus plugging, and expert ventilation risks. A strictly later handoff preserves active
respiratory failure, current evidence, unresolved causes, deterioration triggers, and named owners.
No treatment-response panel, resolution, disposition, prognosis, or outcome follows. The lesson does
not examine; measure PEF; acquire or interpret blood gas, imaging, or monitoring; diagnose; repeat
or deliver medication or oxygen; select a drug, dose, ventilation device, airway procedure,
sedation, neuromuscular blockade, ventilator setting, or permissive-hypercapnia target; perform a
procedure; determine disposition or prognosis; or predict outcome. This is distinct from the
Emergency Medicine adult-asthma lab, which owns first-contact severity and initial treatment only.
The live capnogram uses a generic severe-obstruction shape so it does not contradict the authored
quiet-chest state; it remains pattern rehearsal rather than patient-specific quantitative data.

### Wave C respiratory-medicine slice 2: COPD exacerbation transition reassessment

The second respiratory-medicine slice begins on hospital day 3 after verified experienced-team
controlled oxygen, bronchodilator and antimuscarinic therapy, systemic corticosteroid, antibiotic
treatment for the authored indication, and 12 hours of noninvasive ventilation. Admission acidotic
hypercapnic failure has improved, but a fixed corridor report shows marked dyspnea after 30 m and
SpO₂ 86%, compared with a documented pre-admission 200 m range and resting room-air SpO₂ 92%.

Learners distinguish recovery from readiness, review residual respiratory and oxygen uncertainty
without declaring long-term oxygen eligibility, assign maintenance-treatment, acute-course, and
inhaler-technique review, coordinate pulmonary rehabilitation, self-management, comorbidity review,
and early and later follow-up, then complete a strictly elapsed unresolved-work handoff. The lesson
does not examine; acquire or interpret blood gas, oximetry, imaging, spirometry, or exercise testing;
deliver or prescribe oxygen, medication, ventilation, or treatment; select an inhaler, drug, dose,
device, or duration; perform or grade technique; enroll rehabilitation; guarantee access; assess a
home; determine discharge, disposition, prognosis, readmission risk, recovery, or outcome. This is
distinct from Emergency Medicine's first-contact COPD treatment lab and Critical Care's intubated
auto-PEEP mechanics lab.

### Wave C respiratory-medicine slice 3: hypoxemic community-acquired pneumonia reassessment

The third respiratory-medicine slice presents a spontaneously breathing 62-year-old woman with a
radiographically supported community-acquired pneumonia pattern, pulse-coherent room-air SpO₂ 85%,
RR 32/min with accessory-muscle use, PaO₂ 51 mmHg, preserved mentation and perfusion, and fixed
right middle- and lower-lobe consolidation. RR at least 30/min, PaO₂/FiO₂ no greater than 250, and
multilobar infiltrates supply 3 authored ATS/IDSA minor severe-CAP features, while major criteria,
shock, invasive ventilation, and a proven pathogen remain absent.

Learners corroborate hypoxemia and record immediate support and experienced-help intent, reconcile
the pneumonia evidence while preserving dangerous alternatives and complications, use whole-patient
severity to activate higher-acuity review without turning a criteria count into automatic
disposition, record guideline-bounded testing and empiric-treatment ownership, and complete a
strictly elapsed active-care handoff. The lesson does not examine; acquire or interpret monitoring,
blood gas, imaging, ECG, culture, viral, or laboratory data; calculate a patient-care score; select
or deliver oxygen, a device, flow, FiO₂, high-flow therapy, noninvasive or invasive ventilation,
fluid, antibiotic, corticosteroid, vasopressor, or other treatment; select a drug, combination,
dose, duration, route, or resistant-pathogen regimen; perform a procedure; determine disposition,
prognosis, pathogen, treatment response, or outcome. This remains distinct from Critical Care's
intubated oxygen-delivery troubleshooting and ARDS ventilation labs and preserves later respiratory
device-selection and Infectious Disease antimicrobial-management slices.

### Wave C respiratory-medicine slice 4: persistent dyspnea after pulmonary embolism

The fourth respiratory-medicine slice begins 4 months after objectively confirmed acute pulmonary
embolism and verified therapeutic anticoagulation. A previously active patient now stops after
about 150 m; a fixed supervised walk documents marked limitation and exertional desaturation while
resting pressure, perfusion, and oxygenation remain stable. Fixed echo and V/Q SPECT reports raise
concern for chronic thromboembolic pulmonary disease without establishing CTEPD or CTEPH.

Learners reconcile the longitudinal course, review function and current recurrence and bleeding
warnings, integrate fixed cardiac, perfusion, and exercise evidence while preserving alternative
causes, coordinate pulmonary-vascular expert evaluation and continued anticoagulation ownership,
then complete a strictly elapsed unresolved-work handoff. The lesson does not examine; acquire or
interpret testing; categorize acute PE severity; select, dose, stop, switch, or set duration for
anticoagulation; adjudicate bleeding; prescribe oxygen or rehabilitation; select pulmonary-
hypertension therapy, surgery, balloon angioplasty, or another treatment; perform a procedure;
diagnose CTEPD or CTEPH; decide operability, disposition, prognosis, recovery, recurrence, or
outcome. This longitudinal respiratory niche is distinct from Emergency Medicine's acute C3R-to-E1
deterioration and Critical Care's E2R shock and ECMO bridge.

### Wave C respiratory-medicine slice 5: acute pulmonary edema respiratory-support reassessment

The fifth respiratory-medicine slice begins 30 minutes after an experienced team has started
noninvasive positive-pressure support with titrated oxygen and delivered syndrome treatment for a
fixed hypertensive acute pulmonary edema presentation. Instead of the improvement authored in the
Emergency Medicine lab, the patient is now drowsy with shallow RR 12/min, SpO₂ 86% during reported
support, and fixed pH 7.18, PaCO₂ 68 mmHg, and PaO₂ 58 mmHg. Pressure and central perfusion remain
present while congestion persists; the lower rate is fatigue rather than improvement.

Learners reconcile initial care and trajectory, recognize progressive respiratory failure from the
whole mentation, effort, oxygenation, ventilation, and acid-base pattern, review pressure, perfusion,
congestion, alternatives, and precipitants, activate respiratory, critical-care, and airway-capable
experienced help, then complete a strictly elapsed active-failure handoff. The lesson does not
examine; acquire or interpret tests; select or operate an oxygen or ventilation device; choose an
interface, flow, FiO₂, mode, pressure, PEEP, drug, dose, or treatment; intubate or perform an airway
procedure; determine disposition or prognosis; or predict response, resolution, or outcome. This is
distinct from Emergency Medicine's first-contact rescue, Cardiology's 24-hour decongestion and
transition review, and the later Respiratory Medicine NIV-selection lab.

### Wave C respiratory-medicine slice 6: spontaneous tension pneumothorax post-drainage reassessment

The sixth respiratory-medicine slice begins 6 hours after an experienced team has immediately
treated a fixed spontaneous right tension-pneumothorax pattern and placed a pleural drain. Severe
dyspnea, hypoxemia, hypotension, confusion, cool perfusion, and markedly reduced right ventilation
have improved to alert full-sentence speech, HR 96/min, RR 22/min, BP 108/64 mmHg, room-air SpO₂
93%, warm perfusion, and improved but still reduced right air entry. A fixed radiograph reports
partial re-expansion. A fixed observation record reports an upright bottle below the insertion
site, an intact visible connection, respiratory swing, intermittent bubbling, and an intact
dressing. Improvement does not establish durable drain function, full re-expansion, or resolution.

Learners reconcile the prior event and experienced-team drainage, review current safety and the
authored response, then open parallel drain-system/complication and cause/recurrence-prevention
planning lanes. A strictly later handoff preserves persistent-air-leak questions, patency and
re-expansion concerns, complication and recurrent-deterioration triggers, patient preferences, and
named pleural and thoracic owners. The lesson does not examine; acquire or interpret tests; inspect,
manipulate, clamp, flush, apply suction to, remove, replace, or insert a drain; select a device,
site, technique, oxygen target, drug, dose, pleurodesis, thoracoscopy, surgery, or treatment;
perform decompression or another procedure; determine disposition or prognosis; or predict
recurrence, resolution, or outcome. It contains no live tension-pneumothorax event and is distinct
from Emergency Medicine's penetrating-trauma rescue and Anesthesia's positive-pressure emergency.

### Wave C respiratory-medicine slice 7: large unilateral pleural effusion reassessment

The seventh respiratory-medicine slice presents 6 weeks of progressive dyspnea, cough, and left
chest heaviness with stable perfusion, mild room-air hypoxemia, markedly reduced left basal
ventilation claims, and fixed radiograph and thoracic-ultrasound reports supporting a large
predominantly free-flowing unilateral effusion. Size and appearance do not establish urgency,
procedural safety, or cause by themselves.

Learners record experienced pleural-team, image-guided diagnostic and slow symptom-relief
aspiration intent without choosing a site, device, technique, rate, or volume. After elapsed time,
a fixed experienced-team report gives 850 mL removed before persistent cough and mild chest
tightness prompt stopping; this is a case fact, not a target or maximum. Symptoms, oxygenation, and
expansion improve while residual effusion and cause remain open. Learners review an authored paired-
fluid exudative classification without acquiring, calculating, or interpreting it, coordinate
pending-result and definitive-evaluation ownership, then complete a strictly elapsed handoff. No
examination, live test, calculation, diagnosis, aspiration, drain action, biopsy, catheter,
pleurodesis, surgery, oxygen, drug, treatment, disposition, prognosis, recurrence, or outcome is
modeled. This is distinct from pulmonary-edema congestion, pneumonia, pleural-air rescue, and
post-drain pneumothorax surveillance.

### Wave C respiratory-medicine slice 8: bronchiectasis mucus plugging with focal collapse

The eighth respiratory-medicine slice presents a spontaneously breathing 59-year-old woman with
established bronchiectasis whose previously independent airway-clearance routine has become
ineffective over 2 days. She has short-sentence speech, weak cough, thicker retained secretions,
RR 28/min, room-air SpO₂ 88%, stable perfusion, and markedly reduced left-base air entry. Fixed
radiograph and CT reports show left-lower-lobe volume loss and endobronchial material. Mucus
impaction is the authored working pattern, while infection, blood, aspiration, foreign body, occult
obstruction, compression, and other causes remain open.

Learners reconcile the whole-patient trajectory and fixed evidence, then record experienced
respiratory-physiotherapy review and a supported individualized airway-clearance trial without
selecting a technique, device, position, pressure, duration, frequency, oxygen setting, or drug.
After elapsed time, a fixed report shows stronger cough, easier speech, lower work, improved room-
air SpO₂, and partial re-expansion with residual focal collapse. Learners connect experienced
respiratory and airway-capable evaluation without making bronchoscopy routine, then complete a
strictly elapsed unresolved-work handoff. The lesson does not examine; test cough; assess sputum;
acquire or interpret imaging, microbiology, or monitoring; diagnose; deliver airway clearance,
oxygen, suction, medication, or treatment; select or perform bronchoscopy or another procedure;
determine disposition or prognosis; or predict resolution, recurrence, durable benefit, or outcome.
It is distinct from Critical Care's intubated artificial-airway suction and ventilator-mechanics lab.

### Wave C respiratory-medicine slice 9: chronic opioid-related hypoventilation

The ninth respiratory-medicine slice is a longitudinal respiratory and sleep-clinic reassessment,
not an acute overdose or postoperative rescue. A 61-year-old woman with 8 years of prescribed
opioid exposure has 6 months of shallow irregular sleep breathing, morning headaches, unrefreshing
sleep, and daytime sleepiness. Her awake room-air SpO₂ is 94% with stable perfusion and a fixed
near-normal awake blood gas. An attended polysomnogram with carbon-dioxide monitoring reports a
sustained rise from 46 to 58 mmHg during sleep plus separately reported central and obstructive
events. The learner does not acquire, score, or interpret either test.

Learners first reconcile the longitudinal exposure and whole-patient trajectory, then review fixed
awake-and-sleep evidence and open medication, sleep, pulmonary, neurologic, chest-wall, cardiac,
endocrine, and other contributors in parallel. Only after both lanes may they coordinate
prescriber, sleep, respiratory, pharmacy, and primary-care ownership around pain goals, medication
safety, education, diagnostic work, and reassessment, followed by a strictly elapsed handoff. The
lesson does not diagnose; calculate morphine equivalents; select, stop, substitute, or taper a drug;
select or deliver naloxone, oxygen, PAP mode or settings, ventilation, or treatment; determine
disposition or prognosis; or predict response or outcome. It is distinct from Anesthesia's PACU
opioid ventilatory-impairment rescue, Emergency Medicine's fentanyl-toxicity rescue and recurrence,
and the later obesity-hypoventilation and NIV-selection labs.

### Wave C respiratory-medicine slice 10: neuromuscular respiratory failure

The tenth respiratory-medicine slice is progressive ventilatory and cough failure in established
ALS, not acute myasthenic crisis, Guillain-Barré respiratory decline, postoperative residual
neuromuscular blockade, or a support-device selection exercise. A 58-year-old man has 3 months of
declining endurance and cough plus 2 weeks of orthopnea, sleep disruption, morning headache,
daytime sleepiness, short-phrase speech, and difficulty clearing saliva. Fixed qualified reports
provide mild bulbar weakness, supine abdominal paradox, serial seated and supine FVC, SNIP, peak
cough flow, and hypercapnia despite a quiet awake room-air SpO₂ of 94%.

Learners reconcile the longitudinal whole-patient trajectory and recognize the convergent authored
failure pattern without relying on saturation or one universal mechanics cutoff. Experienced
respiratory-ventilation, critical-care, and airway-capable escalation proceeds in parallel with
cough, secretion, bulbar, test-quality, trigger, and alternative-cause review. Only after both lanes
may learners coordinate patient-centered respiratory, neurology, speech, nutrition, physiotherapy,
nursing, primary-care, caregiver, communication, preference, and follow-up ownership, followed by a
strictly elapsed unresolved-work handoff. The lesson does not examine; acquire, perform, or interpret
testing; diagnose; select or deliver oxygen, ventilation, interfaces, settings, cough assistance,
airway clearance, suction, medication, nutrition, or treatment; perform an airway procedure;
determine disposition or prognosis; or predict response or outcome.

### Wave C respiratory-medicine slice 11: obesity hypoventilation

The eleventh respiratory-medicine slice is a stable respiratory and sleep-clinic reassessment, not
acute-on-chronic ventilatory failure and not the later PAP/NIV-selection lab. A 54-year-old woman has
12 months of snoring, witnessed obstructive events, unrefreshing sleep, morning headache, daytime
sleepiness, impaired concentration, and declining walking tolerance. She remains alert and
comfortable at rest. Fixed qualified reports provide an authored BMI of 43.3 kg/m², bicarbonate
31 mmol/L, a compensated awake room-air gas with PaCO₂ 52 mmHg, and attended sleep evidence of
predominantly obstructive events plus sustained sleep hypoventilation.

Learners first reconcile symptoms, daytime function, physiology, and current safety without reducing
the person to body size. Fixed awake evidence and fixed sleep-plus-open-cause evidence may then be
reviewed in either order. Only after both lanes may learners record the convergent authored working
pattern without diagnosing from BMI, bicarbonate, saturation, PaCO₂, or AHI alone, coordinate
respectful respiratory, sleep, primary-care, cardiometabolic, and weight-health ownership, and
complete a strictly elapsed unresolved-work handoff. The lesson does not examine; calculate BMI or
AHI; acquire, score, or interpret testing; diagnose; select PAP, oxygen, an interface, mode, setting,
drug, nutrition plan, weight target, bariatric procedure, or treatment; counsel driving; determine
disposition or prognosis; or predict response or outcome.

### Wave C respiratory-medicine slice 12: bilevel NIV selection in acute COPD

The twelfth respiratory-medicine slice begins after 60 minutes of verified experienced-team care
for an acute COPD exacerbation. A 64-year-old woman remains alert and cooperative but speaks in
short phrases with accessory-muscle use, RR 30/min, controlled-oxygen SpO₂ 90%, and a fixed gas of
pH 7.28 and PaCO₂ 68 mmHg. Authored suitability findings include a patent airway, current secretion
handling, stable perfusion, discussed preferences, continuous observation, serial reassessment, and
airway-capable rescue readiness without turning these facts into a permanent contraindication list.

Learners reconcile the persistent acidotic hypercapnic trajectory and suitability before choosing
among bilevel NIV, CPAP alone, and high-flow nasal oxygen alone. The 2 alternatives provide calm,
nonmutating explanations; the accepted bilevel choice records support intent only. After strictly
elapsed time, a fixed first-hour report shows improved comfort, speech, work, respiratory rate, pH,
and PaCO₂ without proving durable success. Learners preserve whole-patient failure triggers and
rapid rescue, then complete another strictly elapsed handoff. The lesson does not examine, acquire
or interpret tests, diagnose, choose oxygen or NIV hardware, interface, fit, mode, pressure, PEEP,
backup rate, trigger, cycle, flow, FiO₂, drug, sedation, suction, intubation, or treatment; operate a
device; perform a procedure; decide a ceiling of care, weaning, disposition, or prognosis; or predict
outcome. It is distinct from initial COPD treatment, day-3 recovery readiness, pulmonary-edema NIV
failure, chronic OHS or neuromuscular support planning, and the later HFNC-escalation lab.

### Wave C respiratory-medicine slice 13: high-flow nasal oxygen escalation

The thirteenth respiratory-medicine slice is a bounded support-selection lesson for de novo
nonhypercapnic hypoxemic respiratory failure, not oxygen-device training. A 52-year-old man remains
alert and cooperative but in short phrases with accessory-muscle use, RR 34/min, pulse-coherent
SpO₂ 88%, and a fixed gas of pH 7.46, PaCO₂ 31 mmHg, and PaO₂ 55 mmHg after 20 minutes of
verified functioning reservoir-mask oxygen. The nominal monitor FiO₂ is an authored display proxy,
not a precise delivered fraction, so the lesson does not calculate a PaO₂/FiO₂ ratio or ROX index.

Learners reconcile the inadequate conventional-support trajectory and fixed suitability, preference,
monitoring, and airway-rescue facts before choosing among a closely monitored high-flow nasal oxygen
trial, unchanged conventional oxygen, and bilevel NIV first. The 2 alternatives provide calm,
nonmutating explanations. After strictly elapsed time, a fixed 30-minute report shows improved speech,
work, respiratory rate, oxygenation, and gas exchange without proving resolution or durable success.
Learners preserve whole-patient failure triggers and rapid airway-capable reassessment, then complete
another strictly elapsed handoff. The lesson does not examine; acquire or interpret tests; diagnose;
calculate ROX or a PaO₂/FiO₂ ratio; select or deliver oxygen, medication, suction, mask ventilation,
intubation, or treatment; choose or operate a source, device, cannula, fit, flow, temperature,
humidification, FiO₂, oxygen target, NIV mode, interface, pressure, PEEP, backup rate, trigger, or
cycle; perform proning or another procedure; decide weaning, disposition, or prognosis; or predict
durable success or outcome. It is distinct from the preceding acidotic hypercapnic COPD NIV lab and
the acute pulmonary-edema support-failure lesson.

### Wave C respiratory-medicine slice 14: portable oxygen source failure

The fourteenth respiratory-medicine slice is a patient-and-system-safety lesson during
intrahospital transport, not oxygen-device training. A 67-year-old woman with fibrotic interstitial
lung disease was alert and stable at SpO\u2082 93% on verified ward oxygen before departure. Four
minutes after transfer to a portable source, she is frightened and dyspneic in short sentences with
RR 30/min, HR 106/min, and a strong regular pleth accompanying SpO\u2082 84%, while spontaneous
breathing and warm perfusion remain. An attached cannula, selected 4 L/min, and nominal monitor
FiO\u2082 are explicitly not proof of delivered oxygen.

Learners reconcile the credible person-and-signal change before choosing among an immediate verified
oxygen bridge with experienced help, waiting for another gas, and continuing transport. The 2
alternatives provide calm, nonmutating explanations. Support precedes troubleshooting. A fixed
qualified source-to-patient review then reports a positioned patent cannula and tubing but no
remaining pressure or downstream flow from the portable source. Learners record qualified
restoration of the established pathway from a checked replacement source with independent backup,
then review a strictly elapsed fixed 3-minute delivery and whole-person response before another
elapsed systems-focused handoff. The lesson does not examine; measure saturation or flow; acquire or
interpret tests; diagnose; inspect, handle, connect, replace, repair, or operate a cylinder, valve,
regulator, flowmeter, tubing, cannula, or device; calculate cylinder duration; choose a source,
device, interface, flow, FiO\u2082, target, prescription, drug, ventilation, or treatment; deliver
oxygen; perform a procedure; decide transport readiness, disposition, or prognosis; or predict
durable restoration or outcome. It is distinct from pulse-oximeter artifact, ventilator-circuit
disconnection, HFNO escalation, and clinical support failure.

### Wave C respiratory-medicine slice 15: acute tracheostomy obstruction

The fifteenth respiratory-medicine slice is an anatomy-first artificial-airway emergency lesson,
not suction or tube-change training. A 64-year-old man with an established cuffless dual-cannula
tracheostomy, documented patent native upper airway, spontaneous breathing, and no ventilator
dependence deteriorates from clean-pleth SpO₂ 96% and RR 18/min to agitation, one-word
communication, marked effort, RR 34/min, HR 118/min, and clean-pleth SpO₂ 82%. Fixed qualified
findings report scant tracheostomy airflow, faint oral airflow, absent tracheostomy waveform carbon
dioxide, a pulse, and no external source or tubing fault. Absent capnography is not diagnostic alone.

Learners reconcile the tracheostomy-versus-laryngectomy anatomy and converging patency evidence,
then choose immediate expert help and qualified oxygenation to face and tracheostomy instead of
waiting for imaging or trialing ventilation through an unverified path. A fixed review localizes an
occluded removable inner cannula. Learners connect an experienced-team inner-cannula action while
the outer tube remains in place; the canonical tracheostomy gas path, capnography, oxygenation, and
ventilation respond. A strictly elapsed fixed 2-minute whole-person report and another elapsed
active-risk handoff follow. The lesson does not examine; acquire or interpret tests; diagnose;
select or deliver oxygen, ventilation, humidification, drugs, or treatment; handle a cap, valve,
cannula, catheter, cuff, or tube; suction; exchange a tube; ventilate; intubate; perform bronchoscopy
or another procedure; decide disposition or prognosis; or predict durable resolution or outcome.
It does not generalize to laryngectomy, a fresh stoma, another device, upper-airway obstruction,
ventilator dependence, or arrest.

### Wave D pediatrics slice 1: pediatric respiratory distress

The Pediatrics foundation begins with an undifferentiated whole-child respiratory-distress lesson,
not a disease-specific treatment algorithm. A previously well 6-year-old girl weighing 20 kg has
clean pulse-coherent room-air SpO₂ 87%, HR 138/min, RR 46/min, short-phrase speech, grunting, nasal
flaring, marked recession, and equally reduced bilateral air entry, with warm perfusion, strong
pulses, and spontaneous breathing. Learners reconcile appearance, breathing, circulation, and
monitor evidence, then activate experienced pediatric help, qualified oxygenation, continuous
monitoring, and rescue readiness without waiting for imaging, a complete history, or a diagnosis.

A strictly elapsed fixed 5-minute report improves SpO₂ to 94% while grunting, recession, short
phrases, tachypnea, and reduced air entry persist. Another strictly elapsed panel then shows
drowsiness, weak one-word response, shallow irregular breathing, weaker effort, markedly reduced
air movement, RR 28/min, and SpO₂ 90% on unchanged authored support. The falling rate and quieter
effort are fatigue, not recovery. Learners activate airway-capable pediatric rescue and complete an
elapsed active-risk handoff. The lab does not examine; acquire or interpret tests; diagnose; select
or deliver oxygen, a device, flow, fraction, target, drug, dose, fluid, ventilation, airway maneuver,
procedure, or treatment; calculate a score; determine disposition or prognosis; or predict recovery
or outcome. Bronchiolitis, croup, status asthmaticus, infection, sepsis, anaphylaxis, aspiration,
foreign-body obstruction, and other causes remain open for later distinct labs.

### Wave D pediatrics slice 2: bronchiolitis

The second Pediatrics lab is a cause-consistent supportive-care reassessment, not another fatigue
or airway-rescue branch. A previously well 12-month-old boy weighing 10 kg is on illness day 4 with
the qualified clinical pattern of bronchiolitis, persistent clean-pleth SpO₂ 88%, diffuse crackles
and wheeze, moderate recession, intake near 40% of usual, and reduced wet diapers, while remaining
awake, perfused, spontaneously breathing, and free of current apnea. Learners reconcile the fixed
trajectory, record the supplied clinical pattern, and activate experienced-team oxygenation,
monitoring, feeding, and hydration review without choosing a test, device, setting, medicine, route,
volume, suction technique, or treatment.

After elapsed time, improved SpO₂ does not overrule persistent work of breathing or inadequate safe
intake. A strictly later fixed one-hour report shows partial stabilization only, followed by an
elapsed handoff of respiratory, feeding, hydration, apnea, fatigue, caregiver, and ownership risks.
Routine radiography, saturation-only observation, albuterol, antibiotics, and discharge from one
number are calm nonmutating choices; the copy preserves context-dependent exceptions. The lab does
not examine, diagnose, identify a virus, acquire or interpret tests, select or deliver oxygen,
feeding, fluids, medicines, suction, ventilation, a procedure, or treatment, determine disposition,
or predict durable recovery or outcome.

### Wave D pediatrics slice 3: croup

The third Pediatrics lab is a calm upper-airway reassessment, distinct from generic respiratory
failure and infant lower-airway disease. A previously well 3-year-old girl weighing 15 kg has a
coryzal prodrome followed by bark, hoarseness, inspiratory stridor at calm rest, moderate recession,
and clean pulse-coherent room-air SpO₂ 96% while alert, warm, perfused, and consolable with her
caregiver. Learners reconcile the supplied whole-child pattern and dangerous-alternative guards,
then keep the child with her caregiver, minimize handling, and record experienced pediatric and
airway-capable support plus qualified-team corticosteroid and nebulized epinephrine intent.

A strictly elapsed fixed 20-minute report removes stridor at calm rest while bark and hoarseness
persist. Another strictly later observation shows mild recurrent stridor at rest and recession,
renewing experienced ownership before an elapsed active-risk handoff. Albuterol, routine imaging,
discharge after early improvement, and reassurance from normal saturation are calm nonmutating
choices. The lab does not examine the throat; diagnose; acquire or interpret tests; select or
deliver a drug, dose, route, concentration, repeat interval, oxygen interface or setting, nebulizer,
airway maneuver, ventilation, procedure, or treatment; decide disposition; or predict outcome.

### Wave D pediatrics slice 4: status asthmaticus after initial care

The fourth Pediatrics lab begins after a verified first hour of experienced-team severe-asthma
care, making it distinct from first-contact adult asthma and from the adult hypercapnic-failure
reassessment. A 10-year-old girl weighing 32 kg has established asthma, one prior PICU admission,
and a supplied child-specific peak-flow history. At minute 60 she remains alert and anxious with
one-word speech, marked recession, poor equal bilateral air entry, diffuse expiratory wheeze, and
an oxygen requirement despite the authored initial-care record. The learner reconciles prior care
and the whole-child trajectory, recognizes severe nonresponse without relying on one number, and
activates pediatric critical-care and airway-capable ownership before fatigue.

Experienced staff then own monitored, patient-specific intravenous magnesium as the supplied,
evidence-supported second-line pathway; the learner records team ownership and monitoring rather
than selecting a drug. A strictly elapsed minute-90 report shows improved speech, effort,
air entry, breathing, and oxygenation with residual obstruction and oxygen need, so an additional
elapsed handoff preserves toxicity surveillance, failure triggers, open alternatives, access and
adherence questions, caregiver context, and named owners. More learner-delivered albuterol, forced
peak flow, aminophylline selection, and discharge from saturation alone are calm nonmutating
choices. The lab does not examine, diagnose, score, test, choose or deliver a drug, dose, route,
oxygen setting, inhaler, nebulizer, intravenous access, infusion, airway care, procedure, or
treatment; determine disposition or prognosis; or predict outcome.

### Wave D pediatrics slice 5: pediatric sepsis without shock

The fifth Pediatrics lab separates infection-associated organ dysfunction from current shock so
the following septic-shock lab can own hemodynamic rescue. A previously well 6-year-old boy
weighing 20 kg has a probable but unconfirmed urinary source and a fixed experienced-team report
of thrombocytopenia and prolonged INR. A qualified report supplies 2 Phoenix coagulation points,
0 cardiovascular, respiratory, and neurological points, and pediatric sepsis without current
shock. The learner does not calculate Phoenix, which is classification after overt organ
dysfunction rather than an early screening tool.

Learners reconcile suspected infection, organ dysfunction, whole-child state, and verified care;
distinguish current sepsis from shock without treating preserved pressure as low risk; confirm
ongoing experienced ownership of the supplied evaluation and antimicrobial care, source work,
organ support, and serial reassessment;
then review source, organ, alternative-cause, and deterioration work. A strictly elapsed fixed
minute-120 report shows improved physiology but persistent coagulation dysfunction and unresolved
source, followed by another elapsed active-risk handoff. Exactly one positive action is visible at
each stage. The lab does not examine, screen, score, diagnose, acquire or interpret tests, identify
a pathogen, choose or deliver an antimicrobial, drug, dose, route, access, fluid, vasoactive,
oxygen, device, procedure, source control, or treatment, determine disposition or prognosis, or
predict recovery or outcome.

### Wave D pediatrics slice 6: pediatric septic shock after reassessed fluid

The sixth Pediatrics lab is a persistent-shock reassessment rather than an initial bundle or fluid
calculator. A previously well 4-year-old girl weighing 16 kg has a suspected but unconfirmed
intra-abdominal source. After supplied timely antimicrobial care and 2 individually reassessed
10 mL/kg balanced-crystalloid aliquots, she has worsening cool mottled perfusion, weak pulses,
refill 6 seconds, oliguria, hypotension, lactate 6.2 mmol/L, and new crackles and hepatomegaly.
Those congestion findings stop automatic fluid continuation but do not prove fluid causation.

A supplied expert report assigns 2 cardiovascular Phoenix points and no points in the other
components, establishing authored pediatric sepsis with cardiovascular dysfunction and therefore
septic shock. The learner reconciles the fixed care and whole-child trajectory, recognizes
persistent shock after fluid-by-fluid reassessment, activates experienced critical-care and
vasoactive ownership without waiting for central access, and escalates source-control evaluation in
parallel. A strictly elapsed minute-90 report shows partial stabilization with one unnamed
vasoactive, persistent lactate elevation, cool extremities, oliguria, crackles, hepatomegaly, and
unresolved source before another elapsed active-risk handoff. The lab does not teach a universal
fluid total, MAP target, first-line vasoactive, access route, or response; examine, score, test,
diagnose, choose or deliver a drug, fluid, device, procedure, or treatment; determine disposition or
prognosis; or predict recovery or outcome.

### Wave D pediatrics slice 7: dehydration with compensated hypovolemia

The seventh Pediatrics lab separates clinical dehydration with compensated volume depletion from
current shock and from the preceding infection-associated cases. A previously well 2-year-old girl
weighing 12 kg has 3 days of non-bloody watery diarrhea, vomiting, reduced intake and urine, and a
reliable same-scale weight decline. Dry mucosa, absent tears, mildly sunken eyes, and reduced turgor
support the supplied classification, while interactive mentation, warm normal-volume pulses,
refill 2 seconds, and preserved blood pressure support the no-current-shock boundary. Weight change
is one clue, not a learner-calculated dehydration percentage or intravascular deficit.

The learner reconciles the fixed loss and whole-child trajectory, recognizes compensated
dehydration with hypovolemia, and activates experienced rehydration ownership in parallel with
ongoing-loss, tolerance, alternative-cause, caregiver, and escalation review. A strictly elapsed
minute-60 report shows better interaction and hydration signs with one urine and another watery
stool before another elapsed active-risk handoff. The lab does not examine or weigh; calculate a
percentage, deficit, or maintenance requirement; acquire or interpret tests; diagnose; choose or
deliver a solution, route, volume, rate, access, electrolyte, drug, feeding plan, device, procedure,
or treatment; determine disposition or prognosis; or predict complete rehydration, recurrence,
recovery, or outcome.

The eighth Pediatrics lab is a pediatric diabetic-ketoacidosis reassessment, not a copy of the
adult potassium-to-insulin-to-dextrose pathway. A 9-year-old, 30 kg child has a supplied whole-child
history and fixed glucose, beta-hydroxybutyrate, pH, bicarbonate, potassium, and sodium panel.
Experienced teams supply the DKA classification; preserved orientation, perfusion, and pressure
support no current shock and no current authored cerebral-injury warning cluster while neurological and metabolic risk remains
active.

The learner reconciles the fixed illness and biochemical pattern, recognizes authored pediatric
DKA, and activates qualified DKA care in parallel with neurological, circulatory, rhythm,
electrolyte, glucose, ketone, acid-base, fluid-balance, output, and precipitant review. A strictly
elapsed minute-60 report shows improving but unresolved whole-child and biochemical findings before
another elapsed active-risk handoff. The lab exposes no examination, calculation, test, diagnosis,
fluid, insulin, glucose, electrolyte, access, pump, device, treatment, or disposition control and
does not prove treatment effect, DKA resolution, cerebral-injury exclusion, recovery, or outcome.

### Wave D pediatrics slice 9: hypoglycemic seizure after a brief stopped convulsion

The ninth Pediatrics lab is an afebrile hypoglycemic-seizure reassessment rather than a generic
status-epilepticus or febrile-seizure pathway. A previously well 5-year-old boy weighing 18 kg had
a witnessed generalized convulsion lasting about 90 seconds that stopped before the learner
surface opened. He is drowsy, localizes, opens his eyes to voice, breathes spontaneously, and is
not safe to swallow. Warm normal-volume pulses, refill 2 seconds, preserved pressure, and room-air
oxygenation accompany a supplied qualified glucose of 34 mg/dL. No fever, meningism, trauma,
focal deficit, known diabetes, or reported insulin or glucose-lowering medicine exposure is
authored, but these are snapshots and the cause remains open.

The learner reconciles the stopped convulsion, whole-child state, airway safety, circulation, and
glucose; recognizes supplied severe hypoglycemia; and activates immediate experienced rescue
ownership in parallel with cause and recurrence-risk review. A strictly elapsed minute-20 report
shows wakefulness, age-appropriate speech, no recurrent convulsion, glucose 86 mg/dL, and improved
vital signs before another elapsed active-risk handoff. The lab does not examine, test, diagnose,
choose or deliver glucose, glucagon, carbohydrate, fluid, anticonvulsant, route, concentration,
dose, access, infusion, feeding, oxygen, device, airway maneuver, procedure, or treatment;
determine disposition or prognosis; or prove causal treatment effect, durable euglycemia,
neurological recovery, etiologic closure, recurrence exclusion, or outcome.

### Wave D pediatrics slice 10: febrile seizure recovery and danger boundary

The tenth Pediatrics lab is a recovery and serious-illness reassessment after a brief stopped
febrile seizure, not active status treatment or a declaration that fever is benign. A previously
well, reportedly developmentally typical 2-year-old boy weighing 12 kg has 12 hours of fever,
rhinorrhea, and mildly reduced drinking before a first bilateral generalized convulsion lasting
about 3 minutes. It stops spontaneously before the learner surface without rescue medicine. He is
sleepy and clingy but responsive to his caregiver, breathing spontaneously, symmetrically moving,
warm and perfused, with temperature 39.0°C, HR 150/min, RR 30/min, BP 94/58 mmHg, and room-air
SpO₂ 98%. No routine glucose or other test is supplied.

The learner reconciles the event, recovery, fever, and whole-child state; recognizes a
febrile-seizure pattern with simple features to date while dangerous alternatives remain open;
and activates qualified fever-source and serious-illness care in parallel with infection,
recurrence, complex-feature, alternative-cause, caregiver-safety, and escalation review. A
strictly elapsed minute-30 report shows return to age-appropriate interaction with persistent fever
and no recurrent seizure or focal finding so far before another elapsed active-risk handoff. The
lab does not examine, measure, time, test, diagnose, choose or deliver an antipyretic,
antimicrobial, antiseizure or rescue medicine, fluid, oxygen, dose, route, access, device, airway
maneuver, procedure, or treatment; assess caregiver communication or first-aid performance;
determine disposition or prognosis; or prove confirmed simple classification, treatment effect,
fever source, CNS-infection exclusion, durable recovery, recurrence exclusion, or outcome.

### Wave D pediatrics slice 11: convulsive status after first-line care

The eleventh Pediatrics lab begins after first-line care and before refractory critical-care
management. A previously well 6-year-old girl weighing 20 kg has ongoing bilateral generalized
convulsions for 14 minutes 30 seconds without recovery. A supplied experienced-team record verifies
2 documented appropriate weight-based first-line benzodiazepine doses at minutes 5 and 10 without
showing a product, dose, concentration, route, access, preparation, or delivery control. She has a
pulse and spontaneous chest rise, but respiratory rate is not reliably countable during movement
and no capnography is supplied. Fixed qualified findings include HR 146/min, BP 106/68 mmHg,
temperature 37.2°C, pulse-coherent room-air SpO₂ 94%, warm perfusion, refill 2 seconds, and
point-of-care glucose 108 mg/dL.

The learner reconciles the seizure clock, supplied care, and whole-child state; recognizes
persistent pediatric convulsive status after first-line care; and activates qualified second-line
ownership without waiting for parallel airway, monitoring, cause, and refractory-boundary review.
A strictly elapsed minute-25 report states that visible convulsions have not been seen since minute
18, while the child remains drowsy, below baseline, and unsafe to swallow, before another elapsed
active-risk handoff. The lab does not time or examine the seizure, acquire or interpret monitoring,
glucose, laboratory, EEG, imaging, or lumbar-puncture findings, verify or select a drug, dose, route,
access, infusion, oxygen, suction, airway, procedure, or treatment, diagnose or treat a cause,
assess team performance, determine disposition or prognosis, or prove causal treatment effect,
electrographic or durable seizure control, recovery, recurrence exclusion, or outcome.

### Wave D pediatrics slice 12: anaphylaxis after first-line care

The twelfth Pediatrics lab begins 5 minutes after one supplied qualified community first-line dose.
A 6-year-old boy weighing 20 kg has mild asthma but no prior anaphylaxis. A witnessed insect sting is
reported at minute 0, while species, allergen, and causal trigger remain unconfirmed. Despite
qualified help, safe positioning, unspecified oxygen support, and one documented appropriate
intramuscular epinephrine dose at minute 5, he has persistent cough and diffuse wheeze, hoarse
one-to-two-word speech, repeated vomiting, pallor, drowsiness, weak pulses, and refill 4 seconds. A
fixed minute-10 report supplies HR 148/min, RR 34/min, BP 78/42 mmHg, pulse-coherent SpO₂ 91% on
supplied oxygen, and temperature 36.7°C. No typical skin findings are authored.

The learner reconciles the reported exposure, supplied care, and whole-child state; recognizes
persistent pediatric airway, breathing, and circulation compromise; activates qualified repeat
first-line and resuscitation ownership; and then reviews airway, asthma overlap, open causes,
circulation, and the refractory boundary. A strictly elapsed minute-18 report shows partial but
incomplete improvement before another elapsed observation, allergy, recurrence, caregiver, and
escalation-risk handoff. The lab does not examine or monitor the child, score criteria, confirm a
diagnosis or trigger, verify or select a drug, concentration, dose, route, injector, access, oxygen
interface or flow, fluid type, volume or rate, adjunct medicine, infusion, vasopressor, airway device
or procedure, CPR, test, observation duration, prescription, training, referral, disposition, or
prognosis, or prove causal treatment effect, resolution, durable response, recurrence exclusion, or
outcome.

### Wave D pediatrics slice 13: supraventricular tachycardia with perfusion compromise

The thirteenth Pediatrics lab separates pediatric whole-child perfusion assessment from a rate-only
rhythm label and from adult hypotensive instability. A previously well 6-year-old boy weighing 20
kg reports an abrupt pounding heartbeat and dizziness beginning while seated at school 45 minutes
earlier. A fixed qualified ECG report describes a very regular narrow-complex rhythm at 210/min,
QRS 70 ms, nonvariable RR intervals, and no clearly visible P waves: a probable SVT pattern without
one established mechanism. He remains awake with BP 96/60 mmHg, but pale cool distal extremities,
refill 4 seconds, and weak peripheral pulses compared with the central pulse establish supplied
perfusion compromise.

The learner reconciles the clock, rhythm, and whole-child state; recognizes probable pediatric SVT
with perfusion compromise despite measurable pressure; activates qualified rhythm-care and
resuscitation ownership without delay; and then reviews support, open causes, heart-failure risk,
and deterioration. A strictly elapsed minute-12 report supplies sinus rhythm 118/min and improving
perfusion before another elapsed recurrence, cardiology, caregiver, cause, and active-risk handoff.
The lab does not examine or palpate the child; acquire or interpret an ECG; establish a mechanism or
cause; perform a vagal maneuver; choose or deliver access, oxygen, medicine, dose, route, sedation,
pad, synchronization, energy, cardioversion, refractory therapy, procedure, test, or treatment;
choose observation or disposition; predict recurrence or prognosis; or prove treatment modality or
effect, durable control, complete recovery, recurrence exclusion, or outcome.

### Wave D pediatrics slice 14: bradycardic arrest transition

The fourteenth Pediatrics lab owns the pediatric bridge from compromised bradycardia with a pulse
to nonshockable arrest. A previously well 6-year-old girl weighing 20 kg has several hours of
worsening breathing and fatigue from an unestablished cause. A fixed qualified report documents a
patent airway, assisted positive-pressure ventilation with oxygen, equal bilateral chest rise, a
continuous capnogram with EtCO₂ 36 mmHg, and SpO₂ improving from 79% to 95%. Despite that supplied
effective support, sinus bradycardia and a central pulse persist at 52/min with BP 64/36 mmHg,
unresponsiveness, pale cool mottled skin, refill 5 seconds, a weak central pulse, and no peripheral
pulse reported. Pulse loss has not yet occurred.

The learner reconciles support, pulse, perfusion, and trajectory; recognizes persistent HR below
60/min with cardiopulmonary compromise despite effective ventilation with oxygen; activates
qualified pediatric CPR and resuscitation ownership without waiting for pulse loss; and then
reviews support evidence, open causes, pulse surveillance, and the arrest boundary. A strictly
elapsed qualified checkpoint reports organized electrical activity at 46/min with no pulse,
a nonpulsatile pleth, and unobtainable BP, establishing authored PEA before
another elapsed active-resuscitation handoff. The lab does not examine or palpate the child; assess
a pulse, airway, ventilation, monitor, capnogram, CPR quality, or treatment response; acquire or
interpret a rhythm or test; choose or deliver oxygen, ventilation, compressions, access, drug, dose,
route, pacing, shock, energy, device operation, procedure, cause-specific treatment, resuscitation,
or post-arrest care; determine termination or disposition; predict prognosis; or report ROSC or
outcome.

### Wave D pediatrics slice 15: foreign-body airway obstruction

The fifteenth Pediatrics lab owns abrupt witnessed choking and the changing cough-effectiveness
boundary. A previously well 6-year-old boy weighing 20 kg suddenly coughs while eating a whole grape.
No object is seen to exit, and neither object nor location is confirmed. Initially he remains awake,
follows directions, coughs forcefully and loudly with audible airflow, and speaks normally between
coughs, with room-air SpO₂ 98%, normal color, warm strong pulses, and preserved pressure.

The learner reconciles the event and whole-child state, preserves effective coughing with close
qualified surveillance, then recognizes a strictly elapsed minute-2 transition to severe responsive
obstruction: silent ineffective cough attempts, inability to speak, minimal air movement, cyanosis,
and falling room-air SpO₂ despite a central pulse. Qualified responsive-child care is activated before
a strictly elapsed minute-3 unresponsive transition with no normal breathing, effective cough,
speech, or audible airflow and no reported relief. Pulse status is deliberately unsupplied. The
learner activates qualified unresponsive-child CPR and airway-check ownership before an elapsed
active-risk handoff. The lab does not examine the child; assess cough, airflow, breathing, or pulse;
visualize, sweep, suction, or remove an object; expose back-blow, thrust, ventilation, compression,
CPR-sequence, oxygen, airway-device, laryngoscopy, bronchoscopy, drug, procedure, treatment,
disposition, recovery, ROSC, or outcome controls. Because AHA and European/UK guidance differ in the
opening sequence after unresponsiveness, the learner surface records qualified pathway ownership
rather than presenting one sequence as universal.

### Wave D pediatrics slice 16: safeguarding concern

The sixteenth Pediatrics lab owns recognition and protected escalation when a stable child's supplied
injury pattern is not adequately explained, without diagnosing abuse. A previously well, reportedly
developmentally typical and independently mobile 2-year-old girl weighing 12 kg has a reported single
forward trip onto carpet. She is awake, interactive, warm, and physiologically stable. A fixed
qualified examination supplies one posterior-ear bruise, three similarly shaped clustered lateral-
torso bruises, and two anterior-shin bruises. A fixed experienced-team statement says the single fall
does not adequately account for the ear and torso distribution. This establishes a safeguarding
concern requiring further evaluation, not abuse, perpetrator identity, or a credibility ruling.

The learner reconciles development, history, injuries, immediate safety, physiology, and the whole
child; recognizes concern without diagnosis; activates qualified pediatric safeguarding and
immediate-safety ownership; then reviews injury needs, medical alternatives, history limits,
information sharing, and the local-pathway boundary. A strict later report preserves
stable physiology in a supervised clinical setting with named ownership while injury assessment,
medical alternatives, information gathering, immediate safety, other-child risk, and locally
governed multi-agency work remain active before another elapsed unresolved-risk handoff. The lab does
not examine or interview; identify, measure, photograph, map, or date bruises; calculate
TEN-4-FACESp; acquire or interpret tests or imaging; diagnose abuse; identify a perpetrator; judge
credibility; confront or separate a caregiver; collect clinical or sensitive free text through the
scenario action controls; submit a referral or
report; select jurisdiction or law; decide custody or disposition; perform a procedure; treat;
predict prognosis; or report outcome. Stable physiology does not establish reassurance or discharge
readiness, and reporting duties remain locally governed.

#### Pediatrics: 16

Pediatric respiratory distress; bronchiolitis; croup; status asthmaticus; pediatric sepsis; septic
shock; dehydration with hypovolemia; diabetic ketoacidosis; hypoglycemic seizure; febrile seizure;
status epilepticus; anaphylaxis; supraventricular tachycardia; bradycardic arrest; foreign-body airway
obstruction; safeguarding concern escalation boundary.

#### Obstetrics: 15

Postpartum hemorrhage from atony; concealed hemorrhage; severe preeclampsia; eclampsia; maternal
sepsis; amniotic-fluid-embolism pattern; maternal cardiac arrest; shoulder-dystocia cognitive
sequence; umbilical-cord prolapse escalation; uterine rupture recognition; magnesium toxicity;
high neuraxial block; failed airway in pregnancy; maternal-to-neonatal resuscitation handoff;
oxytocin-associated uterine tachysystole with a deteriorating fetal-heart-rate pattern and recovery
after corrective simulated actions.

#### Neonatology: 11

Term newborn transition; neonatal apnea; ineffective ventilation correction; neonatal bradycardia;
meconium-stained transition; preterm respiratory distress; neonatal hypoglycemia; neonatal sepsis;
thermoregulation failure; delivery-room-to-NICU handoff; tension pneumothorax during respiratory
support with asymmetric ventilation and rapid cardiopulmonary deterioration.

### Wave E neurology slice 1: minor nondisabling acute ischemic stroke

The first Neurology lab is a function-based minor-stroke decision boundary, not another disabling
large-vessel-occlusion reperfusion lesson. A 62-year-old right-handed, independently living retired
teacher has 95 minutes of persistent left cheek and arm sensory loss. A supplied qualified
examination reports no weakness, aphasia, visual loss, neglect, ataxia, gait impairment, or swallowing
concern and preserves walking, dressing, toileting, eating, writing, phone use, and normal
communication. Supplied NIHSS is 1 for sensation, but the patient-specific qualified discussion—not
the score alone—describes the deficit as nondisabling to date and explicitly revisable. Fixed CT
reports no hemorrhage or established large infarct, and fixed CTA reports no large-vessel occlusion or
flow-limiting stenosis.

The learner reconciles the clock, deficit, individualized function, physiology, and whole patient;
reviews supplied imaging, open mimics, and immediate threats; recognizes the nondisabling boundary
without relying on NIHSS alone; and records qualified antiplatelet-strategy and neurological-
surveillance intent. A strict later report preserves the isolated sensory deficit without spread or a
new neurological finding before another elapsed etiology, recurrence, prevention, rehabilitation,
and active-risk handoff. No treatment is reported delivered, and no treatment effect is claimed. The
lab does not take a history; examine; calculate a score; measure glucose or pressure; acquire or
interpret imaging, ECG, laboratory, swallowing, or other tests; diagnose stroke, disability,
etiology, or a mimic; adjudicate eligibility; select, prescribe, prepare, dose, route, or deliver an
antiplatelet, thrombolytic, blood-pressure therapy, or other drug; perform reperfusion or another
procedure; prescribe rehabilitation; determine admission or discharge; predict prognosis; or report
outcome. The Emergency Medicine lesson retains disabling left-M1 stroke, exact thrombolytic intent,
and thrombectomy transfer; the next Neurology slice retains LVO escalation.

### Wave E neurology slice 2: late-window basilar artery occlusion escalation

The second Neurology lab owns posterior-circulation LVO escalation, not another early anterior
thrombolysis lesson. A previously independent 74-year-old man has 10 hours of diplopia, vertigo,
severe dysarthria, and left-sided weakness. Supplied examination, NIHSS 14, prestroke modified
Rankin Scale 0, CT without hemorrhage and with pc-ASPECTS 8, and CTA with mid-basilar occlusion are
authored selection facts. Present cough and secretion handling do not close the airway risk created
by bulbar findings and fluctuating alertness.

The learner serially reconciles the trajectory, reviews fixed evidence and open mimics, recognizes
the qualified thrombectomy-escalation boundary, and activates endovascular and airway-capable
ownership without waiting for a treatment decision or response. A strict later persistent-deficit
report precedes another elapsed handoff of clocks, imaging, thrombolysis review, etiology, airway
risk, procedure, complications, disposition, and unresolved outcome. No history, examination,
score calculation, testing, imaging interpretation, diagnosis, eligibility adjudication, drug,
blood-pressure target, airway management, transfer mechanics, thrombectomy, reperfusion grade,
procedure, treatment, disposition, prognosis, or outcome is controlled or claimed.

### Wave E neurology slice 3: spontaneous cerebellar intracerebral hemorrhage

The third Neurology lab owns confined posterior-fossa danger and serial deterioration rather than
the Emergency Medicine lesson's anticoagulant reversal or the Critical Care lesson's monitored
ICP/CPP rescue. A previously independent 67-year-old woman has 75 minutes of abrupt vertigo,
vomiting, dysarthria, and severe truncal ataxia. Fixed CT initially reports an 11 mL right cerebellar
ICH with fourth-ventricle effacement but no hydrocephalus, brainstem compression, or herniation.

The learner reconciles the whole trajectory, reviews fixed imaging and open threats, recognizes the
posterior-fossa boundary, and activates qualified neurocritical, neurosurgical, and airway-capable
ownership. A strict later report supplies increasing drowsiness, recurrent vomiting, weaker cough,
expansion to 14 mL, new obstructive hydrocephalus, and brainstem compression without authored
herniation. Another elapsed handoff preserves etiology, airway risk, procedure, disposition, and
outcome as unresolved. The lab does not examine; score; calculate volume; acquire or interpret
imaging or tests; diagnose; select or deliver a drug, pressure target, reversal, oxygen, airway,
device, drain, surgery, procedure, transfer, or treatment; determine disposition or prognosis; or
predict outcome.

### Wave E neurology slice 4: aneurysmal subarachnoid hemorrhage delayed deterioration

The fourth Neurology lab owns a delayed neurological deterioration boundary after a secured
aneurysmal subarachnoid hemorrhage, not hyperacute hemorrhage control, posterior-fossa surgery, ICP
rescue, or seizure treatment. A previously independent 56-year-old woman is on day 7 after a right
MCA-bifurcation aneurysm rupture, with fixed experienced-team coil-treatment and scheduled-care
records. After an intact morning examination, she develops 35 minutes of slowed responses, left
neglect, facial weakness, and arm drift. Supplied CT shows no rebleeding, hydrocephalus, or established
infarct; CTA reports new right M1/proximal M2 narrowing; and CTP reports delayed right-MCA perfusion
without a supplied established core.

The learner serially reconciles the trajectory, reviews fixed alternative-cause and perfusion
evidence, recognizes possible DCI without equating angiographic narrowing with DCI or delaying for a
research-definition clock, and activates qualified neurocritical, neurovascular, and rescue-capable
ownership. A strict later report supplies increasing drowsiness and motor deficit with repeat CT
still negative for rebleeding, hydrocephalus, or established infarct and a captured EEG interval
without electrographic seizure. Another elapsed handoff preserves diagnosis, aneurysm and recurrence
risk, alternatives, rescue planning, disposition, and outcome as unresolved. The lab does not
examine; score; acquire or interpret imaging, EEG, or tests; diagnose; select or deliver a drug,
fluid, pressure target, oxygen, airway, angiography, endovascular therapy, device, procedure,
transfer, or treatment; determine disposition or prognosis; or predict outcome.

### Wave E neurology slice 5: focal motor status epilepticus escalation

The fifth Neurology lab owns the visible focal-motor recognition boundary, not Emergency Medicine's
initial generalized-convulsive treatment sequence, Pediatrics' second-line escalation, Critical
Care's refractory electrographic treatment, or the next Neurology lab's nonconvulsive EEG-based
recognition. A previously independent 58-year-old has one continuous 18-minute evolving event:
left face and arm clonus progresses to bilateral convulsions, then becomes less dramatic after
supplied qualified initial rescue care while overt unilateral clonus and absent meaningful recovery
persist. The long authored event avoids asserting one universal focal-status time point.

The learner reconciles the clock, semiology, recovery, physiology, and whole patient; recognizes
that less movement is not seizure resolution; activates qualified seizure, resuscitation, and
airway-capable ownership; and reviews airway, glucose, causes, injury risk, and escalation boundaries.
A strict fixed minute-26 report preserves visible focal clonus without recovery before another
elapsed handoff of active seizure, airway, cause, rescue-choice, EEG-need, recurrence, disposition,
and outcome uncertainty. The lab does not take a history; examine; time a seizure; acquire or
interpret monitoring, glucose, EEG, imaging, laboratory, or other tests; diagnose a cause or
nonconvulsive state; select or deliver a drug, dose, route, access, oxygen, airway device, infusion,
anesthetic, procedure, or treatment; determine movement cessation, electrographic control,
disposition, or prognosis; or predict outcome.

### Wave E neurology slice 6: nonconvulsive status epilepticus recognition

The sixth Neurology lab owns the earlier suspicion-to-qualified-EEG boundary in a patient without a
reported prior convulsion. It remains separate from visible focal motor status and Critical Care's
post-convulsive refractory electrographic-status treatment pathway. A previously independent
72-year-old has 95 minutes of fluctuating language and interaction, recurrent speech arrest,
inattention, and brief rightward gaze deviation without bilateral convulsion, sustained clonus, or
meaningful return to baseline. Fixed CT and CTA do not close vascular or other alternatives.

The learner reconciles the clock, subtle recurrent signs, physiology, supplied glucose and sodium,
and whole patient; recognizes suspicion sufficient for urgent qualified EEG without diagnosing NCSE
clinically; activates neurology, neurophysiology, resuscitation, and airway-capable ownership; and
reviews safety and broad alternatives in parallel. A strict later supplied neurophysiologist report
describes 24 minutes of evolving electrographic seizures in a 60-minute record and states that the
ACNS electrographic-status definition is met, while fluctuation persists without a motor correlate.
Another elapsed handoff preserves cause, treatment, recurrence, recovery, airway risk, disposition,
and outcome as unresolved. The lab does not take a history; examine; monitor; acquire or interpret
glucose, sodium, imaging, laboratory data, or EEG; diagnose clinically; select or deliver a drug,
dose, route, access, oxygen, airway device, procedure, or treatment; determine seizure control,
disposition, or prognosis; or predict outcome.

### Wave E neurology slice 7: myasthenic crisis escalation

The seventh Neurology lab owns rapid fatigable bulbar and respiratory deterioration in established
generalized myasthenia, distinct from the slow ALS trajectory and home-support planning in
Respiratory Medicine. The learner integrates the 36-hour course, serial qualified FVC and MIP,
speech, cough, secretion handling, neck weakness, paradoxical breathing, gases, infection context,
and whole patient without using saturation, carbon dioxide, or one mechanics cutoff alone. Qualified
neurological, neurocritical, respiratory, nursing, and airway-capable ownership begins before the
strict later report supplies worse bulbar and ventilatory function and qualified-team invasive
ventilation, establishing the authored manifest-crisis transition. Another elapsed handoff keeps the
trigger, individualized rapid-acting and precipitant treatment, complications, ventilator course,
weaning, recurrence, recovery, disposition, prognosis, and outcome unresolved. No learner history,
examination, test, diagnosis, drug, IVIG, plasma exchange, antimicrobial, oxygen, ventilation,
suction, airway device, procedure, treatment, disposition, prognosis, or outcome control exists.

### Wave E neurology slice 8: Guillain-Barré respiratory decline

The eighth Neurology lab owns rapid postinfectious ascending weakness with bulbar, respiratory, and
autonomic deterioration, distinct from the slow ALS home-support boundary and the junctional
fatigability and supplied manifest-crisis transition in myasthenia. The learner integrates the
48-hour functional decline, reflex and weakness pattern, swallowing, cough, breathing, serial
qualified FVC, single-breath count and MIP, gas exchange, supportive CSF and electrodiagnostic
reports, and monitored heart-rate and pressure ranges without using saturation, a score, one test,
or one mechanics cutoff alone. Qualified neurological, neurocritical, respiratory, nursing,
airway-capable, and cardiac-monitoring ownership begins before a strict 4-hour report supplies worse
bulbar and ventilatory function plus wider autonomic lability. Another elapsed handoff keeps the
diagnosis and alternatives, individualized airway and immune treatment, arrhythmia and pressure
risk, complications, rehabilitation, recurrence, recovery, disposition, prognosis, and outcome
unresolved. No learner history, examination, score, test or monitoring interpretation, diagnosis,
drug, IVIG, plasma exchange, oxygen, ventilation, rhythm or pressure treatment, airway device,
procedure, treatment, disposition, prognosis, or outcome control exists.

### Wave E neurology slice 9: acute bacterial meningitis first hour

The ninth Neurology lab owns the prompt LP, no-routine-pre-LP-imaging, and no-diagnostic-delay
treatment boundary in a supplied alert, nonfocal, physiologically stable adult with acute meningeal
and infection findings. This is distinct from generic sepsis resuscitation and from the next
encephalitis lab's altered cognition, focal, seizure, and etiologic-treatment boundary. The learner
reconciles the clock and whole patient, activates qualified time-critical infection, neurological,
resuscitation, nursing, diagnostic, pharmacy, and locally appropriate precaution ownership, reviews
the exact LP-safety and imaging-deferral triggers, and activates qualified empiric antimicrobial and
adjunctive pathways without allowing tests or imaging to delay care. A strict later report supplies
qualified LP, bacterial-pattern CSF, prior qualified care, and persistent stable neurology before an
elapsed handoff keeps organism, susceptibility, treatment optimization, infection control, public
health, contacts, neurological and systemic complications, hearing, rehabilitation, disposition,
prognosis, and outcome unresolved. No learner history, examination, score, test, imaging, LP,
diagnosis, drug, dose, route, access, isolation equipment, procedure, treatment, contact decision,
disposition, prognosis, or outcome control exists.

### Wave E neurology slice 10: suspected herpes simplex encephalitis

The tenth Neurology lab owns the fever-plus-parenchymal-brain-dysfunction and early-negative-PCR
boundary in an adult with new behavior, memory, language, and focal-seizure change. It is distinct
from meningitis because altered cognition and temporal localization dominate without meningism, and
from status epilepticus because the single focal seizure stopped and a strict qualified EEG sample
contains no electrographic seizure. The learner reconciles the syndrome, activates qualified
neurological, infection, neurocritical, airway-capable, nursing, seizure, and diagnostic ownership,
and activates immediate qualified empiric intravenous antiviral care without waiting for MRI, EEG,
CSF, or PCR certainty. Supplied CSF inflammation, temporal MRI, and specialist EEG reports preserve
infectious, autoimmune, vascular, neoplastic, postictal, toxic-metabolic, and other alternatives. A
strict 4-hour report supplies persistent dysfunction and a negative initial HSV PCR from an early
specimen; compatible localization prevents premature closure and preserves qualified repeat-PCR
ownership. Another elapsed handoff keeps treatment safety, seizures, autoimmune evaluation,
cognition, rehabilitation, recurrence, disposition, prognosis, and outcome unresolved. No learner
history, examination, test acquisition or interpretation, diagnosis, drug, dose, route, access,
oxygen, airway, LP, imaging, EEG, procedure, treatment, disposition, prognosis, or outcome control
exists.

### Wave E neurology slice 11: raised intracranial pressure with visual threat

The eleventh Neurology lab owns subacute papilledema, secondary-cause exclusion, serial visual
function, and imminent sight-threat escalation rather than duplicating Critical Care's monitored
post-TBI ICP treatment or the next acute herniation lab. The learner reconciles headache, pulsatile
tinnitus, transient visual obscurations, diplopia, stable neurology, and specialist-confirmed
papilledema; activates qualified neurological, neuro-ophthalmic, imaging, and procedure ownership;
reviews supplied photography, OCT, fields, MRI, venography, LP, CSF, opening pressure, and secondary
causes without demographics or one cutoff establishing diagnosis; then reviews a strict 24-hour
field decline despite preserved acuity before an elapsed sight-rescue, disease, headache,
surveillance, and active-risk handoff. No learner examination, test interpretation, diagnosis, drug,
dose, route, access, LP, procedure selection, treatment, visual rescue, disposition, prognosis, or
outcome control exists, and no herniation pattern is authored.

### Wave E neurology slice 12: acute transtentorial herniation pattern

The twelfth Neurology lab owns the rapidly converging clinical herniation emergency rather than
duplicating stable visual-threat, posterior-fossa hydrocephalus, hemorrhage-reversal, or monitored
post-traumatic ICP treatment. The learner reconciles rapid consciousness, pupil, motor,
physiological, and supplied right temporal mass-effect change; recognizes the whole pattern without
requiring an isolated pupil or complete Cushing triad; activates qualified airway, neurocritical,
neurosurgical, and brain-rescue ownership; reviews individualized systemic, osmotic, imaging, and
definitive-control boundaries; then reviews a strict 15-minute supplied qualified-rescue report with
the pupil still nonreactive before an elapsed active-risk handoff. No learner examination, scoring,
monitoring, imaging, diagnosis, airway management, oxygen, ventilation, drug, dose, route, access,
drain, surgery, procedure, treatment, recovery, disposition, prognosis, or outcome control exists.

### Wave E neurology slice 13: metastatic spinal cord compression

The thirteenth Neurology lab owns cord-level localization and emergency escalation in a patient with
known cancer rather than duplicating trauma, neuraxial high block, peripheral inflammatory weakness,
future cauda-equina recognition, or future oncology treatment planning. The learner reconciles
progressive movement-sensitive thoracic pain, bilateral pyramidal leg weakness, a T8 sensory level,
gait loss, and urinary dysfunction; recognizes suspected metastatic cord compression before imaging
confirmation; activates qualified spinal, oncology, radiology, radiotherapy, nursing, pharmacy,
rehabilitation, pain, bladder, skin, and thrombosis-prevention ownership; reviews individualized
stability, movement, whole-spine MRI, early corticosteroid, supportive, and definitive-care
boundaries; then reviews a strict 4-hour qualified MRI confirming T6 epidural compression with
persistent deficits before an elapsed active-risk handoff. No learner history, examination, gait
testing, movement, imaging, diagnosis, drug, dose, route, access, catheter, surgery, radiotherapy,
biopsy, procedure, treatment effect, recovery, disposition, prognosis, or outcome control exists.

### Wave E neurology slice 14: acute delirium with reversible causes

The fourteenth Neurology lab owns verified-baseline, acute-fluctuation, qualified-assessment, and
multicausal contributor review rather than duplicating emergence, infection, shock, stroke, seizure,
toxicity, or future nursing falls-risk labs. The learner reconciles hypoactive and restless change,
attention, perception, function, and the whole patient; recognizes a qualified 4AT and expert
diagnosis boundary without treating the score as a cause, capacity test, severity scale, or dementia
label; activates qualified medical, nursing, pharmacy, family, safety, capacity, mobility, and
supportive owners; reviews reversible contributors, familiar communication, environment,
de-escalation, and least-restrictive care; then reviews a strict 6-hour multicontributor report with
attention still fluctuating before an elapsed active-risk handoff. No learner history, examination,
score, capacity assessment, test, diagnosis, observation, restraint, reorientation, mobility, drug,
dose, route, access, catheter, procedure, treatment effect, recovery, disposition, prognosis, or
outcome control exists.

### Wave E neurology slice 15: autonomic dysreflexia with an authored trigger

The fifteenth Neurology lab owns the baseline-relative autonomic emergency and a bounded canonical
trigger transition rather than duplicating Guillain-Barré dysautonomia, neurogenic shock, essential
hypertension, intracranial emergencies, or generic bladder and bowel care. The learner reconciles a
declared chronic T4 lesion, verified usual pressure, sudden symptoms, severe hypertension, reflex
bradycardia, and the whole patient; recognizes an urgent autonomic-dysreflexia pattern without
definitive or alternative-cause closure; activates upright support, frequent pressure and pulse
surveillance, and qualified ownership; then begins a supplied urinary-first survey and releases one
visible external drainage-tubing kink. That release changes canonical pressure and pulse rather than
display text alone. A strict elapsed reassessment precedes another elapsed baseline, trigger,
recurrence, complication, prevention, and active-risk handoff. No real lesion or baseline, learner
history, examination, monitoring acquisition, definitive diagnosis, invasive catheter or bowel
care, drug, dose, route, access, oxygen, fluid, device, procedure, disposition, prognosis, or outcome
control exists.

#### Neurology: 15

Acute ischemic stroke; large-vessel-occlusion escalation; intracranial hemorrhage; subarachnoid
hemorrhage deterioration; status epilepticus; nonconvulsive status recognition; myasthenic crisis;
Guillain-Barré respiratory decline; meningitis; encephalitis; raised intracranial pressure;
herniation pattern; spinal-cord compression; acute delirium with reversible causes; autonomic
dysreflexia with an authored noxious trigger, severe hypertension, and reflex bradycardia.

#### Endocrine and metabolic medicine: 12

Diabetic ketoacidosis; hyperosmolar hyperglycemic state; severe hypoglycemia; adrenal crisis;
thyroid storm; myxedema coma; hypercalcemic crisis; hypocalcemic tetany; severe hyponatremia;
hypernatremic dehydration; refeeding electrolyte shift; perioperative diabetes management.

#### Renal and electrolyte medicine: 12

Hyperkalemia with ECG change; severe hypokalemia; symptomatic hyponatremia; hypernatremic
dehydration; hypocalcemia; hypermagnesemia; acute kidney injury from hypovolemia; acute kidney injury
with overload; metabolic acidosis differential; metabolic alkalosis from losses; dialysis-patient
pulmonary edema; missed-dialysis deterioration.

#### Infectious disease: 10

Sepsis without shock; septic shock; meningitis; neutropenic fever; severe community-acquired
pneumonia; pyelonephritis with deterioration; cellulitis progressing to necrotizing infection;
endocarditis complication; toxic-shock pattern; source-control reassessment.

#### Toxicology: 15

Opioid poisoning; acetaminophen overdose; salicylate toxicity; tricyclic-antidepressant toxicity;
beta-blocker toxicity; calcium-channel-blocker toxicity; digoxin toxicity; cholinergic poisoning;
anticholinergic syndrome; serotonin syndrome; sympathomimetic toxicity; toxic alcohol pattern;
carbon-monoxide exposure; local-anesthetic systemic toxicity; methemoglobinemia with a saturation
gap, exposure history, chocolate-brown blood observation, and bounded antidote intent.

### Wave F toxicology slice 1: methemoglobinemia with a saturation gap

The first Toxicology lab owns oxidant-exposure dyshemoglobin recognition rather than duplicating
pulse-oximeter motion artifact, primary pulmonary hypoxemia, carbon-monoxide poisoning, shock, or
routine oxygen titration. The learner reconciles documented benzocaine exposure, cyanosis, symptoms,
pulse-coherent SpO2 85%, high supplied PaO2, chocolate-brown blood, and whole-patient state; recognizes
an urgent suspected methemoglobinemia pattern without treating one number as diagnosis; activates
continued qualified oxygen and monitoring, source cessation, poison-center or medical-toxicology
consultation, and critical-care ownership; then reviews supplied multiwavelength co-oximetry with
G6PD-deficiency hemolysis and serotonergic-drug hazards explicit. The only antidote action is bounded
qualified-team methylene-blue intent without a product, dose, route, preparation, access, infusion,
eligibility result, or delivery. A strict elapsed fixed clinical and co-oximetry response precedes
another elapsed exposure, rebound, hemolysis, serotonin-syndrome, rescue, disposition, and active-risk
handoff. The canonical state is a teaching fixture, not a dyshemoglobin chemistry or individualized
treatment-response model.

### Wave F toxicology slice 2: carbon monoxide with a reassuring monitor

The second Toxicology lab owns shared combustion-exposure recognition when conventional pulse
oximetry looks reassuring. The learner connects an attached-garage generator exposure, a similarly
symptomatic partner, transient loss of consciousness, confusion, conventional SpO2 99%, elapsed time,
and whole-patient state; recognizes an urgent suspected carbon-monoxide pattern without using pulse
oximetry as exclusion or one COHb value as diagnosis or severity; activates source and co-exposed-
person safety, continued qualified oxygen and monitoring, poison-center or medical-toxicology
consultation, and emergency ownership; then reviews supplied COHb 28%, sample and oxygen timing,
neurologic and cardiac findings, co-exposures, and alternatives. Hyperbaric care appears only as a
selected-patient qualified consultation shaped by symptoms, severity, availability, distance, time,
and transport risk. A strict elapsed fixed clinical and COHb response precedes another elapsed delayed-
neurologic, cardiac, exposure, follow-up, disposition, and active-risk handoff. The canonical state is
a teaching fixture, not a CO uptake, elimination, tissue-oxygen, or individualized-treatment model.

### Wave F toxicology slice 3: acetaminophen where the clock changes the meaning

The third Toxicology lab owns the timed acute immediate-release acetaminophen pathway rather than
forcing unknown-time, repeated, extended-release, delayed-absorption, coingested, late, or established
liver-injury presentations through one nomogram. The learner reconciles product, witnessed ingestion
window, exact 6-hour clock, nausea, uncertain reported quantity, stable whole-patient state, supplied
acetaminophen 132 µg/mL, and baseline liver, coagulation, renal, and glucose evidence; recognizes the
qualified nomogram-applicability boundary; activates poison-center or medical-toxicology, emergency,
laboratory, monitoring, and compassionate safety ownership; and reviews the supplied above-treatment-
line, below-high-risk-line position without plotting. The only antidote action is bounded qualified-
team acetylcysteine intent without product, dose, route, preparation, access, infusion, or delivery.
A strict elapsed fixed 22-hour report precedes another elapsed serial-level, liver-failure, stopping,
safety, disposition, and active-risk handoff. The clock does not create an automatic stop, and the
canonical state is not an absorption, metabolism, liver-injury, pharmacology, or individualized-
response model.

#### Hematology and oncology: 11

Neutropenic fever; tumor-lysis syndrome; hyperleukocytosis pattern; sickle-cell acute chest syndrome;
massive hemorrhage and component support; anticoagulant-associated bleeding; transfusion reaction;
febrile nonhemolytic transfusion event; superior-vena-cava syndrome; spinal-cord compression;
cytokine-release syndrome after cellular therapy with fever, hypotension, hypoxemia, and graded
escalation.

#### Surgery and trauma: 10

Trauma primary survey; hemorrhagic shock; tension pneumothorax; traumatic brain injury deterioration;
pelvic hemorrhage; postoperative hemorrhage; postoperative sepsis; anastomotic-leak pattern;
compartment-syndrome escalation; perioperative handoff.

#### Medical-surgical nursing: 9

Ward sepsis escalation; opioid-induced respiratory depression; postoperative hemorrhage; insulin
and hypoglycemia rescue; transfusion reaction; acute delirium and falls risk; deteriorating heart
failure; structured escalation and handoff; smart-pump weight-unit mismatch intercepted before
medication delivery.

### 3.6 Reuse without duplication

Repeated syndromes are intentional when environment, role, prior information, available actions,
or learning objective differs. Shared physiology and source assertions live once. A catalog gate
rejects two scenarios with the same patient state, action set, objective evidence, and debrief merely
retitled for different modules.

### 3.7 Hardening briefs for the 16 newest scenarios

These briefs establish educational shape and safe defaults. Exact numeric behavior, thresholds,
doses, and action windows remain unset until the scenario evidence brief traces them to current
primary or authoritative sources. “Stable” means a fully specified fictional baseline, not generic
normal values supplied by the browser.

| Scenario | Starting state and honest default | Primary rehearsal value | Required capability/source floor | Explicit boundary |
| --- | --- | --- | --- | --- |
| Capnography sampling-line obstruction | Stable intubated/ventilated fictional adult; no diagnosis label; capnogram quality/number changes through sampling state while airway pressure, delivered breaths, pleth, and physiology remain independently available | Cross-check a disappearing or distorted carbon-dioxide signal before treating the patient | Separate patient, circuit, sampling, and display state; device/monitoring standards and manufacturer-independent signal behavior | Does not teach physical tubing manipulation, proprietary diagnostics, or that every absent capnogram is obstruction |
| Arterial transducer misleveling and dynamic-response artifact | Hemodynamically stable anesthetized adult with an arterial line and available cuff; transducer position or response changes display, not true pressure | Verify implausible invasive pressure using waveform quality, leveling/zero intent, and an independent measure | Hydrostatic relation, dynamic-response teaching model, cuff sampling delay, separate sensor/patient state | Does not certify leveling/flushing technique or represent one commercial monitor |
| Ventilator circuit disconnection | ICU patient stable on established support with declared oxygen reserve; disconnection is not announced by diagnosis; device alarms follow sourced delay/priority behavior | Recognize device/patient discordance, oxygenate, inspect the circuit, restore support, and reassess | Circuit continuity, delivered-versus-commanded breaths, oxygen stores, alarm behavior | Does not teach physical connection security, all ventilator brands, or every leak/disconnection pattern |
| Delayed vasopressor delivery | Fictional shock patient with a newly commanded infusion, declared tubing/dead-space state, and no immediate concentration effect | Distinguish pump-running intent from drug delivery; trace line/setup state and reassess pressure | Commanded/delivered separation, carrier flow/dead-space transport, effect-site response, pump event log | No bedside infusion calculator, line-priming instruction, universal tubing volume, or real-patient rate recommendation |
| Pulse-oximeter motion artifact | Patient physiology initially stable; motion/perfusion state degrades pleth quality and displayed saturation while other observations retain declared independence | Evaluate signal quality and corroborate before escalating treatment | Separate oxygenation, perfusion, probe, pleth, numeric display, delay, and alarm state | Does not imply a clean capnogram excludes hypoxemia or that all discordance is artifact |
| Electrical without mechanical pacing capture | Fictional unstable bradycardia with monitor/pacing equipment available; electrical complexes may follow stimuli while pulse/perfusion does not | Check mechanical perfusion rather than equating electrical appearance with effective circulation | Rhythm, pacing stimulus/electrical response, pulse/mechanical output, discomfort/sedation scope, current resuscitation guidance | No physical pad-placement instruction, brand-specific thresholds, or real-patient pacing prescription |
| Oxytocin-associated tachysystole | Laboring fictional patient with a declared infusion and initially interpretable uterine/fetal patterns; regional policy is pinned before start | Recognize temporal relationship, stop/adjust the fictional trigger, reposition/support/escalate within scope, and reassess both patterns | Maternal/fetal state, contraction timing, fetal-pattern representation, medication-delivery state, current obstetric guidance | Does not teach fetal-monitor certification, operative delivery technique, universal drug sequence, or definitive fetal diagnosis |
| Smart-pump weight-unit mismatch near miss | Fictional order, medication record, pump library, weight basis, and units intentionally disagree before delivery; no medication reaches the patient by default | Reconcile sources, identify the mismatch, stop the setup, escalate, and document simulated intent | Typed units, independent order/MAR/pump state, high-consequence confirmation, no-delivery guard | Not a dosing calculator, pump-library validator, or substitute for local medication policy |
| Circle-system rebreathing | Stable anesthetized/ventilated fictional patient; carbon dioxide rises through declared circuit absorbent/valve state while metabolic production is initially unchanged | Separate inadequate carbon-dioxide elimination/rebreathing from changing metabolism and patient ventilation; inspect/replace fictional equipment and reassess | Inspired/expired carbon dioxide, circuit flow, absorber/valve state, capnogram baseline, gas exchange | No physical machine checkout credential, proprietary circuit replica, or claim that one waveform proves the fault |
| Acute aortic syndrome with evolving malperfusion | Fictional emergency presentation with incomplete early evidence; pulse, perfusion, pain, and neurologic findings evolve before definitive imaging availability | Avoid premature closure, repeat focused assessment, recognize discordance, escalate and protect the patient from an unsupported default pathway | Branching encounter plus sourced discrete malperfusion transitions, examination/result availability, time-to-escalation | Does not diagnose a real patient, compute a risk score, choose definitive surgery, or model every phenotype |
| Endotracheal-tube migration after repositioning | Previously stable ventilated ICU patient; position change precedes unilateral ventilation and progressive gas-exchange change without announcing tube depth | Reassess after movement, integrate airway pressure, bilateral observations, capnography, oxygenation, and tube-depth evidence, then perform bounded correction intent | Tube position, lung-side ventilation, airway pressure, gas exchange, examination observations | Does not teach auscultation skill, physical repositioning, radiograph interpretation, or exact depth for a real patient |
| Acute tracheostomy obstruction | Fictional tracheostomy patient with declared device type/maturity and initially stable ventilation; obstruction develops with independent patient/device evidence | Call for help, oxygenate by the appropriate fictional routes, assess patency/displacement, and follow a bounded current algorithm branch | Tracheostomy/device state, upper-airway applicability, gas flow, oxygenation, capnography, current multidisciplinary emergency guidance | Does not teach physical suction/change technique, apply one pathway to every device, or continue past modeled role/scope |
| Neonatal tension pneumothorax during support | Fictional neonate on declared respiratory support with neonatal baseline; unilateral ventilation and cardiopulmonary deterioration arise through pleural state | Notice rapid deterioration, verify support/air entry asymmetry, escalate, oxygenate/ventilate, and record bounded decompression intent | Neonatal respiratory mechanics, pleural pressure, asymmetric ventilation, transition circulation, neonatal monitoring | Does not scale an adult model, teach needle placement, select real equipment size, or individualize outcome |
| Autonomic dysreflexia | Fictional person with a declared spinal lesion and initially stable state; an authored noxious trigger causes evolving hypertension and reflex bradycardia | Recognize the syndrome pattern, seek/remove a fictional trigger within role, position/support/escalate, and reassess | Neurogenic autonomic state transition, trigger library, pressure/heart-rate response, current spinal-injury guidance | Does not accept a real injury level, diagnose every hypertensive episode, teach catheter technique, or prescribe real treatment |
| Methemoglobinemia with saturation gap | Fictional exposure with discordant pulse oximetry, arterial oxygen evidence, symptoms, and blood observation revealed through ordered assessment | Detect discordance, obtain relevant exposure history/tests, support/escalate, and use bounded antidote intent while respecting contraindication scope | Dyshemoglobin teaching state, co-oximetry result, conventional saturation limitations, exposure transition, authoritative toxicology guidance | No exposure/dose calculator, universal antidote eligibility, real-patient treatment plan, or individual outcome prediction |
| Cytokine-release syndrome after cellular therapy | Fictional post-therapy patient with fever followed by sourced discrete hypotension/hypoxemia states; infection remains a plausible competing concern | Reassess severity, maintain parallel differential, provide support, notify/escalate, and follow a bounded region/protocol-specific treatment-intent branch | State-transition severity, oxygen/pressure support, infection differential, therapy timing, current specialty consensus guidance | Does not grade or treat a real patient, model immune kinetics as individual prediction, or replace the treating center's protocol |

Each brief must be expanded into the standard evidence, defaults, hazard, tutor, objectives,
limitations, and verification records before implementation. None of these titles counts as playable
merely because it is listed here.

## 4. Tutor design

### 4.1 Tutor contract

The tutor is authored, deterministic, and offline. It never improvises clinical advice. Each tutor
intervention declares its trigger, earliest time, cooldown, prerequisite observation, message,
explanation link, and suppression conditions.

The tutor follows an assistance ladder:

1. **Orient:** identify the immediate goal and relevant interface region.
2. **Notice:** draw attention to a changing signal without interpreting it.
3. **Connect:** ask the learner to connect two observations.
4. **Prioritize:** name the category of next action, not the exact control.
5. **Direct:** state a safe next simulated action and why.
6. **Explain:** after action or scenario end, show the causal model and source.

Guided mode may use all six levels. Coached mode begins at Notice and does not use Direct until an
authored safety or learning threshold is crossed. Unassisted mode emits none during the session.
All modes use the same patient state and objective evaluator.

### 4.2 Preparation paths

The front catalog offers goal-based paths in addition to domains:

- My first simulation lab
- Recognize a deteriorating patient
- Airway and oxygenation
- Shock and perfusion
- Rhythm and resuscitation
- Ventilation and respiratory failure
- Pediatric emergencies
- Obstetric emergencies
- Medication and infusion safety
- Handoff and escalation

A path is a versioned ordered list with prerequisites, estimated total practice time, and a plain
statement of what it cannot prepare. Nothing is locked. “Recommended next” is derived locally from
objective evidence, recency, difficulty, and the learner's chosen goal.

### 4.3 Fun without distortion

The product may celebrate first completion, recovery after an error, reduced time to recognition,
fewer unnecessary actions, and explanation of a causal mechanism. It may display a private local
practice history and personal-best comparison. It may not award points for clinically irrelevant
speed, hide scenarios behind progress, compare learners, punish missed days, or turn patient harm
into spectacle.

### 4.4 Tutor content is reviewable content

Hints, direct prompts, explanations, expected actions, and next-scenario recommendations carry the
same source and maturity metadata as scenarios. A tutor cannot be more authoritative than the
content it teaches. Preview content displays preview tutor guidance.

## 5. Interface and visual system

### 5.1 Catalog

Desktop uses a left filter rail and responsive result grid; phone uses one filter sheet and a
single-column list. The default ordering is curated readiness path, then domain and difficulty, not
popularity. There is no telemetry from which popularity could honestly be inferred.

Every card includes title, domain, environment, estimated duration, difficulty, fidelity class,
maturity, 1–3 competency tags, and the primary practice goal. A card never exposes a hidden diagnosis
when discovery is an objective. Search indexes learner language, abbreviations, presenting signs,
competencies, environment, and official title.

Filters are encoded in the URL without learner history. Selecting a scenario and starting it takes
at most three activation actions from the unfiltered catalog.

### 5.2 Scenario frame

The frame always provides:

- scenario title and simulated clock;
- patient/scene summary;
- primary workspace;
- action region grouped by assessment, support, medication, procedure, communication, and
  disposition as applicable;
- event log;
- tutor region with a one-action collapse control;
- Help, Sources and limitations, and Report a problem controls;
- Pause and End session controls.

At phone width, the patient-critical region remains visible and actions use one bottom sheet. No
more than one modal or sheet can be open. Clinical color remains reserved for physiology and alarm
meaning; catalog domain colors use neutral icons and text rather than saturated clinical hues.

### 5.3 Depth disclosure

The first screen stays calm. Detail unfolds in layers: goal and patient first; actions and current
signals during the run; causal detail, counterfactual, rubric evidence, sources, maturity, and
limitations in debrief/provenance. “Rich” means depth on demand, not simultaneous panels.

## 6. Maturity and sign-off model

### 6.1 Status vocabulary

| Status | Public meaning | Minimum evidence |
| --- | --- | --- |
| `draft` | repository work, not in public catalog | schema-valid work in progress |
| `preview` | complete and usable, not clinically reviewed | completion contract, sources, automated verification, explicit preview label |
| `source_checked` | sources and transcription independently checked; clinical behavior not signed | second-source or primary-source verification record |
| `clinically_reviewed` | named qualified reviewers accept the declared educational scope | current exact-version review records and conflict declarations |
| `institution_endorsed` | named organization endorses a defined release and use | organization record, authorized signer, scope, region, expiration, reviewed base |
| `withdrawn` | unavailable because of correction, supersession, or risk | public reason and correction/reference record |

Status is monotone only within an unchanged content version. Any clinical, tutor, objective,
limitation, or numeric change creates a new version whose status is recomputed. Editorial spelling
changes may preserve review only under a machine-checkable nonclinical-diff policy.

### 6.2 What blocks what

- Static build and preview deployment require technical integrity, source presence, safety scope,
  test fixtures, limitations, and honest labels.
- `source_checked` requires independent transcription/source verification.
- `clinically_reviewed` requires qualified exact-version sign-off.
- `institution_endorsed` requires a clinically reviewed base and organization-specific scope.
- The “reviewed only” catalog filter, adoption pack, curriculum coverage claim, and reviewed release
  channel exclude preview content.
- A severe confirmed error may withdraw any status immediately.

This permits building the entire catalog without waiting for signatures while preserving a bright
line around organizational trust.

### 6.3 Organizational record

An endorsement record includes organization legal/display name, public website, signer name and
role, authority statement, scenarios/modules and versions covered, learner population, practice
region, exclusions, review method, signed date, expiration no later than 24 months, conflicts,
signature artifact hash, and revocation state. The public interface says “endorsed by X for Y” and
never “medically certified.”

## 7. Report-a-problem design

### 7.1 Placement and flow

One shared control appears in the prebrief, live-session overflow, debrief, and each source/
limitation drawer. Activating it pauses the simulation locally and opens a native accessible dialog.

The smallest useful report is:

1. choose one category: clinical content, patient behavior, tutor/debrief, controls, accessibility,
   outdated source, or other;
2. optionally describe the problem in at most 160 characters;
3. inspect an exact payload preview;
4. optionally select **Include recent simulation context**; it is off by default;
5. complete Turnstile and send.

Always included: scenario ID, content version, app version, engine version, maturity, region,
fidelity class, current surface, simulated second rounded to the engine tick, and a canonical URL
without learner state. Optional context includes seed, last 20 accepted/refused action events, and a
bounded current non-text patient/equipment snapshot. It never includes learner reflections, tutor
free text, prior sessions, local progress, imported instructor files, real-world timestamps, locale,
device identifiers, or arbitrary storage.

The dialog warns: “Do not include a patient name or any real clinical information.” The application
already forbids real-patient inputs; the server also rejects obvious contact fields and terminal or
bidirectional control characters. A report may be sent with category only.

### 7.2 API and security contract

Routes are exact `GET /api/reports/config` and `POST /api/reports`. Other paths and methods fail.
The POST accepts `application/json` only, caps declared and streamed UTF-8 bodies at 32 KB, rejects
content encoding, unknown top-level fields, invalid IDs/versions/categories, cross-origin URLs,
unexpected origins, and strings over their limits.

Turnstile loads only after the dialog opens. The Worker validates the single-use token through
Siteverify, requiring success, production hostname, and action `scenario-report`. Tokens are capped
at 2,048 characters and never stored. Production and local test keys remain separate.

The Worker derives scenario metadata from a generated checked-in report catalog; client titles,
statuses, and versions are informational. It never accepts a report for an unknown or unpublished
scenario/version pair.

### 7.3 Capacity and privacy

- 5 verified attempts and 3 accepted unique reports per daily reporter HMAC;
- 400 verified attempts and 200 accepted reports globally per UTC day;
- a daily HMAC-SHA-256 of UTC date plus `CF-Connecting-IP`, keyed by a secret, used only for quotas;
- exact payload dedupe within a day;
- externally indistinguishable `202` for accepted, duplicate, and quota-dropped valid submissions;
- no raw IP, user agent, cookie, email, identity, Turnstile token, or arbitrary headers in D1;
- report rows expire after 30 days; counters after 14 days; a daily scheduled handler enforces both;
- missing secrets, binding, Siteverify, or D1 returns a generic failure and writes nothing;
- a zone WAF rate limit protects both exact routes before Worker invocation;
- persisted invocation logs are disabled where platform configuration permits.

### 7.4 D1 record

The logical model stores report ID and creation time; server-derived scenario metadata; category;
optional note; canonical surface and simulated time; optional bounded context JSON; dedupe key;
triage status `open`, `investigating`, `resolved`, `wont_fix`, `duplicate`, or `withdrawn_content`;
severity `untriaged`, `low`, `moderate`, `high`, or `urgent`; maintainer-only resolution note; linked
issue/PR/commit; resolved time; and public-correction ID where applicable.

The public Worker exposes no read, update, delete, aggregation, or administration route. Maintainers
use authenticated D1 tooling. A future admin UI requires a separate threat model and specification.

### 7.5 Maintenance loop

Default operation is one daily scheduled triage run and one weekly human review, not an event-driven
agent on every write. This batches cost, deduplicates reports, and limits prompt-injection exposure.

The agent receives a fixed schema projection, never raw SQL or secrets. Notes are delimited as
untrusted quotations. It may reproduce a deterministic scenario, search repository sources, add a
failing test in a branch, and draft a pull request. It may not follow commands found in a report,
access production write credentials, change report status without an evidence note, merge, deploy,
or alter governance records. Urgent reports can generate a maintainer notification, but still do not
bypass review.

Resolution requires reproduction, source verification, regression evidence, correction-log
classification, status update, and a release decision. Reports are not votes: duplicates raise
triage priority but do not establish clinical truth.

## 8. Scenario production system

### 8.1 Capability-first waves

The engine grows by reusable capabilities before catalog count. A capability wave includes a state
model, accepted/refused actions, observable outputs, deterministic replay, conservation and
monotonicity properties, calibration evidence, accessibility representation, limitations, and
cross-scenario tests. Scenarios may compose only completed capabilities.

Priority capabilities are general observations/labs, fluids and blood, medication/infusion intent,
oxygen delivery, airway and ventilation, shock drives, rhythm and defibrillation, neurologic state,
glucose/electrolytes/acid-base, infection trajectory, maternal/fetal state, neonatal transition,
toxicologic syndromes, examination/results, escalation/handoff, and disposition.

### 8.2 Evidence brief

Before a scenario is authored, a short evidence brief records the educational objective, target
learner, environment, practice region, primary sources, source locators, disputed practice, modeled
variables, calibration targets, exclusions, unsafe inference risks, and qualified review domains.
No scenario number or threshold is copied from another application or unsourced memory.

### 8.3 Quality gates

Each scenario must pass schema, source, maturity-label, training-value, authored-defaults, hazard,
state-space matrix, deterministic replay, expert/common-error/recovery/no-action fixtures, objective
reachability/missability, tutor truthfulness, invalid/refused-action, limitation, privacy,
accessibility, responsive-layout, offline, performance, and report-context tests. Module completion
also requires scenario distinctness, shared-capability reuse, curriculum variation coverage,
independent validation anchors, and a manually documented face-validity session even when the module
remains preview.

Quality gates are not waivable to reach a catalog number or schedule. A waiver may narrow or defer a
scenario, but it cannot mark an unmet scenario playable. The public catalog always reports the actual
passing count beside the 256-scenario target.

### 8.4 Production transfer boundaries

The landing, interactive-cockpit, and complete-offline budgets measure different promises. Vite emits
a build manifest and CI walks static imports from the landing entry and shared clinical route rather
than summing unrelated lazy routes. The cockpit graph also includes its solver worker, both fonts, and
the largest direct scenario document. The complete-offline gate continues to count every emitted
file, so route splitting cannot hide total storage growth.

Automatic route chunking is the authoritative production boundary. Broad manual anesthesia and React
chunks are prohibited because they can create circular static imports that preload the simulator on
the landing page. Only the waveform generator remains a named shared chunk. The interface font is
preloaded on every document; the mono face is requested when the cockpit event log uses it. The static
hero remains an engine-generated trace at two-pixel min/max density, while the live sweep retains its
one-pixel canvas density and identical layout.

## 9. Open source and public operations

The repository becomes the source of truth for code, content, evidence briefs, review records,
endorsements, corrections, schemas, fixtures, and infrastructure configuration. Secrets, D1 data,
raw reports, and private reviewer correspondence are excluded.

The MIT license must be compatible with every checked-in dependency and asset. Each non-original
asset records source, author, license, and modification. The build rejects unknown-license assets.
Self-hosters can omit the report endpoint; the UI then shows reporting unavailable and links to the
repository's public correction instructions without implying that local reports reach the upstream
project.

## 10. MCP decision

A hosted MCP server is not part of this change.

Small deterministic utilities can often be represented well as read-only tool calls. Open Sim Lab's
primary value is instead a time-evolving visual practice session, private learner state, reflection,
and debrief. Turning that into remote MCP tools would add an operational surface, invite real-patient
queries and decision-support misuse, weaken the offline/privacy story, and let an agent bypass the
learning experience without a demonstrated learner need.

Instead, the static build publishes machine-readable, read-only artifacts:

- catalog manifest;
- scenario metadata and JSON Schema;
- competency and path manifests;
- source, limitation, maturity, and correction records;
- deterministic example transcripts that contain no learner data.

These artifacts support search engines, local tools, institutional audits, and a future local stdio
MCP adapter without running a hosted service. Reconsider MCP only after evidence identifies at least
three recurring agent workflows, a safety review shows they cannot become clinical decision support,
and the adapter can remain read-only, bounded, local, and derived from the same manifests.

## 11. Rollout and rollback

Modules ship in capability waves rather than waiting for all 256 scenarios. Catalog totals always
distinguish complete preview, reviewed, endorsed, and planned scenarios; planned titles never appear
as playable cards.

Any scenario can be withdrawn through a checked-in status record and static release. Reporting has a
separate kill switch by removing the public site key or secret. Disabling reports never disables the
simulator. A bad domain pack can be removed from the next service-worker manifest without erasing
locally exported transcripts. Review and endorsement badges disappear automatically when their
exact version is no longer current.

## 12. Authoritative platform behavior

The reporting design assumes that simulation contains sensitive learner context. The note limit is
160 characters, recent context is off by default, a payload preview is mandatory, reflections and
prior history are structurally inaccessible, and captured context comes from a typed scenario
projection rather than a form or document sweep.

Cloudflare behavior relied on by implementation must be verified again at build time against the
current official documentation:

- Turnstile server-side validation is mandatory; tokens are single-use, expire after 300 seconds,
  and are capped at 2,048 characters:
  `https://developers.cloudflare.com/turnstile/get-started/server-side-validation/`.
- Production hostname and action values are validated from the Siteverify response; documented test
  keys are used outside production:
  `https://developers.cloudflare.com/turnstile/troubleshooting/testing/`.
- D1 is SQLite-compatible managed storage with plan limits that fail queries when exhausted:
  `https://developers.cloudflare.com/d1/reference/faq/`.
- Daily cleanup uses the Workers scheduled handler:
  `https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/`.
- Static Assets can serve the application independently of API execution:
  `https://developers.cloudflare.com/workers/static-assets/`.

Plan limits are deployment facts, not permanent product constants. The application ceilings in this
spec remain hard code boundaries even when Cloudflare later raises its free allowance.
