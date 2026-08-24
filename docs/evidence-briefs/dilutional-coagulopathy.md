# Evidence brief: dilutional coagulopathy during ongoing bleeding

## Learning boundary

- **Target learner:** anesthesia learners familiar with basic hemorrhage resuscitation and blood
  components.
- **Environment:** operating room, during a mid-case anesthesia handoff.
- **Practice regions:** internationally transferable reassessment principle; the blood-component
  terminology and cited thresholds use current United Kingdom guidance and are not a substitute for
  local major-hemorrhage policy.
- **Primary objective:** recognize a plausible dilutional pattern, obtain the bounded PT-ratio and
  fibrinogen panel, use that result before plasma selection, and repeat the panel after response.
- **Why simulation adds value:** learners can compare before/after factor concentrations and replay
  an ordered assessment-treatment-reassessment loop without exposing a patient to blood products.

## Evidence and applicability

1. National Institute for Health and Care Excellence. *Blood transfusion: fresh frozen plasma
   transfusion*, guideline NG24, recommendations 1.9.1 and 1.10.1. Updated 2026-02-26; consulted
   2026-08-24. NICE says to consider fresh frozen plasma for clinically significant bleeding without
   major hemorrhage when coagulation results are abnormal, giving PT or APTT ratio above 1.5 as an
   example, and calls for clinical reassessment and repeat testing after transfusion.
2. NHS Blood and Transplant Better Blood Transfusion Team. *Fresh-Frozen Plasma Dosage*, version 1.
   Consulted 2026-08-24. The official adult chart provides 12–15 mL/kg therapeutic-dose context and
   an approximate 275 mL mean component volume. The simulator uses that volume only as a fixed
   teaching value.

This scenario begins with PT ratio 1.67 × normal and fibrinogen 1.8 g/L to represent prior
crystalloid-heavy replacement. It does not replay or infer the amount of earlier bleeding or fluid.
The cited NICE threshold is context for the learner-visible abnormal result, not a universal
eligibility rule, and NG24 directs major hemorrhage management to local protocols. Four fixed 275 mL
units are offered because the existing bounded model permits one listed 1,100 mL response; this is
not presented as an individualized dose recommendation.

## Modeled variables and calibration targets

- An optional scenario-declared starting clotting-factor fraction and fibrinogen concentration;
  every existing scenario continues to default to 1.0 and 3.0 g/L respectively.
- Modest active blood loss so the existing adult blood-product controls remain available.
- One immediate panel reporting PT ratio and fibrinogen, with repeat requests allowed.
- A confirmed instantaneous release before any product appears, then a listed whole-unit plasma
  action only after a panel.
- Plasma adds fixed normal-donor factor and fibrinogen mass, allowing both displayed values to move
  toward baseline without claiming that bleeding itself stops.
- Complete, absent, out-of-order, duplicate-boundary, and deterministic-replay paths are tested.

## Exclusions and unsafe inferences

The browser does not model the earlier resuscitation sequence, consumption, hyperfibrinolysis,
platelets, cryoprecipitate, viscoelastic tests, temperature or acid-base effects on hemostasis,
specimen collection, laboratory delay, ABO/RhD typing, antibody screening, crossmatch, inventory,
emergency release, patient or unit identification, infusion rate, warming, calcium, reactions,
source control, team communication, a massive-transfusion protocol, or individual outcome. An
instantaneous numerical improvement must not be interpreted as cessation of real bleeding or proof
of adequate hemostasis.

## Review needs

Required review domains are perioperative hemorrhage, transfusion medicine, hematology, anesthesia
education, and simulation safety. The content remains unsigned preview work until those reviews are
recorded against the exact content version.
