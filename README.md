# Open Sim Lab

An open-source, browser-native clinical simulator for medical students, residents, and
nurse anesthetists — anywhere in the world, on any device, with or without a network.

**opensimlab.com/anesthesia** is the first complete 39-scenario module. Emergency medicine is complete at `/emergency-medicine` with 25 bounded labs. Critical care is complete at `/critical-care` with 24 bounded labs. Cardiology is complete at `/cardiology` with 17 bounded labs spanning coronary care, heart failure, shock, arrhythmias, conduction, pacing, pericardial disease, infarction, and hypertensive emergency.

Respiratory Medicine is now playable at `/respiratory-medicine` with all 15 bounded labs: acute severe asthma, post-exacerbation COPD recovery-versus-readiness, hypoxemic community-acquired pneumonia, persistent dyspnea after pulmonary embolism, progressive respiratory failure during initial support for acute pulmonary edema, post-drainage reassessment after a spontaneous tension pneumothorax, symptom-limited evaluation of a large unilateral pleural effusion, bronchiectasis mucus plugging with persistent focal collapse after individualized airway clearance, chronic prescribed-opioid exposure with fixed attended sleep-related hypoventilation evidence and shared follow-through, progressive neuromuscular respiratory failure in established ALS with patient-centered escalation and ownership, obesity hypoventilation with fixed awake hypercapnia and attended sleep evidence, bilevel NIV selection for acute acidotic hypercapnic COPD, high-flow nasal oxygen escalation with calm support choices and an active rescue boundary, a portable oxygen source interruption during transport with immediate verified bridge support and systems-focused handoff, and acute obstruction of a declared removable tracheostomy inner cannula with anatomy-first oxygenation, qualified restoration, reassessment, and active-risk handoff.

Pediatrics is now playable at `/pediatrics` with all 16 bounded labs. Pediatric
respiratory distress teaches whole-child recognition and fatigue escalation. Infant bronchiolitis
adds illness-day, feeding, hydration, apnea-risk, and supportive-care reassessment while keeping
routine imaging, low-value medicine, oxygen-device, fluid-route, suction, treatment, and disposition
controls out of the learner surface. Croup adds calm caregiver-centered upper-airway assessment,
qualified-team care intent, time-aware response review, and recurrence escalation without exposing
drug, dose, device, airway-procedure, or disposition controls. Pediatric status asthmaticus adds
established-asthma risk, verified first-hour care reconciliation, persistent severe-nonresponse
recognition, early pediatric critical-care escalation, qualified second-line intent, and timed
partial-response handoff without exposing peak-flow, score, drug, dose, route, oxygen, device,
intravenous-access, airway, treatment, or disposition controls. Pediatric sepsis adds supplied
infection-plus-coagulation-dysfunction recognition, explicit distinction from current shock,
confirmation of qualified evaluation and antimicrobial-care ownership, source and organ review, and timed
active-risk handoff without exposing a screening calculator, test, antimicrobial, dose, access,
fluid, oxygen, source-control, treatment, or disposition control.
Pediatric septic shock adds a worsening post-fluid trajectory with supplied Phoenix cardiovascular
dysfunction, congestion warnings, qualified critical-care and vasoactive ownership, source-control
work in parallel, and a timed partial-stabilization handoff without exposing a fluid calculator,
MAP target, vasoactive selector, access, procedure, treatment, or disposition control.
Pediatric dehydration with hypovolemia adds a compensated gastroenteritis-loss trajectory,
whole-child dehydration recognition, qualified rehydration and ongoing-loss safety ownership in
parallel, and a timed partial-response handoff without exposing a percentage, deficit, maintenance
formula, solution, route, volume, rate, test, treatment, or disposition control.
Pediatric diabetic ketoacidosis adds whole-child and supplied biochemical-pattern recognition,
qualified DKA care and neurological-metabolic safety ownership in parallel, and a timed
improving-but-unresolved handoff without exposing a severity, sodium, osmolality, anion-gap,
fluid, insulin, electrolyte, glucose, dose, route, rate, pump, treatment, or disposition control.
Pediatric hypoglycemic seizure adds an afebrile, brief stopped convulsion with supplied severe
hypoglycemia, immediate qualified rescue ownership in parallel with open cause and recurrence-risk
review, and a timed improving-but-unresolved handoff without exposing glucose acquisition,
product, concentration, route, dose, access, drug, airway, treatment, or disposition controls.
Pediatric febrile seizure adds a brief stopped generalized event with fever, provisional simple
features to date, qualified fever-source and serious-illness ownership in parallel with recovery,
recurrence, alternative-cause, and caregiver-safety review, and a timed handoff without exposing
examination, routine testing, drug, dose, airway, treatment, communication-performance, or
disposition controls.
Pediatric status epilepticus adds ongoing bilateral generalized convulsions after 2 supplied
appropriate first-line doses, immediate qualified second-line ownership in parallel with airway,
cause, and refractory-boundary review, and a timed visible-response reassessment and active-risk
handoff without exposing seizure timing, examination, monitoring, glucose acquisition, drug, dose,
route, access, infusion, airway, EEG, treatment, or disposition controls.
Pediatric anaphylaxis adds persistent airway, breathing, and circulation compromise after supplied
community first-line care, immediate qualified repeat-care ownership before airway, asthma-overlap,
cause, circulation, and refractory-boundary review, and a timed partial-response and
caregiver-risk handoff without exposing examination, diagnostic criteria, product, dose, injector,
oxygen or fluid delivery, airway procedure, observation-duration, referral, or disposition controls.
Pediatric supraventricular tachycardia adds an abrupt fixed regular narrow rhythm with poor
peripheral perfusion despite a measurable blood pressure, immediate qualified rhythm-care and
resuscitation ownership, a timed improving response, and recurrence, cardiology, cause, caregiver,
and deterioration-risk handoff without exposing examination, ECG interpretation, vagal maneuver,
drug, dose, access, sedation, synchronization, energy, cardioversion, treatment, or disposition
controls.
Pediatric bradycardic arrest adds the uniquely pediatric transition from persistent HR below 60/min
with severe compromise despite supplied effective ventilation and a central pulse to a strictly
later fixed PEA checkpoint, qualified CPR and nonshockable-resuscitation ownership, and active-risk
handoff without exposing examination, pulse assessment, ventilation, CPR mechanics, drug, dose,
access, pacing, shock, device, cause treatment, termination, post-arrest care, or outcome controls.
Pediatric foreign-body airway obstruction adds an abrupt witnessed eating event with an initially
effective cough, a strictly later severe responsive obstruction, then an unresponsive transition,
qualified age-appropriate pathway ownership, and active-risk handoff without exposing cough or pulse
assessment, back blows, thrusts, sweeps, suction, ventilation, CPR mechanics, object removal, airway
device, procedure, treatment, disposition, recovery, or outcome controls.
Pediatric safeguarding concern adds stable whole-child, developmental, history, and supplied injury-
distribution reconciliation, non-diagnostic concern recognition, immediate qualified safety and
safeguarding ownership, medical-alternative and information-boundary review, and a timed protected
handoff without scenario controls for examination, interviewing, bruise dating, photography, clinical
or sensitive free text,
screening-rule calculation, abuse or perpetrator diagnosis, confrontation, referral or report
submission, jurisdiction selection, custody action, procedure, treatment, disposition, or outcome
controls.

