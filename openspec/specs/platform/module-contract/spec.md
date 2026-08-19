# platform/module-contract Specification

## Purpose

Defines the boundary between the shared simulator platform and a specialty module, so that anesthesiology at `/anesthesia` is the first instance of a general pattern rather than a one-off application. Oncology, cardiology, critical care, and emergency medicine must be addable without re-engineering the core.

## Requirements

### Requirement: Specialty Modules Are Self-Contained Packages

A specialty module SHALL be a package declaring its route segment, display name, model bindings, state variables, monitor layout, cockpit action set, scenario library, and debrief rubric templates. The platform SHALL contain no specialty-specific logic.

#### Scenario: The core has no anesthesiology knowledge

- **WHEN** the anesthesiology module is removed from the build
- **THEN** the platform still compiles, the landing page still renders, and no core file references an anesthetic drug, a depth-of-anesthesia index, or a ventilator

#### Scenario: A new module mounts by registration alone

- **WHEN** a new module package is registered
- **THEN** its route becomes available, its scenarios appear in the library, and its monitor layout renders, with no change to core source

### Requirement: Shared Kernel Across Specialties

The platform SHALL provide, for reuse by every module: the compartment solver, the Hill and response-surface effect mapping, the simulation clock and transcript, the canvas trace renderer, the alarm framework, the event log, the debrief framework, and the provenance, accessibility, offline, and privacy guarantees.

#### Scenario: A second module reuses the solver unchanged

- **WHEN** the oncology module simulates an exposure–response relationship
- **THEN** it uses the same compartment solver and effect mapping as anesthesiology, with different model bindings and different state variables, and no fork of the numerical core exists

#### Scenario: Guarantees are inherited, not reimplemented

- **WHEN** a new module ships
- **THEN** it automatically satisfies the offline, privacy, and not-for-clinical-use requirements because they are enforced at the platform layer, and its own tests need only cover its specialty content

### Requirement: Modules Declare Their Own Physiological Timescale

A module SHALL declare the simulated timescale it teaches, and the platform SHALL supply speed multipliers appropriate to it, because a drug bolus resolves in minutes while an oncology exposure–response plays out over weeks.

#### Scenario: Anesthesiology uses second-scale time

- **WHEN** the anesthesiology module loads
- **THEN** the clock offers 1×, 2×, 5×, and 60×, and elapsed time is displayed as hours, minutes, and seconds

#### Scenario: A long-timescale module uses its own units

- **WHEN** a module declares a timescale of days
- **THEN** the transport controls offer multipliers appropriate to that scale, the elapsed display uses days, and the solver step size is set from the module declaration rather than fixed at 100 ms

### Requirement: Module Model Bindings Follow The Same Provenance Rules

Every module SHALL bind its models through the same provenance layer, with tiers, envelopes, citations, and the never-synthesize rule applying identically.

#### Scenario: A new module cannot bypass provenance

- **WHEN** a module attempts to supply a parameter value directly rather than through a curated or explicitly-labeled pedagogical descriptor
- **THEN** the module registration fails validation at build time, naming the offending binding

### Requirement: Cross-Module Navigation Is Explicit And Cheap

The landing page SHALL let a visitor find the module relevant to their study, and each module SHALL state its prerequisites and its intended audience.

#### Scenario: A student finds the right module in one step

- **WHEN** a first-time visitor loads `/`
- **THEN** the available modules are listed with a one-sentence description of what each teaches and who it is for, and selecting one navigates directly into it

#### Scenario: A module supplies its own directory entry

- **WHEN** a module package is registered
- **THEN** it declares its route segment, display name, one-line description, audience, and status, and the landing page's module directory renders from those declarations rather than from a hand-maintained list

#### Scenario: Unavailable modules do not mislead

- **WHEN** a module is planned but not yet built
- **THEN** it is shown as planned with no interactive entry point that implies it works
