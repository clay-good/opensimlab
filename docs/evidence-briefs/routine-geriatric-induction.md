# Evidence brief: routine geriatric intravenous induction

## Learning boundary

- **Target learner:** anesthesia learners who can preoxygenate, give intravenous boluses, read pressure and predicted-depth trends, and start delivered ventilation.
- **Environment:** one stable 76-year-old adult before elective surgery, with standard monitoring and no surgical stimulus.
- **Primary objective:** build oxygen reserve, titrate a labeled older-adult propofol range in small spaced increments, preserve perfusion, and begin bounded delivered ventilation.
- **Why simulation adds value:** the learner can compare a single large dose with incremental dosing while the modeled effect site continues to change after each accepted action. Replay makes dose, timing, pressure, depth, and ventilation directly comparable without presenting an individual prescription.

## Evidence and applicability

1. United States Food and Drug Administration approved labeling. *Propofol injectable emulsion prescribing information*. Current DailyMed label, Dosage and Administration. Consulted 2026-08-24. The label gives approximately 1–1.5 mg/kg for induction in elderly or debilitated patients, calls for titration to clinical response, and warns that rapid boluses increase undesirable cardiorespiratory depression. The simulator models total dose and effect-site delay, but not injection rate.
2. Eleveld DJ, Colin P, Absalom AR, Struys MMRF. *Pharmacokinetic-pharmacodynamic model for propofol for broad application in anaesthesia and sedation*. Br J Anaesth 2018;120:942-59. PMID 29661412; DOI 10.1016/j.bja.2018.01.018. Consulted 2026-08-24. This supplies the engine's deterministic population-mean propofol model and age covariate. The source population ranged from 27 weeks postmenstrual age to 88 years; a population model does not predict one patient's required dose or response.
3. Klein AA, et al. *Recommendations for standards of monitoring during anaesthesia and recovery 2021*. Anaesthesia 2021;76:1212-23. PMID 34013531; DOI 10.1111/anae.15501. Consulted 2026-08-24. The guideline supplies the continuous monitoring and direct-observation context and the limits of processed-EEG interpretation.

These sources support a labeled range, incremental clinical titration, an age-aware population model, and monitoring context. They do not supply the exact pressure, predicted-depth, or oxygen trajectories below, which are bounded deterministic teaching calibrations.

## Modeled variables and calibration targets

- The fictional patient starts awake, breathing room air, with a baseline heart rate of 68 beats/min and mean arterial pressure of 92 mmHg.
- The expert fixture changes inspired oxygen to 1.0 at 0.1 simulated seconds. At the first propofol dose, 120 seconds later, end-tidal oxygen is 0.933.
- The fixture gives five accepted 20 mg propofol increments at 120, 140, 160, 180, and 200 seconds: 100 mg total, or 1.39 mg/kg. It begins 450 mL delivered breaths at 12/min at 220 seconds. These values exercise the declared boundary; they are not a real-patient recommendation.
- In seed 616, predicted depth reaches a nadir of 49.69, mean arterial pressure reaches 73.19 mmHg, and oxygen saturation remains above 99.99%. These are deterministic model outputs, not individual predictions.
- The debrief evaluates observed state and accepted actions: end-tidal oxygen before the first dose, accepted total and increment timing, post-dose pressure nadir, delivered tidal volume per kilogram, and oxygen-saturation nadir.
- No-action, out-of-range single-bolus, malformed-action, early-exit, boundary-timing, and deterministic-replay paths require tests.

## Exclusions and unsafe inferences

The browser does not choose a dose for an individual, measure consciousness, reproduce a commercial processed-EEG monitor, model injection rate, frailty, cognition, delirium, organ dysfunction, polypharmacy, airway or mask skill, neuromuscular blockade, surgical stimulation, intubation, or emergence. The Eleveld output, arterial stiffness, baroreflex setting, predicted depth, and hemodynamic response are teaching models. A stable number never proves adequate anesthesia or safety in a real patient.

## Review needs

Required review domains are geriatric anesthesia, propofol pharmacology, pharmacometrics, airway and ventilation practice, perioperative monitoring, anesthesia education, accessibility, and simulation safety. The content remains unsigned draft work until those reviews are recorded against the exact content version.
