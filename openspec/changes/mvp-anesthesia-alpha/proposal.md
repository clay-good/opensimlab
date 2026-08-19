## Why

The specification is complete enough to build against, and nothing is built. The risk now is not under-specification — it is starting in the wrong place, spending months on breadth, and arriving at something no clinician has looked at.

Three of the twenty-eight capabilities carry nearly all the technical and credibility risk, and none of them are the ones a normal project would start with:

1. **Waveform realism.** A clinician judges the simulator in five seconds by whether the traces look right. If the electrocardiogram looks synthetic, nothing else matters.
2. **Frame budget on a real phone.** Five traces at 60 fps on a four-year-old mid-range Android, with the solver running, is an assumption. It has not been measured.
3. **Whether the physiology is convincing to an anesthetist.** Not whether it passes tests — whether a consultant watching an induction says "yes, that is what happens."

This change de-risks those three first, on the narrowest scenario that can exercise them, and puts it in front of clinicians before the breadth work begins.

## What Changes

Build a vertical slice: one scenario, one patient, one drug pair, the real monitor, the real design system, the real debrief. Everything else stubbed or absent.

**The slice is a routine induction.** A healthy adult, propofol and remifentanil, bag-mask ventilation, intubation, incision. No crisis, no fluids, no reversal, no curriculum, no sandbox.

It is chosen because it exercises the compartment solver, the interaction surface, the hemodynamic response, the airway sequence, apnea and desaturation, all five traces, the alarm system, the concentration plot, and the debrief — while requiring only two pharmacology models and one scenario file to reach clinical review.

**Explicitly out of scope for this change:** every crisis scenario, the Model Lens, prediction bands, target-controlled infusion, the curriculum and competency map, spaced practice, instructor mode, the sandbox, scenario authoring, translation beyond English, additional practice regions beyond the two required, and the oncology and cardiology module stubs.

**Ends with a gate, not a launch.** The slice is reviewed by at least three clinicians against the face-validity rubric. If waveform realism or physiological plausibility fails, this change is extended rather than the next one started.

## Capabilities

### New Capabilities

None. Every requirement this change implements already exists in `openspec/specs/`. This change sequences existing requirements; it does not add any.

### Modified Capabilities

None.

## Impact

- Creates the repository's entire source tree, build, and test infrastructure from empty.
- Establishes the token module, the solver worker protocol, and the transcript format — three interfaces that everything later depends on and that are expensive to change afterward.
- Requires editorial board recruitment to begin immediately, because the face-validity gate needs three credentialed reviewers and recruiting them is a longer lead time than the code.
- Produces the first public build at `opensimlab.com/anesthesia`, which starts the clock on the honest-status-signaling requirement.
