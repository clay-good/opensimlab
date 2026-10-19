# Design: a queue, a record, and a version to cite

## 1. The queue page

`/verification-queue` is a trust document under the clinical-governance rule: the finding first,
the evidence behind a control. The finding is two figures — parameters verified, parameters
pending — and the evidence is the list, grouped by model, each entry showing:

```text
Eleveld 2018 propofol · V1 · 6.28 L (reference individual)
  primary: Eleveld et al. Br J Anaesth 2018;120:942–59, Table 2, with the 2018 corrigendum
  second sources accepted: the corrigendum; an independent published implementation;
                           an open reference implementation
  status: pending independent check
  content version: pharmacology model set r<version>
```

The procedure is one paragraph on the page: open the primary locator, confirm the value as
transcribed, open a second source from the accepted list, confirm it agrees, note any
discrepancy, and submit the record. Where a parameter has a known corrigendum the queue says so,
because that is the case where a naive check against the original table would "confirm" a wrong
number.

## 2. The verification record

```text
{ modelId, parameter, valueChecked, unit, contentVersion,
  primaryLocator, secondSource: { kind, citation, locator },
  checker: { name, statedQualification }, date, discrepancy?: string }
```

The record is accepted into source by a maintainer only when: the checker's name differs from the
transcriber's; the second source is of an accepted kind for that model; the maintainer has
opened the second source and confirmed the agreement or the discrepancy; and the content version
matches the current model-set revision (a check of an older version is kept as history and the
parameter stays pending). A discrepancy opens a correction under the existing corrections
process rather than a verified record.

The transcription record the pharmacology capability already requires gains the checker fields,
so "verified" in the model detail panel means exactly one thing and the test that marks unverified
parameters reads the same record.

## 3. Submission paths

- **Report channel.** A new category, `parameter check`, with the record fields as structured
  inputs rather than a free note, inside the existing 32 KB bound, same Turnstile, same quotas,
  same untrusted handling. The report preview shows exactly what is sent.
- **Pull request.** The record file added beside the model file. The contribution guide shows
  the format.

Both paths are quoted data until a maintainer confirms the second source. Neither path changes a
status on receipt.

## 4. Citation and archive

`CITATION.cff` at the repository root names the project, authors, licence, repository, and the
persistent identifier of the archived release; each release is archived with its own identifier
and a concept identifier for the project; the about panel renders the suggested citation for the
running build, offline, from the build-time release identity. A verification record names the
content version it checked, and that version is what the citation resolves to.

## 5. Alternatives considered

- **Treating a volunteer check as review.** Rejected: the governance capability separates flagging,
  checking, and signing, and the product's credibility rests on not blurring them.
- **Automated cross-check against an open implementation at build.** Rejected as the only path:
  it is one acceptable second source among three, it cannot read a corrigendum, and the capability
  requires a named person. It may assist a maintainer's confirmation.
