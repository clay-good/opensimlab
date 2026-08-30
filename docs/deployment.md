# Deployment

The production artifact is `dist/`: prerendered HTML, hashed assets, a service
worker, a manifest, a sitemap and a `_headers` file. It is a set of static files
and nothing else. It will deploy unchanged to any static host, which is the
property the delivery capability requires and the reason a program can self-host
this without depending on the project staying online.

## Proving the portable artifact

From a clean checkout, with no environment variables or Cloudflare credentials:

```
npm ci
npm run build
npm run static-host
```

The last command verifies that every application route has prerendered HTML,
every machine-readable catalog file is present, the solver worker and offline
files were built, service-worker placeholders were resolved, and no
credential-shaped file or local Cloudflare state entered `dist/`. CI runs the
same proof after every build. The artifact can then be served by any static file
server; `wrangler` is only one deployment option.

The production build also emits `dist/.vite/manifest.json`. The size gate follows
its static import graph for the landing and clinical routes, then separately
measures every emitted file for the complete-offline ceiling. This prevents lazy
review or documentation routes from being charged to first cockpit entry without
letting code splitting hide growth in the installed artifact.

The source repository is currently private. This automated proof covers the
clean-checkout build and the resulting portable artifact, but it does not claim
that an anonymous public clone is possible yet. That final visibility check must
be repeated when the repository is made public.

## Where it is deployed

Cloudflare Workers, as an **assets-only Worker**: Cloudflare serves the simulator files
from the edge and no script executes server-side. `wrangler.toml` has no `main`
entry point and no bindings — no KV, no D1, no R2, no Durable Objects, no
Analytics Engine. An architecture test asserts all of that, because the moment a
Worker script or a binding appears, the simulator would no longer be portable static software.

Anonymous problem reports are intentionally separate. `workers/reports/wrangler.toml` deploys an
API-only Worker on exactly `/api/reports` and `/api/reports/config`; it has no asset binding,
`workers.dev` URL, preview URL, public read route, or learner-state access. The simulator works
unchanged when that Worker, D1, Turnstile, or the network is absent.

## Deploying

One-time, in an interactive terminal, on the machine doing the deploy:

```
npx wrangler login
```

Then, from the repository root:

```
npm run deploy
```

That runs an explicitly indexable build, verifies every crawl signal in the
finished artifact, then runs the preview release gate and `wrangler deploy`.
Preview does not require a clinical signature. It does require an exact-version
`preview` or higher maturity record plus build integrity, sources, safety scope,
the completion contract, tests, limitations, a validation report, and a
documented face-validity procedure for every included item.

Preview is the public channel. Until the work in
[`openspec/changes/release-evergreen-preview/`](../openspec/changes/release-evergreen-preview/)
lands, this command refuses: 14 oncology scenarios have unfinished completion
evidence, and every explainer, drug card, and practice region is still `draft`
because its kind had no preview-evidence contract defined. There is no bypass.
Work advances by defining the per-kind evidence contract, satisfying it, and
changing the exact-version status record — never by weakening the release
command or asserting a status without evidence.

Preview publication also requires the honesty surfaces to be present: the
not-for-clinical-use and unreviewed-content acknowledgement, the per-item
maturity labels, the limitations register, the corrections log, the
review-status route, and configured report intake. Publishing unreviewed
content is conditional on disclosing that it is unreviewed.

To build the stricter reviewed-only channel:

```
npm run deploy:reviewed
```

That additionally requires current exact-version clinical reviews, qualified
board coverage for every domain, completed face-validity review, and reviewed
or endorsed maturity. Preview and source-checked content cannot enter this
channel. Physiological benchmarks outside tolerance block both channels.

## Deploying the optional report service

