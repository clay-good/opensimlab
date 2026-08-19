# Open-SimLab

An open-source, browser-native clinical simulator for medical students, residents, and
nurse anesthetists — anywhere in the world, on any device, with or without a network.

**opensimlab.com/anesthesia** is the first module. `/oncology` and `/cardiology` follow.

The goal is not a tech demo. It is the best anesthesia education on the internet: the
thing a student opens the night before their first day in the OR and comes out of
understanding something they did not understand before.

Physical simulation labs cost hundreds of thousands of dollars, require physical
attendance, and are bottlenecked by scheduling. Open-SimLab is free, needs no login or
install, runs entirely in the browser, works offline, and sends nothing anywhere.

> **Not for clinical use.** Open-SimLab is an educational simulator. It is not a clinical
> decision-support tool, not a dosing calculator, and not validated for any decision
> affecting a real patient.

## Three commitments

**One theme, built well.** A single dark theme called Theater Dark, whose organizing rule
is that *color is a clinical signal, never decoration*. The entire interface chrome is a
neutral ramp. The only saturated color on screen is physiology, alarm severity, and the
focus ring. Every token, type size, spacing value, and motion duration is specified
exactly in [`design/design-system`](openspec/specs/design/design-system/spec.md) — a
builder should never have to guess a value.

**We own our pharmacology.** Model parameters are transcribed by hand from the primary
literature into typed TypeScript in this repository, each carrying its citation and its
applicability envelope. There is no external dataset dependency, nothing vendored, and
nothing fetched at build or runtime. Tests assert published reference values so a mistyped
digit fails immediately.

**Nothing leaves the device.** No login, no accounts, no server, no analytics, no
telemetry. Progress, transcripts, and debriefs live in the browser on that device. Sharing
happens only through a file the learner exports deliberately.

## The specification

This project is spec-driven with [OpenSpec](https://openspec.dev/). The authoritative
specification is the capability tree under [`openspec/specs/`](openspec/specs/).

### Engine — the virtual patient

| Capability | What it governs |
| --- | --- |
| [`engine/pkpd-core`](openspec/specs/engine/pkpd-core/spec.md) | Compartment solvers, effect-site kinetics, Hill and interaction surfaces, determinism |
| [`engine/physiology`](openspec/specs/engine/physiology/spec.md) | Hemodynamics, gas exchange, blockade, fluids, surgical stimulus, baroreflex |
| [`engine/pharmacology`](openspec/specs/engine/pharmacology/spec.md) | Model parameters, applicability envelopes, citations, drug cards, the Model Lens |
| [`engine/simulation-clock`](openspec/specs/engine/simulation-clock/spec.md) | Simulated time, transport controls, worker isolation, deterministic transcripts |
| [`engine/scenario-engine`](openspec/specs/engine/scenario-engine/spec.md) | Scenario format, patient profiles, timeline events, crisis and artifact injection |

### Design — one visual language

| Capability | What it governs |
| --- | --- |
| [`design/design-system`](openspec/specs/design/design-system/spec.md) | Theater Dark: every color, type, spacing, radius, and motion token; component inventory |
| [`design/layout`](openspec/specs/design/layout/spec.md) | The four-region cockpit, breakpoints, reflow, and the explicit sacrifice order |

### Cockpit — the screen

| Capability | What it governs |
| --- | --- |
| [`cockpit/patient-monitor`](openspec/specs/cockpit/patient-monitor/spec.md) | Sweeping waveform canvas, vital tiles, alarms, artifact rendering |
| [`cockpit/pkpd-visualizer`](openspec/specs/cockpit/pkpd-visualizer/spec.md) | Plasma vs. effect-site plot, hysteresis, decrement times, prediction bands |
| [`cockpit/action-cockpit`](openspec/specs/cockpit/action-cockpit/spec.md) | Syringes, infusions and TCI, ventilator, fluids, airway, resuscitation |
| [`cockpit/event-log`](openspec/specs/cockpit/event-log/spec.md) | Chronological record, severity, cross-panel navigation, export |

### Learning — why it exists

| Capability | What it governs |
| --- | --- |
| [`learning/pedagogy`](openspec/specs/learning/pedagogy/spec.md) | Onboarding, guidance levels, structured debrief with computed counterfactuals |
| [`learning/curriculum`](openspec/specs/learning/curriculum/spec.md) | Competency map, progression, transcript-derived evidence, spaced return, instructor mode |
| [`learning/knowledge-layer`](openspec/specs/learning/knowledge-layer/spec.md) | The Why panel, concept explainers, predict-then-observe, the sandbox |

### Platform — the guarantees

| Capability | What it governs |
| --- | --- |
| [`platform/safety-and-scope`](openspec/specs/platform/safety-and-scope/spec.md) | Not-for-clinical-use guards, the forward-only boundary, clinical review |
| [`platform/privacy`](openspec/specs/platform/privacy/spec.md) | No telemetry, no accounts, no server state, on-device only |
| [`platform/offline-pwa`](openspec/specs/platform/offline-pwa/spec.md) | Service worker, installability, download budgets, local storage |
| [`platform/accessibility`](openspec/specs/platform/accessibility/spec.md) | WCAG 2.2 AA, keyboard operation, screen reader access to live physiology |
| [`platform/global-reach`](openspec/specs/platform/global-reach/spec.md) | Translation, both unit systems, regional drug naming, low-end devices, licensing |
| [`platform/delivery`](openspec/specs/platform/delivery/spec.md) | Static build, routes, performance budgets, test strategy, releases |
| [`platform/module-contract`](openspec/specs/platform/module-contract/spec.md) | The boundary that lets oncology and cardiology reuse the core |

Validate the tree with:

```bash
openspec validate --specs --strict
```

## A note on Hypnos

[Hypnos](https://github.com/clay-good/hypnos) is a sibling project: a curated,
citation-backed dataset of PK/PD model parameters with confidence tiers and applicability
envelopes. It is a useful cross-check when transcribing parameters, and the envelope idea
is borrowed gratefully. It is **not** a dependency of this project — not imported, not
vendored, not fetched. Open-SimLab owns its numbers and tests them against the primary
literature directly.

## License

Code is MIT. Educational content is openly licensed per scenario. See `LICENSE`.
