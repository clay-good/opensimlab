# Open the pharmacology verification queue to the public

## Summary

Every pharmacology parameter in the product is transcribed by hand from its primary publication,
and every one is marked pending its independent second-source check, because that check must be
done by a different person than the transcriber and there is one person. The README says so. The
model detail panels say so. Nothing invites anyone to do the check, tells them how, or shows them
what is left.

This change adds a public verification queue: a page listing every parameter awaiting its check,
with its primary locator, the acceptable second sources, and the exact procedure, and a path for a
qualified volunteer to submit a check that is recorded as a check and nothing more. It also
implements the citable-release requirement the adoption capability already states — a citation
file and an archived release identifier — because a volunteer who checks a value is citing a
specific version of it.

## Why

- **The blocker is people, and the product hides the work from them.** A pharmacologist with an
  afternoon could verify a model's parameters against the paper's own table. Today they would
  have to find the source file, read the transcription record format, and guess what "verified"
  requires. The queue makes the task one page long.
- **Verification is cheaper than review and it is the gate the product is stuck on.** Clinical
  review needs a credentialed clinician to take professional responsibility for content. A
  second-source check needs someone able to read a table in a pharmacokinetics paper and compare
  numbers. The project should ask for the cheaper thing it can actually get, and keep the two
  clearly separate.
- **"Second source" is already defined.** The pharmacology capability names what counts: the
  paper's own erratum or corrigendum, an independent published implementation, or an open
  reference implementation. The queue needs only to list them per parameter.
- **A checked value must be a checked version.** The adoption capability requires a citation file
  and a persistent identifier per release; neither exists. A verification record that names
  "the propofol Eleveld file" without a version is a record of nothing.

## What changes

- Publish `/verification-queue`: every parameter with no verified record, grouped by model, with
  the primary source locator, the acceptable second sources for that model, the procedure, and the
  headline count first with the list behind a disclosure.
- Define the verification record a volunteer submits: parameter, value checked, second source and
  its locator, checker's name and qualification as they state it, date, and the content version
  checked; and the rule that a check is recorded only when the checker is not the transcriber.
- Route submissions through the existing report channel under a new category, or by pull
  request, with the same untrusted-data handling as every report.
- Add `CITATION.cff`, archive each release with a persistent identifier, and show the suggested
  citation in the about panel, as the adoption capability requires.

## Explicit non-goals

- A check is not a clinical review. It changes a parameter's status from pending to verified
  and nothing else; it signs no content, covers no domain, and advances no maturity label.
- No automatic acceptance. A submitted check is evidence a maintainer compares against the
  second source before recording it.
- No contact collection. The checker's name goes in the record because it is a record; no email
  or account is requested.

## Success measures

- The queue lists every unverified parameter, and the count on it equals the count of unverified
  records in source, verified by a test.
- A submitted check with a second-source locator that resolves to the named source is recorded
  within the five-working-day acknowledgement window the governance capability already sets.
- `CITATION.cff` validates, each release is archived with a persistent identifier, and the about
  panel shows the citation offline.
