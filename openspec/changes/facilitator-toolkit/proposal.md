# A facilitator toolkit generated from scenario data

## Summary

Open Sim Lab is rehearsal before the simulation lab. The people who run that lab — simulation
coordinators, clerkship directors, nurse anesthesia faculty — currently get an educator page, a
curriculum map, an assignment-link builder, and a transcript review surface. They do not get the
one artifact every simulation center produces by hand for every case: a facilitator guide. Nor
can they stop a projected run at a teaching point, jump to it, or take the scenario back to their
own mannequin.

This change adds a `platform/facilitation` capability: a facilitator guide generated per scenario
from the data the scenario already declares; authored discussion pause points for classroom use;
declared bookmarks with scrubbing, which the adoption capability already requires; and a
mannequin run sheet export so a sim center can run the same case physically after students have
rehearsed it on screen. Everything is generated from checked-in scenario data, renders offline,
carries the maturity label, and collects nothing.

## Why

- **Scenarios are developed in isolation and rarely shared.** That finding, from the simulation
  literature, describes the sim-center world the product sits beside. Every one of the 256 labs
  already declares objectives, patient, timeline events, expected actions with windows, common
  errors, limitations, and sources — exactly the contents of a facilitator guide, in the structure
  INACSL's design and debriefing standards ask for. Generating the guide costs nothing clinically
  new and gives a coordinator a document they would otherwise write from scratch.
- **Classroom use is specified but hollow.** The adoption capability requires presentation mode,
  bookmarks, and scrubbing. Bookmarks and scrubbing are not implemented. An instructor projecting
  a lab cannot stop at the moment the capnogram changes and ask the room what they see, except
  by pausing by hand and hoping to hit it.
- **The screen-to-mannequin handoff is the product's stated position.** The proposal for the
  multidomain catalog says the product "helps a learner arrive ready to use scarce supervised
  simulation time well." Nothing currently helps the person running that supervised time use the
  same case. A neutral run sheet — states, triggers, expected actions, vitals at each state — is
  the smallest artifact that makes the rehearsal and the lab the same lesson.

## What changes

- **Generated facilitator guide** per scenario: learning objectives, patient summary, prebrief
  content per the INACSL prebriefing standard, the authored timeline, expected actions with their
  windows and the common-error and recovery paths, PEARLS-phase debrief prompts drawn from the
  scenario's objectives and attribution, limitations, content note, sources, content version, and
  the maturity label. Printable, offline, one file.
- **Discussion pause points**: an author-declared set of ticks or state predicates at which, when
  classroom mode is on, the clock pauses and a question for the room is shown. No answers are
  collected. The patient is untouched.
- **Bookmarks and scrubbing**: scenario-declared bookmarks an instructor can jump to by replaying
  the expert transcript to that tick, and a scrubber over any completed transcript.
- **Mannequin run sheet**: an export of the scenario as a modality-neutral run sheet with states,
  transitions, triggers, expected learner actions, and the monitor values at each state, licensed
  as the scenario is, and labelled as not clinically reviewed.

## Explicit non-goals

- No live multi-device session, no instructor observation of a learner's device, no polling or
  answer collection at pause points. The room talks; the software waits.
- No claim that a run sheet is a validated mannequin scenario. It is the same unreviewed content
  in a different shape, and it says so on every page.
- No vendor-specific export format. The run sheet is plain text and structured JSON.
- No new clinical content. Every line of the guide is drawn from fields the scenario already
  declares or from the engine's own attribution.

## Success measures

- A facilitator guide renders offline for all 256 scenarios from scenario data with no
  hand-written text, verified by an automated run; a scenario missing a required guide field
  fails the catalog gate.
- Every scenario declares at least one bookmark and the expert transcript reaches it, verified at
  build; jumping to a bookmark takes under 2 seconds on the reference device.
- Every pause point fires exactly once at its declared tick or predicate, pauses the clock, and
  changes no state, verified by replay tests.
- A run sheet exported for any scenario lists every declared state and transition and carries the
  not-for-clinical-use and not-clinically-reviewed statements, verified by a test over the
  catalog.
