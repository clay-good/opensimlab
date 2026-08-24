# Evidence brief: arterial-pressure transducer artifact

## Learning boundary

- **Target learner:** anesthesia learners who can interpret routine invasive and non-invasive pressure monitoring.
- **Environment:** operating room during stable neuraxial anesthesia.
- **Primary objective:** separate patient pressure from a corrupted invasive display by checking waveform quality, recording level-and-zero intent, and cycling an independent cuff before treatment.
- **Why simulation adds value:** canonical circulation can remain unchanged while a hydrostatic offset changes the displayed MAP and over-damping changes waveform morphology. Replay makes premature treatment and disciplined verification directly comparable.

## Evidence and applicability

1. Saugel B, Kouz K, Meidert AS, Schulte-Uentrop L, Romagnoli S. *How to measure blood pressure using an arterial catheter: a systematic 5-step approach*. Crit Care 2020;24:172. PMID 32331527; DOI 10.1186/s13054-020-02859-w. Consulted 2026-08-24. The review describes leveling, zeroing, waveform-quality assessment, and a 7.5 mmHg hydrostatic pressure difference for 10 cm of vertical offset.
2. Gardner RM. *Direct blood pressure measurement—dynamic response requirements*. Anesthesiology 1981;54:227-36. PMID 7469106; DOI 10.1097/00000542-198103000-00010. Consulted 2026-08-24. This foundational paper supports treating the fluid-filled catheter and transducer as a dynamic measurement system whose damping and natural frequency shape the displayed pressure waveform.
3. American Society of Anesthesiologists. *Standards for Basic Anesthetic Monitoring*. Last amended October 15, 2025. Consulted 2026-08-24. The standard supplies the circulation-monitoring context and the requirement to determine arterial pressure and heart rate at least every five minutes.

These sources do not provide an individual patient-response curve. The case therefore changes sensor state only and uses the existing deterministic patient model for canonical physiology.

## Modeled variables and calibration targets

- A transducer 20 cm above the reference level subtracts 15 mmHg from displayed MAP using a fixed 0.75 mmHg/cm relation.
- Over-damping reduces waveform pulse-pressure spread and high-frequency content without altering canonical state.
- Level-and-zero intent removes only the hydrostatic offset.
- Waveform assessment must precede pressure-tubing replacement intent; replacement removes only the damping artifact.
- A cuff cycle takes 20 simulated seconds and samples canonical MAP when it completes, not when requested.
- Expert, premature-treatment, out-of-order, duplicate-action, delayed-cuff, and deterministic-replay paths require tests.

## Exclusions and unsafe inferences

The browser does not certify arterial cannulation, leveling, zeroing, flushing, air-bubble removal, tubing selection, sterility, cuff placement, cuff accuracy, patient positioning, cerebral reference levels, or any commercial monitor. The fixed pressure offset and cuff delay are teaching parameters, not device specifications. The controls record screen intent only. A matching cuff does not prove that every real invasive or non-invasive reading is correct, and this case must not be used to choose treatment thresholds.

## Review needs

Required review domains are perioperative monitoring, invasive pressure measurement, equipment human factors, anesthesia education, accessibility, and simulation safety. The content remains unsigned preview work until those reviews are recorded against the exact content version.
