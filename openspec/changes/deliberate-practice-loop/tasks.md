# Implementation plan: deliberate-practice loop

Spec-only until checked. Every mechanism here is a learner-operated control; none starts on
its own, none changes the engine, and none produces a score.

## 1. Blind draw

- [ ] Add a draw operation to the catalog that selects from a pool (module, path, or all
  installed) using the session seed, with an "unseen only" filter defaulting on.
- [ ] Define the withheld field set and the pre-start field set; render the pre-start briefing
  from the latter only. Record `blindDraw: { pool }` in the transcript.
- [ ] Test over every scenario with a recognition objective that no withheld field reaches the
  DOM, the accessible tree, the document title, or the URL before the reveal condition.
- [ ] Test reproducibility of the draw from the transcript seed and pool.

## 2. Expert overlay

- [ ] Replay the expert fixture through the replay worker under the learner's seed, engine, and
  content version; compare against the fixture's declared tolerance and withhold on mismatch.
- [ ] Render both traces and action marks on the existing debrief axes; list per-objective tick
  differences and order agreement for order-sensitive actions only.
- [ ] Offer every declared equivalent-path transcript as a selectable reference.
- [ ] Architecture test: no sum, mean, score, or distance figure is exported by the overlay
  module; snapshot the line format.
- [ ] Automated run: the overlay renders offline for all 256 scenarios from their fixtures.

## 3. Rapid-cycle rehearsal

- [x] Extend the scenario schema with `rapidCycle` decision points: objective id, window, directive
  line (≤160 chars) with source locator, cycle cap (3–6). Reject recognition objectives at build.
  `ScenarioRapidCycle` in the scenario types, validated by `validateScenario`, which refuses an
  undeclared objective, a directive over 160 characters, a cap outside 3 to 6, and a recognition
  objective, named by the convention every lesson follows (its id leads with "recognize"). The
  author guide documents it. No scenario declares one yet, and the cycle itself is next.
- [x] Implement the cycle on top of the existing rehearsal branch; assert the restored state hash
  equals the original tick's hash. Each cycle calls the existing `rehearseFromDecisionPoint`, which
  rebuilds the run's exact state at the decision tick; `rapidCycleStatus` reads whether the
  declared action landed inside the window, the route pauses the moment it is decided, and the
  cockpit shows either the result or the directive with "Try the cycle again" until the cap, then
  the source. A test holds that the engine reaches an identical state at the decision tick on
  every run, which is what makes each cycle start the same.
- [x] Hide the mechanism in Unassisted mode; show the evidence sentence with its citation in the
  rehearsal briefing. The debrief never offers rapid cycle when guidance is unassisted, and its
  offer carries the one ILCOR 2024 sentence at very low certainty, claiming no more.
- [ ] Author rapid-cycle decision points for every scenario whose objectives include a timed
  protocol step, starting with cardiac arrest, anaphylaxis, malignant hyperthermia, LAST, and
  status epilepticus across modules; register each directive line with the tutor-rule maturity.
  Started: both persistent VF lessons (anesthesia and emergency medicine) declare compressions
  within 20 seconds of their scheduled VF event, from the first step of each one's cited algorithm. A rapid-cycle point restores a fixed decision tick, so it fits
  only a lesson whose crisis is scheduled. Malignant hyperthermia is not: its trigger is latent,
  and rigidity begins whenever the learner's volatile reaches the patient (tick 2,400 on the
  expert path, later on others), so a fixed tick would restore the wrong moment for most
  learners. The first authored points should go on scheduled-event lessons, or the format needs
  an event-relative decision point (for example "90 seconds after the first modeled rigidity").
- [ ] Build test: every timed-protocol objective has at least one rapid-cycle decision point.

## 4. Reasoning notes

- [x] Add the note control to action confirmation and pause; store notes in the transcript
  sidecar keyed by tick; assert the transcript hash is unchanged. A "Note your reasoning" field
  in the session menu, present but never prompting, attaches up to 280 characters to the current
  simulated moment. Notes live in their own store (`src/platform/session/reasoning-notes.ts`),
  never in the transcript, so its hash cannot change; a new session starts with none.
- [ ] Show notes in the debrief analysis phase beside attribution; exclude from summary export;
  include in full export only after preview. Mostly done: the analysis phase shows "What you
  wrote at the time", each note beside the action it was written next to and the engine's
  attribution for the change that followed. Each one-second history sample now keeps its
  attribution, and the route's lookup answers for the moment asked about, or with nothing,
  instead of returning the latest attribution for every tick; that also makes the debrief's
  existing ranked contributors read from the episode's own time. Not yet: the full-export
  option, since notes are in no export today.
- [x] Extend the report-context structural exclusion test to notes. `tests/unit/reasoning-notes.test.ts`
  holds that the transcript, the reporting package, and the report-context collector never
  reference the notes store, and the debrief receives notes as a prop rather than reading session
  state, keeping the private-tutor boundary intact.

## 5. Spaced return and progress file (curriculum requirements)

- [ ] Compute weakest-then-oldest across all modules from the tutor's local evidence; one
  suggestion; 7-day dismissal; interval schedule 7 → 14 → 28 → 56 days labelled as convention.
  Mostly done: `catalog/spaced-return.ts` ranks practised scenarios weakest-then-oldest among
  those past their interval (7 days after one day of practice, doubling per further separate day,
  capped at 56, labelled as a convention). Each module's index shows at most one "worth coming
  back to" suggestion with its duration, the objectives behind it, and a 7-day hide, read after
  mount so the prerendered page still hydrates. Remaining: each module's index suggests from its
  own scenarios only. The practice history records scenario ids without a module, so one
  suggestion across all sixteen modules needs either a module field on each attempt or a
  cross-module lookup on a page that can afford to load every catalog.
- [ ] Define the progress file schema; export with both statements; import with replace/merge and
  recomputation report. Mostly done: the practice-history export is now progress file version 2.
  It carries the not-for-clinical-use, not-clinically-reviewed, and simulated-practice-not-
  clinical-time statements and each attempt's calendar day instead of its timestamp. Version 1
  files still import. `/privacy` offers merge (duplicates skipped) or replace (confirmed), and
  reports what it added and every objective whose latest status moved, from what to what.
  Remaining: the file does not yet carry goal-suggestion dismissals or reasoning notes. The notes
  do not exist yet, and the dismissals live in their own store.
- [ ] Tests: round trip, newer-map recomputation, identifier/device/sub-day timestamp absence,
  zero network requests. Round trip, status-change reporting, duplicate-safe merge, version-1
  compatibility, and the absence of identifiers, device fields, and sub-day timestamps are in
  `tests/unit/practice-history.test.ts` and `tests/ui/practice-history-controls.test.tsx`.
  Recomputation under a newer competency map waits for a map; status today is the latest
  outcome per objective. The no-network claim rests on the existing offline suite.

## 6. Documentation and labels

- [ ] Document each mechanism in the educator pages with what it is for and what it does not
  claim; add the ILCOR 2024 and Chamberland 2015 citations to the sources register.
- [ ] Update the limitations register: notes are not assessed, overlays are not scores, rapid
  cycle evidence is low certainty.
