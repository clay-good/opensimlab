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

218 bounded labs across 12 specialties:

| Module | Labs | Where |
| --- | --- | --- |
| Anesthesia | 39 | `/anesthesia` |
| Emergency medicine | 25 | `/emergency-medicine` |
| Critical care | 24 | `/critical-care` |
| Endocrine & metabolic | 20 | `/endocrine-metabolic` |
| Cardiology | 17 | `/cardiology` |
| Pediatrics | 16 | `/pediatrics` |
| Neurology | 15 | `/neurology` |
| Obstetrics | 15 | `/obstetrics` |
| Respiratory medicine | 15 | `/respiratory-medicine` |
| Toxicology | 15 | `/toxicology` |
| Neonatology | 11 | `/neonatology` |
| Renal & electrolyte | 6 | `/renal-electrolyte` |

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

## Status: alpha, not yet clinically reviewed

Everything above is what the project is *for*. This is what it currently *is*:

- **No clinician has signed any content in this build.** The editorial board is empty,
  every scenario and drug card carries an unsigned review record, and the release gate
  refuses to publish because of it.
- **No pharmacology parameter has had its independent second-source check.** Values are
  transcribed from the primary publications, but the second-person verification this
  project requires has not happened. Every number is marked as pending.
- **Face-validity review and on-device frame-budget measurement have not been run.**
  Both need people and hardware rather than more code.

What is done: the waveform engine, compartment solver, physiology, design system, cockpit,
sound, accessibility, debrief, practice regions, and offline shell — with hundreds of
automated tests and the Benumof apnea benchmarks inside 5% of published times.

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
