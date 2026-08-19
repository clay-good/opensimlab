# engine/scenario-engine Specification

## Purpose

Defines how a clinical case is described, loaded, driven, and perturbed: the declarative scenario file format, the virtual patient profile, scripted timeline events, and the crisis injector that produces the rare emergencies most students never see in person.

## Requirements

### Requirement: Declarative Scenario Format

A scenario SHALL be a single declarative JSON document, validated against a published JSON Schema, containing: metadata (id, version, title, author, license, estimated duration, difficulty, learning objectives), the patient profile, the starting equipment and monitoring state, the drug formulary available, a timeline of scripted events, and the debrief rubric.

#### Scenario: An invalid scenario is rejected with a precise message

- **WHEN** a scenario omits a required field or uses an unknown event type
- **THEN** loading fails before any simulation starts, and the error names the JSON pointer, the expected type, and the schema rule violated

#### Scenario: Scenarios are authorable without writing code

- **WHEN** an educator writes a scenario file by hand following the published schema and examples
- **THEN** it loads and runs without any change to application source, and the schema is bundled so an editor can validate it offline

### Requirement: Virtual Patient Profile

The patient profile SHALL specify age, sex, height, total body weight, ASA physical status, primary diagnosis, planned procedure, relevant comorbidities, current medications, allergies, fasting status, airway assessment, and baseline vital signs. Derived values such as body mass index, lean body mass, and predicted body weight SHALL be computed, not stored.

#### Scenario: Comorbidities alter the response, not just the text

- **WHEN** the profile marks severe aortic stenosis
- **THEN** the physiology layer applies the corresponding constraint — a fixed stroke volume that cannot rise to compensate for vasodilation — and the debrief can cite it

#### Scenario: Allergy is enforced

- **WHEN** the profile lists a documented anaphylactic allergy and the learner administers that agent
- **THEN** the engine triggers the anaphylaxis response, and the event log records both the administration and the allergy that was documented

#### Scenario: Pediatric and elderly profiles select appropriate models

- **WHEN** the profile is a 6-year-old child
- **THEN** propofol defaults to the pediatric model and adult-only models are demoted to **Out of range** by the envelope rules

### Requirement: Scripted Timeline Events

A scenario SHALL be able to schedule events at fixed simulated times or on triggering conditions, including surgical stimulus changes, blood loss, equipment failure, physiological deterioration, and narrative prompts.

#### Scenario: A time-based event fires exactly once

- **WHEN** a scenario schedules incision at tick 3000 (5 simulated minutes)
- **THEN** the surgical stimulus rises at exactly that tick, the event appears in the log, and it does not re-fire on replay or after a speed change

#### Scenario: A conditional event fires on a state predicate

- **WHEN** a scenario declares "trigger laryngospasm when the train-of-four ratio exceeds 0.7 and airway manipulation occurs"
- **THEN** the event fires the first time the predicate holds and is then marked consumed unless declared repeatable

### Requirement: Crisis Injector

The application SHALL provide a manual crisis injector covering at minimum: massive hemorrhage, anaphylaxis, laryngospasm, bronchospasm, malignant hyperthermia, local anesthetic systemic toxicity, high spinal, air embolism, cardiac arrest with a shockable and a non-shockable rhythm, and total intravenous anesthesia line disconnection with awareness under paralysis.

#### Scenario: Massive hemorrhage produces a coherent picture

- **WHEN** massive hemorrhage is injected at 100 mL/min
- **THEN** circulating volume falls, cardiac output and mean arterial pressure fall, the anesthetized patient shows blunted compensation, end-tidal carbon dioxide falls with cardiac output, and the arterial line waveform shows increasing respiratory variation

#### Scenario: Malignant hyperthermia follows the MHAUS protocol

- **WHEN** malignant hyperthermia is triggered in a susceptible profile exposed to a volatile agent and succinylcholine
- **THEN** end-tidal carbon dioxide rises first and steeply, followed by tachycardia, muscle rigidity, and a later temperature rise; **AND** the scenario's protocol steps follow the MHAUS acute-crisis protocol — discontinue triggering agents, hyperventilate with 100% oxygen at 10 L/min, give dantrolene 2.5 mg/kg intravenously and repeat until end-tidal carbon dioxide, rigidity, and heart rate improve, treat acidosis and hyperkalemia, and cool actively above 39 °C, stopping below 38 °C

#### Scenario: The first sign is the one the learner must catch

- **WHEN** the malignant hyperthermia scenario runs without intervention
- **THEN** a rising end-tidal carbon dioxide despite adequate minute ventilation precedes the temperature rise by a clinically realistic interval, and the debrief names temperature as a late sign

#### Scenario: Anaphylaxis reflects NAP6 epidemiology

