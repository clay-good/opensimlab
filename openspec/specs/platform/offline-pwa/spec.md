# platform/offline-pwa Specification

## Purpose

Makes Open-SimLab work where medical students actually study: hospital basements, rural clinics, commuter trains, and campuses with metered or intermittent connectivity. Once loaded, the application must be complete on the device and never require the network again.

## Requirements

### Requirement: Full Offline Operation After First Load

After the first successful load, the application SHALL run every bundled scenario, model, citation, and debrief with the network disabled.

#### Scenario: Airplane mode changes nothing

- **WHEN** the device is switched to airplane mode after a first successful load and the application is restarted
- **THEN** the cockpit, all bundled scenarios, the model detail panels, the citations, and the debrief all function identically, verified by an automated offline end-to-end test

#### Scenario: No runtime network dependency exists

- **WHEN** the application runs a complete session with network requests blocked at the test harness
- **THEN** zero requests are attempted, verified by a test that fails on any attempted request

### Requirement: Cache-First Service Worker With Explicit Updates

A service worker SHALL serve all application assets cache-first using a versioned cache, SHALL check for a new version in the background when a network is available, and SHALL apply the update only when the learner accepts it.

#### Scenario: An update never interrupts a running session

- **WHEN** a new version is detected while a session is in progress
- **THEN** the running session continues on the current version, and a non-blocking notice offers to reload when the learner is ready

#### Scenario: Version activation is atomic

- **WHEN** the learner accepts an update
- **THEN** the new cache is fully populated before activation, old caches are deleted after activation, and a partially downloaded update never serves mixed asset versions

#### Scenario: A broken service worker can be escaped

- **WHEN** the service worker fails to activate twice in a row
- **THEN** the application unregisters it, falls back to direct network loading, and shows a diagnostic the learner can report

### Requirement: Installable Progressive Web App

The application SHALL supply a web app manifest enabling installation to the home screen on Android, iOS, Windows, macOS, and ChromeOS, with an appropriate name, icon set, theme color, and display mode.

#### Scenario: Installed app launches offline into the cockpit

- **WHEN** the installed application is launched from the home screen with no network
- **THEN** it opens directly into the cockpit at the last used route without a browser chrome dependency

### Requirement: Bounded Download Budget

The initial load required to reach an interactive cockpit SHALL not exceed 1.5 MB compressed, and the complete offline bundle including every scenario and the vendored dataset SHALL not exceed 8 MB compressed.

#### Scenario: Budget is enforced in continuous integration

- **WHEN** a pull request pushes the initial load above 1.5 MB or the full bundle above 8 MB compressed
- **THEN** the size-budget job fails and reports the largest contributors to the increase

#### Scenario: Scenario packs load on demand

- **WHEN** the learner opens a scenario outside the initial pack while online
- **THEN** it downloads once, is cached permanently, and is thereafter available offline

### Requirement: Local Storage Is Small, Inspectable, And Erasable

All persisted data SHALL be limited to preferences, the not-for-clinical-use acknowledgement, and session transcripts, SHALL be listed in a data panel, and SHALL be erasable in one action.

#### Scenario: Learner sees exactly what is stored

- **WHEN** the learner opens the local data panel
- **THEN** it lists each stored item by name, purpose, and size, with a control to delete each individually and one to delete everything

#### Scenario: Storage pressure degrades predictably

- **WHEN** the browser reports a storage quota error while saving a transcript
- **THEN** the application reports the failure clearly, offers to export the transcript instead, and never silently discards a session without saying so
