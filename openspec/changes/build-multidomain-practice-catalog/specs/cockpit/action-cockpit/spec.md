# cockpit/action-cockpit Delta Specification

## ADDED Requirements

### Requirement: Action Presentation Reflects Current Fictional Capability

The action cockpit SHALL derive controls from the compiled scenario/environment manifest and current
equipment state. It SHALL not expose every possible medical action, a universal formulary, or an
action that has no implemented consequence/refusal rationale.

#### Scenario: Controls do not reveal the diagnosis

- **WHEN** a cause remains hidden
- **THEN** action grouping and labels remain presentation-neutral and do not add a diagnosis-specific
  rescue tray until its declared observation or learner action makes that tray available

#### Scenario: No clinical option is silently preselected

- **WHEN** an action requires agent, dose intent, route, energy, device, setting, or disposition
  choice
- **THEN** the scenario defaults record either justifies a preselection as prior fictional state or
  leaves the choice unset; browser-first-option behavior cannot choose clinically

### Requirement: High-Consequence Simulated Actions Use Bounded Confirmation

Actions that are irreversible in the scenario, immediately change critical state, deliver a
medication/energy, end the session, or represent an invasive procedure SHALL show patient/action,
units/settings, and consequence class in a keyboard-operable confirmation. Confirmation SHALL not
teach a real-patient dose or imply physical competence.

#### Scenario: Confirmation catches unit mismatch

- **WHEN** displayed units, weight basis, route, energy, or device state differ from the selected
  action intent
- **THEN** the mismatch is explicit before acceptance, confirm remains unavailable for schema-invalid
  combinations, and cancel mutates/logs no patient action

#### Scenario: Repeated action is not accidental

- **WHEN** a high-consequence action is requested twice within its declared duplicate-safety window
- **THEN** the second request names the prior simulated tick and requires a fresh deliberate
  confirmation or is refused by the scenario model

### Requirement: Refusal Teaches Scope Without Giving Clinical Advice

Refused actions SHALL use stable reason codes and short fictional-context explanations. They SHALL
not recommend what to do for a real patient or reveal the hidden correct path.

#### Scenario: Refusal is distinguishable from application failure

- **WHEN** an action is refused for state, equipment, region, or scope
- **THEN** the control remains operable, patient state is unchanged, the event log records refusal,
  and the user can distinguish it from a disabled/broken interface
