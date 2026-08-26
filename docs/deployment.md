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

All current scenarios, explainers, drug cards, and practice regions remain
`draft`, and their completion evidence is not finished, so this command refuses
today. There is no unsigned-alpha bypass: work advances by satisfying preview
evidence and changing the exact status record, not by weakening the release
command.

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
Before enabling `REPORTING_ENABLED`, add a Cloudflare WAF rate rule for the exact POST route, run
the test-key checklist against a non-production database, and inspect one bounded row. A generic
`202` deliberately does not reveal whether a valid report was new, duplicated, or quota-dropped.

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

Hashed assets are immutable and cached for a year. HTML is revalidated every
time, and `sw.js` is never cached, so an update is actually seen.
