# platform/practice-region Delta Specification

## ADDED Requirements

### Requirement: Region Variants Preserve Objectives Without Inventing Consensus

Each scenario SHALL declare supported regions and every region-dependent action, term, unit,
guideline, threshold, device, formulary, and acceptable objective path. A region variant SHALL
preserve the scenario's primary learning objective and difficulty or become a separate scenario.

#### Scenario: Equivalent regional paths are both respected

- **WHEN** supported regions recommend different acceptable actions or sequences
- **THEN** the scenario exposes only the selected region's context, evaluator accepts its declared
  paths, tutor teaches that path, and debrief notes material alternatives without calling one
  universally correct

#### Scenario: Region changes cannot occur mid-run

- **WHEN** a learner attempts to change practice region after the briefing begins
- **THEN** the current scenario remains pinned and the interface offers to restart under the new
  region because controls, sources, objectives, and defaults may differ

#### Scenario: Unsupported region is honest

- **WHEN** a scenario lacks sufficient source/reviewer coverage for the learner's selected region
- **THEN** it is excluded or clearly offers another supported region before start and never silently
  falls back to a default jurisdiction

### Requirement: Region Defaults Are Not Inferred From Identity

Practice region SHALL be chosen explicitly or stored locally from a prior choice. It SHALL NOT be
inferred from IP address, locale, timezone, institution, browser language, or report data.

#### Scenario: First regional scenario requires a choice

- **WHEN** more than one materially different region is available and no local preference exists
- **THEN** the briefing asks once with plain descriptions and no preselected clinically normative
  option
