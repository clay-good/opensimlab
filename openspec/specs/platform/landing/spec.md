# platform/landing Specification

## Purpose

Defines the front door at `opensimlab.com`. It has two jobs and they pull in opposite directions: send the right person into `/anesthesia` within seconds, and carry all the substantive prose that lets a stranger — or a search engine — understand what this is. It resolves that by being short at the top and substantial below the fold. The simulator itself stays clean; the root domain does the explaining.

## Requirements

### Requirement: One Screen, One Action

The landing page SHALL fit its essential content — the name, the one-line description, the hero, and the primary action — within the first viewport at every breakpoint from 360 px wide upward, with no carousel, no modal, no cookie banner, no newsletter capture, and no interstitial of any kind.

#### Scenario: The primary action is unmissable and singular

- **WHEN** the page renders at any supported breakpoint
- **THEN** exactly one primary Button is present, labeled to name the destination — for example "Open the anesthesia simulator" — linking to `/anesthesia`, and no other control competes with it visually

#### Scenario: Nothing interrupts arrival

- **WHEN** a first-time visitor loads the page
- **THEN** nothing overlays the content: no consent banner (because nothing is collected), no email capture, no app-install prompt, and no autoplaying sound

#### Scenario: The front matter is short even though the page is not

- **WHEN** the page is measured from the top to the end of the module directory
- **THEN** that front matter occupies no more than two screens at 1440 px width, and an automated test fails the build if it grows beyond that; the substantive content section below it is not counted and is not length-limited

### Requirement: The Hero Is The Product Running

The hero element SHALL be a live electrocardiogram trace rendered by the project's own waveform engine, and it SHALL be the only saturated color on the page, in keeping with the design system's rule that color is a clinical signal and never decoration.

#### Scenario: The hero proves the thing works

- **WHEN** the landing page loads
- **THEN** a real trace sweeps using the same generator the simulator uses, drawn in `--ecg`, and every other element on the page is drawn from the neutral ramp

#### Scenario: The hero is cheap

- **WHEN** the landing page's contribution to the download budget is measured
- **THEN** the hero reuses only the waveform generator and the canvas renderer, pulls in no scenario, pharmacology model, or cockpit code, and the landing route stays within its own budget

#### Scenario: The hero degrades to a still image

- **WHEN** the visitor has requested reduced motion, or JavaScript has not executed
- **THEN** a static rendering of the same trace is shown instead, with identical layout and no shift when the live version takes over

### Requirement: Say What It Is In One Line

The page SHALL state what Open-SimLab is in a single sentence a medical student understands without domain jargon, positioned directly beneath the name.

#### Scenario: The description is plain and specific

- **WHEN** the one-line description is read
- **THEN** it names the audience and the thing — a free, browser-based clinical simulator for medical students, residents, and nurse anesthetists — without the words "revolutionary", "cutting-edge", "AI-powered", or "platform"

#### Scenario: No claim outruns the evidence

- **WHEN** any claim on the landing page is checked against the validation report and the limitations register
- **THEN** every claim is supported, and the page makes no assertion of educational outcome that the evaluation has not produced

### Requirement: Three Facts, No More

Below the primary action the page SHALL present at most three short supporting facts, each one line, chosen because they answer the objections a first-time visitor actually has.

#### Scenario: The three facts are the right three

- **WHEN** the supporting facts are enumerated
- **THEN** they cover: that it is free with no account, that it works offline once loaded, and that the pharmacology comes from published models with citations a reader can check — each linking to the relevant deeper page

#### Scenario: The facts are not a feature list

- **WHEN** the section is reviewed
- **THEN** it contains no icon grid, no feature comparison table, and no more than three items

### Requirement: Modules Directory Is Honest About What Exists

The page SHALL list the modules with an unambiguous status for each: Anesthesia as available, and the planned modules — cardiology first, then others such as oncology and critical care — clearly marked as planned, with no date promised.

#### Scenario: Available and planned are visually distinct

- **WHEN** the module list renders
- **THEN** the anesthesia entry is an active link with a short description, and each planned entry is visibly non-interactive as a destination, labeled "Planned", with one line describing what it will cover

