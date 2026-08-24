# Evidence brief: bounded blood-bank handoff

## Learning boundary

- **Target learner:** anesthesia learners who can recognize a declared operative hemorrhage, use an ordered confirmation control, and interpret accepted event evidence.
- **Environment:** established adult general anesthesia during a short, fixed operative blood-loss trajectory.
- **Primary objective:** request the simulator's bounded release only after hemorrhage is active, select the released red-cell teaching action, and reassess the modeled pressure, hemoglobin, and calculated oxygen-delivery response.
- **Why simulation adds value:** replay makes an out-of-order product request visibly different from an accepted release-first transcript while keeping real patient and unit identifiers out of the browser.

## Evidence and applicability

1. AABB, American Red Cross, America's Blood Centers, and Armed Services Blood Program. *Circular of Information for the Use of Human Blood and Blood Components*. June 2024. The current circular says component selection, dose, and administration require professional judgment and points users to facility procedures for recipient-sample identification, compatibility testing, issue, transfusion, reaction investigation, and records. It describes red-cell component content and risks; it does not support replacing those safeguards with an instant request control.
2. Joint United Kingdom Blood Transfusion and Tissue Transplantation Services Professional Advisory Committee. *Guidelines for the Blood Transfusion Services in the United Kingdom*, Chapter 7.3, Red Cell Components. Current May 2026 component specifications give a 280 ± 60 mL red-cell-component volume. Open Sim Lab retains the previously documented rounded 300 mL fixed teaching unit.

The sources define component and safety context, not this scenario's action timing or fictional patient response. The browser therefore treats every timing, blood-loss, and response value below as an authored teaching fixture.

## Exact teaching fixture

- Fictional starting state: age 62 years, 68 kg, blood volume 4,400 mL, hemoglobin 10.2 g/dL, and mean arterial pressure 82 mmHg.
- Declared blood loss: 200 mL/min from simulated minute 1 through minute 4, for a fixed modeled loss of 600 mL.
- Deterministic expert transcript: accepted bounded release at 60.1 seconds and 2 fixed red-cell units at 90 seconds.
- Each fixed unit adds 300 mL and 60 g hemoglobin on the next 100 ms engine tick. This is not a clinical dose, rate, or product-selection recommendation.
- At 6 minutes, the expert fixture ends at 4,400 mL blood volume, 11.40 g/dL hemoglobin, and 68.23 mmHg mean arterial pressure. The no-action fixture ends at 3,800 mL, 10.20 g/dL, and 60.46 mmHg. These are deterministic model outputs, not individual predictions.

## Explicit exclusions

The simulator does not collect or label a specimen; represent patient or unit identifiers, ABO/RhD type, antibody screening, compatibility testing, crossmatch, inventory, delay, emergency-release authorization, prescription, consent, special requirements, transport, issue records, bedside checks, administration equipment or rate, warming, reactions, calcium, electrolytes, platelets, plasma eligibility, massive-transfusion protocols, surgical source control, or team communication. The instant release must never be used to rehearse or infer a real local workflow.

## Review needs

Independent review is required from perioperative hemorrhage, transfusion-medicine, anesthesia, and simulation-education reviewers. Reviewers must specifically challenge whether the confirmation control could be mistaken for a complete request or compatibility process and whether the debrief preserves the boundary after a successful modeled response.
