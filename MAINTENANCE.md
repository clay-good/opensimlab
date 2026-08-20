# Maintenance, succession, and the honest status

A program adopting Open Sim Lab is making a multi-year bet. This page states what that bet actually
is, without softening it.

## Status

**Alpha. Not clinically reviewed.**

No clinician has signed any content. The pharmacology parameters are transcribed from the
primary literature but have not had the independent second-source check this project
requires before a model may be called Published. The face-validity review the first
development change ends at has not been run. The frame budget has not been measured on a
physical reference device.

Use it to see how the simulator works. Do not use it to learn clinical facts from, and do
not put it in front of students as though it had been checked.

## Bus factor

**One.**

One person wrote this. If they stop, nothing continues on its own. That is the single
largest risk to any institution adopting it, and it is stated first rather than buried.

## What survives if the project stops

Deliberately, quite a lot:

- The code is MIT licensed and the content is openly licensed per item. Anyone may fork it.
- The build is reproducible from a clean checkout with a pinned toolchain and a committed
  lockfile. `npm ci && npm run build` produces a static directory.
- There is no server, no database, no account system and no vendor. Nothing can be switched
  off remotely, and there is nothing to migrate off.
- Every institution can self-host the built files from any static host, on their own
  domain, indefinitely, with no dependency on this project remaining online.

If you are evaluating this for a curriculum, **fork it and host it yourself**. That removes
the bus factor from your risk register entirely.

## Succession

There is no succession plan worth the name yet, because there is no second maintainer.
What exists instead:

- The specification under `openspec/specs/` is complete enough to rebuild from. It states
  what the product must do and why, independently of how this implementation does it.
- Every non-obvious decision is recorded in a comment at the point it was made, with the
  requirement it serves.
- The tests are written as the acceptance criteria of those requirements, so a new
  maintainer can tell whether a change broke something that mattered.

The intended path is a small maintainer group with commit rights and at least two people
able to make a release. Getting there requires people, and asking for them honestly is more
useful than pretending an org chart exists.

## Dependency ceiling

The runtime dependency list is deliberately three packages:

| Package | Why it is worth the risk |
| --- | --- |
| `react` | The interface layer. |
| `react-dom` | Rendering and hydration. |
| `zustand` | The session store. Small, unopinionated, replaceable in an afternoon. |

Everything else is written here: the router, the JSON Schema validator, the matrix
exponential, the colour mathematics, the accessibility scan, the service worker. Each of
those was a deliberate choice to hold the ceiling rather than a case of not knowing a
library exists. A dependency in a project a student's institution will audit costs more
than it looks like it costs.

Build tooling is pinned and lives in `devDependencies`, where a compromise cannot reach a
learner's browser.

## Supply chain

- The lockfile is committed and `npm ci` is used everywhere, including in continuous
  integration.
- No script runs at install time from any dependency in the runtime set.
- The production bundle references no foreign origin at all, which
  `tests/arch/boundaries.test.ts` enforces. A compromised CDN cannot reach a learner
  because there is no CDN.

## Funding disclosure

**Unfunded.** No grant, institution, company, or vendor supports this project. Nobody has
paid for anything in it, and nobody has been promised anything by it. There is no
commercial interest, no pending one, and no plan that requires one.

If that changes, this section changes with it, before anything else does.
