# Evidence brief: capnography sampling-line obstruction

## Learning boundary

- **Target learner:** anesthesia learners who can establish basic ventilation and interpret a
  multiparameter monitor.
- **Environment:** operating room.
- **Practice regions:** internationally transferable monitoring principles; interface terminology
  follows the selected United States or United Kingdom profile.
- **Primary objective:** distinguish loss of the carbon-dioxide sampling signal from loss of patient
  ventilation, cross-check independent observations, restore the sample path, and confirm the trace.
- **Why simulation adds value:** the displayed capnogram and end-tidal number can disappear while
  canonical ventilation, saturation, and the plethysmogram remain stable. The learner can compare
  those signals before and after a replayable equipment action without exposing a patient to delay.

## Evidence and applicability

1. Klein AA, et al. *Recommendations for standards of monitoring during anaesthesia and recovery
   2021*. Anaesthesia 2021;76:1212-23. PMID 34013531; DOI 10.1111/anae.15501. Consulted
   2026-08-24. The guideline requires waveform capnography during general anesthesia, describes it
   as a monitor of airway patency and alveolar ventilation, and states that monitors supplement
   clinical observation, including chest-wall or reservoir-bag movement and breath sounds.
2. Gelb AW, McDougall RJ, Gore-Booth J, Mainland PA; WFSA Ad Hoc Capnometry Workgroup. *The World
   Federation of Societies of Anaesthesiologists Minimum Capnometer Specifications 2021—A Guide for
   Health Care Decision Makers*. Anesth Analg 2021;133:1132-7. PMID 34427566; DOI
   10.1213/ANE.0000000000005682. Consulted 2026-08-24. The specification establishes capnometry as a
   safety technology for detecting airway-device position, gas exchange, obstruction, cardiac-output
   change, and metabolic change, supporting the need to treat an unexpected signal loss as a finding
   that requires discrimination rather than as a diagnosis by itself.

Neither source supplies a patient-response curve for an obstructed sampling tube, and this scenario
does not invent one. The equipment fault changes the sampled display only. The independent patient
trajectory comes from the existing deterministic respiratory model.

## Modeled variables and calibration targets

- One fixed sampling-line obstruction after a stable capnogram has been established.
- A flat displayed capnogram and unavailable displayed end-tidal carbon-dioxide number while the
  underlying respiratory state remains unchanged.
- Independent breath delivery, respiratory rate, saturation, and plethysmogram remain available for
  cross-checking.
- A confirmed reconnect action clears the display artifact on the next engine tick.
- Expert, premature-reconnect, no-action, duplicate-action, and deterministic-replay paths are tested.

## Exclusions and unsafe inferences

The browser does not model water traps, secretions, kinks, leaks, pump flow, transport delay,
sidestream dilution, calibration, analyzer failure, dead space, or device-specific alarm timing. The
cross-check control records screen intent; it does not assess chest movement, bag movement,
auscultation, circuit inspection, tube position, communication, or technical skill. Stable saturation
over this short teaching interval must not be read as proof that ventilation is adequate in a real
patient. Reconnection is a deterministic teaching action, not a device troubleshooting procedure.

## Review needs

Required review domains are perioperative monitoring, capnography, anesthesia education, equipment
human factors, and simulation safety. The content remains unsigned preview work until those reviews
are recorded against the exact content version.
