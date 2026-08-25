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
`/emergency-medicine` module boundary with 16 playable, completion-audited scenarios. The remaining
9 planned titles remain descriptive scope only and do not enter playable counts before their full
scenario contracts pass.

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

#### Cardiology: 17

Stable chest-pain evaluation; STEMI recognition and first actions; NSTEMI risk reassessment; acute
decompensated heart failure; cardiogenic shock; atrial fibrillation with rapid response; regular
narrow-complex tachycardia; wide-complex tachycardia; symptomatic bradycardia; complete heart block;
torsades de pointes; hyperkalemic conduction disturbance; pericardial tamponade; right-ventricular
infarction; hypertensive emergency; pacemaker capture failure; transcutaneous pacing with electrical
capture but absent mechanical capture.

#### Respiratory medicine: 15

Acute severe asthma; COPD exacerbation; community-acquired pneumonia with hypoxemia; pulmonary
embolism; acute pulmonary edema; tension pneumothorax; large pleural effusion; mucus plugging;
opioid-related hypoventilation; neuromuscular respiratory failure; obesity hypoventilation;
noninvasive-ventilation selection; high-flow oxygen escalation; oxygen-device failure; acute
tracheostomy obstruction requiring assessment, oxygenation, escalation, and a bounded device pathway.

#### Pediatrics: 16

Pediatric respiratory distress; bronchiolitis; croup; status asthmaticus; pediatric sepsis; septic
shock; dehydration with hypovolemia; diabetic ketoacidosis; hypoglycemic seizure; febrile seizure;
status epilepticus; anaphylaxis; supraventricular tachycardia; bradycardic arrest; foreign-body airway
obstruction; nonaccidental-injury escalation boundary.

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
2. optionally describe the problem in at most 500 characters;
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
500 characters, recent context is off by default, a payload preview is mandatory, reflections and
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