Wave F Toxicology is now live at `/toxicology`. Its first bounded lab, methemoglobinemia with a
saturation gap, connects documented benzocaine exposure, cyanosis, symptoms, pulse-coherent SpO2
85%, PaO2 238 mmHg, chocolate-brown blood, and supplied co-oximetry methemoglobin 32%; activates
qualified support, source control, poison-center or medical-toxicology consultation, and critical-
care ownership; keeps G6PD-deficiency hemolysis and serotonergic-drug hazards visible; records only
bounded qualified-team methylene-blue intent; and requires elapsed reassessment and active-risk
handoff. It exposes no learner test acquisition, gas calculation, diagnosis, oxygen setting, drug,
dose, route, infusion, treatment delivery, rescue procedure, disposition, or outcome control.
Its second lab, carbon monoxide with a reassuring monitor, contrasts a documented shared generator-
exhaust exposure, transient loss of consciousness, confusion, and conventional SpO2 99% with supplied
COHb 28%. It makes source and co-exposed-person safety, qualified oxygen and monitoring, poison-center
or medical-toxicology ownership, timed co-oximetry context, neurologic and cardiac surveillance,
selected-patient hyperbaric consultation, elapsed reassessment, delayed neurologic risk, and follow-up
visible without exposing an oxygen setting, universal COHb threshold, hyperbaric eligibility or
treatment, chamber or transport choice, procedure, disposition, or outcome control.
Its third lab, acetaminophen where the clock changes the meaning, connects a witnessed acute
immediate-release ingestion, exact 6-hour clock, supplied 132 µg/mL level and qualified nomogram
position, baseline liver evidence, poison-center and compassionate safety ownership, bounded
qualified-team acetylcysteine intent, a strict elapsed later report, individualized stopping review,
and active-risk handoff. It exposes no learner nomogram calculator, drug, dose, route, infusion,
automatic course-length stop, safety disposition, procedure, prognosis, or outcome control.
Its fourth lab, salicylate where the falling number can be worse, connects an acute aspirin exposure,
tinnitus, vomiting, tachypnea, volume clues, concentration units, and a supplied mixed respiratory-
alkalosis and metabolic-acidosis pattern. It makes toxicology, critical-care, nephrology, serial pH,
ventilation, CNS and pulmonary risk, bounded qualified alkalinization intent, early dialysis
preparedness, a strict worsening-acidemia report, and active-risk handoff visible without exposing a
blood-gas calculator, fluid or electrolyte prescription, airway setting, dialysis threshold,
eligibility or delivery, procedure, disposition, or outcome control.
Its fifth lab, tricyclic toxicity where the whole electrical pattern matters, couples declared
amitriptyline exposure, anticholinergic and CNS clues, a stopped seizure, hypotension, a supplied
widened-QRS and terminal-aVR pattern, acid-base and electrolyte context, early toxicology and
resuscitation ownership, bounded qualified bicarbonate and refractory-rescue intent, strict elapsed
electrical and perfusion reassessment, and recurrence handoff. It exposes no learner ECG
interpretation, dose or target, airway or rhythm treatment, lipid, ECLS, shock, pacing, procedure,
disposition, or outcome control.
Its sixth lab, beta-blocker toxicity where perfusion is more than pulse rate, couples a witnessed
immediate-release metoprolol exposure with bradycardia, shock, impaired mentation, low glucose,
supplied conduction and contractility evidence, reported initial-care nonresponse, qualified
toxicology and resuscitation ownership, bounded vasopressor, glucagon, high-dose-insulin/euglycemia
and refractory-rescue intent, strict elapsed perfusion and metabolic reassessment, and recurrence
handoff. It exposes no learner ECG or imaging interpretation, glucose or electrolyte prescription,
drug, dose, rate, target, pacing, dialysis, lipid, ECLS, procedure, disposition, or outcome control.
Its seventh lab, calcium-channel blocker toxicity where glucose belongs beside the shock, couples a
witnessed extended-release diltiazem exposure with bradycardia, complete AV block, mixed cardiogenic
and vasodilatory shock, impaired mentation, hyperglycemia, supplied conduction, contractility and
vascular-tone evidence, reported initial-care nonresponse, qualified toxicology and resuscitation
ownership, bounded vasopressor, calcium, high-dose-insulin/euglycemia and refractory-rescue intent,
strict elapsed perfusion, rhythm and metabolic reassessment, and prolonged-absorption handoff. It
exposes no learner ECG or imaging interpretation, glucose or electrolyte prescription, drug, dose,
rate, target, pacing, decontamination, lipid, methylene blue, ECLS, procedure, disposition, or outcome
control.
Its eighth lab, digoxin toxicity where rhythm and potassium tell one story, couples a witnessed acute
digoxin exposure with GI and visual clues, complete AV block, ventricular ectopy, shock,
hyperkalemia, a properly timed pre-antidote level, qualified toxicology and resuscitation ownership,
bounded immune-Fab, rhythm-potassium surveillance and rescue intent, strict elapsed perfusion and
electrolyte reassessment, and assay-aware recurrence handoff. It exposes no learner ECG or level
interpretation, Fab product or vial calculation, electrolyte prescription, pacing, dialysis,
cardioversion, antiarrhythmic, procedure, disposition, or outcome control.
Its ninth lab, cholinergic poisoning where team protection precedes airway rescue, couples a declared
greenhouse organophosphate splash with wet-clothing secondary-contamination risk, secretions,
bronchospasm, hypoxemia, bradycardia, vomiting, fasciculations, weakness, CNS change, qualified PPE
and decontamination ownership, bounded atropine, pralidoxime, seizure, airway and surveillance intent,
strict elapsed respiratory reassessment, and intermediate-syndrome handoff. It exposes no learner PPE
selection, clothing removal, washing, cholinesterase interpretation, antidote dose, suction, airway or
ventilation operation, neuromuscular blocker, seizure treatment, procedure, disposition, workplace
clearance, or outcome control.
Its tenth lab, anticholinergic poisoning where cooling starts before certainty ends, couples a
declared benztropine exposure with severe delirium, dry flushed skin and mucosa, mydriasis, urinary
retention, reduced bowel sounds, sinus tachycardia, life-threatening hyperthermia, supplied ECG,
renal and CK evidence, qualified cooling and compassionate-safety ownership, bounded supportive,
sedation, seizure, surveillance and toxicologist-led physostigmine-eligibility intent, strict elapsed
temperature and mental-state reassessment, and rebound-risk handoff. It exposes no learner diagnosis,
cooling method, restraint, catheter, sedative, physostigmine product or dose, airway operation,
procedure, disposition, or outcome control.

