# cockpit/sonification Specification

## Purpose

The operating room is an auditory environment. An anesthesiologist tracks oxygen saturation by the pitch of the pulse tone while looking at the surgical field, and recognizes an alarm priority before reading it. This capability specifies the sound layer — which is simultaneously the most-overlooked realism feature and the strongest accessibility affordance the project has.

## Requirements

### Requirement: Variable-Pitch Pulse Tone

The application SHALL produce a pulse tone on each detected beat whose pitch tracks oxygen saturation, with pitch falling as saturation falls, following the convention that ISO 80601-2-61 requires of pulse oximeter equipment that provides a tone.

#### Scenario: Desaturation is audible before it is read

- **WHEN** oxygen saturation falls from 99% to 92% while the learner's attention is elsewhere in the interface
- **THEN** the pulse tone pitch falls monotonically across that range, and a listening test confirms the direction of change matches the standard's requirement

#### Scenario: The tone carries rate as well as saturation

- **WHEN** heart rate changes
- **THEN** the tone repetition rate follows it, so rate and saturation are carried on separate perceptual dimensions

#### Scenario: The tone stops when the pulse does

- **WHEN** the plethysmogram loses pulsatility, from cardiac arrest or from probe displacement
- **THEN** the pulse tone stops, which is itself the clinically meaningful signal, and the reason is available visually

#### Scenario: Pitch mapping is documented and testable

- **WHEN** the pitch mapping is inspected
- **THEN** the saturation-to-frequency function is declared explicitly with its range, is monotonic, and is asserted by an automated test rather than tuned by ear alone

### Requirement: Alarm Tones Follow The Clinical Standard

Audible alarms SHALL follow the IEC 60601-1-8 conventions for priority, so that a learner develops the same auditory recognition they will need clinically: distinct burst patterns per priority, with higher priority more urgent in rate and pattern, using frequency components within the standard's stated range.

#### Scenario: Priority is identifiable without looking

- **WHEN** a high-priority and a medium-priority alarm sound
- **THEN** their burst patterns differ per the standard, and a listening test confirms a trained clinician can identify priority without seeing the screen

#### Scenario: The simulator does not claim conformance

- **WHEN** the audio implementation is documented
- **THEN** it states that it follows the standard's conventions for educational fidelity and that the project is not a certified medical device and claims no conformance

### Requirement: Audio Is Opt-In, Explained, And Never Required

Audio SHALL begin disabled, SHALL be enabled by a deliberate learner action satisfying browser autoplay policy, and SHALL never be the only channel carrying any information.

#### Scenario: The learner is told what they are missing

- **WHEN** a learner first reaches the cockpit with audio disabled
- **THEN** a single non-blocking prompt explains that the pulse tone is how anesthetists actually track saturation and offers to enable sound, and dismissing it never asks again on that device

#### Scenario: Every sound has a visual equivalent

- **WHEN** audio is disabled, or the learner is deaf or hard of hearing
- **THEN** every alarm, pulse event, and cue is fully conveyed visually and textually, verified by an automated audit that every audio event has a paired visual event

#### Scenario: Volume is controllable and remembered

- **WHEN** the learner sets pulse tone and alarm volumes independently
- **THEN** both persist on that device, either can be muted separately, and a single control mutes everything immediately

### Requirement: Sonification Is A First-Class Accessibility Channel

For learners who cannot see the traces, the application SHALL provide an extended sonification mode that conveys additional parameters through sound, beyond the clinical pulse tone.

#### Scenario: A blind learner can track the patient

- **WHEN** extended sonification is enabled
- **THEN** the learner can track saturation by pitch, heart rate by tone rate, and can request an on-demand spoken summary of all current values, and can complete a full scenario using sound and screen reader alone

#### Scenario: Extended sonification is distinguishable from clinical realism

- **WHEN** extended sonification adds a cue that no real monitor makes
- **THEN** it is timbrally distinct from the clinical tones and is documented as an Open-SimLab affordance rather than something to expect on real equipment

#### Scenario: Sonification does not overwhelm

- **WHEN** several parameters are sonified at once
- **THEN** the learner can enable or disable each parameter's cue individually, and no more than three continuous cues sound simultaneously by default

### Requirement: Audio Is Cheap And Offline

The audio layer SHALL be synthesized with the Web Audio API rather than shipped as audio files, SHALL add no measurable amount to the download budget, and SHALL work offline.

#### Scenario: No audio assets are downloaded

- **WHEN** the bundle is inspected
- **THEN** it contains no encoded audio files for tones or alarms, and all sound is generated at runtime

#### Scenario: Audio does not cost frames

- **WHEN** audio is active during a scenario at 5× speed
- **THEN** the rendering frame budget is unaffected within measurement error, and audio scheduling does not run on the main thread's critical path