- **WHEN** the perioperative anaphylaxis scenario runs
- **THEN** its presenting features follow the distribution reported by the 6th National Audit Project (*Br J Anaesth* 2018) — hypotension the commonest presentation, then bronchospasm — and the scenario library includes an antibiotic trigger, because NAP6 found antibiotics the leading culprit, correcting the common assumption that a neuromuscular blocker is always the cause

#### Scenario: Local anesthetic systemic toxicity follows the ASRA checklist

- **WHEN** the local anesthetic systemic toxicity scenario runs
- **THEN** the protocol steps follow the ASRA 2020 checklist (Neal, Neal, and Weinberg, PMID 33148630), including airway management, seizure suppression, reduced epinephrine dosing, avoidance of the drugs the checklist names, and 20% lipid emulsion at the checklist's weight-banded doses

#### Scenario: Line disconnection under paralysis is silent on the monitor

- **WHEN** the intravenous anesthesia line is disconnected while a neuromuscular blocker is active
- **THEN** effect-site hypnotic concentration falls, the predicted depth index climbs above 60, the train-of-four ratio remains low, and no other vital sign alarms, so the learner must notice depth rather than wait for a vital sign

#### Scenario: The awareness scenario carries its evidence base

- **WHEN** the awareness-under-paralysis scenario is briefed and debriefed
- **THEN** it cites the 5th National Audit Project (*Br J Anaesth* 2014;113:549–59) — an overall reported incidence near 1 in 19,600, rising to about 1 in 8,200 with neuromuscular blockade versus about 1 in 135,900 without, with two-thirds of reports arising at induction or emergence — so the learner understands why paralysis is the risk multiplier and why the dynamic phases matter

### Requirement: Sensor Artifact Injection

The engine SHALL be able to corrupt a monitored signal without changing the underlying physiology, so that learners practice distinguishing a monitoring problem from a patient problem.

#### Scenario: Damped arterial line does not change the true pressure

- **WHEN** arterial line damping is injected
- **THEN** the displayed arterial waveform flattens and the displayed pressure falls, while the true mean arterial pressure in the state vector is unchanged and the non-invasive cuff, when cycled, reports the true value

#### Scenario: Electrocautery corrupts the electrocardiogram only

- **WHEN** electrocautery interference is injected
- **THEN** the electrocardiogram trace becomes noisy and the displayed heart rate becomes unreliable, while the pulse oximetry plethysmograph and capnography traces remain clean and consistent with the true state

#### Scenario: Pulse oximeter probe displacement

- **WHEN** the oximetry probe is displaced
- **THEN** the plethysmograph loses pulsatility and the saturation reading drops or blanks, while capnography continues to show normal ventilation and cardiac output is unchanged

### Requirement: Crisis Protocols Are Traceable To Their Issuing Body

Every crisis scenario SHALL name the guideline it implements, its issuing body, and the version consulted, and its protocol steps SHALL be checkable line by line against that source.

#### Scenario: A reviewer can diff the protocol against the source

- **WHEN** a clinical reviewer checks a crisis protocol
- **THEN** each step in the scenario file carries the source clause it derives from, so the review is a comparison rather than a judgment call

#### Scenario: Airway management follows the current guideline

- **WHEN** the difficult airway scenario runs
- **THEN** its decision structure reflects the 2022 ASA Practice Guidelines for Management of the Difficult Airway (PMID 34762729), including limiting intubation attempts, calling for help early, attending to elapsed time and oxygen saturation, and confirming gas exchange

#### Scenario: A superseded guideline is caught before a learner sees it

- **WHEN** an issuing body publishes a newer version of a cited guideline
- **THEN** the currency register flags the affected scenarios for re-review under the clinical governance capability

### Requirement: Bundled Scenario Library

The initial release SHALL ship at least twelve complete, openly licensed scenarios spanning routine and emergency anesthesia care, each with stated learning objectives, an expected duration under 20 simulated minutes at 1×, and a debrief rubric.

#### Scenario: Library covers a defined curriculum spread

- **WHEN** the bundled library is inventoried
- **THEN** it includes at least one routine induction, one rapid-sequence induction, one difficult airway, one hemorrhage, one anaphylaxis, one malignant hyperthermia, one local anesthetic systemic toxicity, one cardiac arrest, one pediatric case, one obstetric case, one geriatric case, one obesity case, and one awareness-under-paralysis case

#### Scenario: Rare events are chosen because they are rare

- **WHEN** the rationale for the crisis scenarios is reviewed
- **THEN** each names its reported incidence with a citation — for example perioperative anaphylaxis near 1 in 10,000 anaesthetics per NAP6 — justifying its inclusion on the ground that a trainee is unlikely to meet it during training

#### Scenario: Every scenario is playable offline on first load

- **WHEN** the application is installed as a progressive web app and the device goes offline
- **THEN** all bundled scenarios load and run with no network access
