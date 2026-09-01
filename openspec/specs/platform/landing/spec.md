# platform/landing Specification

## Purpose

Defines the front door at `opensimlab.com`. It has two jobs and they pull in opposite directions: send the right person into `/anesthesia` within seconds, and carry all the substantive prose that lets a stranger — or a search engine — understand what this is. It resolves that by being short at the top and substantial below the fold. The simulator itself stays clean; the root domain does the explaining.

## Requirements

### Requirement: One Screen, Every Door

The landing page SHALL fit its essential content, the name, the one-line description, the hero, and the module choices, within one screen at 1440 px wide, with no carousel, no modal, no cookie banner, no newsletter capture, and no interstitial of any kind. At a phone width the name, the description, the hero, and the first row of module choices SHALL be above the fold and the remainder SHALL be reachable by one ordinary scroll.

#### Scenario: Every available module is offered at the same weight

- **WHEN** the page renders at any supported breakpoint
- **THEN** every module with `available` status is present as its own control linking to its route, all at the same size and visual weight, and no single module is styled as the primary one

Fifteen modules are registered at their full planned count, and a visitor arriving here is not necessarily an anaesthetist. This requirement previously named exactly one primary Button linking to `/anesthesia`, with the other modules listed beneath it as small text; that said the product was an anaesthesia simulator with extras, which is not what it is. The one-screen half of the requirement is what constrains the design: offering every module costs vertical space, so the space comes from the hero and the spacing rather than from the fold.

#### Scenario: A module choice reads as a control

- **WHEN** a visitor looks at the module choices
- **THEN** each one is a surface with a hairline and a radius whose whole area is the link, at a target size no smaller than the design system's minimum, rather than a run of small text a visitor has to guess is clickable

The choices were 11 px pill chips in a dot-separated line. That is the smallest thing on the page, and it was carrying the one action a stranger came here to take.

#### Scenario: Each module states how much is behind it

- **WHEN** a module choice renders
- **THEN** it carries the number of scenarios that module ships, and that number is the one the module's own route actually serves

The front door claims a total in its one line. The per-module counts are what make that total checkable at a glance instead of asking to be believed. The count is declared in the module registry rather than counted from the scenario files, because the landing route is budgeted separately and may not import one; an automated test holds every declaration against the real scenario array, and the total in the one-line description is summed from the same declarations rather than typed.

#### Scenario: Nothing interrupts arrival

- **WHEN** a first-time visitor loads the page
- **THEN** nothing overlays the content: no consent banner (because nothing is collected), no email capture, no app-install prompt, and no autoplaying sound

#### Scenario: The front door is one screen and stays one screen

- **WHEN** the landing page is measured from the top of the document to the bottom of the footer
- **THEN** it occupies no more than one screen at 1440 by 900, contains no prose section, no questions block and no expandable panel, and an automated test fails the build if a section is added to it, budgeting the module directory separately from the copy so that launching a module cannot buy room for new prose

### Requirement: The Demonstration Is One Click From The Front Door

The front door SHALL offer, under the module choices, a quiet link that starts the guided demonstration directly, without a briefing step. It SHALL NOT be a control and SHALL NOT compete with the module choices for attention.

#### Scenario: A visitor reaches a running demonstration in one click

- **WHEN** a visitor follows the demonstration link from the front door
- **THEN** the scenario the script was authored against opens already running at demonstration speed with the first narration on screen, and no briefing is interposed, because someone who chose to watch has already answered the question a briefing asks

#### Scenario: It stays a link, not a button

- **WHEN** the front door renders
- **THEN** no primary button is present anywhere on it, and the demonstration is offered as text under the module choices, because it is the fallback for a visitor who has not decided which door is theirs rather than the offer itself

#### Scenario: An ordinary visit is never diverted into it

- **WHEN** a scenario is opened without the demonstration being asked for — including from an assignment link carrying a seed, a label or a guidance level
- **THEN** the briefing is shown as normal and no demonstration begins

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

The page SHALL state what Open Sim Lab is in a single sentence a medical student understands without domain jargon, positioned directly beneath the name.

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

The landing page SHALL name every module with an unambiguous status — Anesthesia, emergency medicine, and critical care as available, and planned modules such as cardiology and oncology marked as planned — with no date promised. The one-line scope of each module SHALL be carried by the About page and by that module's own route, so the front door states the status without becoming a catalogue.

#### Scenario: Available and planned are distinguishable on the front door

- **WHEN** the landing page's module line renders
- **THEN** available modules read as live destinations and the planned ones are named as planned in the same line, with no date, no quarter and no countdown

