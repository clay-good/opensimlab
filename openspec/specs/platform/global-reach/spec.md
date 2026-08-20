# platform/global-reach Specification

## Purpose

Makes Open Sim Lab genuinely usable by medical students anywhere, not only by well-resourced English-speaking ones. This capability covers translation, unit systems, drug naming across regulatory regions, device and bandwidth constraints, and the licensing that lets a school in any country adopt and adapt it.

## Requirements

### Requirement: Full Interface Translation

All learner-facing strings SHALL be externalized into translation catalogs with no concatenated sentence fragments, and the application SHALL select a locale from the browser preference with a manual override that persists.

#### Scenario: A new language requires no code change

- **WHEN** a translator supplies a complete catalog for a new locale
- **THEN** the application renders fully in that locale after adding only the catalog file, and a test asserts that no user-facing string is hard-coded in source

#### Scenario: Partial translation degrades gracefully

- **WHEN** a catalog is missing a key
- **THEN** the English string is shown, the missing key is reported by the translation-coverage report, and no placeholder token is ever displayed to a learner

#### Scenario: Right-to-left layout is correct

- **WHEN** a right-to-left locale such as Arabic is selected
- **THEN** the layout mirrors, numerics and waveform time axes retain their conventional left-to-right direction, and the monitor remains clinically conventional

#### Scenario: Translated clinical content is reviewed

- **WHEN** a translation covers scenario or protocol text
- **THEN** it carries its own clinical review record, because a mistranslated protocol step is a clinical error, not a copy error

### Requirement: Both Unit Systems, Everywhere

Every displayed quantity SHALL be available in both the SI and the conventional system used in the learner's region, selectable and persisted, with the internal engine operating in a single canonical unit set.

#### Scenario: Hemoglobin and glucose switch systems

- **WHEN** the learner selects SI units
- **THEN** hemoglobin is shown in g/L and glucose in mmol/L; **AND WHEN** conventional units are selected, they are shown in g/dL and mg/dL, with identical underlying state

#### Scenario: Conversion is display-only

- **WHEN** the same transcript is replayed under each unit setting
- **THEN** the state traces are bit-identical, proving conversion never touches the engine

#### Scenario: Units are never ambiguous

- **WHEN** any numeric is displayed or exported
- **THEN** its unit is displayed with it, and no export column is unitless

### Requirement: Regional Drug Naming

Drugs SHALL be identified by International Nonproprietary Name with regional synonyms available, and SHALL carry stable identifiers (UNII and ATC where the dataset provides them) so a learner can confirm they are looking at the agent they know.

#### Scenario: A learner recognizes a locally named drug

- **WHEN** a learner in a region that uses a different common name opens the drug detail
- **THEN** the International Nonproprietary Name, the regional synonym, and the stable identifiers are all shown

#### Scenario: Concentration conventions are stated

- **WHEN** a syringe is presented
- **THEN** its concentration is stated explicitly in mass per volume, rather than assuming a single country's standard presentation

#### Scenario: Language and clinical practice vary independently

- **WHEN** a learner selects a language
- **THEN** it does not change which techniques, formulary, or protocols are taught, because clinical variance is governed by the practice region setting and a language is spoken across many regions

### Requirement: Low-End Device And Low-Bandwidth Support

The application SHALL be usable on a four-year-old mid-range Android phone over a 2G-class connection, and SHALL degrade rendering rather than function when resources are scarce.

#### Scenario: First load completes on a slow connection

- **WHEN** the application is loaded over a simulated 400 kbit/s connection with 400 ms round-trip latency
- **THEN** an interactive cockpit is reached within 20 seconds, with progressive feedback throughout

#### Scenario: A low-memory device still completes a scenario

- **WHEN** the application runs on a device with 2 GB of memory
- **THEN** a full scenario completes without a crash, with the renderer degrading frame rate and trace density as needed while the solver remains exact

#### Scenario: Data cost is disclosed

- **WHEN** an optional scenario pack is offered for download
- **THEN** its compressed size is stated before the download begins

### Requirement: Open Licensing And Forkability

The application code SHALL be released under a permissive open-source license, the educational content under an open content license, and the build SHALL be reproducible from a clean checkout so any institution can self-host.

#### Scenario: A school self-hosts

- **WHEN** an institution clones the repository and runs the documented build
- **THEN** it produces a static asset bundle that can be served from any static host with no service dependency, and the documented steps require no account with any vendor

#### Scenario: Licenses are unambiguous per artifact

- **WHEN** the repository is inspected
- **THEN** the code license and the content license are each stated in a dedicated file, and the pharmacology module records the publication each model is transcribed from, and every scenario declares its own license
