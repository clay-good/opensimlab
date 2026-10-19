# learning/catalog-growth Delta Specification

## ADDED Requirements

### Requirement: The Ratified Count Is A Floor, Not A Ceiling

The catalog registry SHALL record the ratified count of 256 playable scenarios with its date and
commit. The playable count SHALL be the number of scenarios passing every completion and quality
gate, with no upper bound, and SHALL NOT fall below the ratified count unless a corrections-log
entry records the withdrawal of each missing scenario.

#### Scenario: Growth does not contradict the gate

- **WHEN** a 257th scenario passes every gate
- **THEN** the catalog gate reports 257 playable, every count surface shows 257, and no test or
  gate names 256 as a maximum

#### Scenario: A silent shrink is refused

- **WHEN** the playable count would fall below the ratified count and no corrections-log entry
  names the withdrawn scenario
- **THEN** the catalog gate fails naming the missing scenario and the rule

#### Scenario: A recorded withdrawal is honest

- **WHEN** a scenario is withdrawn with a corrections-log entry
- **THEN** the playable count decreases, the review-status page lists the withdrawal, and the
  landing one-liner, module card, and structured data all show the new count

### Requirement: A Module Passes The Breadth Test Before It Is Planned

A proposed module SHALL be a checked-in proposal document declaring its learner roles and
setting, at least eight scenario proposals each passing the scenario training-value rule, the
shared capabilities it composes or needs, a formulary with a source or declared teaching model
for every agent, its review domains, a negative-transfer analysis for its setting, its regional
variation, and a status of proposed, breadth-test-passed, planned, or declined. A module SHALL
appear as planned on the landing page only with status planned, and SHALL be counted only when
its scenarios pass every scenario gate.

#### Scenario: A proposal with seven scenarios is not planned

- **WHEN** a module proposal lists seven scenario proposals
- **THEN** its status cannot advance past proposed, the build refuses a planned status for it, and
  the About page lists it under proposed with the shortfall named

#### Scenario: A scenario proposal that is a runtime utility fails the module

- **WHEN** one of a proposal's scenarios is primarily a calculator, score, lookup, or checklist
  answer
- **THEN** it does not count toward the eight, and the proposal document must replace or withdraw
  it before the breadth test can pass

#### Scenario: Review coverage is a precondition, not an afterthought

- **WHEN** a module reaches planned status
- **THEN** its review domains are registered so the governance coverage rule applies from the first
  scenario, and the uncovered-domain list on the governance dashboard includes them

#### Scenario: A declined proposal stays visible

- **WHEN** a module proposal is declined
- **THEN** the document remains with its reason, and the public scope documentation lists it under
  declined, so the catalog is not represented as comprehensive medicine

### Requirement: Candidate Modules Are Published As Proposals, Not Promises

The repository SHALL hold proposal documents for the candidate modules the project currently
considers strongest — at minimum prehospital and emergency medical services, office-based
procedural sedation, acute care of older adults, and psychiatric emergencies with medical
physiology — each with its breadth-test status. The landing page SHALL NOT show a candidate as
planned, SHALL promise no date, and the About page SHALL list candidates under a heading that
says they are proposed and not planned.

#### Scenario: A visitor cannot mistake a proposal for a module

- **WHEN** the landing page and About page render
- **THEN** no candidate module appears as available or planned on the landing page, and the About
  page lists each candidate with its status and no date, quarter, or countdown

#### Scenario: A candidate's needs are stated

- **WHEN** a candidate's proposal document is read
- **THEN** it names the shell, capabilities, formulary sources, review domains, and
  negative-transfer analysis still required, so a contributor can see what would advance it

### Requirement: No Reader-Visible Count Is Typed By Hand

Every scenario or module count a reader can see — the landing one-liner, module cards, the About
page, the review-status headline, structured data, and the README table — SHALL be rendered from
the registry and the scenario arrays or asserted against them by a test that fails the build on
disagreement.

#### Scenario: A stale README fails the build

- **WHEN** the README's module table disagrees with the registry on any count or total
- **THEN** a test fails naming the module and both values

#### Scenario: Structured data counts what is served

- **WHEN** the `SoftwareApplication` and `LearningResource` records are generated
- **THEN** any count they carry equals the registry's playable count for that scope, verified in CI
