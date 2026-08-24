# Evidence brief: routine inhalational maintenance

## Learning boundary

- **Target learner:** anesthesia learners who can read end-tidal agent, predicted depth, hemodynamic trends, and an infusion record during established general anesthesia.
- **Environment:** stable adult tracheal anesthesia during a short, changing surgical-stimulus window.
- **Primary objective:** preserve an adequate bounded maintenance state, anticipate a declared stimulus with a modeled opioid infusion, and reduce that infusion when the stimulus ends while reassessing depth and pressure.
- **Why simulation adds value:** the learner can observe delivered-to-end-tidal lag, a stimulus-response trend, and the consequence of leaving an infusion unchanged after the stimulus falls. Replay makes planning, reaction, and reassessment directly comparable without presenting a real-patient dose recommendation.

## Evidence and applicability

1. United States Food and Drug Administration. *Sevoflurane prescribing information*. Drugs@FDA reference ID 4944925, Dosage and Administration and Table 9. Consulted 2026-08-24. The label identifies sevoflurane for maintenance, gives 0.5-3% as the usual concentration range for surgical anesthesia, and reports age-specific MAC values. It does not define an individual target for this fictional patient.
2. Mapleson WW. *Effect of age on MAC in humans: a meta-analysis*. Br J Anaesth 1996;76:179-85. PMID 8777094; DOI 10.1093/bja/76.2.179. Consulted 2026-08-24. This supplies the age relation and MAC-at-40 values already used by the engine. MAC is a population movement endpoint, not a complete measure of hypnosis, analgesia, or individual adequacy.
3. United States Food and Drug Administration approved labeling. *Remifentanil hydrochloride for injection prescribing information*. Current DailyMed label, Dosage and Administration. Consulted 2026-08-24. The label supplies the maintenance-infusion range used by the formulary; the scenario does not promote one rate as a real-patient prescription.
4. Klein AA, et al. *Recommendations for standards of monitoring during anaesthesia and recovery 2021*. Anaesthesia 2021;76:1212-23. PMID 34013531; DOI 10.1111/anae.15501. Consulted 2026-08-24. The guideline supplies the continuous monitoring and direct-observation context and the limits of processed-EEG interpretation.

These sources support direction, labeled ranges, age adjustment, and monitoring context. They do not supply the exact stimulus, response, or recovery curves below, which are bounded deterministic teaching calibrations.

## Modeled variables and calibration targets

- The case starts after tracheal-tube confirmation with volume-controlled ventilation, 2 L/min fresh-gas flow, and 1.2% delivered and end-tidal sevoflurane already established.
- The starting setup is calibrated to keep the fictional patient's predicted depth and mean arterial pressure within their displayed ranges without an arrival alarm.
- A moderate scripted surgical stimulus begins at 240 simulated seconds and lasts 120 seconds. Its exact strength is an Open Sim Lab teaching parameter.
- The expert fixture starts a 0.2 µg/kg/min remifentanil infusion at 120 seconds, before the declared stimulus, and stops it when the stimulus ends. That rate is a test fixture inside the labeled maintenance range, not a recommendation.
- The debrief evaluates observed state and accepted actions: time in the displayed depth range, relative heart-rate and pressure response after stimulus onset, timely infusion reassessment after stimulus offset, and recovery of pressure by scenario end.
- No-action, late-reaction, continued-infusion, hostile-input, boundary-timing, and deterministic-replay paths require tests.

## Exclusions and unsafe inferences

The browser does not choose an anesthetic plan, predict awareness, measure consciousness, reproduce a commercial processed-EEG monitor, model pain experience or memory, individualize MAC, represent surgical nociception, model opioid-induced rigidity or injection rate, include neuromuscular blockade, calculate a real-patient infusion, or teach emergence. Predicted depth, volatile hemodynamics, stimulus strength, and all response curves are teaching models. A stable number in this scenario never proves adequate anesthesia in a real patient.

## Review needs

Required review domains are adult maintenance anesthesia, volatile pharmacology, opioid pharmacology, depth-monitor limitations, perioperative monitoring, anesthesia education, accessibility, and simulation safety. The content remains unsigned preview work until those reviews are recorded against the exact content version.