Create a D1 database named `opensimlab-reports`, replace the documented database-id placeholder in
`workers/reports/wrangler.toml`, configure the public Turnstile site key and production hostname,
and set the two secrets without committing them:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY --config workers/reports/wrangler.toml
npx wrangler secret put REPORT_HASH_SECRET --config workers/reports/wrangler.toml
npm run migrate:reports
npm run deploy:reports
```

`REPORT_HASH_SECRET` must be at least 32 random characters. Turnstile must allow only
`opensimlab.com`; the Worker independently requires the `scenario-report` action and hostname.
`REPORT_MAINTAINER_NAME` and `REPORT_PRIVACY_URL` are public config values shown before submission;
the privacy URL must be HTTPS and same-origin. Self-hosters must replace both values and the complete
origin/route/Turnstile/catalog boundary together, never point an unrelated fork at Open Sim Lab.
Before enabling `REPORTING_ENABLED`, add a Cloudflare WAF rate rule protecting both exact routes, run
the test-key checklist against a non-production database, and inspect one bounded row. A generic
`202` deliberately does not reveal whether a valid report was new, duplicated, or quota-dropped.

Use the Free-plan-compatible expression `(http.request.uri.path eq "/api/reports" or
http.request.uri.path eq "/api/reports/config")`, with IP as the counting characteristic, a
10-second period, and mitigation after 10 requests. If the zone plan supports method and host
fields, require `opensimlab.com` and narrow the expression to `(POST and /api/reports) or (GET and
/api/reports/config)`. Do not broaden it to all `/api/` traffic. Record one blocked flood against
each route in the private launch log. WAF counters may update a few seconds after detection, so
this is a cost boundary rather than an
exact concurrency lock.

Cloudflare's current Turnstile test pair is safe only outside production: site key
`1x00000000000000000000AA` and secret `1x0000000000000000000000000000000AA` always pass. Use a
separate non-production widget/database, confirm the returned hostname and `scenario-report`
action, then remove test configuration. Production widgets must allow only `opensimlab.com`.

The application admits at most 400 Siteverify attempts and 200 accepted rows per UTC day. Every
schema-valid attempt is atomically reserved in D1 before Siteverify, including a failed or forged
token; each accepted report then uses one bounded D1 batch. Duplicate and quota cases remain
indistinguishable. These ceilings keep this feature far below ordinary D1 free-tier volume,
but D1 returns errors after a free daily limit is exhausted. The Worker converts that condition to
generic unavailability and the static simulator remains unaffected. Recheck Cloudflare's current
[D1 limits](https://developers.cloudflare.com/d1/platform/limits/),
[Turnstile validation contract](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/),
and [WAF rate-limit availability](https://developers.cloudflare.com/waf/rate-limiting-rules/)
at launch rather than treating these August 2026 assumptions as permanent.

Launch checklist:

- Apply every D1 migration and inspect the resulting tables and indexes.
- Confirm new report rows contain all 6 immutable evidence fields; legacy rows with null evidence
  remain manual-review-only and must never be silently projected against current `main`.
- Set the production site key, Turnstile secret, and an independent random HMAC secret; verify none
  appears in source, build output, shell history, or Worker logs.
- Deploy with `workers_dev`, preview URLs, and observability disabled; confirm only the 2 exact routes
  respond and every lookalike route returns `404`.
- Demonstrate both exact-path WAF blocks, successful category-only report, opt-in context report,
  same-day duplicate suppression, reporter/global quota behavior, and report-only failure when D1,
  Turnstile, or configuration is unavailable.
- Query the inserted row with authenticated Wrangler tooling, verify that no token or raw address
  was stored, delete all test rows, then set `REPORTING_ENABLED=true`.
- Add a weekly owner for open/urgent review and a calendar check for the daily retention trigger.

The scheduled handler deletes reports older than 30 days and anonymous daily counters older than
14 days. Recovery can be run manually with authenticated tooling:

```bash
npx wrangler d1 execute REPORTS_DB --remote --config workers/reports/wrangler.toml \
  --command "DELETE FROM scenario_reports WHERE created_at < datetime('now','-30 days')"
