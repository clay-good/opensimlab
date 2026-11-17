# Implementation plan: deliberate-practice loop

Spec-only until checked. Every mechanism here is a learner-operated control; none starts on
its own, none changes the engine, and none produces a score.

## 1. Blind draw

- [ ] Add a draw operation to the catalog that selects from a pool (module, path, or all
  installed) using the session seed, with an "unseen only" filter defaulting on.
- [ ] Define the withheld field set and the pre-start field set; render the pre-start briefing
  from the latter only. Record `blindDraw: { pool }` in the transcript.
  Blocked, and worth stating before anyone starts the draw: three of the five fields the design
  shows before start do not exist. A scenario declares id, version, maturity, title, author,
  licence, estimated minutes, difficulty, objectives, clinical review and limitations. There is no
  content note, no environment and no fidelity class anywhere in the schema, and
  `grep -rn "contentNote\|fidelity"` over `src/` finds none. The content note is the one that
  matters: the design shows it precisely so a learner can decline a distressing case without being
  told what it is, and this change's own spec says a drawn scenario carrying one must show it
  first. A blind draw shipped without it would spring exactly the harm the note exists to prevent
  - on a catalogue that includes paediatric arrest, obstetric haemorrhage and end-of-life
  oncology. So the draw is not blocked on its own logic, which is small, but on a scenario field
  and the per-lesson authoring behind it.
  The field now exists. `metadata.contentNote` is one sentence of at most 160 characters, shown
  at the top of the briefing above the fiction contract and carried as its own facilitator-guide
  section. The validator enforces the length and refuses a note that repeats a distinctive word
  from its own title, which is the way this goes wrong: the note is shown while the title is
  withheld, so a note naming its lesson defeats the point of showing it.
  Nine lessons carry one, chosen by a rule narrow enough to check rather than argue about: a
  cardiac arrest, a death, or the resuscitation of a newborn or a child is that lesson's own
  modelled course. Not a risk it hands off, which is why the amniotic-fluid-embolism lesson has
  none, and not an arrest that happened before it starts, which is why post-arrest temperature
  control has none. The set is the two persistent-VF lessons and PEA arrest, the paediatric
  bradycardic arrest and foreign-body obstruction, maternal cardiac arrest and the maternal-to-
  neonatal handoff, and neonatal bradycardia and ineffective newborn ventilation.
  `tests/unit/content-note.test.ts` pins that set by name in both directions, so a lesson cannot
  join it without its course being read or leave it without someone noticing that a warning
  stopped being shown. The environment and fidelity class the design also lists remain unwritten;
  neither gates a learner's consent, so neither blocks the draw.
  What is left before the draw can ship: the other 247 lessons have not been read for this
  purpose, and the guide, the gate and the author guide all say so rather than letting absence
  read as an assurance. A blind draw over the whole catalogue needs that survey finished first,
  because the draw is the one surface where a learner has nothing else to judge by.
- [ ] Test over every scenario with a recognition objective that no withheld field reaches the
  DOM, the accessible tree, the document title, or the URL before the reveal condition.
- [ ] Test reproducibility of the draw from the transcript seed and pool.

## 2. Expert overlay

