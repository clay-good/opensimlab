# Evidence brief: repeated laryngoscopy harm

## Learning boundary

- **Target learner:** anesthesia learners who can use basic induction and airway controls.
- **Environment:** operating room.
- **Practice regions:** United States and United Kingdom.
- **Primary objective:** use a documented difficult-airway history, call for help before attempting,
  limit repeated laryngoscopy, restore oxygenation, and confirm gas exchange.
- **Why simulation adds value:** each accepted attempt consumes simulated time without ventilation;
  repeated attempts also worsen the engine's bounded airway-trauma state. The learner can stop,
  oxygenate, change plan, and see the different trajectory.

## Evidence and applicability

1. American Society of Anesthesiologists. *2022 Practice Guidelines for Management of the Difficult
   Airway*. Anesthesiology 2022;136:31-81. PMID 34762729; DOI
   10.1097/ALN.0000000000004002. Consulted 2026-08-24. The scenario uses the full guideline and
   difficult-airway algorithm to assess the
   airway strategy, review prior records, call for help, limit attempts, remain aware of elapsed time
   and oxygen saturation, and confirm ventilation.
2. Ahmad I, et al. *Difficult Airway Society 2025 guidelines for management of unanticipated difficult
   tracheal intubation in adults*. Br J Anaesth 2026;136:283-307. PMID 41203471; DOI
   10.1016/j.bja.2025.10.006. Consulted 2026-08-24. The scenario uses the guideline's assessment,
   planning, peroxygenation, human-factors, documentation, and education scope.

The United States and United Kingdom guidance differs in organization and some detailed pathways.
The scenario exercises only their shared transferable boundary: use known airway information, call
for help, limit unsuccessful attempts, prioritize oxygenation, and confirm ventilation. It deliberately
does not encode a universal maximum attempt count or choose the post-rescue airway plan.

The case introduces no new dose, clinical threshold, or patient-specific probability. Attempt duration,
view sampling, accumulated trauma, full facemask delivery, and the fixed successful supraglottic action
are existing Open Sim Lab teaching conventions. They are deliberately bounded and are not individual
predictions.

## Modeled variables and calibration targets

- Deterministic laryngoscopy view, duration, and accumulated trauma under a fixed seed.
- No assisted ventilation while an airway procedure is in progress.
- Full commanded facemask breath delivery between attempts in this authored course.
- Fixed 15-second abstract supraglottic insertion, followed by explicit breath delivery.
- Oxygen saturation and end-tidal carbon dioxide from the shared gas-exchange model.

## Exclusions and unsafe inferences

The browser does not assess airway examination, positioning, device selection, manual ventilation,
laryngoscopy, supraglottic insertion, communication quality, or team performance. It does not model
edema, bleeding, aspiration, front-of-neck access, awake intubation, flexible endoscopy, or the plan
after rescue oxygenation. A successful control action is not evidence of psychomotor competence, and
the sampled view or response must not be treated as a prediction for a real patient.

## Review needs

Required review domains are difficult-airway management, anesthesia education, human factors, and
simulation safety. The content remains unsigned preview work until those reviews are recorded against
the exact content version.
