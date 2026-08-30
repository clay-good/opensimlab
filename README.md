# Open Sim Lab

**A free clinical simulator that runs in your browser. No login, no install, works offline.**

Physical simulation labs cost hundreds of thousands of dollars, require you to be in the
room, and are bottlenecked by scheduling. Open Sim Lab is a virtual patient you can open on
a phone on a bus. You make decisions, the patient responds, and a debrief tells you what
your reasoning missed.

Built for medical students, residents, and nurse anesthetists — anywhere in the world, on
any device, with or without a network.

> **Not for clinical use.** This is an educational simulator. It is not clinical
> decision support, not a dosing calculator, and not validated for any decision affecting
> a real patient.

## What it covers

240 bounded labs across 15 specialties:

| Module | Labs | Where |
| --- | --- | --- |
| Anesthesia | 39 | `/anesthesia` |
| Emergency medicine | 25 | `/emergency-medicine` |
| Critical care | 24 | `/critical-care` |
| Cardiology | 17 | `/cardiology` |
| Pediatrics | 16 | `/pediatrics` |
| Neurology | 15 | `/neurology` |
| Obstetrics | 15 | `/obstetrics` |
| Respiratory medicine | 15 | `/respiratory-medicine` |
| Toxicology | 15 | `/toxicology` |
| Endocrine & metabolic | 12 | `/endocrine-metabolic` |
| Neonatology | 11 | `/neonatology` |
| Infectious disease | 10 | `/infectious-disease` |
| Nursing | 9 | `/medical-surgical-nursing` |
| Renal & electrolyte | 6 | `/renal-electrolyte` |
| Oncology | 11 | `/oncology` |

Counts are the registered scenarios the build audits, not a roadmap. Every module above is now
registered at its full planned count. A sixteenth, surgery and trauma, is declared and has not
started, so it has no scenarios and no row here.

Each lab is a closed-loop scenario: the physiology keeps running while you decide, and
what you do changes where the patient goes next.

## How it works

**Your practice stays on your device.** No accounts, no analytics, no telemetry. Progress,
transcripts, reflections, and debriefs live in your browser. Nothing is sent anywhere
unless you open the problem-report form, preview exactly what it contains, and submit it
yourself.

**The pharmacology is ours.** Model parameters are transcribed by hand from the primary
literature, each carrying its citation and the range it is valid over. Nothing is fetched
at build or run time, and tests assert published reference values so a mistyped digit
fails immediately.

**Claims are sourced and correctable.** Crisis protocols trace to their issuing bodies,
physiology is checked against published benchmarks, the limitations register is public,
and confirmed mistakes stay in a permanent [corrections log](CORRECTIONS.md).

## Status: public and unreviewed, on purpose

Everything above is what the project is *for*. This is what it currently *is*.

There is no alpha, beta, or 1.0 here, and no staged content vocabulary either. Open Sim Lab is one
evergreen product in one state: the catalog grows and gets corrected continuously, and every item
ships labeled **"Educational use only — not clinically reviewed."** That label is the whole claim.
A build identifies itself by its date and the commit it came from, not by a stage, and
`npm run lint` fails on a prerelease version or staged-release wording anywhere a reader can
reach it.

- **No clinician has signed any content.** The editorial board is empty and published as empty.
  Nothing is described anywhere in the interface as reviewed, validated, or endorsed. The
  [review-status page](https://opensimlab.com/review-status) lists every item, the label it is
  published under, and the board state — no count without the list behind it. It is linked from
  the front page, and the release gate refuses to publish without it.
- **No pharmacology parameter has had its independent second-source check.** Values are
  transcribed from the primary publications, but the second-person verification this project
  requires has not happened. Every number is marked as pending.
- **Face-validity review and on-device frame-budget measurement have not been run.** Both need
  people and hardware rather than more code.

Publishing anyway is a deliberate decision, recorded in
[`openspec/changes/release-evergreen-preview/`](openspec/changes/release-evergreen-preview/). An
unreviewed corpus nobody can open does not get more accurate by waiting. A public one with a
working correction path does. So the trade is explicit: you get the material, you are told plainly
that nothing in it is signed, and the **report a problem** control in every scenario is how you
tell us we are wrong. Confirmed errors are appended permanently to [CORRECTIONS.md](CORRECTIONS.md).

The `reviewed` release channel still exists and still refuses to publish. It is what institutional
adoption packs are built from, and it will stay refused until named clinicians sign specific
content versions.

What is done: the waveform engine, compartment solver, physiology, design system, cockpit, sound,
accessibility, debrief, practice regions, and offline shell — with hundreds of automated tests and
the Benumof apnea benchmarks inside 5% of published times.

## Running it

```bash
npm install
npm run dev
```

`npm run ci` runs the full gate: specs, lint, build, tests, and budgets.

The build is a folder of static files. There is no server-side code, so it deploys
unchanged to any static host — which is the point: a program can self-host this without
depending on us.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). The project is spec-driven with
[OpenSpec](https://openspec.dev/); the authoritative specification is the capability tree
under [`openspec/specs/`](openspec/specs/), and clinical review is governed by
[GOVERNANCE.md](GOVERNANCE.md).

## License

Code is MIT. Educational content is openly licensed per scenario. See [LICENSE](LICENSE).
