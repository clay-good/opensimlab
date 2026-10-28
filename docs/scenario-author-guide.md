# Scenario author guide

Start with the decision a learner needs to rehearse, not a diagnosis title or an interesting number.
A scenario must require a fictional evolving state, incomplete information, action, consequence,
reassessment, and causal debrief. If a calculator, score, checklist, lookup, or static answer teaches
the whole objective, it does not belong in the playable catalog.

## Authoring order

1. Complete the [evidence brief](evidence-brief.md).
2. Declare stable identity, learner level, environment, regions, fidelity, prerequisites, 2–5
   observable objectives, seed policy, stop condition, and bounded outcomes.
3. Record every starting setting, hidden trait, delay, range, stocked action, and tutor threshold in
   authored defaults with source and educational effect.
4. Define at least 3 accepted actions, 2 meaningful choices/timings, refusals, consequences, and
   event-log evidence. Physical procedures represent intent or modeled completion, not hands-on
   skill.
5. Write limitations and the full hazard analysis before polishing the interface.
6. Add expert, common-error, recovery, and no-action transcripts plus every state-space case.
7. Add deterministic, accessibility, phone, offline, performance, tutor, and debrief tests.

Do not reveal a diagnosis when recognition is an objective. Do not invent precision, silently reuse
browser defaults, or copy another product's behavior. Use shared capabilities and preserve honest
fidelity. A planned title remains distinct from a playable scenario until every public audit passes.

## Register the worked example

A lesson's worked example is data, not a hook in the shared cockpit. Add the entry to
`src/modules/<module>/demo/demonstrations.ts`:

```ts
{ id: 'YourLesson', supports: supportsYourLessonDemonstration,
  actionType: 'your-lesson-response', step: (r) => yourLessonDemonstrationStep(r?.yourLesson) },
```

The module's route (`src/routes/modules/<module>.tsx`) already passes that array to the cockpit
through `ClinicalModuleConfig.demonstrations`, so nothing else needs wiring, and add the lesson's
`moduleId:scenarioId@version` key to `src/modules/anesthesia/demo/worked-example-keys.ts` so the
prebrief offers it.

Register the lesson's action tray the same way, in `src/modules/<module>/trays.ts`:

```ts
{ id: 'YourLesson', actionType: 'your-lesson-response', supports: supportsYourLesson,
  assessment: (r) => r?.yourLesson, Component: YourLessonTray as LessonTray['Component'] },
```

Use the same `id` in both files — that is how the cockpit knows which tray a worked example is
driving. The tray gets `guidance`, `scenarioVersion`, `demonstrating` and `onAction` from the
cockpit; set `opensSource: true` if it shows a source link.

Do not add a `use<Lesson>Demonstration` call to `Cockpit.tsx` or a tray block to
`ActionCockpit.tsx`. Every lesson written into either puts its narration and controls in the chunk
all sixteen modules download, which is what `tests/unit/module-chunking.test.ts` guards. Older
lessons still written out there are ones that read more than the resuscitation snapshot; a new
lesson should not join them.

## Add pause points for a facilitator (optional)

A scenario may declare `pausePoints`: moments where a facilitator running it with a group stops
the clock and asks the room one question. Each has an `id`, exactly one of `atTick` or `when`
(the same one-comparison predicate a timeline event uses, such as `"spo2Percent < 92"`), a
`question` of at most 200 characters, and the `region` it is about (`monitor`, `analysis`, or
`actions`). Write a question for the room, not an instruction, and never one that names the
diagnosis the lesson leaves open. Pause points change nothing about the patient, and they appear
in the scenario's facilitator guide; `validateScenario` refuses a duplicated id, both or neither
of `atTick` and `when`, a predicate the grammar rejects, or a question over 200 characters.

## Declare rapid-cycle decision points (optional)

A scenario may declare `rapidCycle` points for timed protocol steps only: a defibrillation, a
drug dose, a help call. Each has an `id`, the `objectiveId` it serves, the decision point
`atTick` the rehearsal restores, the `windowTicks` the expected action must land in, a
`directive` of at most 160 characters shown when the window closes, the `sourceLocator` it comes
from, and a `cycleCap` from 3 to 6. A recognition objective (one whose id leads with
`recognize`) is refused, because telling a learner what to notice is the cue leakage the hazard
analysis forbids.

A cycle restores one fixed tick, so `atTick` must be a tick the timeline schedules. The
validator refuses any other, with the scheduled ticks listed: a crisis the learner's own
actions time — latent malignant hyperthermia, where rigidity begins whenever the volatile
reaches the patient — would restore the wrong moment for most learners, and needs an
event-relative decision point the format does not yet have. An event at tick 0 is the one
exception: the engine has to step once before that state exists, so its point opens at tick 1.

Where one action type serves more than one step — a pleural lesson that assesses and
decompresses through `pneumothorax-response`, an arterial lesson that cycles the cuff and levels
the transducer through `arterial-line` — declare `actionPayload` with the field that makes this
action the step. Matching on the type alone is worse than having no cycle there: it would tell a
learner they had decompressed the chest when they had only looked at it. The coverage test
requires a matcher whenever the lesson's own expert path sends that type more than once.

Name an `actionType` the lesson actually sends. The engine drops an unknown action silently, so
a typo leaves a cycle that can only ever end in its directive.
`tests/unit/rapid-cycle-coverage.test.ts` holds every declared point against its lesson's expert
reference path: the declared action has to land inside the declared window, the locator has to
carry a year one of the lesson's own sources carries, and the directive may not read as a verdict
on the learner.

## Publish quality evidence

Keep records beside the scenario and register them in
`scripts/quality-records.ts`, the build-only shared registry. Each entry is an envelope with `moduleId`, `kind`, and
`record`. The four kinds are `training-value`, `authored-defaults`, `scenario-hazard`, and
`state-space-verification`; payloads follow their published `/catalog/*.schema.json` contracts.
Bind `scenarioId` and `contentVersion` explicitly in each payload. Do not derive the version from
the current scenario: a content update must trigger reconsideration of its evidence.

Both catalog generation and release checking validate the entire registry before using any
record. Unknown identities, stale versions, duplicate kinds, malformed payloads, duplicate default
IDs, incomplete hazard coverage, and an incomplete or unpassed verification matrix are rejected.
Records are optional while work proceeds; absence stays visibly missing. Do not fabricate a
complete matrix to publish the other three records.

Accepted payloads appear inside the scenario's public quality audit. They must contain only
publishable authored facts and evidence references, never patient information or private reviewer
data. References are inert text: ingestion neither fetches a source nor proves a referenced test
or review occurred. Structural validation does not award clinical review or bypass the completion
contract. Review the cited evidence, distinguish authored conventions from sourced findings, and
leave unverified work open. Whitespace-only strings technically satisfy the existing schemas'
`minLength` rule; they are not meaningful authoring evidence.

Run `npm run catalog`, the relevant tests, and `npm run ci` after changing records. The
hypocalcemia records demonstrate partial publication with honest missing matrix evidence; synthetic
all-passing validator fixtures belong only in tests. Capability, source, and review changes still
require an evidence review even when the content version is unchanged. Register a literal
[dependency receipt](quality-evidence-receipts.md) before either build consumer may use supplied
records. Changed or missing declared dependencies stop publication; receipts never refresh as a
side effect of building.
