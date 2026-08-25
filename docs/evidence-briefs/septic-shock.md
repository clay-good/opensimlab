# Septic shock evidence brief

## What this slice teaches

One fixed adult emergency-department vignette asks the learner to connect probable infection with
new organ dysfunction and impaired perfusion, record blood-culture and lactate intent without
waiting for results, record immediate empiric antimicrobial intent, begin one fixed initial
balanced-crystalloid course, reassess, and respond to persistent shock with first-line
norepinephrine intent plus urgent source-control and critical-care escalation.

## Current source floor

The 2026 Surviving Sepsis Campaign adult guideline treats sepsis and septic shock as medical
emergencies. It recommends collecting blood cultures as soon as possible and ideally before
antimicrobial therapy, suggests measuring lactate, and recommends antimicrobials immediately and
ideally within 1 hour for possible, probable, or definite septic shock. It suggests at least 30
mL/kg crystalloid in the first 3 hours for sepsis-induced hypoperfusion or septic shock while
requiring frequent ongoing reassessment, recommends an initial MAP target of 65 mmHg, recommends
norepinephrine first line, and calls for rapid evaluation and early control of a source that
requires it. Several of these recommendations have low or very-low certainty; this interface does
not erase that uncertainty.

## Authored vignette and modeled behavior

- Fixed evidence combines fever, rigors, dysuria and flank tenderness with new inattention,
  oliguria, delayed capillary refill, hypotension, and an initial venous lactate of 5.2 mmol/L.
- Culture collection, lactate measurement, antimicrobial therapy, and source control are intent
  events. The simulator does not collect a specimen, select a drug, deliver an antimicrobial,
  acquire imaging, or perform drainage.
- For this fixed 70 kg adult, the declared initial course is 2,100 mL of balanced crystalloid. The
  existing shared circulation model retains 25% intravascularly. A fixed reassessment still shows
  impaired perfusion, so further fluid is not offered as an automatic shortcut.
- Norepinephrine intent produces only a directional generic vasopressor teaching effect. No dose,
  concentration, route, line, pump, titration instruction, or individual response is provided.

## Deliberate exclusions

This is not a sepsis screening tool, diagnostic system, antimicrobial guide, dosing calculator, or
resuscitation protocol. It does not accept real-patient details or model pathogen identification,
local resistance, allergies, renal or hepatic dose adjustment, infection biomarkers, laboratory
or culture performance, oxygen delivery, acid-base state, invasive access, vasopressor delivery,
imaging, procedures, consultation, disposition, deterioration, adverse effects, or outcome.

## Sources

1. Surviving Sepsis Campaign. *International Guidelines for Management of Sepsis and Septic Shock
   2026*. Society of Critical Care Medicine and European Society of Intensive Care Medicine.
   Current official recommendations checked August 24, 2026.
2. Monnet X, Messina A, Greco M, et al. ESICM guidelines on circulatory shock and hemodynamic
   monitoring 2025. *Intensive Care Medicine*. 2025;51:1971–2012.
   doi:10.1007/s00134-025-08137-z.