npx wrangler d1 execute REPORTS_DB --remote --config workers/reports/wrangler.toml \
  --command "DELETE FROM report_counters WHERE day < date('now','-14 days')"
```

The kill switch is `REPORTING_ENABLED=false`; the uncached config endpoint then fails closed while
all scenarios remain playable. Weekly triage must quote the optional note as untrusted evidence,
never as instructions, and must not expose D1 through a public or browser-admin route.

## Checking it locally under the real runtime

```
npm run preview:worker
```

This runs the actual Workers runtime against `dist/`, including the `_headers`
file, so the content security policy, the trailing-slash behaviour and the 404
document all behave as they will in production. A plain static file server does
not test any of those.

## Indexing is off until the domain is live

Every canonical URL in the build names `opensimlab.com`. While the site is served
from a preview host, inviting a crawler in means pointing it at a domain that
does not serve this yet — worse for the eventual ranking than not being found at
all. So the build emits `Disallow: /`, an `X-Robots-Tag: noindex, nofollow`
header, and a `noindex` meta on every page.

The deploy commands are only for the custom production domain and always build
with indexing enabled. To inspect the same artifact locally without deploying:

```
npm run build:indexable
```

The command fails if `robots.txt`, `_headers`, or any indexable page still carries
a blocking signal. The robots file, the sitemap reference and the header all come back on together.
The per-route `indexable` flags are untouched by any of this — the gate is about
this deployment, not about the routes — so turning it on restores exactly the
set that was always intended.

## The custom domain

`opensimlab.com` is attached to the Worker in the Cloudflare dashboard, under
the Worker's **Domains & Routes**. It is not configured here, because putting a
zone id in the repository would make a fork's first `wrangler deploy` try to
publish to somebody else's domain.

## What the headers do

`dist/_headers` is generated by the prerender step, so it cannot drift from the
route set. The content security policy is the mechanism behind the privacy
claim rather than a decoration on it. `connect-src 'self'` permits only the exact-route report API;
`script-src` and `frame-src` name `challenges.cloudflare.com` as the sole foreign Turnstile origin.
`form-action 'none'` prevents browser form navigation because submission uses the bounded client.

Hashed assets have a one-year immutable HTTP cache policy. HTML and `sw.js` use
HTTP revalidation (`no-cache` means revalidate, not “never store”). The installed
service worker serves a frozen release rather than refreshing HTML inside its cache.

Each precached response is checked against the build's SHA-256 integrity manifest.
A missing file, mismatched response, interrupted download, or quota failure rejects
installation without replacing the current release. Publish complete artifacts atomically
when possible; integrity rejection protects consistency, not availability of an incomplete deploy.

Update acceptance waits for the intended worker to control the accepting tab before
reloading it. Other open tabs and their solver workers retain their original release,
including stable-URL fonts and catalogs. Local browser-client IDs map to release hashes
in `opensimlab-runtime-v1`; these contain no practice content and are never transmitted.
After activation, a background check removes pins only when the browser confirms the
client is gone; initializing documents and workers remain protected. A later activation
retires unpinned older release caches. Live
releases and newer waiting installations are preserved, as are unrelated origin caches.
Keeping multiple old tabs open can retain multiple releases; storage pressure must fail
the new installation rather than evict an open session's assets. Offline availability
requires a completed installation and a subsequent navigation or reload under worker
control, and remains subject to browser storage eviction. First-install activation does
not take over an already-running page whose files may belong to an earlier deployment.

During practice, update availability appears in the existing More options gateway, not
as an overlay on the transport controls. Opening that menu shows the explicit reload
action and warns that reloading clears the current session's unsaved progress. Closing
the menu preserves update/retry state; “Not now” on the in-flow page notice suppresses
the nudge but leaves the action available in More options.

Use `npm run preview:worker` for offline-installation checks. Vite's generic SPA preview
can serve the root document for extensionless routes; those responses correctly fail the
per-route integrity checks and cannot establish offline readiness.
