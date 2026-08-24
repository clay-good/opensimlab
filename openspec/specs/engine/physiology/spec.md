# engine/physiology Specification

## Purpose

Defines the virtual patient: the hemodynamic, respiratory, neuromuscular, and metabolic state variables, the homeostatic reflexes that regulate them, and the way drug effect, ventilator settings, fluid status, and surgical stimulus combine to move them. This is the layer that turns a concentration into a monitor number.

## Requirements

### Requirement: Canonical Patient State Vector

The engine SHALL maintain a single explicit patient state vector, updated every 100 ms, containing at minimum: heart rate (bpm), systolic / diastolic / mean arterial pressure (mmHg), cardiac output (L/min), stroke volume (mL), systemic vascular resistance (dyn·s·cm⁻⁵), circulating blood volume (mL), hemoglobin (g/dL), arterial oxygen saturation (%), end-tidal carbon dioxide (mmHg), respiratory rate (breaths/min), tidal volume (mL), core temperature (°C), predicted depth-of-anesthesia index (0–100), train-of-four ratio (0–1), and end-tidal sevoflurane (vol %) with its age-adjusted MAC fraction.

#### Scenario: Every state variable is typed and bounded

- **WHEN** the state vector is emitted
- **THEN** each field carries an explicit SI or clinical unit in its type, and any value outside its physiological hard bound is clamped and logged as an engine warning rather than rendered

#### Scenario: Baseline reflects the patient profile

- **WHEN** a scenario loads a 72 y, 60 kg female with ASA III and treated hypertension
- **THEN** the initial state vector reflects the profile's baseline blood pressure and heart rate from the scenario definition, not a fixed 120/80 and 70 bpm default

### Requirement: Hemodynamic Response Model

Mean arterial pressure SHALL be derived from cardiac output and systemic vascular resistance rather than set directly:

```
MAP  = CO * SVR / 80 + CVP
CO   = HR * SV
```

Anesthetic agents SHALL act on the physiologic terms — vasodilation reduces `SVR`, myocardial depression reduces `SV` — so that the same MAP arrived at by different mechanisms responds differently to treatment.

#### Scenario: Propofol induction produces vasodilatory hypotension

- **WHEN** a 2 mg/kg propofol bolus reaches peak effect site in the reference adult
- **THEN** systemic vascular resistance falls, mean arterial pressure falls by a scenario-defined magnitude, and the cause recorded in the state trace is vasodilation rather than an unattributed pressure drop

#### Scenario: Vasopressor treats the right mechanism

- **WHEN** hypotension is vasodilatory and phenylephrine is given
- **THEN** systemic vascular resistance rises, mean arterial pressure recovers, and heart rate falls through the baroreflex

#### Scenario: Vasopressor is insufficient for hypovolemia

- **WHEN** mean arterial pressure is low because circulating volume has fallen 25% from hemorrhage and phenylephrine alone is given
- **THEN** mean arterial pressure rises only transiently and returns toward the hypotensive value, while cardiac output remains depressed, until volume is replaced

### Requirement: The Circulation Responds To Hypoxaemia

The haemodynamic model SHALL take arterial oxygen saturation as an input and SHALL reproduce the sequence that makes an unrelieved airway problem fatal: a sympathetic tachycardia as saturation falls, then bradycardia and falling cardiac output as the myocardium is impaired, then asystole. This response SHALL be declared an Open Sim Lab teaching model wherever it drives a number.

#### Scenario: An abandoned patient does not quietly carry on

- **WHEN** a patient is given an induction dose and then neither ventilated nor oxygenated
- **THEN** the heart rate rises while the saturation falls, then falls as the saturation continues to fall, the mean arterial pressure falls with the cardiac output rather than recovering, and the patient arrests — over minutes, so that the deterioration is recognisable rather than instant

#### Scenario: The early warning comes before the late one

- **WHEN** the two hypoxic responses are compared
- **THEN** the sympathetic response begins at a higher saturation than myocardial failure does, so a learner meets a rising heart rate with a falling saturation while the situation is still recoverable, and a falling heart rate only when it is very late

#### Scenario: A managed patient never meets any of it

- **WHEN** a patient is preoxygenated, induced and ventilated
- **THEN** saturation never falls far enough for either hypoxic response to apply and the circulation behaves exactly as it did before this response existed

#### Scenario: Arrest is where the module stops, and it says so

- **WHEN** the circulation stops
- **THEN** the session log states plainly that this module models no resuscitation — no compressions, no adrenaline, no defibrillation — the patient does not recover however the airway is subsequently managed, and the limitations register records both the teaching model and the absence of resuscitation

#### Scenario: An arrest is in the state, not only on the display

- **WHEN** oxygen is restored to an arrested patient
- **THEN** the heart rate and the cardiac output in the patient state remain zero, so no surface, transcript or debrief can report a recovery the model did not produce

#### Scenario: A monitor shows nothing rather than an impossible number

