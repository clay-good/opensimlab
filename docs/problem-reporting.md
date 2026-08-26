# Anonymous problem reports

Every playable scenario inherits one small correction door. Practice remains local: the report
client cannot import session storage, transcripts, debrief data, practice history, or arbitrary
browser storage. It receives only explicit public metadata from the shared scenario route.

## What a learner sends

The dialog requires one category and permits an optional 160-character plain-text note. Before
sending, it shows the scenario id, exact content version, surface, simulated tick, and category.
The request also contains the application and engine versions, public practice region, canonical
scenario URL, and the single-use Turnstile token. The token is a transport credential, is never
shown in the preview or stored, and expires after 5 minutes.

Recent simulation context is off by default. If the learner chooses to include it, the dialog builds
and displays a bounded snapshot at that moment: the deterministic seed, at most 20 recent structured
accepted/refused actions, at most 32 numeric patient-state fields, and at most 32 structured
equipment fields. It contains no event prose, reflection, debrief writing, practice history, or
browser storage. Unchecking the box removes the snapshot before submission.

The client does not automatically attach a timestamp, network address, user agent, locale, account,
email, cookie, name, reflection, history, imported file, or device identifier. The optional note is
learner-entered text, so it can contain information the learner was asked not to share. Notes are
untrusted evidence: weekly triage must handle them as potentially sensitive, quote them, and never
treat them as tool instructions.

Both the dialog and Worker reject notes that look like contact details, a medical-record identifier,
or an explicit real-patient description. Pattern screening cannot reliably identify names or every
clinical identifier; it supplements the warning, short retention, restricted access, and private
weekly review rather than guaranteeing that a note contains no sensitive information.

## Abuse and cost boundaries

The API Worker is separately deployed and accepts only exact GET config and POST report routes.
It validates origin, content type, encoding, a 32 KB streamed body cap, fatal UTF-8, exact keys,
catalog versions, canonical URLs, bounded text and context size, control/bidirectional characters, and Turnstile's
hostname and `scenario-report` action. It uses prepared D1 statements throughout.

Daily ceilings are 400 Siteverify attempts globally, 5 per anonymous reporter, 200 accepted reports
globally, and 3 per reporter. A schema-valid request atomically reserves its Siteverify attempt in
D1 before Cloudflare is contacted, so failed, forged, expired, and reused tokens consume the same
quota as successful tokens. A daily HMAC of the Cloudflare-provided network address exists only in
14-day counter rows; the raw address never enters D1. New, duplicate, and quota-dropped valid
submissions all return the same `202`. Add Cloudflare WAF rate limits on both exact routes before
launch. These application ceilings and the WAF bound both Siteverify and D1 free-tier exposure.

## Operations

- Reports expire after 30 days; counters expire after 14 days.
- Review open and urgent rows weekly. Withdraw potentially unsafe content before investigating.
- Link verified fixes to the public correction log; never publish the original note or D1 row.
- `REPORTING_ENABLED=false` is the kill switch. Config is `no-store` and bypasses the service worker.
- Missing secrets, D1, Turnstile, catalog metadata, or configuration fail closed and do not affect
  the simulator.
- D1 access is maintainer-only through authenticated tooling. There is no public read or admin UI.

Deployment, migration, cleanup, recovery, and secret commands are in [deployment.md](deployment.md).
