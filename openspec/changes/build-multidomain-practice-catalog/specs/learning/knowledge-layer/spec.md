# learning/knowledge-layer Delta Specification

## ADDED Requirements

### Requirement: Explanations Respect Scenario Reveal State

The Why panel, explainers, sources, tutor links, accessible summaries, and debrief previews SHALL
respect the scenario's declared reveal conditions. Before reveal, they may explain observed
mechanisms and uncertainty but SHALL NOT expose hidden diagnoses, events, triggers, or expected
actions.

#### Scenario: Asking why is not asking for the answer

- **WHEN** a learner opens Why before the diagnosis reveal condition
- **THEN** it explains current observable contributors at the supported evidence level, identifies
  uncertainty, and omits hidden state and diagnosis names

#### Scenario: Provenance does not leak through a title

- **WHEN** a source or limitation title contains the hidden diagnosis
- **THEN** the live surface uses a presentation-safe label and makes the full record available after
  reveal or in debrief

### Requirement: Knowledge Surfaces Distinguish Evidence Types

Every explanation SHALL label recorded observation, modeled attribution, published model, sourced
state transition, authored convention, counterfactual, and unsupported/unknown elements distinctly.

#### Scenario: The engine cannot explain what it does not model

- **WHEN** a learner asks why about a state with incomplete attribution
- **THEN** the panel lists supported contributors and says what remains unmodeled or unknown rather
  than normalizing available contributors to a false 100%

### Requirement: The Sandbox Remains A Teaching Demonstration

Sandbox dimensions SHALL use fictional presets and bounded authored ranges and SHALL teach how a
model responds. It SHALL NOT accept arbitrary real-patient datasets, return a clinical plan, solve
for a dose/target, or expose a general-purpose compute API.

#### Scenario: A learner explores one variable safely

- **WHEN** a learner varies an allowed dimension
- **THEN** the interface identifies the fictional baseline, allowed envelope, model tier, teaching
  question, and scenario connection and prevents inverse target solving