Wave E Neurology catalog work now includes all 15 bounded labs. Minor nondisabling acute ischemic
stroke adds patient-specific function review without relying on NIHSS alone, supplied no-hemorrhage
and no-LVO imaging context, qualified antiplatelet-strategy and surveillance intent, a strict later
neurological trajectory, and elapsed etiology, recurrence, secondary-prevention, and active-risk
handoff without exposing examination, scoring, imaging interpretation, diagnosis, drug, dose,
duration, route, reperfusion, procedure, rehabilitation prescription, disposition, or outcome
controls. Late-window basilar artery occlusion adds a fixed 10-hour posterior-circulation syndrome,
supplied imaging and selection context, immediate qualified endovascular and airway-capable
ownership, strict later surveillance, and elapsed unresolved-risk handoff without examination,
scoring, eligibility, drug, airway-device, transfer, thrombectomy, reperfusion, disposition,
prognosis, or outcome controls. Spontaneous cerebellar intracerebral hemorrhage adds early
posterior-fossa danger recognition, qualified neurocritical, neurosurgical, and airway-capable
ownership, a strict later transition to obstructive hydrocephalus and brainstem compression, and
elapsed active-risk handoff without examination, scoring, imaging interpretation, drug, pressure,
reversal, airway device, drain, surgery, procedure, disposition, prognosis, or outcome controls.
Aneurysmal subarachnoid hemorrhage delayed deterioration adds a day-7 secured-aneurysm context,
new focal-deficit and alternative-cause review, possible-DCI recognition without equating vascular
narrowing with DCI, qualified neurocritical, neurovascular, and rescue-capable ownership, a strict
later neurological trajectory, and elapsed active-risk handoff without examination, scoring,
imaging or EEG interpretation, diagnosis, drug, fluid, pressure target, airway device, angiography,
endovascular treatment, procedure, disposition, prognosis, or outcome controls.
Focal motor status epilepticus escalation adds an 18-minute evolving focal-to-bilateral event whose
bilateral movement becomes less dramatic while visible unilateral clonus and absent recovery persist,
with qualified seizure and airway-capable ownership, a strict minute-26 visible-motor report, and an
elapsed active-risk handoff without examination, monitoring, EEG, drug, dose, route, oxygen, airway,
imaging, laboratory, procedure, treatment, disposition, prognosis, or outcome controls.
Nonconvulsive status epilepticus recognition adds a 95-minute unexplained fluctuating language and
awareness pattern with intermittent speech arrest and gaze deviation but no convulsion, an urgent
qualified-EEG boundary without clinical-only diagnosis, broad alternative-cause review, a strict
later supplied neurophysiologist report meeting the electrographic-status definition, and elapsed
active-risk handoff without examination, monitoring, raw-EEG interpretation, diagnosis, drug, dose,
route, oxygen, airway, procedure, treatment, disposition, prognosis, or outcome controls.
Myasthenic crisis escalation adds a rapid 36-hour fatigable bulbar and respiratory decline in
established generalized myasthenia, multimodal recognition without saturation or one mechanics
cutoff, early qualified neurocritical and airway-capable ownership, a strict later supplied
ventilation requirement establishing manifest crisis, and elapsed active-risk handoff without
examination, testing, diagnosis, IVIG, plasma exchange, drug, dose, ventilation, airway procedure,
weaning, disposition, prognosis, or outcome controls.
Guillain-Barré respiratory decline adds a postinfectious 48-hour ascending weakness pattern with
rapid functional loss, bulbar and cough weakness, falling serial respiratory measures, and authored
autonomic lability; the learner reviews supportive evidence and mimics, recognizes high-risk decline
despite preserved saturation, activates qualified neurocritical, respiratory, airway-capable, and
cardiac-monitoring ownership, reviews a strict 4-hour deterioration, and completes an elapsed
active-risk handoff without examination, score calculation, testing, diagnosis, IVIG, plasma
exchange, drug, oxygen, ventilation, rhythm or pressure treatment, airway procedure, disposition,
prognosis, or outcome controls.
Acute bacterial meningitis first hour adds a stable alert adult with an acute meningeal and
infection pattern, prompt qualified ownership, an explicit LP-safety and no-routine-pre-LP-imaging
boundary, early qualified empiric and adjunctive-care activation without diagnostic delay, a strict
later bacterial-pattern CSF report, and elapsed organism, treatment, complication, public-health,
hearing, and active-risk handoff without examination, testing, imaging, LP, diagnosis, drug, dose,
route, access, procedure, treatment, disposition, prognosis, or outcome controls.
Suspected herpes simplex encephalitis adds fever with new behavior, memory, language, and focal-
seizure change; immediate qualified brain, infection, airway, seizure, and empiric antiviral
ownership; supplied CSF, temporal MRI, and EEG boundaries; a strict 4-hour early negative HSV PCR
that cannot safely close the compatible localized syndrome; and elapsed repeat-testing, treatment-
safety, seizure, autoimmune, cognitive, rehabilitation, and active-risk handoff without examination,
testing, interpretation, diagnosis, drug, dose, route, access, procedure, treatment, disposition,
prognosis, or outcome controls.
Raised intracranial pressure with visual threat adds specialist-confirmed papilledema, supplied
visual function, MRI plus venography, qualified LP, a strict 24-hour worsening visual-field report
despite preserved 20/20 acuity, and urgent sight-preservation handoff without duplicating the
monitored traumatic-ICP or acute herniation labs and without examination, testing, interpretation,
diagnosis, drug, dose, LP, procedure, treatment, disposition, prognosis, or outcome controls.
Acute transtentorial herniation pattern adds a rapid consciousness, pupil, motor, physiological,
and temporal mass-effect convergence; immediate qualified airway, neurocritical, neurosurgical, and
brain-rescue ownership; a strict 15-minute supplied rescue report with the pupil still nonreactive;
and elapsed lesion, airway, pressure, seizure, surgery, complication, and active-risk handoff without
examination, scoring, monitoring, imaging interpretation, diagnosis, airway management, drug, dose,
route, access, drain, decompression, procedure, treatment-effect, recovery, disposition, prognosis,
or outcome controls.
Metastatic spinal cord compression adds a known-cancer context with progressive movement-sensitive
thoracic pain, bilateral pyramidal leg weakness, a T8 sensory level, gait loss, and urinary
dysfunction; recognition as an oncologic emergency before imaging confirmation; immediate qualified
spinal, oncology, imaging, nursing, and rehabilitation ownership; a strict 4-hour qualified
whole-spine MRI confirming T6 epidural compression with persistent deficits; and elapsed level,
stability, function, bladder, definitive-care, complication, rehabilitation, and active-risk handoff
without history, examination, movement, imaging interpretation, diagnosis, drug, dose, route,
access, catheter, surgery, radiotherapy, procedure, treatment-effect, recovery, disposition,
prognosis, or outcome controls.
Acute delirium with reversible causes adds a verified independent baseline, 10-hour fluctuation
across hypoactive and restless change, supplied qualified 4AT and diagnosis boundaries, immediate
familiar and least-restrictive multidisciplinary ownership, a strict 6-hour multi-contributor report
with attention still fluctuating, and elapsed cause, capacity, safety, medicine, function,
recurrence, follow-up, and active-risk handoff without history, examination, scoring, capacity
assessment, testing, diagnosis, observation, restraint, drug, dose, route, access, catheter,
procedure, treatment-effect, recovery, disposition, prognosis, or outcome controls.
Autonomic dysreflexia with an authored trigger adds a declared chronic T4 spinal injury, verified
98/62 mmHg usual pressure, acute severe baseline-relative hypertension with reflex bradycardia,
immediate upright support and qualified ownership, a urinary-first supplied trigger survey, and a
canonical pressure-and-pulse transition when one visible external drainage-tubing kink is released.
An elapsed reassessment and recurrence-focused handoff preserve alternative causes, complications,
medication boundaries, and outcome uncertainty without accepting a real lesion or baseline,
examining, diagnosing, acquiring monitoring, teaching catheter or bowel technique, selecting a
drug, dose, route, access, oxygen, fluid, device, procedure, disposition, prognosis, or outcome.

The goal is not a tech demo. It is the best anesthesia education on the internet: the
thing a student opens the night before their first day in the OR and comes out of
understanding something they did not understand before.

Physical simulation labs cost hundreds of thousands of dollars, require physical
attendance, and are bottlenecked by scheduling. Open Sim Lab is free, needs no login or
install, runs in the browser, and works offline. Practice data stays local. A problem report is sent
only after the learner opens the report form, previews what will be shared, and explicitly submits it.