#### Scenario: The scope of each module is one click away

- **WHEN** a visitor wants to know what a planned module will cover
- **THEN** the About page lists every module with its one-line scope and its status, and each planned module's own route states the same thing

#### Scenario: No date is invented

- **WHEN** a planned module is displayed
- **THEN** it carries no launch date, no quarter, and no countdown, because the honest status signaling requirement forbids promising a schedule the project cannot commit to

#### Scenario: A planned route is honest when visited directly

- **WHEN** a visitor navigates to `/cardiology` before it exists
- **THEN** the route resolves to a page stating it is planned, describing its intended scope, and linking to the anesthesia module, consistent with the route scheme requirement

#### Scenario: Interest is expressed without collecting anything

- **WHEN** a visitor wants to be told when cardiology ships
- **THEN** they are pointed to the public repository's releases or its feed, and no email address is requested, because collecting one would breach the privacy architecture

### Requirement: The Front Door Asks For A Reviewer, And Nothing Else

The landing page SHALL carry exactly one request, directly beneath the honest-status line: an invitation to a credentialed clinician to review the clinical content, offered as a mail link that opens the visitor's own client with a subject already written. It SHALL NOT ask for money, a subscription, an address, or an account, and it SHALL NOT exceed one sentence.

#### Scenario: The ask sits where the claim it answers is made

- **WHEN** the footer renders
- **THEN** the line stating that nothing here is clinically reviewed is immediately followed by the sentence saying what would change that, styled no louder than the status line itself, so a visitor who is not a clinician reads past it without being addressed

#### Scenario: It asks for a reviewer, not for support

- **WHEN** the invitation is read
- **THEN** it requests clinical review and names no donation, sponsorship, subscription or mailing list, and it collects nothing: the project publishes its own address rather than asking for the visitor's, which is the only direction the privacy architecture permits

#### Scenario: It stays one sentence

- **WHEN** the front door's word budget is measured
- **THEN** the invitation is counted as copy rather than exempted as navigation, and the budget leaves only a few words of slack, because a front door that begins making a case has stopped being a front door

This project cannot pay for the review it needs, and the alternative to asking is shipping an unsigned corpus indefinitely while the footer says so and offers no way to help. One sentence is the whole of the ask.

### Requirement: Substantive Content Lives On The Root Domain

The root domain SHALL carry genuine prose explaining the project, written for a human reader who wanted to know more, at a dedicated `/about` route linked from the landing page and from the footer of every page. Keeping it off the landing page is what lets the front door be one screen; keeping it on the root domain is what stops the simulator ever having to carry marketing copy.

#### Scenario: The About route is reachable and indexable

- **WHEN** the route set is enumerated
- **THEN** `/about` is present, indexable, prerendered to static HTML, and linked from the landing page

#### Scenario: The content section covers what a stranger needs

- **WHEN** the About page's content is enumerated
- **THEN** it covers, in this order: what the simulator teaches and how it teaches it; who it is for, naming medical students, anesthesiology residents, nurse anesthetist students, and the faculty who teach them; what is inside the anesthesia module; where the pharmacology comes from and how it is reviewed; what the project deliberately does not do; and how to use it in a course

#### Scenario: The prose is real writing, not keyword filler

- **WHEN** the content is reviewed
- **THEN** every paragraph would be worth reading to a human who scrolled to it, contains no repeated keyword phrases, no hidden text, no location or specialty permutation pages, and no content generated to rank rather than to inform

#### Scenario: Claims in the content match the evidence

- **WHEN** the content section makes a claim about accuracy, review, or educational value
- **THEN** it links to the validation report, the governance page, or the cited source that supports it, and the clinical review requirement applies to any clinical statement it makes

#### Scenario: A short answer section addresses the real questions

- **WHEN** the About page's questions section renders
- **THEN** it answers, plainly and in a few sentences each: whether it is free, whether an account is needed, whether it works offline, whether it can be used on a phone, where the drug models come from, who reviews the clinical content, whether it can be used in a course, whether it replaces mannequin simulation, and when other modules are coming — with the last answered honestly as "no date is promised"

#### Scenario: The content does not delay the primary action

- **WHEN** the landing page loads
- **THEN** the prose is not on it at all, so the primary action is interactive without waiting for anything the About page needs

### Requirement: Footer Carries The Trust Signals

The footer SHALL carry, compactly: the not-for-clinical-use statement, and links to the About page, the validation report, the clinical governance page, the limitations register, the license, the source repository, and the suggested citation. The suggested citation MAY live on the About page's footer rather than the landing page's, so the front door stays one screen.

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