- [ ] Replay the expert fixture through the replay worker under the learner's seed, engine, and
  content version; compare against the fixture's declared tolerance and withhold on mismatch.
  **Unblocked, and half built.** The earlier reading of this line was that it needed a person to
  choose a tolerance, because no fixture declares one - all 256 export only `scenarioId`,
  `contentVersion`, `seed`, `noAction`, `expert`, `commonError` and `recovery`. That was the wrong
  conclusion. The engine is deterministic, so what a different seed does to an expert path is
  something to measure, not to decide.
  Measured: replaying all 39 closed-loop lessons' expert transcripts under other seeds moves the
  trace by at most 0.9 bpm, 6 mmHg systolic, 2.8 diastolic, 3.8 mean, 2.7 end-tidal CO2 and 0.1%
  saturation. `EXPERT_TRACE_TOLERANCE` in `src/modules/anesthesia/debrief/expert-trace.ts` sits
  above those and far below any difference that would be a different patient, and
  `tests/unit/expert-trace.test.ts` re-runs the whole measurement on every CI run and fails if the
  engine ever moves further than is declared. The number stays evidence rather than becoming
  folklore.
  It is one shared set rather than a field on each fixture, because the measurement found the
  lessons alike, and 256 separately justified numbers is 256 numbers nobody can defend. A lesson
  that genuinely needs a wider bound can carry its own when one appears.
  `expertTraceWithinTolerance` is the rule the task asks for: it compares a replayed trace against
  the recorded one and says which parameter moved too far and when, so the overlay has a line to
  print when it withholds. A trace of a different length or sampled at different ticks is refused
  at ANY threshold, because that is not a looser comparison but a different run - which is what a
  changed content version or a changed engine looks like, and the case that matters most.
  The wiring is now done too. `npm run expert-paths` writes
  `src/modules/anesthesia/debrief/expert-paths.generated.ts`: the 39 closed-loop lessons as
  REPLAYABLE actions with the seed they were recorded under and the trace that recording produced.
  It is a second generated file rather than a reuse of `reference-paths.generated.ts`, and the
  reason is the bundle: that one is written for the facilitator guide, carries all 256 lessons in
  7,400 lines of labels and formatted payloads a person reads, and the debrief lives in the
  cockpit chunk every learner downloads. Pulling it in there would ship 217 lessons' prose to draw
  39 lessons' traces.
  At runtime the debrief asks the replay worker to run those actions under the LEARNER's seed and
  region, and `expertTraceWithinTolerance` decides whether what came back is still the same
  patient. `tests/unit/expert-paths.test.ts` recomputes every path from the fixtures, so a
  committed file that nobody regenerated fails the build rather than being drawn.
- [x] Render both traces and action marks on the existing debrief axes; list per-objective tick
  differences and order agreement for order-sensitive actions only.
  `ExpertOverlayPanel` draws four parameters - heart rate, mean pressure, saturation, end-tidal
  CO2 - with the learner's trace solid and the reference run's dashed on the same axis, both runs'
  accepted actions on one list in time order, and one line per objective saying when each run met
  it and the difference in seconds.
  Two refusals are the substance of it. A difference is printed only where BOTH runs met the
  objective: a gap between a moment and nothing is not a gap, and printing one would make an
  unmet objective read as a slow one. And there is no figure anywhere saying how close the two
  runs were - the panel's own closing line says there will not be one, because two runs can
  differ for reasons that are not better or worse and a single number hides every one of them.
  ORDER AGREEMENT IS NOT RENDERED, and that is not an omission to fix later. No scenario declares
  which of its actions are order-sensitive; the schema has no such field. Reporting order
  agreement without one would mean inferring it from the reference run, which would turn one
  authored path into the order - exactly the claim the equivalent-paths requirement exists to
  prevent. It needs a declaration before it needs code.
- [ ] Offer every declared equivalent-path transcript as a selectable reference.
  Blocked on the same thing order agreement is blocked on, and worth stating once for both. The
  requirement this serves says "WHEN regional guidance or expert review identifies multiple
  acceptable action sequences" - and nothing in the catalogue declares one. The scenario schema
  has no field for an equivalent path, and the three transcripts each lesson ships are an expert
  path, the error the lesson exists to make visible, and the recovery from it: none of those is a
  second acceptable way through.
  So the selectable reference needs an authored declaration before it needs code, and inventing
  the alternatives here would be worse than leaving the control out - it would turn this project's
  guess into the second right answer. What exists today is honest about being one path: the
  overlay's own introduction says the reference run is one way through the lesson and not the only
  one.
- [x] Architecture test: no sum, mean, score, or distance figure is exported by the overlay
  module; snapshot the line format. `tests/arch/expert-overlay-has-no-score.test.ts` holds three
  things: no export whose name is a score, total or distance; no aggregation in the module's own
  code, with comments stripped first so a rule cannot be satisfied by describing it; and an
  exhaustive list of every numeric field the module declares - three moments and one difference
  between two of them. The failure mode here is not a bug but the slow, reasonable-looking
  addition of one number that says how close the runs were, and that test is what makes such an
  addition visible in a diff.
