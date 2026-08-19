## Context

Greenfield. No code exists. Twenty-eight capabilities are specified; this change implements a slice of eleven of them and deliberately ignores seventeen.

The binding constraints are the ones already specified and not yet proven: 1.5 MB compressed to interactive, sub-16.7 ms frame time at the 95th percentile on a mid-range 2020 Android, bit-identical replay across devices, and zero network requests after first load.

## Goals / Non-Goals

**Goals:**
- Prove waveform realism to a clinician's eye before building breadth.
- Prove the frame and download budgets on real hardware, early enough to change architecture if they fail.
- Establish the three interfaces that are expensive to change later: design tokens, the worker protocol, and the transcript format.
- Reach a clinical face-validity review with something worth reviewing.

**Non-Goals:**
- Feature breadth. One scenario is the point.
- Any crisis. Crises are where the product's value is, and they are worthless on an unconvincing patient.
- Performance optimization beyond meeting the declared budgets. Meeting them is the goal; beating them is not.
- Translation infrastructure beyond externalizing strings from day one, which is cheap now and expensive to retrofit.

## Decisions

**Build the waveform engine first, not the interface.** The ordinary differential equations of McSharry et al. produce the electrocardiogram; the capnogram, arterial, and plethysmographic generators follow. This is week one, rendered to a bare canvas on a page with no design, because if it does not look right the rest of the plan changes. Standard practice would be to build the shell first; that would defer the largest risk to the end.

**Implement the published equations from the papers, never from GPL reference code.** The PhysioNet ECGSYN implementation is GPL and this project is permissively licensed. The equations and parameter tables in the paper are the source. This is recorded in the licensing note at the time of writing, not retrofitted.

**The solver worker protocol is designed once, in this change, for the full specification.** It carries the whole state vector, the attribution data the Why panel needs, and the waveform sample buffers, even though this slice uses a fraction of it. Retrofitting attribution into a worker protocol later means touching every consumer.

**Tokens are generated, not hand-written, from the first commit.** One source module emits both CSS custom properties and TypeScript constants. The contrast test runs from day one, so a failing token can never land.

**Transcript format is versioned from the first commit.** It records engine version, content version, model-set revision, practice region, and seed. Sessions recorded during the alpha should still replay later, and a format without a version field cannot migrate.

**Two practice regions, chosen deliberately.** United States and United Kingdom, because they differ on exactly the axis that matters — the United States profile has no target-controlled infusion — so the region mechanism is exercised rather than merely present.

**Defer the service worker to the end of the change.** An aggressive cache during active development wastes more time than it saves, and the offline requirement is testable in a day once the bundle is stable.

## Risks / Trade-offs

**The frame budget may not be reachable on the target device.** Five traces, 250 Hz electrocardiogram sampling, and a 10 Hz solver on a 2020 mid-range Android is an unproven assumption. Measured in week two on real hardware, not an emulator. If it fails, the fallbacks in order are: reduce trace sample density before rendering, move waveform generation off the tick and onto a lower-rate schedule with interpolation at draw time, then reduce the default trace count. The specification's degradation ladder already anticipates this; what is unknown is where on the ladder the device lands.

**Waveform realism may not survive clinical review.** The published model produces a realistic single-lead electrocardiogram; the arterial and capnogram generators have no equivalent published dynamical model and are being constructed. This is the most likely thing to fail review, and the change ends at that gate deliberately.

**Recruiting three credentialed reviewers may take longer than building the slice.** Started on day one rather than at the review. If reviewers are not secured by the time the slice is ready, the slice ships as a clearly-labeled preview with no clinical claims rather than waiting, and no scenario is described as reviewed.

**A single-scenario alpha invites the wrong feedback.** Clinicians shown one routine induction will ask for crises. The review rubric is written to ask about realism and plausibility, not about coverage, and the known gaps are stated up front.

**Building the worker protocol for the full spec risks over-engineering.** Accepted: the cost is a larger message shape carrying unused fields; the cost of the alternative is a migration across every consumer. Reversible in a way the alternative is not.
