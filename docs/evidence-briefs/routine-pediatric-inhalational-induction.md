# Evidence brief: routine pediatric inhalational induction

## Learning boundary

- **Target learner:** anesthesia learners who can operate the modeled oxygen, fresh-gas-flow, and vaporizer controls and read end-tidal agent, age-adjusted MAC, pressure, saturation, and predicted depth.
- **Environment:** one healthy 6-year-old, 20 kg child breathing spontaneously before a planned mask induction.
- **Primary objective:** prepare the modeled circuit, distinguish vaporizer delivery from end-tidal sevoflurane during wash-in, reduce delivery as agent accumulates, and reassess bounded model signals.
- **Why simulation adds value:** the learner can pause and replay the lag between a machine setting and the end-tidal patient signal. The lesson stops before claiming cooperation, mask technique, loss of consciousness, airway readiness, or an individualized anesthetic plan.

## Evidence and applicability

1. United States Food and Drug Administration. *Sevoflurane prescribing information*. Drugs@FDA reference ID 4944925, Indications and Usage, Dosage and Administration, Pediatric Use, and Table 9. Consulted 2026-08-24. The label establishes pediatric induction and maintenance, suitability for mask induction, inspired concentrations up to 8% for induction, age-related MAC values, and the need for trained administration with immediately available airway and resuscitation capability. It does not define an individual target or this simulator's deterministic wash-in.
2. Mapleson WW. *Effect of age on MAC in humans: a meta-analysis*. Br J Anaesth 1996;76:179-85. PMID 8777094. Consulted 2026-08-24. The engine uses the published age relation and sevoflurane MAC-at-40 anchor to calculate its displayed age-adjusted MAC fraction.
3. Welborn LG, Hannallah RS, Norden JM, Ruttimann UE, Callan CM. *Sevoflurane versus halothane for general anesthesia in pediatric patients: a comparative study of vital signs, induction, and emergence*. J Clin Anesth 1996;8:283-92. PMID 7669316. Consulted 2026-08-24. This randomized pediatric comparison used incremental sevoflurane from 1% to a maximum of 7% and recorded vital signs and end-tidal agent during induction. Its clinical endpoints are context only; they are not reproduced by this browser.
4. Klein AA, Meek T, Allcock E, et al. *Recommendations for standards of monitoring during anaesthesia and recovery 2021*. Anaesthesia 2021;76:1212-23. PMID 34013531. Consulted 2026-08-24. This supplies the continuous monitoring and direct-observation context.

These sources support pediatric use, labeled machine concentrations, age-adjusted MAC context, end-tidal observation, and continuous monitoring. They do not validate the browser's first-order wash-in, predicted-depth surface, hemodynamic response, or any behavioral or airway endpoint.

## Modeled variables and calibration targets

- The case starts with 0.21 inspired oxygen, 2 L/min fresh-gas flow, zero sevoflurane, and the existing bounded healthy-child respiratory profile.
- The expert fixture prepares 1.0 inspired oxygen and 6 L/min fresh-gas flow with the vaporizer off, then uses an accepted induction-range setting and reduces delivery as the end-tidal signal approaches the declared target.
- In seed 929, 8% delivery begins at 20 seconds after circuit preparation. The first 1-second regression sample at or above 0.8 age-adjusted MAC occurs at 27 seconds: end-tidal sevoflurane 1.954%, MAC fraction 0.879, predicted depth 50.44, mean arterial pressure 67.87 mmHg, and saturation above 99.98%.
- Delivery is reduced to 2.5% at 28 seconds. End-tidal sevoflurane settles near 2.5%, predicted depth near 40.75, pressure remains above 56.27 mmHg, and saturation remains above 96.93% across the complete 7-minute fixture. These are deterministic teaching outputs, not clinical timing or target recommendations.
- Expert, no-action, unprepared-start, no-reduction, hostile-input, and replay paths require tests.

## Exclusions and unsafe inferences

The browser does not model the child's behavior or distress, parental presence, premedication, mask choice or acceptance, seal, leak, circuit priming, breath-by-breath technique, excitement, breath-holding, coughing, laryngospasm, airway obstruction, apnea, volatile respiratory depression, loss of consciousness, eyelash reflex, IV access, airway-device selection or placement, movement, pain, memory, emergence, recovery, or individual anesthetic requirement. Fresh-gas wash-in, pediatric gas exchange, predicted depth, and hemodynamics are bounded teaching models. A displayed threshold never proves unconsciousness, immobility, airway readiness, or safety in a real child.

## Review needs

Required review domains are pediatric anesthesia, volatile pharmacology, pediatric respiratory physiology, anesthesia-workstation engineering, perioperative monitoring, human factors, anesthesia education, accessibility, and simulation safety. The content remains unsigned draft work until those reviews are recorded against the exact content version.
