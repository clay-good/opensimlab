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
