# Evidence brief: preeclampsia before urgent delivery

## Decision this lesson rehearses

Confirm a declared persistent severe-range blood pressure, use one explicitly bounded first-line
antihypertensive branch, start a separate magnesium-sulfate branch for seizure prophylaxis, and
recheck the observed maternal pressure. The urgent-delivery decision is already made.

## Source basis

1. American College of Obstetricians and Gynecologists. *Gestational Hypertension and
   Preeclampsia: ACOG Practice Bulletin No. 222*. Obstet Gynecol 2020;135:e237-60; reaffirmed
   2026. Consulted August 24, 2026. The official bulletin page and tables support the severe-range
   threshold, urgent treatment, IV labetalol as a first-line option, and a magnesium-sulfate loading
   branch for seizure prophylaxis.
2. Alliance for Innovation on Maternal Health. *Severe Hypertension in Pregnancy Patient Safety
   Bundle*. 2022. Consulted August 24, 2026. The implementation and response resources support
   repeat verification of a persistent systolic pressure at least 160 mmHg or diastolic pressure at
   least 110 mmHg and treatment initiation within 60 minutes.
3. Society for Maternal-Fetal Medicine. *Special Statement: A quality metric for evaluating timely
   treatment of severe hypertension*. 2022; reaffirmed 2025. Consulted August 24, 2026. This
   supports treating confirmed severe pregnancy hypertension as an emergency with a 30- to
   60-minute treatment window.

## Implemented teaching bounds

- The scenario's first deterministic engine sample is 164.63/120.19 mmHg with mean arterial
  pressure 135.00 mmHg. An accepted repeat records the canonical simulated pressure without adding
  a cuff-error or cycling-delay model.
- The only antihypertensive branch is 20 mg IV labetalol after the accepted repeat. Its pressure and
  heart-rate effects approach a fixed endpoint on a 45-second teaching time constant. This is not a
  pharmacokinetic model or an individual response prediction.
- In seed 31, 60 seconds after labetalol, the deterministic state is 142.81/104.26 mmHg with mean
  arterial pressure 117.11 mmHg. A follow-up repeat records that observed state.
- The 4 g IV magnesium-sulfate action records seizure prophylaxis and produces no pressure effect.
  A comparative regression requires the complete patient state to be identical with and without
  magnesium when every other action is the same.

## Explicit exclusions

The browser does not diagnose preeclampsia or model serial measurement error, laboratory criteria,
proteinuria, platelets, liver or renal function, fetal status, fluid strategy, pulmonary edema,
eclampsia, seizure treatment, alternative antihypertensives, repeat or escalating doses,
drug pharmacokinetics, infusion duration, magnesium maintenance, renal adjustment, serum levels,
reflex examination, respiratory toxicity, calcium treatment, delivery timing or route, anesthetic
choice, neuraxial technique, general anesthesia, surgery, postpartum care, or team performance.
