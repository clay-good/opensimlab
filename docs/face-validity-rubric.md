# Face-validity rubric

The instrument the expert review uses. It asks about **realism and plausibility**, not about
coverage, because a clinician shown one routine induction will otherwise ask for crises, and
crises are worthless on an unconvincing patient.

Three independent credentialed reviewers complete this. Ratings and free-text objections are
committed verbatim to `docs/face-validity/`. Disagreement is preserved, never averaged away:
both positions are recorded, and the resolution — change the model, or document the
limitation — is recorded with its rationale.

## Scale

| Rating | Meaning |
| --- | --- |
| 4 | Indistinguishable from what I would expect on a real monitor. |
| 3 | Recognisable and clinically acceptable; minor differences I would not act on. |
| 2 | Recognisable but wrong in a way that could teach the wrong thing. |
| 1 | Not what happens. |

**An item rated below 3 blocks the release** or is documented in the limitations register
and labelled as schematic in the interface. Those are the only two outcomes.

## Section A — Waveform realism

Shown at the default sweep speed, 25 mm/s equivalent, on the monitor.

| # | Item | Rating | Objection |
| --- | --- | --- | --- |
| A1 | Normal sinus rhythm, lead II: P wave, QRS complex, ST segment and T wave with correct relative timing and amplitude | | |
| A2 | Beat-to-beat variability in an awake patient looks physiological rather than metronomic | | |
| A3 | That variability is visibly attenuated under general anaesthesia | | |
| A4 | At 140 beats per minute the QT shortens rather than the whole complex scaling | | |
| A5 | Atrial fibrillation is irregularly irregular with no P waves | | |
| A6 | Complete heart block shows dissociated P waves marching through the complexes | | |
| A7 | Ventricular fibrillation is chaotic in the way real fibrillation is | | |
| A8 | A paced rhythm's spike and broad complex look right | | |
| A9 | Arterial trace: upstroke, dicrotic notch and diastolic runoff | | |
| A10 | The arterial shape changes correctly when vascular resistance falls | | |
| A11 | A damped arterial line looks damped, not hypotensive | | |
| A12 | Capnogram: the four phases and a normal alpha angle | | |
| A13 | The shark fin of obstruction is the shark fin | | |
| A14 | The plethysmogram's shape and its relation to the arterial trace | | |
| A15 | The three mechanical traces are convincingly beat-for-beat coherent | | |

## Section B — Physiological plausibility

Reviewers run the routine induction themselves before answering.

| # | Item | Rating | Objection |
| --- | --- | --- | --- |
| B1 | The magnitude of the pressure fall after a standard induction dose | | |
| B2 | The timing of that fall relative to the syringe | | |
| B3 | The heart rate response to it | | |
| B4 | The saturation holding, then falling, on the timescale you would expect | | |
| B5 | The shape of the desaturation once it passes 90% | | |
| B6 | The end-tidal carbon dioxide behaviour on starting ventilation | | |
| B7 | The haemodynamic response to incision without opioid | | |
| B8 | How much that response is blunted by an adequate opioid | | |
| B9 | The relationship between the depth index and the concentrations driving it | | |
| B10 | The laryngoscopy view distribution across several attempts | | |
| B11 | Whether repeated attempts worsen things at the rate you would expect | | |
| B12 | Rocuronium onset and spontaneous train-of-four recovery | | |
| B13 | The saturation change while a laryngoscopy attempt consumes simulated time | | |
| B14 | Overall: does this patient behave like a patient? | | |

## Section C — Free response

1. What is the first thing that told you this was a simulation?
2. What would you change first?
3. Is there anything here you would not want a student to learn from as it stands?
4. What is missing that you expected to be here? *(Recorded, but coverage is out of scope
   for this review by design.)*

## Known gaps, stated before you start

So that reviewers spend their attention on what this review is for:

- Rocuronium onset and spontaneous recovery use a teaching model. Reversal and emergence are not modelled.
- Peripheral train-of-four is observable but does not guarantee conditions at the larynx.
- The full-stomach case does not model regurgitation, aspiration, or cricoid pressure.
- No fresh gas flow; volatile wash-in does not change with flow.
- Balanced crystalloid uses a fixed-retention teaching model. There are no blood products,
  coagulation effects, laboratory guidance, or resuscitation actions.
- Six scenarios use propofol and remifentanil; the rapid-sequence case adds rocuronium. The
  hemorrhage case covers recognition and initial crystalloid temporization, not a
  massive-transfusion protocol.
- Nothing here has been clinically reviewed before — you are the first.
