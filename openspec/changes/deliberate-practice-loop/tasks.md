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
  Eleven lessons now declare twelve points, each on a scheduled crisis event, each inside the
  window its own objective measures, and each traced to the step its cited source puts first:
  compressions in both persistent VF lessons and PEA arrest; the 50 microgram IV epinephrine
  action in perioperative anaphylaxis; benzodiazepine then lipid in LAST, in checklist order, so
  the offer takes seizure suppression first; the jaw thrust with CPAP in laryngospasm; the help
  call in pneumothorax under positive pressure, high spinal, bronchospasm and emergency
  medicine's tension pneumothorax; and source control in venous air embolism. Two lessons chose
  the help call over the more obvious step because assessment and decompression share one engine
  action type there, so a cycle on the decompression could not tell the two apart - which is the
  kind of thing only the behavioural test makes visible. That sharp edge is now fixed rather than
  worked around: a point may declare `actionPayload`, the fields the landing action has to carry,
  and both pleural lessons declare the decompression step beside their help call. Sixteen points
  across thirteen lessons: the arterial artifact's cuff check and the capnography cross-check are
  authored the same way, each naming the payload that separates it from the repair that follows,
  and the blood-bank release needs no matcher because it has an action type of its own. The
  coverage test now demands a matcher whenever a lesson's expert path sends that action type more
  than once, so the next author cannot reintroduce the ambiguity by hand.
  Twenty-four points across twenty lessons now, the last seven being the hypnotic-line inspection
  in awareness under paralysis, the fresh-gas bridge and the absorbent replacement in
  circle-system rebreathing, the coagulation panel in dilutional coagulopathy, breath delivery in
  opioid-induced ventilatory impairment, the jaw thrust in post-extubation obstruction, and
  bringing the remifentanil down when the stimulus falls. Two of those taught something about the
  matcher. The opioid lesson's whole error is oxygen without breath delivery, so its point
  matches `delivering: true` as well as the oxygen: a cycle that accepted any ventilator action
  would have accepted precisely the mistake. And the maintenance lesson matches the drug rather
  than a rate of zero, because its objective accepts a reduction or a stop, and a cycle demanding
  zero would tell a learner who reduced that they had missed. Every directive line is now a `tutor-rule` maturity subject at its lesson's
  own version and status, and registering them had consequences worth recording. The release gate
  refused the build until each one also had a preview evidence rule and appeared on the public
  review-status page, which is the right refusal: a maturity record for an item no rule judges and
  no surface lists is a record with no owner. So `publication.ts` now carries a `tutor-rule` rule
  (its locator is its source, its bounded window and 3-to-6 cap are its limitation, and it is in
  scope while it names the step rather than ranking the learner), `/content-review` lists every
  directive under its lesson, and governance counts them as six more unreviewed clinical items:
  277 rather than 271, all still unsigned. Four separate places were building these catalogs and
  only one passed anesthesia its extra subjects; they share `scripts/module-maturity.ts` now.
  Still open, and each for a stated reason. Malignant hyperthermia cannot carry one: its trigger
  is latent, and rigidity begins whenever the learner's volatile reaches the patient (tick 2,400
  on the expert path, later on others), so a fixed tick would restore the wrong moment for most
  learners; it needs an event-relative decision point (for example "90 seconds after the first
  modeled rigidity") the format does not have. Status epilepticus, in both modules, measures its
  objectives by sequence rather than by a clock, so there is no authored window to rehearse
  against; giving it one would be inventing a measure the lesson does not make. The remaining 41
  timed measures across 17 anesthesia and emergency-medicine lessons are ordinary authoring work.
- [ ] Build test: every timed-protocol objective has at least one rapid-cycle decision point.
  Not yet: 12 of the 47 timed measures in the catalogue are rehearsed, so a build gate would fail
  every build. Eleven lessons with timed measures remain, and the inventory behind them is in this
  change's own history: of the 22 lessons that measure a window, malignant hyperthermia cannot
  carry a fixed-tick point and the rest are ordinary authoring. What exists is `tests/unit/rapid-cycle-coverage.test.ts`, which holds every point
  that is authored against its own lesson: the declared action has to land inside the declared
  window on that lesson's expert reference path, the locator has to carry a year one of the
  lesson's own sources carries, the directive may not read as a verdict on the learner, and the
  set of lessons declaring points has to equal the set the test covers, so a new point cannot be
  added without one. The validator now also refuses an `atTick` the timeline does not schedule,
  which is what stopped malignant hyperthermia being authored by hand into the wrong moment. The
  gate this task asks for lands when authoring reaches the last schedulable lesson.

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

- [x] Document each mechanism in the educator pages with what it is for and what it does not
  claim; add the ILCOR 2024 and Chamberland 2015 citations to the sources register.
  `/for-educators` carries "The practice mechanisms, and what each one does not claim": the four
  that exist (rapid-cycle rehearsal, reasoning notes, spaced return, the progress file), each with
  a paragraph of what it does and a paragraph of what it refuses to claim, and a first line saying
  that the blind draw and the expert overlay are designed and not built, so nothing in the
  interface offers them. Both citations are in the register, verified through NCBI E-utilities on
  2026-10-27: the ILCOR review (PMID 38757054) as nine simulated studies at very low certainty
  with no patient outcome, and Chamberland 2015 (PMID 25626750) with the honest note that the
  group which gained most heard worked examples and answered prompts, and the note field does
  neither. Writing this surface tripped the learner-claim guard on a bare "score" inside a
  sentence denying it; the prose was reworded rather than the guard loosened.
- [x] Update the limitations register: notes are not assessed, overlays are not scores, rapid
  cycle evidence is low certainty. Two entries in `limitations/shared.ts`, which is the register
  for properties of the simulator rather than of a specialty, both with `briefIn: []`, so the
  per-scenario limitation manifests and the append-only report catalog are untouched:
  `rapid-cycle-evidence-is-very-low-certainty` and `reasoning-notes-are-never-assessed`. There is
  no overlay entry, because there is no overlay; it belongs with section 2, not here.