- [x] Automated run: the overlay renders offline for all 256 scenarios from their fixtures.
  `tests/unit/expert-overlay-catalogue.test.ts` builds it for every lesson from its own fixture,
  with no network and nothing stored. The 39 with a modelled patient are replayed under a
  DIFFERENT seed from the one they were recorded with - which is the case the overlay exists to
  survive, since an assignment link or a blind draw gives a learner their own patient - and all 39
  come back inside the measured tolerance and draw.
  One measurement decided where the data lives. Importing the 39 paths eagerly put the anaesthesia
  module's graph at 576.2 KB gz against a 575 KB guard whose own comment says raising the number
  is not the answer: measure and move the boundary. So the panel loads them with a dynamic import
  when a debrief asks for one. They are data for a panel that appears after a run, and the cockpit
  budget is measured on what a learner downloads to START one. The other 217 are refused with the reason that
  says why: the lesson has no modelled patient, and the reference path is in the facilitator guide
  instead. Either a trace or a reason; never a half-drawn panel.

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
- [x] Show notes in the debrief analysis phase beside attribution; exclude from summary export;
  include in full export only after preview. Done: the analysis phase shows "What you
  wrote at the time", each note beside the action it was written next to and the engine's
  attribution for the change that followed. Each one-second history sample now keeps its
  attribution, and the route's lookup answers for the moment asked about, or with nothing,
  instead of returning the latest attribution for every tick; that also makes the debrief's
  existing ranked contributors read from the episode's own time.
  The export is now there, and its shape follows from the constraint the first line of this
  section set: notes are not in the transcript and cannot be, because the transcript's hash is
  what makes a session replayable. So the file that carries them WRAPS the transcript rather than
  extending it - `{ kind, transcript, reasoningNotes }`, with the transcript object inside
  identical to the one the plain export writes. The file an instructor opens stays the file an
  instructor opens, and this one is additional.
  It is offered only when notes exist, and only behind a preview that prints every word of every
  note with the moment it was written at. That preview is the whole control: these are the
  learner's own words typed in the moment, nothing in the build can tell whether one of them names
  a patient, a colleague or themselves, and the warning says exactly that. Showing them the file
  before it exists is the only honest check available.
- [x] Extend the report-context structural exclusion test to notes. `tests/unit/reasoning-notes.test.ts`
  holds that the transcript, the reporting package, and the report-context collector never
  reference the notes store, and the debrief receives notes as a prop rather than reading session
  state, keeping the private-tutor boundary intact.

## 5. Spaced return and progress file (curriculum requirements)

- [x] Compute weakest-then-oldest across all modules from the tutor's local evidence; one
  suggestion; 7-day dismissal; interval schedule 7 → 14 → 28 → 56 days labelled as convention.
  `catalog/spaced-return.ts` ranks practised scenarios weakest-then-oldest among
  those past their interval (7 days after one day of practice, doubling per further separate day,
  capped at 56, labelled as a convention). Each module's index shows at most one "worth coming
  back to" suggestion with its duration, the objectives behind it, and a 7-day hide, read after
  mount so the prerendered page still hydrates.
  The module field this needed now exists, and building it found a live defect rather than only
  an obstacle. A scenario id is unique inside its module and not across the catalogue:
  `status-epilepticus` is one lesson in emergency medicine and a different one in critical care.
  The history keyed practice by scenario id alone, so practising either marked both complete,
  offered the other as a previous attempt, and made the one never opened due for a spaced return
  with no objectives under it. Each attempt now records its `moduleId`, the progress file is
  version 3 and carries it between devices, and `completedScenarioIds`, `previousScenarioAttempt`
  and the suggestion all match on module and scenario together. A record written before the field
  existed keeps `moduleId: null` and still matches by scenario id alone, so no existing learner
  loses practice on upgrade; a version 1 or 2 progress file still imports; and an unregistered
  module id is refused on the way in. The remaining bleed from those module-less records is closed
  from the other side: an attempt that shares a scenario id but declares none of that lesson's own
  objectives is not practice of it. `tests/unit/scenario-identity.test.ts` names the one shared id
  so a second cannot appear unnoticed, and holds that no two lessons share a scenario AND
  objective pair, which is what lets `objectiveStatus` and the import's duplicate check stay
  module-free and so keep reading an older file without reporting every status as moved.
  The suggestion now ranks across all sixteen modules, which is what this task asked for. The
  ranking itself needs no catalogue: the history carries module, scenario, objectives, outcomes
  and days, and that is everything the ordering uses. What it could not do is name a winner that
  is not this module's, so `src/platform/catalog/return-index.generated.ts` is the smallest
  derived view of the whole catalogue that lets any page name any lesson - module, scenario id,
  title, duration, and each objective's statement, and none of the physiology, timeline, branches
  or trays that make a scenario large. It is written by `npm run return-index` and held in step by
  `tests/unit/return-index.test.ts`, so a reworded objective cannot leave the suggestion quoting
  the old words. The panel takes no props now: it loads the index lazily, after mount, and only
  when this device has practice to rank, so a first-time visitor never downloads it. When the
  winner is another module's lesson the panel names that module and links into it.
  The cost is stated rather than hidden: the index is its own chunk at 273 KB raw and 49 KB
  Brotli, and it is precached like every other asset, because the offline promise is that every
  scenario works offline and prerender deliberately keeps no exceptions. That took the first-visit
  precache from 1,911 KB to 1,960.8 KB against a 2,048 KB budget - 87 KB of headroom left, down
  from 136 KB. The encoding is already at the floor: the same data as bare JSON is 48.1 KB Brotli,
  so there is no cheaper shape, only a smaller promise. If that headroom is needed later, the
  lever is to drop the objective statements (5 KB Brotli without them) and show what a lesson
  practises only when it is this module's - which costs the requirement its second clause.
