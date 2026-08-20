# platform/adoption Specification

## Purpose

Removes the practical reasons a program says no. A residency program director, a nurse anesthesia faculty member, or a medical school course lead needs the tool to map to their curriculum, work in their classroom, satisfy their procurement and accessibility review, be citable in their scholarship, and be extensible by them without asking permission. This capability specifies each of those.

## Requirements

### Requirement: Curriculum Mapping To Recognized Frameworks

Every scenario and competency SHALL declare its mapping to published training frameworks, at minimum the ACGME Anesthesiology Milestones 2.0 subcompetencies for residency, and the Council on Accreditation standards and NBCRNA content domains for nurse anesthesia. Mappings SHALL be data, not prose, so they can be filtered and exported.

#### Scenario: A program director filters by milestone

- **WHEN** a program director selects an ACGME subcompetency in the curriculum view
- **THEN** every scenario mapped to it is listed with its objectives and duration, and the mapping is exportable as CSV for their program documentation

#### Scenario: Mappings state their framework version

- **WHEN** a mapping is displayed
- **THEN** it names the framework and its version or year, so a reader can tell whether it reflects the current published framework

#### Scenario: An unmapped scenario is visible as unmapped

- **WHEN** a scenario has no framework mapping
- **THEN** it is listed as unmapped rather than omitted, so coverage claims stay honest

### Requirement: Classroom And Lecture Use

The application SHALL support use in front of a room: a presentation mode with enlarged type and traces legible from the back of a lecture hall, and operation with no network.

#### Scenario: A trace is readable from 15 metres

- **WHEN** presentation mode is enabled on a 3-metre projected display
- **THEN** vital numerics render at no less than the equivalent of 120 px on a 1080p projection, trace stroke width doubles, and the interface chrome recedes

#### Scenario: A lecture runs with the venue wifi down

- **WHEN** the instructor's device has been used once before and the venue has no working network
- **THEN** every bundled scenario, drug card, explainer, and debrief runs from the cache

#### Scenario: An instructor can drive a scenario to a teaching point quickly

- **WHEN** an instructor wants to demonstrate a specific moment
- **THEN** they can jump the simulation to a declared bookmark in the scenario, or scrub a completed transcript to any tick, without replaying in real time

### Requirement: Citable Scholarly Object

The project SHALL be citable: a `CITATION.cff` file, an archived release with a persistent digital object identifier, and a suggested citation shown in the application.

#### Scenario: A faculty member cites the tool in a paper

- **WHEN** they open the about panel or the repository
- **THEN** they find a formatted suggested citation including authors, title, version, year, and a resolvable persistent identifier for that specific version

#### Scenario: Each release is independently citable

- **WHEN** a release is published
- **THEN** it is archived with its own version identifier, so a study can cite the exact version its participants used

### Requirement: Procurement And Accessibility Documentation

The project SHALL publish the artifacts an institution's review process asks for: an accessibility conformance report, a plain statement of data handling, a security statement covering the static-asset architecture, and the licensing terms.

#### Scenario: An accessibility office can complete its review

- **WHEN** an institutional accessibility reviewer requests documentation
- **THEN** a current accessibility conformance report covering WCAG 2.2 Level AA is published in the repository, naming the evaluation date, method, and any known exceptions

#### Scenario: A privacy office finds the answer in one page

- **WHEN** a privacy reviewer asks what learner data is collected
- **THEN** the data-handling statement says that none is collected or transmitted, names the enforcing tests, and explains what the static host necessarily observes

#### Scenario: Licensing permits institutional use and modification

- **WHEN** an institution wishes to self-host a modified copy for its own curriculum
- **THEN** the license permits it without a separate agreement, and the documentation gives the build and deploy steps

### Requirement: Instructor Authoring Without Engineering

An educator SHALL be able to author a scenario, map it to competencies, write its debrief rubric, validate it, and run it, without installing a development environment.

#### Scenario: A scenario is authored in the browser

- **WHEN** an educator opens the scenario authoring surface
- **THEN** they can build a patient, a timeline, objectives, and a rubric through forms, preview it live, and download the resulting scenario file

#### Scenario: Validation errors are in the educator's language

- **WHEN** an authored scenario is invalid
- **THEN** the error names the field in plain language and states what is expected, rather than reporting a schema path

#### Scenario: A local scenario runs without publishing it

- **WHEN** an educator loads their own scenario file into the application
- **THEN** it runs identically to a bundled scenario, is marked as a local unreviewed scenario, and never leaves the device

#### Scenario: Contributed scenarios enter governance

- **WHEN** an educator proposes their scenario for inclusion in the bundled library
- **THEN** it enters the clinical review process, and it is not bundled until it carries a review record

### Requirement: Institutional Self-Hosting

The application SHALL be self-hostable as static files with no service dependency, and the documentation SHALL cover deploying it behind an institutional network.

#### Scenario: A hospital serves it from an internal host

- **WHEN** an institution copies the build output to an internal static server with no internet egress
- **THEN** the application functions completely, including install, offline use, and every bundled scenario

#### Scenario: A fork can rebrand and re-scope

- **WHEN** an institution forks the project to add their own local protocols
- **THEN** the documentation explains how to add scenarios and content, and the clinical review requirement is preserved in the fork's build so local content is still signed

### Requirement: Honest Positioning Against Alternatives

The project documentation SHALL state plainly what this tool is for and what it is not, including where mannequin-based simulation, supervised clinical time, or an existing tool remains the better choice.

#### Scenario: The comparison is fair

- **WHEN** the documentation compares Open Sim Lab to existing screen-based simulators
- **THEN** it names them accurately, states what they do well, and confines its own claims to what the validation report supports

#### Scenario: The tool does not overclaim its place

- **WHEN** a reader asks whether this replaces hands-on simulation
- **THEN** the documentation states that it does not: it teaches decision-making, pharmacology, and pattern recognition, and does not teach psychomotor skills, team communication, or physical airway technique
