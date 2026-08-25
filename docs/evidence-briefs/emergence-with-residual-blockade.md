# Evidence brief: emergence with residual blockade

## Learning boundary

- **Target learner:** anesthesia learners interpreting neuromuscular recovery near emergence.
- **Environment:** one stable adult with a secured tracheal tube, delivered ventilation, four visible twitches, no detectable qualitative fade, and a static quantitative ratio of 0.72.
- **Primary objective:** let the quantitative value override reassuring clinical signs, identify residual blockade below 0.9, and preserve the airway and ventilation while recovery is addressed and reassessed.
- **Why simulation adds value:** the screen makes the disagreement between qualitative appearance and quantitative recovery explicit without asking the learner to infer it from hidden state.

## Evidence and applicability

1. Thilen SR, Weigel WA, Todd MM, et al. *2023 American Society of Anesthesiologists Practice Guidelines for Monitoring and Antagonism of Neuromuscular Blockade*. Anesthesiology 2023;138:13-41. PMID 36520073; DOI 10.1097/ALN.0000000000004379. Consulted 2026-08-24. The guideline supports quantitative monitoring at the adductor pollicis and confirmation of a train-of-four ratio of at least 0.9 before extubation. This case uses that threshold but does not simulate extubation.
2. Fuchs-Buder T, Romero CS, Lewald H, et al. *Peri-operative management of neuromuscular blockade: a guideline from the European Society of Anaesthesiology and Intensive Care*. Eur J Anaesthesiol 2023;40:82-94. PMID 36377554; DOI 10.1097/EJA.0000000000001769. Consulted 2026-08-24. The guideline supports ulnar-nerve stimulation with quantitative monitoring at the adductor pollicis to exclude residual paralysis and continued monitoring until a ratio above 0.9.

These sources support the decision threshold and the need for quantitative assessment. They do not supply the exact 0.72 fixture or a complete extubation-readiness pathway.

## Modeled variables and exact fixture

- The engine converts the declared starting ratio of 0.72 into the existing monotone rocuronium teaching signal, which produces four twitches and “no detectable fade.” The ratio remains static during this short decision vignette.
- The case begins with a tracheal tube and 480 mL delivered breaths at 12/min on 0.5 inspired oxygen. The expert path reviews the monitor, classifies residual blockade, and records deferral while the tube and ventilation remain in place.
- The engine rejects classification before review, planning before classification, duplicate steps, unknown choices, and use of the action outside this declared lesson. Debrief credit comes only from accepted engine events.

## Exclusions and unsafe inferences

The browser does not reproduce a commercial monitor, stimulation technique, electrode placement, calibration, signal artifact, muscle-site differences, drug dose or pharmacokinetics, reversal choice, spontaneous recovery, clinical-sign measurement, consciousness, airway-reflex recovery, airway removal, postoperative weakness, or a complete extubation-readiness assessment. The static 0.72 ratio is an authored teaching fixture, not a patient prediction. Reaching 0.9 would satisfy only the neuromuscular-recovery checkpoint, not prove that a real patient is otherwise ready for extubation.

## Review needs

Required review domains are neuromuscular monitoring, adult anesthesia, emergence and extubation, pharmacology, anesthesia education, accessibility, and simulation safety. The content remains unsigned draft work until those reviews are recorded against the exact content version.
