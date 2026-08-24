# Evidence brief: circle-system rebreathing

## Learning boundary

- **Target learner:** anesthesia learners who can interpret routine waveform capnography and adjust fresh-gas flow.
- **Environment:** established adult general anesthesia through a circle breathing system.
- **Primary objective:** identify carbon-dioxide rebreathing from a raised inspiratory baseline, use higher fresh-gas flow as a temporary bridge, replace exhausted absorbent, and confirm washout.
- **Why simulation adds value:** the capnogram can retain delivered breaths while its inspiratory baseline and end-tidal value rise. Replay makes pattern recognition, bridge action, and definitive correction directly comparable without exposing a patient to equipment failure.

## Evidence and applicability

1. Verbeke D, Jouwena J, De Wolf AM, Hendrickx JFA. *When to replace a CO₂ absorber?* Acta Anaesthesiol Belg 2023;74:43-49. DOI 10.56126/74.1.06. Consulted 2026-08-24. The review recommends using inspired carbon dioxide rather than absorbent color alone to guide exchange, gives 3-4 mmHg as a routine replacement threshold, and explains how fresh-gas flow changes rebreathing during exhaustion.
2. Feldman JM. *Replacing CO₂ Absorbent During Surgery—The Risk of Hypoventilation Continues*. APSF Newsletter 2024;39(3). Consulted 2026-08-24. The article explains the absorber’s role in low-flow circle anesthesia, identifies inspired carbon dioxide as evidence of ineffective absorbent, and emphasizes that safe intraprocedure exchange depends on workstation design and backup ventilation.
3. Klein AA, et al. *Recommendations for standards of monitoring during anaesthesia and recovery 2021*. Anaesthesia 2021;76:1212-23. PMID 34013531; DOI 10.1111/anae.15501. Consulted 2026-08-24. The guideline supplies the continuous waveform-capnography and direct-observation context; the monitor supplements rather than replaces patient and equipment assessment.

These sources establish direction, recognition, and safety boundaries, not an individual concentration-time curve. The exact trajectory below is therefore labeled as a bounded teaching calibration.

## Modeled variables and calibration targets

- The case starts at 1 L/min fresh-gas flow with 1.6% delivered sevoflurane and mechanical ventilation already active.
- At 180 simulated seconds, exhausted absorbent raises inspired carbon dioxide toward 8 mmHg with a fixed 45-second time constant.
- Inspired carbon dioxide is added to the existing modeled end-tidal value and raises the phase-I capnogram baseline. Delivered breaths and the sampled signal remain present.
- Fresh-gas flow reduces the inspired-carbon-dioxide target linearly between 1 and 15 L/min, with a 5% residual floor. It is a bridge and does not repair the absorber.
- Accepted absorber replacement requires prior capnogram assessment and clears inspired carbon dioxide with a fixed 10-second washout.
- Premature replacement, duplicate actions, hostile actions, delayed correction, and deterministic replay require tests.

## Exclusions and unsafe inferences

The simulator does not model canister size, granule chemistry, channeling, desiccation, color indicators, absorbent heat, compound formation, anesthetic degradation, valve failure, hose volume, leaks, pressure, compliance, device alarms, pause mode, exchange technique, backup ventilation, carbon-dioxide production, arterial blood gas, pH, cerebral effects, or individual physiology. The starting maintenance state and every numeric curve are teaching calibrations, not machine specifications or patient predictions. Controls record screen intent only.

## Review needs

Required review domains are anesthesia workstation engineering, perioperative capnography, low-flow anesthesia, human factors, anesthesia education, accessibility, and simulation safety. The content remains unsigned preview work until those reviews are recorded against the exact content version.
