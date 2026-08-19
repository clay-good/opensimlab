# Open-SimLab

An open-source, browser-native clinical simulator for medical students, residents, and
nurse anesthetists — anywhere in the world, on any device, with or without a network.

**opensimlab.com/anesthesia** is the first module. `/oncology` and `/cardiology` follow.

Physical simulation labs cost hundreds of thousands of dollars, require physical
attendance, and are bottlenecked by scheduling. Open-SimLab is free, needs no login or
install, runs entirely in the browser, works offline, and sends nothing anywhere.

> **Not for clinical use.** Open-SimLab is an educational simulator. It is not a clinical
> decision-support tool, not a dosing calculator, and not validated for any decision
> affecting a real patient.

## Where the specification lives

This project is spec-driven with [OpenSpec](https://openspec.dev/). The authoritative
specification is the capability tree under [`openspec/specs/`](openspec/specs/):

| Capability | What it governs |
| --- | --- |
| [`engine/pkpd-core`](openspec/specs/engine/pkpd-core/spec.md) | Compartment solvers, effect-site kinetics, Hill and interaction surfaces, determinism |
| [`engine/physiology`](openspec/specs/engine/physiology/spec.md) | The virtual patient: hemodynamics, gas exchange, blockade, fluids, surgical stimulus |
| [`engine/model-provenance`](openspec/specs/engine/model-provenance/spec.md) | Hypnos dataset ingestion, confidence tiers, applicability envelopes, citations |
| [`engine/simulation-clock`](openspec/specs/engine/simulation-clock/spec.md) | Simulated time, transport controls, worker isolation, deterministic transcripts |
| [`engine/scenario-engine`](openspec/specs/engine/scenario-engine/spec.md) | Scenario format, patient profiles, timeline events, crisis and artifact injection |
| [`cockpit/patient-monitor`](openspec/specs/cockpit/patient-monitor/spec.md) | Sweeping waveform canvas, numeric readouts, alarms |
| [`cockpit/pkpd-visualizer`](openspec/specs/cockpit/pkpd-visualizer/spec.md) | Plasma vs. effect-site plot, hysteresis, decrement times, prediction bands |
| [`cockpit/action-cockpit`](openspec/specs/cockpit/action-cockpit/spec.md) | Syringes, infusions and TCI, ventilator, fluids, airway, resuscitation |
| [`cockpit/event-log`](openspec/specs/cockpit/event-log/spec.md) | Chronological record, severity, cross-panel navigation, export |
| [`learning/pedagogy`](openspec/specs/learning/pedagogy/spec.md) | Onboarding, guidance levels, structured debrief, formative assessment |
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

## Clinical models

Pharmacological parameters come from [Hypnos](https://github.com/clay-good/hypnos), a
curated, citation-backed dataset of PK/PD model parameters annotated with confidence
tiers and applicability envelopes. Hypnos is forward-only and marks every export
`clinicalUse = "PROHIBITED"`; Open-SimLab preserves that boundary. Target-controlled
infusion is Open-SimLab's own simulation layer, not a Hypnos capability.

## License

Code is MIT. Educational content is openly licensed per scenario. See `LICENSE`.
