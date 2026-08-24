# Evidence brief: quantitative neuromuscular reversal

## Learning boundary

- **Target learner:** anesthesia learners who can read quantitative train-of-four count and ratio during established general anesthesia.
- **Environment:** one stable adult with a secured tracheal tube, delivered ventilation, established volatile anesthesia, and one declared 0.6 mg/kg rocuronium exposure.
- **Primary objective:** establish a quantitative baseline, distinguish developing from recovering block, select an available reversal branch from measured depth, and confirm a ratio of at least 0.9 afterward.
- **Why simulation adds value:** the same count or ratio can appear on the way into and out of block. The learner can accelerate, pause, and replay the trajectory to compare an onset-phase shortcut, deep recovery, moderate recovery, and minimal recovery without presenting elapsed time as a patient prediction.

## Evidence and applicability

1. Thilen SR, Weigel WA, Todd MM, et al. *2023 American Society of Anesthesiologists Practice Guidelines for Monitoring and Antagonism of Neuromuscular Blockade*. Anesthesiology 2023;138:13-41. PMID 36520073; DOI 10.1097/ALN.0000000000004379. Consulted 2026-08-24. The guideline supports quantitative monitoring, confirmation of train-of-four ratio at least 0.9 before extubation, 2 mg/kg sugammadex with at least one twitch, 4 mg/kg with no twitches and post-tetanic count at least one, and neostigmine with an antimuscarinic as an alternative during minimal block. The browser does not model extubation.
2. McCoy EP, Mirakhur RK, Maddineni VR, Wierda JMKH, Proost JH. *Neuromuscular effects of rocuronium bromide (Org 9426) during fentanyl and halothane anaesthesia*. Anaesthesia 1993;48:103-5. PMID 8460753. Consulted 2026-08-24. This provides adult onset and spontaneous-recovery landmarks used to calibrate the explicitly labeled rocuronium teaching course. The compact PK/PD parameters are Open Sim Lab constructions, not transcribed study parameters.
3. Klein AA, Meek T, Allcock E, et al. *Recommendations for standards of monitoring during anaesthesia and recovery 2021*. Anaesthesia 2021;76:1212-23. PMID 34013531; DOI 10.1111/anae.15501. Consulted 2026-08-24. This supplies the continuous anesthesia, ventilation, and direct-observation context.

These sources support monitoring, recovery thresholds, reversal branches, and broad time-course landmarks. They do not supply the exact deterministic checkpoints or instantaneous teaching response below.

## Modeled variables and calibration targets

- The case starts with a tracheal tube, 450 mL delivered breaths at 12/min, 0.5 inspired oxygen, 2 L/min fresh-gas flow, and 1.25% delivered and end-tidal sevoflurane.
- The expert fixture records a baseline train-of-four count of 4 and ratio of 1.00, then gives one 0.6 mg/kg rocuronium bolus at 30 seconds.
- In the recovery phase, post-tetanic count first returns to 1 approximately 274.7 seconds after that modeled bolus; count 1 returns approximately 1,155.8 seconds after it; and four twitches with ratio 0.40 return approximately 2,503.9 seconds after it. These are teaching-model checkpoints, not individual predictions.
- The 10-minute expert fixture selects 4 mg/kg sugammadex at 330 seconds, when count is 0 and post-tetanic count is 1. The engine records the measured pre-reversal state and produces immediate bounded opposition, not sugammadex pharmacokinetics.
- In seed 818, saturation remains above 99.9%, pressure remains above 70 mmHg, and predicted depth remains in the displayed 40–60 maintenance range after the 1.25% starting-agent correction.
- Expert, no-action, onset-phase shortcut, wrong-depth, moderate-recovery, minimal-recovery, hostile-input, and deterministic-replay paths require tests across the scenario and shared engine.

## Exclusions and unsafe inferences

The browser does not reproduce a commercial monitor, peripheral-nerve-stimulation technique, electrode placement, calibration, signal artifact, muscle-site differences, dose pharmacology, onset at the larynx, injection rate, antimuscarinic identity, hypersensitivity, recurrent block, emergence, airway removal, extubation readiness, postoperative weakness, or an individual recovery time. Count, ratio, post-tetanic count, rocuronium course, volatile response, and reversal are bounded teaching models. A ratio at least 0.9 here does not prove that a real patient is ready for extubation.

## Review needs

Required review domains are neuromuscular pharmacology, quantitative monitoring, adult anesthesia, pharmacometrics, perioperative monitoring, anesthesia education, accessibility, and simulation safety. The content remains unsigned draft work until those reviews are recorded against the exact content version.