- **WHEN** there is no cardiac output
- **THEN** oxygen saturation, heart rate and the blood pressures are reported as unmeasurable rather than as zero, because a pulse oximeter reads the pulsatile component of absorbance and with no pulse there is nothing for it to read

### Requirement: Baroreflex And Autonomic Regulation

The engine SHALL implement a baroreflex that adjusts heart rate and systemic vascular resistance toward a set-point mean arterial pressure with a first-order time constant, and SHALL attenuate reflex gain in proportion to anesthetic depth and to opioid effect-site concentration.

#### Scenario: Awake patient compensates for blood loss

- **WHEN** 500 mL of blood is lost from an awake, unanesthetized virtual patient
- **THEN** heart rate rises and systemic vascular resistance rises, holding mean arterial pressure within 10% of baseline

#### Scenario: Anesthetized patient does not compensate

- **WHEN** the same 500 mL loss occurs at a predicted depth index of 45 with remifentanil running
- **THEN** the reflex tachycardia is markedly blunted and mean arterial pressure falls substantially, teaching that anesthesia removes the compensation that masks hypovolemia

### Requirement: Respiratory And Gas Exchange Model

The engine SHALL model alveolar ventilation, carbon dioxide production and clearance, and oxygen uptake, so that end-tidal carbon dioxide and arterial oxygen saturation follow from ventilator settings, apnea, airway obstruction, and metabolic rate.

#### Scenario: Hypoventilation raises end-tidal carbon dioxide

- **WHEN** minute ventilation is halved by reducing respiratory rate from 12 to 6 at constant tidal volume
- **THEN** end-tidal carbon dioxide rises toward a new steady state with a time constant consistent with body carbon dioxide stores, not instantaneously

#### Scenario: Apnea desaturation reproduces published times

- **WHEN** ventilation stops after preoxygenation in a healthy 70 kg adult, a moderately ill adult, and an obese adult
- **THEN** the times to an arterial oxygen saturation of 90% approximate the values reported by Benumof, Dagg, and Benumof (*Anesthesiology* 1997;87:979–82, PMID 9357902) — about 8, 5, and 2.7 minutes respectively — within the tolerance declared in the validation report

#### Scenario: Desaturation follows the dissociation curve, not a straight line

- **WHEN** saturation falls below 90%
- **THEN** the subsequent fall is markedly steeper than the preceding plateau, reflecting the shape of the oxyhemoglobin dissociation curve, so a learner sees why 90% is the point of urgency

#### Scenario: Failure to preoxygenate shortens the margin visibly

- **WHEN** the same apnea occurs without preoxygenation
- **THEN** the time to 90% is a small fraction of the preoxygenated time, and the debrief names preoxygenation as the modifiable factor

### Requirement: Neuromuscular Blockade

The engine SHALL model neuromuscular blockade as a train-of-four ratio and count driven by the effect-site concentration of the administered blocking agent, and SHALL model reversal by neostigmine and by sugammadex encapsulation.

#### Scenario: Rocuronium produces intubating conditions then recovers

- **WHEN** 0.6 mg/kg rocuronium is given
- **THEN** the train-of-four count reaches zero within a model-consistent onset time and recovers spontaneously over the expected duration

#### Scenario: Reversal follows the 2023 ASA guideline dose–depth relationship

- **WHEN** sugammadex 2 mg/kg is given with at least one train-of-four twitch present, and 4 mg/kg with no twitches but a post-tetanic count of one or more
- **THEN** the train-of-four ratio recovers to 0.9 or greater, consistent with the 2023 ASA practice guideline for monitoring and antagonism of neuromuscular blockade

#### Scenario: Neostigmine is restricted to minimal block

- **WHEN** neostigmine with an antimuscarinic is requested outside four twitches and a quantitative ratio from 0.4 to below 0.9
- **THEN** the request is rejected without recovery, demonstrating why the guideline restricts neostigmine to minimal blockade and recommends sugammadex from deep and moderate blockade

#### Scenario: Qualitative assessment cannot exclude residual blockade

- **WHEN** the train-of-four ratio lies between 0.4 and 0.9
- **THEN** the qualitative twitch display shows no detectable fade while the quantitative ratio readout shows the true value, reproducing the insensitivity of subjective assessment that the guideline is built on, and the debrief names extubation below a ratio of 0.9 as residual blockade

#### Scenario: Succinylcholine in a patient with pseudocholinesterase deficiency

- **WHEN** the scenario sets the plasma cholinesterase phenotype to deficient and succinylcholine is given
- **THEN** the block persists far beyond the normal duration and the debrief names prolonged block as the finding

### Requirement: Volatile Agent Uptake And MAC

The engine SHALL model sevoflurane uptake from the vaporizer through the breathing circuit to the alveolus and effect site, and SHALL express depth as an age-adjusted minimum alveolar concentration fraction.

#### Scenario: MAC is age-adjusted per the iso-MAC relationship

