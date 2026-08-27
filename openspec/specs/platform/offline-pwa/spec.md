# platform/offline-pwa Specification

## Purpose

Makes Open Sim Lab work where medical students actually study: hospital basements, rural clinics, commuter trains, and campuses with metered or intermittent connectivity. Once installed and controlling a page, the application must be complete on the device while its offline files remain stored.

## Requirements

### Requirement: Full Offline Operation After First Load

After the first successful offline installation and a subsequent navigation or reload under worker control, the application SHALL run every bundled scenario, model, citation, and debrief with the network disabled. A first page render alone SHALL NOT be described as completed offline installation; clearing or browser eviction of site data requires another download. First-install activation SHALL NOT claim an uncontrolled page whose release identity is unknown.

#### Scenario: Airplane mode changes nothing

- **WHEN** the device is switched to airplane mode after successful offline installation and the application is restarted
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
- **THEN** every precached response matches its build-stamped SHA-256 integrity value before activation, the accepting tab reloads once after the intended worker controls it, and an incomplete or mixed deployment cannot replace the current release

#### Scenario: Another tab retains its release through repeated updates

- **WHEN** one tab remains open while another accepts multiple newer releases, including a service-worker restart
- **THEN** the older tab and its solver workers retain their original lazy assets and stable-URL resources; release pins survive worker restarts without recording practice content or transmitting client IDs

#### Scenario: Cleanup never evicts a live or waiting release

- **WHEN** a release activates
- **THEN** all durable client pins, including initializing clients omitted by client enumeration, retain their release; after activation, confirmed closed-client pins may be removed and a later activation may retire unpinned older snapshots; live releases, newer installations, and unrelated origin caches remain intact; insufficient storage rejects a new installation rather than evicting a live release

#### Scenario: Release responses remain immutable

- **WHEN** the network begins serving newer HTML or assets before update acceptance
- **THEN** the current release's cached bytes remain unchanged, query/trailing-slash/index aliases resolve within that release, and no arbitrary network response is written into its cache

#### Scenario: A broken service worker can be escaped

- **WHEN** the service worker fails to activate twice in a row
- **THEN** the application unregisters it, falls back to direct network loading, and shows a diagnostic the learner can report

### Requirement: Installable Progressive Web App

The application SHALL supply a web app manifest enabling installation to the home screen on Android, iOS, Windows, macOS, and ChromeOS, with an appropriate name, icon set, theme color, and display mode.

#### Scenario: Installed app launches offline into the cockpit

- **WHEN** the installed application is launched from the home screen with no network
- **THEN** it opens directly into the cockpit at the last used route without a browser chrome dependency

### Requirement: Bounded Download Budget

The initial load required to reach an interactive cockpit SHALL not exceed 1.625 MB compressed, and the complete offline bundle including every scenario and the vendored dataset SHALL not exceed 8 MB compressed. The interactive ceiling includes capacity for the bounded multidomain tutor catalog; the independently enforced 150 KB landing budget remains unchanged.

#### Scenario: Budget is enforced in continuous integration

- **WHEN** a pull request pushes the initial load above 1.625 MB or the full bundle above 8 MB compressed
- **THEN** the size-budget job fails and reports the largest contributors to the increase

#### Scenario: Scenario packs load on demand

- **WHEN** the learner opens a scenario outside the initial pack while online
- **THEN** it downloads once and is thereafter available offline while its installed release remains stored; browser eviction or clearing site data may require another download

### Requirement: Local Storage Is Small, Inspectable, And Erasable

All persisted data SHALL be limited to preferences, the not-for-clinical-use acknowledgement, and session transcripts, SHALL be listed in a data panel, and SHALL be erasable in one action.

#### Scenario: Learner sees exactly what is stored

- **WHEN** the learner opens the local data panel
- **THEN** it lists each stored item by name, purpose, and size, with a control to delete each individually and one to delete everything

#### Scenario: Storage pressure degrades predictably

- **WHEN** the browser reports a storage quota error while saving a transcript
- **THEN** the application reports the failure clearly, offers to export the transcript instead, and never silently discards a session without saying so