#### Scenario: No date is invented

- **WHEN** a planned module is displayed
- **THEN** it carries no launch date, no quarter, and no countdown, because the honest status signaling requirement forbids promising a schedule the project cannot commit to

#### Scenario: A planned route is honest when visited directly

- **WHEN** a visitor navigates to `/cardiology` before it exists
- **THEN** the route resolves to a page stating it is planned, describing its intended scope, and linking to the anesthesia module, consistent with the route scheme requirement

#### Scenario: Interest is expressed without collecting anything

- **WHEN** a visitor wants to be told when cardiology ships
- **THEN** they are pointed to the public repository's releases or its feed, and no email address is requested, because collecting one would breach the privacy architecture

### Requirement: Substantive Content Lives Below The Fold

Beneath the front matter the page SHALL carry genuine prose explaining the project, written for a human reader who scrolled because they wanted to know more. This is where the root domain's descriptive weight lives, so that the simulator itself never has to carry marketing copy.

#### Scenario: The content section covers what a stranger needs

- **WHEN** the below-the-fold content is enumerated
- **THEN** it covers, in this order: what the simulator teaches and how it teaches it; who it is for, naming medical students, anesthesiology residents, nurse anesthetist students, and the faculty who teach them; what is inside the anesthesia module; where the pharmacology comes from and how it is reviewed; what the project deliberately does not do; and how to use it in a course

#### Scenario: The prose is real writing, not keyword filler

- **WHEN** the content is reviewed
- **THEN** every paragraph would be worth reading to a human who scrolled to it, contains no repeated keyword phrases, no hidden text, no location or specialty permutation pages, and no content generated to rank rather than to inform

#### Scenario: Claims in the content match the evidence

- **WHEN** the content section makes a claim about accuracy, review, or educational value
- **THEN** it links to the validation report, the governance page, or the cited source that supports it, and the clinical review requirement applies to any clinical statement it makes

#### Scenario: A short answer section addresses the real questions

- **WHEN** the questions section renders
- **THEN** it answers, plainly and in a few sentences each: whether it is free, whether an account is needed, whether it works offline, whether it can be used on a phone, where the drug models come from, who reviews the clinical content, whether it can be used in a course, whether it replaces mannequin simulation, and when other modules are coming — with the last answered honestly as "no date is promised"

#### Scenario: The content section does not delay the primary action

- **WHEN** the page loads
- **THEN** the front matter and its primary action are interactive before the content section has finished rendering, and the content section's assets are not on the critical path

### Requirement: Footer Carries The Trust Signals

The footer SHALL carry, compactly: the not-for-clinical-use statement, and links to the validation report, the clinical governance page, the limitations register, the license, the source repository, and the suggested citation.

#### Scenario: A skeptical clinician finds the evidence in one hop

- **WHEN** a clinician arrives and wants to know whether this is credible before clicking into the simulator
- **THEN** the validation report, the editorial board, and the limitations register are each reachable in one click from the landing page

#### Scenario: The disclaimer is present without dominating

- **WHEN** the footer renders
- **THEN** the not-for-clinical-use statement is legible at `--type-micro` in `--text-secondary`, is never hidden behind a disclosure control, and does not occupy more space than the module list

### Requirement: The Landing Route Has Its Own Budget

The landing page SHALL be independently budgeted and SHALL NOT pull in the simulator bundle.

#### Scenario: The front door is very small

- **WHEN** the landing route is loaded cold
- **THEN** its total transferred weight is at most 150 KB compressed including fonts and the below-the-fold prose, its Largest Contentful Paint is under 1.2 seconds on the reference mid-range device over a 4G-class connection, and continuous integration fails the build on either regression

#### Scenario: Text weighs almost nothing and is treated accordingly

- **WHEN** the content section grows
- **THEN** it stays within budget because it is prose and markup rather than images, and any image it introduces is measured against the same budget

#### Scenario: The simulator is prefetched, not loaded

- **WHEN** the visitor's connection is not metered and they have been on the page for two seconds
- **THEN** the anesthesia route's entry bundle is prefetched at low priority so the click feels instant, and the prefetch is skipped entirely when the browser reports a saving-data preference or a slow connection