- **WHEN** end-tidal sevoflurane is 2.0 vol % in a 20-year-old and in an 80-year-old
- **THEN** the reported minimum alveolar concentration fraction is higher in the older patient, reproducing the age-related iso-MAC relationship of Nickalls and Mapleson (*Br J Anaesth* 2003;91:170–4)

#### Scenario: Nitrous oxide contributes to total MAC

- **WHEN** 60% nitrous oxide is added at a fixed end-tidal sevoflurane concentration
- **THEN** the total minimum alveolar concentration fraction rises additively as the iso-MAC charts describe, and the interface shows the contribution of each agent separately

#### Scenario: A control the model does not use says so where it is used

- **WHEN** a learner sets a control this module records but does not act on — PEEP, or pressure-control ventilation
- **THEN** the session log states once, at that point, that the setting will change nothing and what specifically will not change, because a learner who sets PEEP and sees no response reasonably concludes that PEEP does not do much; and the limitations register carries the same entry

#### Scenario: The vaporizer reaches the patient, not only the display

- **WHEN** a learner sets the vaporizer and end-tidal sevoflurane rises
- **THEN** the depth index falls and the blood pressure falls with it, so the setting changes the patient rather than only the numbers describing the gas; a control that moves a figure on screen without touching the patient SHALL NOT ship

#### Scenario: The volatile's depth contribution is anchored to the depth endpoint

- **WHEN** the MAC fraction is converted into the depth surface's normalized potency
- **THEN** the denominator is the MAC fraction giving a half-maximal depth INDEX, about one MAC — not MAC, which is an EC50 for movement, and not MAC-awake, which is an EC50 for response to command — so the index reads in the mid-forties at 1.0 MAC, near 65 at 0.5 MAC and in the twenties at 2 MAC

#### Scenario: A volatile adds to an intravenous hypnotic

- **WHEN** propofol and sevoflurane are both present
- **THEN** their normalized potencies combine additively, and the synergy term applies only between hypnotic and opioid where it is established

#### Scenario: A volatile overdose looks like one

- **WHEN** the vaporizer is left at 8 vol % until the end-tidal concentration approaches it
- **THEN** the patient is reported at over 4 MAC, profoundly deep, and profoundly hypotensive, with the fall attributed to volatile vasodilation and myocardial depression and declared an Open Sim Lab teaching model

#### Scenario: Fresh gas flow changes wash-in speed

- **WHEN** the vaporizer is set to 4 vol % at a fresh gas flow of 1 L/min and again at 8 L/min
- **THEN** the end-tidal concentration approaches the dial setting substantially faster at the higher flow, and turning the vaporizer off washes agent out faster at higher flow
- **AND** this flow-dependent time constant is identified as an Open Sim Lab teaching calibration rather than a breathing-system, uptake, distribution, or rebreathing model

### Requirement: Fluids, Blood Loss, And Transfusion

The engine SHALL track circulating volume and hemoglobin, apply the differing volume-expanding efficiency of crystalloid and blood products, and reduce oxygen delivery as hemoglobin falls.

#### Scenario: Crystalloid dilutes hemoglobin

- **WHEN** 1000 mL of crystalloid is given after a 1000 mL hemorrhage
- **THEN** circulating volume partially recovers, hemoglobin falls further by dilution, and oxygen delivery improves less than volume alone would suggest

#### Scenario: Packed red cells restore oxygen delivery

- **WHEN** two units of packed red cells are given in the same state
- **THEN** hemoglobin and calculated oxygen delivery both rise, and the event log records the volume and the hemoglobin change

### Requirement: Surgical Stimulus

The engine SHALL model surgical stimulus as a time-varying scalar that raises heart rate, blood pressure, and the predicted depth-of-anesthesia index, and that is opposed by hypnotic and opioid effect.

#### Scenario: Incision without opioid provokes a response

- **WHEN** surgical incision occurs at a predicted depth index of 55 with no opioid on board
- **THEN** heart rate and mean arterial pressure rise and the predicted depth index transiently increases

#### Scenario: Adequate opioid blunts the response

- **WHEN** the same incision occurs with an effect-site remifentanil concentration in the analgesic range
- **THEN** the hemodynamic response is markedly attenuated, demonstrating the hypnotic–opioid balance

### Requirement: Physiology Is Reproducible And Attributable

Every change to a state variable SHALL be attributable to a named contributing term, and the engine SHALL be able to emit that attribution for debriefing and for testing.

#### Scenario: Debrief explains a pressure drop

- **WHEN** a learner asks why mean arterial pressure fell at a given simulated time
- **THEN** the engine reports the ranked contributions — for example propofol vasodilation, hemorrhage, and positive-pressure ventilation — with each term's share

#### Scenario: Noise is seeded

- **WHEN** physiological variability or sensor noise is applied
- **THEN** it is drawn from a seeded pseudorandom generator recorded in the session, so the same seed reproduces the same trace exactly