> **Not for clinical use.** Open Sim Lab is an educational simulator. It is not a clinical
> decision-support tool, not a dosing calculator, and not validated for any decision
> affecting a real patient.

## Four commitments

**One theme, built well.** A single dark theme called Theater Dark, whose organizing rule
is that *color is a clinical signal, never decoration*. The entire interface chrome is a
neutral ramp. The only saturated color on screen is physiology, alarm severity, and the
focus ring. Every token, type size, spacing value, and motion duration is specified
exactly in [`design/design-system`](openspec/specs/design/design-system/spec.md) — a
builder should never have to guess a value.

**We own our pharmacology.** Model parameters are transcribed by hand from the primary
literature into typed TypeScript in this repository, each carrying its citation and its
applicability envelope. There is no external dataset dependency, nothing vendored, and
nothing fetched at build or runtime. Tests assert published reference values so a mistyped
digit fails immediately.

**Practice stays on the device.** No login, accounts, analytics, or telemetry. Progress,
transcripts, reflections, tutoring, and debriefs stay in the browser. The report service receives
only a problem report the user previews and explicitly sends.

**Clinical claims are sourced, gated, and correctable.** The editorial board is currently empty,
so no clinical content is signed and the release gate says so. Crisis protocols trace to their
issuing bodies, physiology is checked against published benchmarks, limitations are public, and
confirmed mistakes remain in a permanent corrections log.

## The specification

