# Open Sim Lab

An open-source, browser-native clinical simulator for medical students, residents, and
nurse anesthetists — anywhere in the world, on any device, with or without a network.

**opensimlab.com/anesthesia** is the first module. `/oncology` and `/cardiology` follow.

The goal is not a tech demo. It is the best anesthesia education on the internet: the
thing a student opens the night before their first day in the OR and comes out of
understanding something they did not understand before.

Physical simulation labs cost hundreds of thousands of dollars, require physical
attendance, and are bottlenecked by scheduling. Open Sim Lab is free, needs no login or
install, runs entirely in the browser, works offline, and sends nothing anywhere.

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

**Nothing leaves the device.** No login, no accounts, no server, no analytics, no
telemetry. Progress, transcripts, and debriefs live in the browser on that device. Sharing
happens only through a file the learner exports deliberately.

**Every clinical claim is signed, sourced, and correctable.** A named editorial board of
credentialed clinicians reviews every scenario, protocol, drug card, and explainer, with
declared competing interests and a re-review date. Crisis protocols trace to their issuing
body — MHAUS, ASRA, ASA. Physiology is checked against published benchmarks as automated
tests. What the simulator does *not* model is published as a limitations register, and
mistakes go into a permanent public corrections log.

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
| [`platform/privacy`](openspec/specs/platform/privacy/spec.md) | No telemetry, no accounts, no server state, on-device only |
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
lists **Anesthesia** as available and **Cardiology** and others as *Planned*, with no dates
promised, because the project does not commit to schedules it cannot keep.

Search weight is concentrated at the root domain on purpose. The simulator itself carries only a
title, a description, a canonical URL, and social tags — no marketing copy in the cockpit. Every
indexable route is prerendered to static HTML so a crawler, a scripting-disabled browser, and a
link preview all get real content without executing the app. Search performance is measured only
through a webmaster console, which needs no script on the page, so the no-telemetry guarantee
holds.

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
aspiration physiology remain later work. Its third slice separates a running propofol pump command
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

## Running it

Requires Node.js 22.13+ on the 22.x line, or Node.js 24+.

```bash
npm ci
npm run dev
```

```bash
npm run ci
```

`npm run ci` runs strict specification validation, the design-token lint, the build, the full test
suite, the size budgets and the font budget. `npm run release` runs the clinical and validation
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