- [x] Define the progress file schema; export with both statements; import with replace/merge and
  recomputation report. Done: the practice-history export is now progress file version 3.
  It carries the not-for-clinical-use, not-clinically-reviewed, and simulated-practice-not-
  clinical-time statements, each attempt's calendar day instead of its timestamp, and
  the module the lesson belongs to. Version 1 and version 2 files still import. `/privacy` offers merge (duplicates skipped) or replace (confirmed), and
  reports what it added and every objective whose latest status moved, from what to what.
  Version 4 carries a hidden spaced-return suggestion, as the calendar day it runs out and never
  as the stored millisecond: the file drops the time of day from every attempt precisely so it
  cannot place a learner at a moment, and a dismissal timestamp would put one straight back by
  saying when they last opened a module index. It is restored as the END of that day, because
  rounding down would quietly shorten a hide the learner asked for on the other device. A version
  1, 2 or 3 file still imports and simply carries no hide.
  The open question was whether this file should carry reasoning notes, and the decision is no -
  for a reason about THIS file rather than about notes. A progress file is moved between a
  learner's devices with no preview of its contents, and that is only defensible while everything
  in it is structured: an outcome, a scenario id, a calendar day. Nothing in it is free text, so
  nothing in it can name a person. Notes are free text, they belong to one session rather than to
  a history of outcomes, and they now leave the device through an export that shows the learner
  every word first. Putting them here would mean either a preview on this file too, or a file
  that quietly carries sentences nobody re-read.
  `tests/unit/practice-history.test.ts` holds the attempt to its five known keys and holds the
  writer to being unable to reach a note, so a later addition has to be argued for in a diff.
- [ ] Tests: round trip, newer-map recomputation, identifier/device/sub-day timestamp absence,
  zero network requests. Round trip, status-change reporting, duplicate-safe merge, version-1
  compatibility, and the absence of identifiers, device fields, and sub-day timestamps are in
  `tests/unit/practice-history.test.ts` and `tests/ui/practice-history-controls.test.tsx`.
  Recomputation under a newer competency map waits for a map; status today is the latest
  outcome per objective. The no-network claim rests on the existing offline suite.

## 6. Documentation and labels

- [x] Document each mechanism in the educator pages with what it is for and what it does not
  claim; add the ILCOR 2024 and Chamberland 2015 citations to the sources register.
  `/for-educators` carries "The practice mechanisms, and what each one does not claim": the five
  that exist (rapid-cycle rehearsal, reasoning notes, spaced return, the progress file, and the
  reference-run overlay), each with a paragraph of what it does and a paragraph of what it refuses
  to claim, and a first line saying that the blind draw is designed and not built, so nothing in
  the interface offers it. The overlay's own paragraph was written when it shipped rather than
  left for later: a page that lists what each mechanism refuses to claim is exactly the page that
  goes stale first. Both citations are in the register, verified through NCBI E-utilities on
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