This project is spec-driven with [OpenSpec](https://openspec.dev/). The authoritative
specification is the capability tree under [`openspec/specs/`](openspec/specs/).

### Engine — the virtual patient

| Capability | What it governs |
| --- | --- |
| [`engine/pkpd-core`](openspec/specs/engine/pkpd-core/spec.md) | Compartment solvers, effect-site kinetics, Hill and interaction surfaces, determinism |
| [`engine/physiology`](openspec/specs/engine/physiology/spec.md) | Hemodynamics, gas exchange, blockade, fluids, surgical stimulus, baroreflex |
| [`engine/pharmacology`](openspec/specs/engine/pharmacology/spec.md) | Model parameters, applicability envelopes, citations, drug cards, the Model Lens |
| [`engine/validation`](openspec/specs/engine/validation/spec.md) | Varvel performance framework, published benchmarks, face validity, the limitations register |
| [`engine/waveform-synthesis`](openspec/specs/engine/waveform-synthesis/spec.md) | How the traces are actually generated: ECG ODE model, arterial, capnogram, plethysmogram, rhythm library |
| [`engine/simulation-clock`](openspec/specs/engine/simulation-clock/spec.md) | Simulated time, transport controls, worker isolation, deterministic transcripts |
| [`engine/scenario-engine`](openspec/specs/engine/scenario-engine/spec.md) | Scenario format, patient profiles, timeline events, crisis and artifact injection |

### Design — one visual language

| Capability | What it governs |
| --- | --- |
| [`design/design-system`](openspec/specs/design/design-system/spec.md) | Theater Dark: every color, type, spacing, radius, and motion token; component inventory |
| [`design/layout`](openspec/specs/design/layout/spec.md) | The four-region cockpit, breakpoints, reflow, and the explicit sacrifice order |

### Cockpit — the screen

| Capability | What it governs |
| --- | --- |
| [`cockpit/patient-monitor`](openspec/specs/cockpit/patient-monitor/spec.md) | Sweeping waveform canvas, vital tiles, alarms, artifact rendering |
| [`cockpit/pkpd-visualizer`](openspec/specs/cockpit/pkpd-visualizer/spec.md) | Plasma vs. effect-site plot, hysteresis, decrement times, prediction bands |
| [`cockpit/action-cockpit`](openspec/specs/cockpit/action-cockpit/spec.md) | Syringes, infusions and TCI, ventilator, fluids, airway, resuscitation |
| [`cockpit/event-log`](openspec/specs/cockpit/event-log/spec.md) | Chronological record, severity, cross-panel navigation, export |
| [`cockpit/sonification`](openspec/specs/cockpit/sonification/spec.md) | Variable-pitch pulse tone, standard alarm tones, extended sonification for non-visual use |

### Learning — why it exists

| Capability | What it governs |
| --- | --- |
| [`learning/pedagogy`](openspec/specs/learning/pedagogy/spec.md) | Onboarding, guidance levels, structured debrief with computed counterfactuals |
| [`learning/curriculum`](openspec/specs/learning/curriculum/spec.md) | Competency map, progression, transcript-derived evidence, spaced return, instructor mode |
| [`learning/knowledge-layer`](openspec/specs/learning/knowledge-layer/spec.md) | The Why panel, concept explainers, predict-then-observe, the sandbox |

### Platform — the guarantees

| Capability | What it governs |
| --- | --- |
| [`platform/clinical-governance`](openspec/specs/platform/clinical-governance/spec.md) | Editorial board, signed content, guideline currency, corrections log, limitations register |
| [`platform/adoption`](openspec/specs/platform/adoption/spec.md) | Curriculum mapping, classroom use, citability, procurement docs, instructor authoring |
| [`platform/landing`](openspec/specs/platform/landing/spec.md) | The front door at `opensimlab.com`: one screen, one action, live ECG hero, honest module directory |
| [`platform/discoverability`](openspec/specs/platform/discoverability/spec.md) | Prerendering, per-route metadata, structured data, social previews, search without surveillance |
| [`platform/practice-region`](openspec/specs/platform/practice-region/spec.md) | Technique availability, formulary, protocol variant, and terminology by country |
| [`platform/sustainability`](openspec/specs/platform/sustainability/spec.md) | Bus factor, succession, dependency ceiling, supply chain, funding disclosure, honest status |
| [`platform/safety-and-scope`](openspec/specs/platform/safety-and-scope/spec.md) | Not-for-clinical-use guards, regulatory position, the forward-only boundary |
| [`platform/privacy`](openspec/specs/platform/privacy/spec.md) | No telemetry or accounts; practice stays local; optional anonymous reports are bounded and previewed |
| [`platform/offline-pwa`](openspec/specs/platform/offline-pwa/spec.md) | Service worker, installability, download budgets, local storage |
| [`platform/accessibility`](openspec/specs/platform/accessibility/spec.md) | WCAG 2.2 AA, keyboard operation, screen reader access to live physiology |
| [`platform/global-reach`](openspec/specs/platform/global-reach/spec.md) | Translation, both unit systems, regional drug naming, low-end devices, licensing |
| [`platform/delivery`](openspec/specs/platform/delivery/spec.md) | Static build, routes, performance budgets, test strategy, releases |
| [`platform/module-contract`](openspec/specs/platform/module-contract/spec.md) | The boundary that lets oncology and cardiology reuse the core |

Validate the tree with:

```bash
npm run validate:specs
```

### The front door

`opensimlab.com` is one short page: the name, a one-line description, a live electrocardiogram
drawn by the project's own waveform engine as the only color on the screen, and a single button
into `/anesthesia`. Below it sits the substantive prose — what the simulator teaches, who it is
for, where the pharmacology comes from, what it deliberately does not do. The module directory
lists **Anesthesia**, **Emergency medicine**, **Critical care**, and **Cardiology** as available and
the remaining modules as *Planned*, with no dates promised, because the project does not commit to schedules
it cannot keep.

Search weight is concentrated at the root domain on purpose. The simulator itself carries only a
title, a description, a canonical URL, and social tags — no marketing copy in the cockpit. Every
indexable route is prerendered to static HTML so a crawler, a scripting-disabled browser, and a
link preview all get real content without executing the app. Search performance is measured only
through a webmaster console, which needs no script on the page, so the no-telemetry guarantee
holds.

The `/anesthesia` catalog keeps discovery local and linkable: search covers the patient, problem,
procedure, and objectives, while difficulty, duration, and maturity filters are encoded in the URL.
The unfiltered prerender still contains all 39 current scenarios, so filtering adds no telemetry and
does not trade away no-script access or scenario-page indexing.
`/catalog/anesthesia-catalog.json` publishes the same 39 exact-version entries, filters, objectives,
and normalized search text for static integrations; its schema and data are included in the offline
bundle and fail the build if they drift from the scenario registry or completion audit.
The catalog also offers all 10 authored preparation goals from the product design. Each versioned
path names its ordered scenarios, total time, prerequisites, target behaviors, supported roles, and
limits; selection stays in the public URL, locks nothing, and explains the first local recommendation.
That goal follows the learner into debrief, where one next rehearsal is suggested with exact maturity
and a local-only “hide for 7 days” control. The stored dismissal contains only a public path ID and
expiry; it never contains performance, reflection, identity, or transcript data.
The debrief also keeps at most 50 private attempt summaries on the device. Each records only the
exact scenario and content version, selected public goal, simulated duration, completion time, and
objective outcome words. It can compare those words with the learner's own prior attempt at that
exact version and continue the selected path; it never stores reflections, actions, physiology,
identity, or an overall score. `/privacy` makes that bounded history exportable, importable, and
independently erasable.
The hypotension scenario also authors the first replay-safe decision point. When its linked objective
needs work, debrief can reconstruct the original deterministic state at that exact tick, preserve
the parent run, and pause in a clearly labeled rehearsal branch for a different response. Scenarios
without an authored, objective-linked point never offer targeted repetition.
In-session tutor prompts are checked-in, versioned rules rather than generated advice. Each declares
its observable trigger, objective, earliest time, cooldown, prerequisite observations, urgency,
assistance level, applicability, source explainer, maturity, and suppression conditions. The prompt
shows its assistance level, draft status, rule version, and a local source/explanation link; changing
Guided, Coached, or Unassisted presentation never reaches the patient engine.
Guided practice begins with the smallest useful intervention and escalates one behavior through
Orient, Notice, Connect, Prioritize, and Direct only after the shared cooldown; Explain follows an
observable action. Prompts appear once per rule, never compete with an alarm, and offer 3 deliberate
depths: the compact intervention, “Why this now?”, and the full local source. On phones the tutor
sits above the action dock instead of covering the monitor values.
A first-run introduction explains the private, local tutor without stopping the clock. It can be
permanently dismissed on that device, reopened from More options, and each live prompt collapses to
one labeled control. Unassisted sessions show neither the introduction nor live tutor prompts.
Deterministic expert, common-error, and recovery transcripts exercise every current rule and all 5
trigger families. CI verifies the observed oxygen, apnea, recent-dose, and pressure conditions,
requires each recovery trigger to resolve after visible corrective actions, and checks the tutor's
oxygen-reserve, effect-site-lag, and saturation-curve claims directly against replayed patient traces.

### What gets built first

[`openspec/changes/mvp-anesthesia-alpha`](openspec/changes/mvp-anesthesia-alpha/) sequences the
first build. It is a vertical slice — one routine induction, propofol and remifentanil, the real
monitor and the real debrief — ordered so the three riskiest things come first: waveform realism,
the frame budget on a real phone, and whether an anesthetist finds the patient convincing. It ends
at a clinical face-validity gate rather than a launch, on the principle that crisis scenarios are
worthless on an unconvincing patient.

[`openspec/changes/expand-anesthesia-scenarios`](openspec/changes/expand-anesthesia-scenarios/)
tracks the breadth work that follows that provisional gate. Its first verified slice adds
unexpected intraoperative hemorrhage with learner-delivered crystalloid. A later bounded foundation
adds adult packed red cells with fixed unit volume, hemoglobin mass, and calculated oxygen-delivery
evidence. The next bounded slice adds dilution-only factor and fibrinogen mass, an immediate
PT-ratio/fibrinogen teaching panel, and fixed-volume plasma. A confirmed teaching handoff now
precedes product release, while compatibility, consumption, platelets, cryoprecipitate, and
massive-transfusion management remain explicitly out of scope. Its second slice adds a
full-stomach rapid-sequence induction, modeled rocuronium onset, quantitative train-of-four
monitoring, and airway attempts that consume simulated time. A later bounded slice adds depth-
matched sugammadex and neostigmine with an antimuscarinic only during minimal block; emergence, extubation, and
aspiration physiology remain later work. A later recognition vignette now separates ordinary fasting
from a patient-specific GLP-1 escalation-and-symptom pattern without simulating gastric contents or
creating a blanket medication rule. Its third slice separates a running propofol pump command
from actual intravenous delivery, then uses a silent line disconnection under neuromuscular
blockade to teach inspection and restoration of TIVA delivery. It models a risk pattern, not
consciousness or recall. Its fourth slice models abrupt upper-airway closure and a held jaw-thrust
with continuous positive pressure, 100% oxygen, and anesthetic deepening. It stops at initial
measures; suction, airway adjuncts, succinylcholine, and refractory management remain unavailable.
Its fifth slice adds abrupt hypotension with coupled bronchospasm after cefazolin exposure and
records initial intravenous epinephrine, crystalloid, oxygen, and ventilation. It models an
observable response pattern, not definitive diagnosis, laboratory confirmation, team behavior,
or refractory management.
Its sixth slice adds a volatile-triggered malignant-hyperthermia teaching model in which rising
carbon dioxide precedes tachycardia, observable rigidity, and later heat. Learners stop volatile
delivery, establish high-flow 100% oxygen with hyperventilation, and give repeatable 2.5 mg/kg IV
dantrolene. It covers early recognition and initial response, not the complete crisis or post-crisis protocol.
Its seventh slice adds one bounded routine pediatric induction: a healthy 6-year-old weighing
20 kg. Paedfusor supplies pediatric propofol kinetics, while preoxygenation, weight-based dosing,
pediatric-sized breaths, and observed gas exchange form the learning task. The displayed depth
response remains a shared teaching calibration, not validated pediatric pharmacodynamics; the
case does not generalize to other ages or conditions and does not model pediatric hemodynamic
maturation, airway-device sizing, maintenance, or emergence.
Its eighth slice adds a reproducible failed-intubation course with marginal facemask ventilation,
an explicit request for airway help, and a fixed-time supraglottic rescue. The
learning endpoint is restored oxygen delivery and sustained capnography, not tracheal intubation.
Placement technique, team arrival, repeated supraglottic attempts, aspiration protection, the
post-rescue airway decision, and cannot-intubate-cannot-oxygenate rescue remain outside the model.
Its ninth slice adds an awake 60 kg adult with a scripted post-injection local-anesthetic toxicity
pattern and the bounded initial ASRA 2020 response: oxygen and ventilation, agent-class seizure
suppression, reduced-dose epinephrine, and weight-banded 20% lipid. It does not model a regional
block, dose-to-toxicity pharmacokinetics, refractory resuscitation, or follow-up.
Its tenth slice adds a third-cycle persistent-VF handoff with keyboard-reachable fixed-rate
compressions, exact 1 mg IV/IO epinephrine, and energy-selected biphasic defibrillation. The
declared teaching device converts VF at 200 J under accepted case conditions and never converts
asystole or PEA. It stops at initial modeled ROSC and does not claim physical CPR skill,
device-independent energy selection, reversible-cause treatment, individual outcome, or
post-cardiac-arrest care.
Its eleventh slice adds the manual crisis-injector foundation as a scenario-author tool. Nine
already-modeled entries are two-step, logged, transcripted, and deterministic: hemorrhage,
anaphylaxis, laryngospasm, bronchospasm, malignant-hyperthermia susceptibility, local-anesthetic
toxicity, shockable and non-shockable arrest, and TIVA-line disconnection. Its twelfth slice
completes the required 11-entry control with distinct high-spinal and venous-air-embolism teaching
trajectories. Their exact slopes are calibrations, not block-height, gas-volume, diagnostic,
treatment, or outcome models.
Slice 17 promotes high spinal into the fifteenth authored scenario: a bounded initial
response after an epidural top-up with help escalation, high inspired oxygen and active ventilation,
a 250–500 mL crystalloid bolus, and confirmed 6/12 mg IV ephedrine actions. It does not model
neuraxial dose or spread, pregnancy physiology, aortocaval compression, fetal status, delivery,
full vasopressor pharmacology, or individualized outcome.
Slice 18 promotes venous air embolism into the sixteenth authored scenario during central-line
removal. It adds accepted help escalation, two-step intent to stop further air entry, 100% oxygen
with active breath support, and gradual recovery of the residual monitor pattern. It does not model
gas volume, embolus location, diagnostic certainty, neurologic injury, imaging, aspiration,
positioning, hyperbaric therapy, physical source-control technique, team performance, or outcome.
Slice 19 completes the legacy bronchospasm case with accepted help escalation and a region-aware,
two-step 5 mg nebulized albuterol/salbutamol action. The bounded effect improves the modeled
lower-airway obstruction while the capnogram, oxygen, depth, and pressure remain observable. It
does not model examination, tube or circuit checks, suction, HME or nebulizer delivery, advanced
drugs, team performance, or individualized response.
Slice 20 adds the seventeenth authored scenario, a known difficult-airway case that makes the prior
record actionable before induction and contrasts one bounded rescue attempt with repeated
laryngoscopy. It uses the existing deterministic attempt-duration, accumulated-trauma, oxygen-reserve,
help-escalation, and supraglottic-rescue capabilities. It does not assess examination, manual airway
skill, communication quality, edema, bleeding, aspiration, front-of-neck access, or the post-rescue plan.
Slice 21 adds the eighteenth authored scenario, an awake, steadily breathing regional-anesthesia
case whose carbon-dioxide sampling line becomes obstructed. The displayed capnogram and end-tidal
number disappear while canonical ventilation, saturation, and plethysmography remain stable. A
cross-check and confirmed reconnection are logged and replayable. It does not model physical
examination, device-specific troubleshooting, analyzer mechanics, alarm timing, or sedation technique.
Slice 22 adds the nineteenth authored scenario, a mid-case neuraxial-anesthesia handoff with an
explicitly declared diluted factor and fibrinogen state plus modest ongoing bleeding. It rehearses
an accepted coagulation panel, panel-guided bounded plasma, and repeat testing. It does not replay
the earlier resuscitation or model laboratory and product delays, compatibility, consumption,
platelets, cryoprecipitate, reactions, source control, teams, or a massive-transfusion protocol.
Slice 23 adds the twentieth authored scenario, a stable neuraxial-anesthesia case in which a raised
arterial transducer lowers displayed MAP and an over-damped pressure system blunts waveform
morphology without changing canonical circulation. A dedicated Monitor tray supports waveform
assessment, level-and-zero intent, delayed cuff verification, and pressure-tubing replacement
intent. It does not certify physical technique or model a commercial monitor, complete cuff,
positioning, arterial-site, or individualized device-error system.
Slice 24 adds the twenty-first authored scenario, established volatile maintenance through a circle
system whose exhausted carbon-dioxide absorbent produces a raised inspiratory capnogram baseline
and rising end-tidal carbon dioxide while delivered breaths remain present. A focused Circuit tray
supports capnogram assessment, higher fresh-gas flow as a bounded bridge, absorber-replacement
intent, and confirmation of washout. It does not model a commercial workstation, physical exchange,
valve faults, full carbon-dioxide physiology, or an individualized patient response.
Slice 25 adds the twenty-second authored scenario, a calm routine inhalational-maintenance case that
starts after airway confirmation and asks the learner to plan before a changing surgical stimulus,
observe depth and hemodynamic response together, then reduce modeled opioid delivery when the
stimulus falls. It does not prescribe a real anesthetic, measure consciousness, model pain or memory,
or individualize volatile and opioid effects.
Slice 26 adds the twenty-third authored scenario, a focused blood-bank handoff during established
general anesthesia and fixed operative blood loss. The learner must wait until hemorrhage is active,
confirm the bounded release, select the released red-cell teaching action, and reassess its modeled
hemoglobin, calculated oxygen-delivery, and pressure response. It deliberately omits specimens,
identifiers, compatibility, inventory, delay, authorization, bedside checks, administration, and
team communication, so it cannot be mistaken for a real transfusion workflow.
Slice 27 adds the twenty-fourth authored scenario, a calm routine geriatric intravenous induction
for one stable 76-year-old profile. The learner builds end-tidal oxygen reserve, gives the labeled
older-adult propofol range in small spaced increments, watches the modeled effect site and pressure,
and begins bounded delivered ventilation. It does not predict an individual dose or model injection
rate, frailty, cognition, delirium, organ dysfunction, polypharmacy, airway skill, or emergence.
Slice 28 adds the twenty-fifth authored scenario, a quantitative neuromuscular-reversal lesson
during established volatile anesthesia. The learner confirms a baseline, observes one declared
rocuronium exposure through onset and recovery, chooses reversal from measured recovery depth, and
confirms a train-of-four ratio of at least 0.9. The idealized signal, bounded reversal response, and
teaching time course do not model a commercial monitor, individual recovery, emergence, extubation,
recurrent block, postoperative weakness, or patient-specific dosing.
Slice 29 adds the twenty-sixth authored scenario, a device-focused pediatric inhalational-induction
lesson for the same bounded healthy 6-year-old profile. The learner prepares oxygen and fresh-gas
flow, observes vaporizer-to-end-tidal lag, reduces delivery as agent accumulates, and reassesses
modeled depth, pressure, and saturation. It does not simulate the child's behavior, mask technique,
consciousness, airway reflexes, respiratory depression, airway placement, or individual timing.
Slice 30 adds the twenty-seventh authored scenario, a bounded obstetric general-anesthesia sequence
for emergency cesarean delivery. It introduces one calibrated term-pregnancy oxygen-reserve profile,
requires end-tidal preoxygenation and high fresh-gas flow before induction, preserves
hypnotic-before-paralytic ordering, and confirms modeled tube placement plus gas exchange. Fetal
status, delivery, aspiration, cricoid pressure, awareness, neonatal effects, hemorrhage, emergence,
and team performance remain explicit exclusions.
Slice 31 adds the twenty-eighth authored scenario, a focused preeclampsia response before urgent
delivery. The learner confirms persistent severe-range pressure, uses one bounded 20 mg IV
labetalol branch, starts a 4 g IV magnesium-sulfate loading branch for seizure prophylaxis, and
rechecks the observed pressure response. It does not diagnose preeclampsia, model alternative or
escalating treatment, reproduce drug pharmacokinetics or magnesium toxicity, choose an anesthetic,
or simulate fetal status, delivery, surgery, postpartum care, or team performance.
Slice 32 adds the twenty-ninth authored scenario, pneumothorax under positive-pressure ventilation.
The learner responds to a combined pressure-alarm, oxygenation, carbon-dioxide, and circulation
change by checking bilateral ventilation, escalating, delivering 100% oxygen, recording immediate
left-chest decompression intent, and observing recovery. It does not model airway pressure, lung
compliance, pleural gas volume, diagnostic imaging, procedural technique, equipment selection,
complications, or team performance.
Slice 33 adds the thirtieth authored scenario, aspiration-risk recognition. One elective patient is
in week 3 of semaglutide dose escalation with current nausea and bloating despite an ordinary fasting
interval. The learner reviews the combined cues, classifies delayed-emptying risk, and chooses a
confirmed disposition. It does not estimate gastric contents, simulate aspiration, teach ultrasound
or airway technique, set a universal medication rule, or replace shared planning and local policy.
Slice 34 adds the thirty-first authored scenario, emergence with residual neuromuscular blockade.
Four visible twitches and no detectable fade conflict with a static quantitative ratio of 0.72.
The learner reviews the quantitative signal, identifies residual blockade below 0.9, and preserves
the tracheal tube and delivered ventilation. It does not model reversal selection, recovery time,
consciousness, airway removal, postoperative weakness, or complete extubation readiness.
Slice 35 adds the thirty-second authored scenario, a bounded delayed-emergence differential. The
learner preserves the airway and ventilation, reviews common recorded pharmacologic and metabolic
categories in order, finds a new lateralizing examination pattern, and escalates urgently. The
fixed findings do not simulate testing, establish a neurologic diagnosis, teach treatment, or
predict outcome.
Slice 36 adds the thirty-third authored scenario, extubation readiness. A static quantitative ratio
of 0.93 opens, but cannot complete, an ordered awake-airway, spontaneous-gas-exchange, airway-risk,
and rescue-plan review. The expert path records readiness for a planned awake extubation while the
tube and delivered ventilation remain in place; removal, technique, rescue, and outcome are absent.
Slice 37 adds the thirty-fourth authored scenario, post-extubation obstruction. A drowsy adult with
obesity and obstructive sleep apnea develops a scripted soft-tissue obstruction after the tube has
already been removed. The learner recruits airway help, delivers high-concentration oxygen and
continuous positive pressure, holds a jaw thrust, and confirms modeled gas-flow recovery. The slice
does not model laryngospasm, edema, aspiration, airway adjuncts, reintubation, pulmonary edema,
recurrent obstruction, or team performance.
Slice 38 adds the thirty-fifth authored scenario, opioid-induced ventilatory impairment. A fixed
postoperative opioid exposure produces difficult arousal and a slow-rate, relatively preserved-
breath pattern while supplemental oxygen initially leaves saturation reassuring. The learner
recruits help, supports ventilation, holds further opioid, records dose-free naloxone titration
intent, and checks spontaneous recovery. Morphine pharmacokinetics, pain, sedation-scale technique,
naloxone dosing, withdrawal, recurrent depression, and monitoring disposition are absent.
Slice 39 adds the thirty-sixth authored scenario, hypothermia and rewarming. During stable
intraoperative maintenance, a fixed cooling course lowers core temperature while circulation and
ventilation remain observable. The learner confirms the trend, restores active surface warming,
records warming intent for a fixed 700 mL crystalloid exposure, and follows gradual recovery.
Device setup, probe technique, heat transfer, complications, comfort, and disposition are absent.
Slice 40 adds the thirty-seventh authored scenario, perioperative hyperglycemia. A fixed elevated
glucose cue opens an ordered point-of-care confirmation, dose-free institutional insulin-protocol
intent, 30-minute simulated wait, and repeat result within the declared 100–180 mg/dL target.
Sampling, individualized dosing, delivery, hypoglycemia, electrolytes, ketones, nutrition,
complications, and outcome are absent.
Slice 41 adds the thirty-eighth authored scenario, pacemaker and cautery planning. A fixed
device record and procedure review lead to a coordinated asynchronous-pacing plan, external backup,
continuous monitoring, and explicit post-procedure restoration. Interrogation, programming, magnet
effects, electrosurgery technique, malfunction, emergency response, and team performance are absent.
Slice 42 adds the thirty-ninth authored scenario, postoperative handoff. Receiver readiness opens
separate patient/course and current-state blocks, followed by unresolved risks with timing and
ownership, receiver synthesis, and acknowledged acceptance. Voice, behavior, staffing, bedside
assessment, documentation, real clinical action, and outcomes are absent.

## Running it

Contributions follow [CONTRIBUTING.md](CONTRIBUTING.md). Clinical authors should begin with the
[scenario author guide](docs/scenario-author-guide.md) and
[evidence brief](docs/evidence-brief.md); security concerns follow [SECURITY.md](SECURITY.md).

Requires Node.js 22.13+ on the 22.x line, or Node.js 24+.

```bash
npm ci
npm run dev
```

```bash
npm run ci
```

`npm run ci` runs strict specification validation, the design-token lint, the build, the full test
suite, the public-tree audit, the size budgets and the font budget. Run
`npm run public-ready:history` from a complete clone to repeat the full-history secret and
contributor-metadata audit. `npm run release` runs the clinical and validation
gates and currently **refuses**,
which is correct.

| Route | What it is |
| --- | --- |
| `/` | The front door |
| `/anesthesia` | The simulator |
| `/validation` | The validation report, generated from the same constants the tests assert |
| `/governance` | Every content item and whether it is signed, by name |
| `/limitations` | What is not modelled and where that would mislead you |
| `/privacy` | What is stored, and the test enforcing each claim |
| `/gallery` | Every component in every state, for visual review |
| `/frame-budget` | The measurement harness, to be run on a real device |

The build also publishes `/catalog/scenario-completion.schema.json` and
`/catalog/anesthesia-completion-audit.json`. The audit names which parts of the new completion
contract each existing scenario satisfies and, just as importantly, which evidence is still
missing. Structurally valid does not mean complete; incomplete scenarios are never counted as
complete by trusting a card or a boolean.

The same catalog directory publishes training-value, authored-defaults, scenario-hazard, and
state-space-verification schemas plus `/catalog/anesthesia-quality-audit.json`. A scenario is
playable only when its completion contract and all four version-bound quality records pass. The
current audit honestly reports 0 playable scenarios while those records are still being authored.

`/catalog/asset-licenses.json` classifies every shipped media asset by source, author, license,
modification, and redistribution terms; `/catalog/evidence-sources.json` publishes the complete
clinical source register. Both are generated, offline-available release artifacts. The build fails
if any media asset is unclassified, multiply classified, missing its license, or differs from a
pinned provenance hash.

`/catalog/maturity-record.schema.json` defines the shared six-state maturity vocabulary, and
`/catalog/anesthesia-maturity.json` binds each current status to an exact content version for all 41
scenarios, explainers, drug cards, and practice-region profiles. The current records remain `draft`;
no source check, clinical review, or endorsement is inferred.
The shared publication policy separately names every preview gate and reserves reviewed-only claims
for exact-version `clinically_reviewed` or `institution_endorsed` records.
Scenario cards, briefings, live sessions, debriefs, explainers, drug cards, and practice-region
context link their text-and-icon maturity marker to that exact public record. Live-session links
open the offline catalog in a new tab so checking the evidence never interrupts the simulation.
Release commands now expose separate preview and reviewed channels; neither has an unsigned-alpha
bypass, and missing exact-version maturity records fail closed.

Architecture tests keep tutor rules outside engine and session mutation paths. The same boundary
also rejects any reporting code that reads browser storage, transcripts, reflections, or progress;
reporting must receive an explicit bounded projection when it is implemented.
Tutor, history, recommendation, and debrief surfaces are also barred from browser network
primitives. CI rejects leaderboards, learner percentiles, streak mechanics, public performance,
arbitrary point awards, and rewards tied to irrelevant speed; causal contributors and simulation
speed remain ordinary teaching tools, not learner rankings.

The product boundary is executable too: CI rejects standalone calculator, score, classification,
conversion, lookup, checklist-answer, documentation-generator, diagnosis, treatment-recommendation,
real-patient input, public compute API, package API, and MCP surfaces. Calculations remain permitted
inside a fictional scenario only when they drive or explain the simulated patient.

## Status: alpha, and not yet clinically reviewed

This is worth stating plainly, because everything above describes what the project is *for* and
this describes what it currently *is*.

**No clinician has signed any content in this build.** The editorial board is empty. Every
scenario, drug card, explainer and region profile carries an unsigned review record, the build
gate excludes every one of them from a release, and `npm run release` refuses to publish.

**No pharmacology parameter has had its independent second-source check.** The values are
transcribed from the primary publications, but the check by a second person that this project
requires before a model may be called *Published* has not happened. Every number a model drives
is marked as pending that check, wherever it appears.

**The face-validity review has not been run**, and neither has the frame-budget measurement on a
physical device. Both need people and hardware rather than more code.

What *is* done: the waveform engine, the compartment solver, the physiology, the design system,
the cockpit, the sound layer, the accessibility layer, the debrief, the practice regions, the
prerendered front door, and the offline shell — with hundreds of automated tests, the Benumof
apnea benchmarks inside 5% of the published times, and every architectural boundary the
specification promises enforced by a test rather than by intention.

[`openspec/changes/mvp-anesthesia-alpha/tasks.md`](openspec/changes/mvp-anesthesia-alpha/tasks.md)
marks exactly which tasks are done and which are not, and why.

## What this is grounded in

The specs bind the product to published evidence and to the standards clinicians already
recognize, rather than to invented conventions:

| Area | Source |
| --- | --- |
| Predictive performance (MDPE, MDAPE, wobble, divergence) | Varvel, Donoho & Shafer, *J Pharmacokinet Biopharm* 1992 ([PMID 1588504](https://pubmed.ncbi.nlm.nih.gov/1588504/)) |
| Propofol PK/PD | Marsh 1991; Schnider 1998; Eleveld et al., *Br J Anaesth* 2018;120:942–59 |
| Remifentanil PK/PD | Minto et al., *Anesthesiology* 1997 ([PMID 9009935](https://pubmed.ncbi.nlm.nih.gov/9009935/), [9009936](https://pubmed.ncbi.nlm.nih.gov/9009936/)) |
| Age-related MAC | Nickalls & Mapleson, *Br J Anaesth* 2003;91:170–4 |
| Apnea desaturation times | Benumof, Dagg & Benumof, *Anesthesiology* 1997 ([PMID 9357902](https://pubmed.ncbi.nlm.nih.gov/9357902/)) |
| Monitored parameter set | [ASA Standards for Basic Anesthetic Monitoring](https://www.asahq.org/standards-and-practice-parameters/standards-for-basic-anesthetic-monitoring) |
| Alarm priority, color, flash rate | IEC 60601-1-8 |
| Malignant hyperthermia protocol | [MHAUS acute crisis protocol](https://www.mhaus.org/healthcare-professionals/managing-a-crisis/) |
| Local anesthetic systemic toxicity | ASRA checklist, 2020 version ([PMID 33148630](https://pubmed.ncbi.nlm.nih.gov/33148630/)) |
| High central neuraxial block | [Obstetric Anaesthetists' Association quick reference](https://www.oaa-anaes.ac.uk/downloads/oaa-qrh/2-7-high-central-neuraxial-block.pdf) |
| Venous air embolism | McCarthy et al., *Diagnostics* 2017;7:5 ([PMID 28106717](https://pubmed.ncbi.nlm.nih.gov/28106717/)) |
| Pneumothorax under positive pressure | Association of Anaesthetists QRH, June 2023; Resuscitation Council UK special circumstances, 2025 |
| Difficult airway | 2022 ASA Practice Guidelines ([PMID 34762729](https://pubmed.ncbi.nlm.nih.gov/34762729/)) |
| Neuromuscular blockade and reversal | 2023 ASA Practice Guidelines (quantitative monitoring, TOF ratio ≥ 0.9) |
| Awareness epidemiology | NAP5, *Br J Anaesth* 2014 ([PMID 25204697](https://pubmed.ncbi.nlm.nih.gov/25204697/)) |
| Perioperative anaphylaxis epidemiology | NAP6, *Br J Anaesth* 2018 |
| Debriefing structure | PEARLS — Eppich & Cheng, *Simul Healthc* 2015 ([PMID 25710312](https://pubmed.ncbi.nlm.nih.gov/25710312/)) |
| Simulation design | INACSL Healthcare Simulation Standards of Best Practice |
| Curriculum mapping | ACGME Anesthesiology Milestones 2.0; COA / NBCRNA content domains |
| Prior evidence for screen-based sim | Schwid et al. ([PMID 11302037](https://pubmed.ncbi.nlm.nih.gov/11302037/)) |
| ECG waveform generation | McSharry, Clifford, Tarassenko & Smith, *IEEE Trans Biomed Eng* 2003 ([PMID 12669985](https://pubmed.ncbi.nlm.nih.gov/12669985/)) |
| Pulse tone pitch behavior | ISO 80601-2-61 (pitch falls as saturation falls) |
| Difficult laryngoscopy incidence | Cormack-Lehane grading; published elective-surgery incidence ranges |

**On practice variation.** Target-controlled infusion is routine practice across the UK,
Europe, Australia, and much of Asia, and TCI pumps are **not FDA-approved for routine use
in the United States**. Teaching a learner a technique they cannot use where they train is
a defect, so practice region is a first-class setting governing technique availability,
formulary, protocol variant, units, and terminology.

**On the ECG model.** The McSharry equations are implemented from the published paper. No
code is taken from the GPL-licensed PhysioNet ECGSYN reference implementation, so this
project's permissive license stays clean.

**On depth of anesthesia.** The depth index is a *predicted* value from a published
pharmacodynamic model, on the 0–100 scale those models were fitted to. It is not the
output of any commercial monitor and does not reproduce any proprietary algorithm. BIS is
a trademark of Medtronic, referenced here only to identify the scale a published model
targets.

**Regulatory position.** Educational training software, not a medical device. The FDA
lists software that simulates clinical scenarios to train health professionals among
[examples of software functions that are not medical devices](https://www.fda.gov/medical-devices/device-software-functions-including-mobile-medical-applications/examples-software-functions-are-not-medical-devices).
No device clearance has been sought or held.

**What this does not do.** It does not teach psychomotor skills, physical airway
technique, or team communication, and it does not replace mannequin-based simulation or
supervised clinical time. See [`engine/validation`](openspec/specs/engine/validation/spec.md)
for the limitations register.

## A note on Hypnos

[Hypnos](https://github.com/clay-good/hypnos) is a sibling project: a curated,
citation-backed dataset of PK/PD model parameters with confidence tiers and applicability
envelopes. It is a useful cross-check when transcribing parameters, and the envelope idea
is borrowed gratefully. It is **not** a dependency of this project — not imported, not
vendored, not fetched. Open Sim Lab owns its numbers and tests them against the primary
literature directly.

## License

Code is MIT. Educational content is openly licensed per scenario. See `LICENSE`.
