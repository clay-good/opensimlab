# Contributing to Open Sim Lab

Open Sim Lab accepts code, documentation, evidence, accessibility, and fictional scenario work.
Every contribution must preserve the product boundary: this is educational rehearsal, never a
calculator, real-patient tool, or clinical decision aid.

## Before you start

Read [governance](GOVERNANCE.md), the [scenario author guide](docs/scenario-author-guide.md), and
the [evidence-brief template](docs/evidence-brief.md). Security problems follow
[SECURITY.md](SECURITY.md), not a public issue. Suspected educational errors follow
[CORRECTIONS.md](CORRECTIONS.md).

The browser-only proposal form described in the catalog specification is not implemented yet.
Until it exists, contributions require a local checkout and pull request.

## Make a change

1. Open the structured **Change or scenario proposal** issue form describing the learner value and scope.
2. For clinical content, write the evidence brief before numerical behavior.
3. Implement the smallest coherent change, including sources, limitations, tests, and maturity
   impact. Never copy proprietary question-bank, simulator, table, figure, or monitor content.
4. Run `npm ci` and `npm run ci`.
5. Open a pull request that names the evidence, verification, limitations, clinical-review domains,
   and any human or automated generation used.

Scenario volume earns no shortcut. Each scenario independently needs completion, training-value,
authored-defaults, hazard, state-space, fixture, accessibility, offline, and review evidence before
it can count as playable. Automated drafting is contribution provenance, not source verification or
clinical review.

Contributions are accepted under the repository's MIT license. Third-party material must have a
compatible redistribution record; a citation supports a fact but does not license copied prose or
media. Never commit credentials, environment files, real clinical data, raw reports, private
reviewer correspondence, or identifiable learner data.

Maintainers may narrow, request evidence for, or decline a change. Clinical status is assigned only
through the version-bound process in [GOVERNANCE.md](GOVERNANCE.md).

## Check a pharmacology parameter

This is the most useful contribution that needs no clinical credential: every pharmacology
parameter is pending an independent second-source check by someone other than its transcriber.
The [verification queue](https://opensimlab.com/verification-queue) lists each one with its
primary locator and the second sources accepted for its model.

Add a record to the `checks` array of the model's `transcription` block in
`src/modules/anesthesia/pharmacology/models/<model>.ts`:

```ts
{
  modelId: 'propofol-marsh-1991', parameter: 'v1', valueChecked: 15.96, unit: 'L',
  contentVersion: '<MODEL_SET_REVISION from registry.ts>',
  primaryLocator: '<as given on the queue>',
  secondSource: { kind: 'open-reference-implementation', citation: '<full citation>',
    locator: '<table, page, file, or line>' },
  checker: { name: '<your name>', statedQualification: '<as you would state it>' },
  date: '<YYYY-MM-DD>', maintainerConfirmed: false,
}
```

Leave `maintainerConfirmed` false: a maintainer opens your second source and sets it. If the
second source disagrees, add a `discrepancy` describing what differs instead of changing the
value; that opens a correction rather than a verified record. No contact detail is needed, and a
check is never a clinical review. Rules: `src/modules/anesthesia/pharmacology/verification.ts`.

## Translate the interface

The interface, educator documentation, and root prose are translatable; a module's clinical
content — each lab's steps, model limits, spoken state, waveform descriptions, and scenario
framing — stays English until a clinically reviewed translation exists, and the catalog refuses a
clinical key.

A locale catalog is a JSON object: a `locale` (such as `es` or `pt-BR`), a `translators` array of
the names behind it, a `provenance` of `"human"`, and a `messages` object mapping each English key
to its `text` and the `sourceHash` of the English it translated. A catalog with no named
translator, or any `provenance` but `human`, is refused — a machine-seeded catalog has no value
here, because nobody reviewed it. The checks live in `catalogProblems`
(`src/platform/i18n/catalog.ts`) and run in the build.

Before you commit, check your work in the browser at
[`/translation-coverage`](https://opensimlab.com/translation-coverage): drop the catalog file in
and it shows the coverage, the same shipping checks the build runs, every missing or stale key, and
a sample render with placeholders filled. Everything there runs locally; nothing is uploaded. A
locale is offered in the language selector only at full, non-stale coverage, and only once those
checks pass. The English keys are in `src/platform/i18n/messages*.ts`, split by surface; run
`npm run ci` to see the coverage report the build publishes to
[`/translation-status`](https://opensimlab.com/translation-status).
