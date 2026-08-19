## 1. Prove The Riskiest Thing First: Waveforms

- [ ] 1.1 Scaffold the Vite + TypeScript repo, pinned toolchain, lockfile, CI running lint and test on every push
- [ ] 1.2 Implement the McSharry et al. electrocardiogram ordinary differential equations from the paper, with per-event angle, amplitude, and width parameters; record the licensing note that no GPL reference code was consulted
- [ ] 1.3 Render lead II to a bare unstyled canvas at 25 mm/s equivalent; no design system, no layout, no interface
- [ ] 1.4 Add respiratory sinus arrhythmia and rate-dependent QT shortening; assert both with automated tests
- [ ] 1.5 Implement the arterial pressure generator with upstroke, dicrotic notch, and runoff driven by pressure, rate, and systemic vascular resistance
- [ ] 1.6 Implement the capnogram generator with the four phases and an explicit alpha angle parameter
- [ ] 1.7 Implement the plethysmogram generator, phase-locked to the cardiac cycle; assert phase coherence across all three by cross-correlation
- [ ] 1.8 Informal review: show the traces to two clinicians and record what they say before going further

## 2. Prove The Second Riskiest Thing: The Frame Budget

- [ ] 2.1 Acquire or identify the reference device: a mid-range 2020 Android handset, physical hardware, not an emulator
- [ ] 2.2 Render five simultaneous traces with a sweep and erase bar; measure 95th-percentile frame time over a 60-second run
- [ ] 2.3 Run the solver in a Web Worker at the 100 ms tick alongside rendering; re-measure
- [ ] 2.4 If the budget fails, apply the degradation ladder in order and record where the device lands; if it fails at the bottom of the ladder, stop and revise the architecture before task 3
- [ ] 2.5 Wire the long-task observer and frame-time measurement into CI as a budget gate

## 3. The Foundations Everything Else Depends On

- [ ] 3.1 Write the design token module emitting both CSS custom properties and TypeScript constants from one source
- [ ] 3.2 Add the automated contrast test asserting every specified token pair, including `--text-tertiary` on `--surface-3` at 4.76:1
- [ ] 3.3 Add the token lint rule rejecting off-scale spacing, radius, and any saturated color outside the trace, alarm, and focus sets
- [ ] 3.4 Self-host and subset Inter and JetBrains Mono; assert the combined Latin subset stays under 120 KB compressed
- [ ] 3.5 Design the solver worker protocol for the full specification: complete state vector, attribution terms, waveform sample buffers, versioned message shape
- [ ] 3.6 Define the transcript format with engine version, content version, model-set revision, practice region, seed, and ordered actions; write the replay harness and the state-trace hash comparison

## 4. Pharmacology, Transcribed And Checked

- [ ] 4.1 Implement the three-compartment mammillary solver with the analytic matrix-exponential step and the effect-site compartment
- [ ] 4.2 Transcribe propofol Eleveld 2018 including the corrigendum; record source locator, second source, and checker for every parameter
- [ ] 4.3 Transcribe remifentanil Minto 1997; record the same transcription metadata
- [ ] 4.4 Implement the shared body-composition equations once, used by both
- [ ] 4.5 Assert published reference-individual parameters and at least one published concentration-time point per model
- [ ] 4.6 Implement the sigmoid Emax mapping and the propofol–remifentanil response surface; assert synergy exceeds additivity and degrades to the single-drug curve at zero
- [ ] 4.7 Implement the envelope evaluator and the James lean-body-mass failure predicate; assert Schnider demotion at body mass index 47.3
- [ ] 4.8 Property tests: non-negative amounts, mass conservation without elimination, Hill monotonicity

## 5. Physiology For One Induction

- [ ] 5.1 Implement the state vector with typed units and hard bounds
- [ ] 5.2 Implement cardiac output, systemic vascular resistance, and mean arterial pressure as derived rather than set, with propofol acting on the physiologic terms
- [ ] 5.3 Implement the baroreflex with anesthetic-depth and opioid attenuation
- [ ] 5.4 Implement alveolar ventilation, carbon dioxide stores, oxygen uptake, and the oxyhemoglobin dissociation curve
- [ ] 5.5 Assert the Benumof apnea benchmark for healthy, ill, and obese profiles within declared tolerance
- [ ] 5.6 Implement surgical stimulus and its opposition by hypnotic and opioid effect
- [ ] 5.7 Implement the attribution mechanism so every state change reports its ranked contributing terms
- [ ] 5.8 Implement laryngoscopy returning a Cormack-Lehane grade, with attempts consuming time and worsening the grade

## 6. The Cockpit, Built From The Design System

- [ ] 6.1 Build the four-region layout at the `md` breakpoint and above; assert zero cumulative layout shift after initial render
- [ ] 6.2 Build the component inventory subset this slice needs, plus the component gallery route rendering every state
- [ ] 6.3 Build the VitalTile with its alarm treatment and its invalid-value state
- [ ] 6.4 Build the WaveformCanvas drawing only from the sample buffer, with device-pixel-ratio scaling
- [ ] 6.5 Build the AlarmRail and Banner with IEC 60601-1-8 priorities, colors, and flash rates; assert flash rates in an automated timing test
- [ ] 6.6 Build the Status Bar with transport controls and speed multipliers; assert identical trajectories across speeds
- [ ] 6.7 Build the Syringes tray and the Airway and Ventilator tray for this slice's drugs and actions
- [ ] 6.8 Build the concentration plot with plasma and effect-site curves and the time-to-peak-effect annotation
- [ ] 6.9 Build the event log with severity, filtering, and cross-panel time navigation
- [ ] 6.10 Reflow to `sm` and `xs`; verify a full induction is completable at 360 by 780 CSS pixels

## 7. Sound

- [ ] 7.1 Implement the Web Audio variable-pitch pulse tone with a declared monotonic saturation-to-frequency mapping; assert the mapping
- [ ] 7.2 Implement IEC 60601-1-8 alarm burst patterns per priority
- [ ] 7.3 Implement the one-time opt-in prompt explaining what the pulse tone is for
- [ ] 7.4 Add the audit asserting every audio event has a paired visual event

## 8. Accessibility, Not Retrofitted

- [ ] 8.1 Keyboard operation of the entire induction sequence, with visible focus and a logical order
- [ ] 8.2 Live region announcing on threshold crossings rather than on every change; on-demand full state summary
- [ ] 8.3 Text description of current waveform morphology for each trace
- [ ] 8.4 Reduced-motion path: transitions to zero, stepped 4 Hz waveform update, static alarm priority treatment
- [ ] 8.5 Automated accessibility scan in CI at zero serious or critical violations
- [ ] 8.6 Manual audit: keyboard-only completion, screen reader narration, 400% zoom reflow; commit the results

## 9. The Scenario And The Debrief

- [ ] 9.1 Write the scenario JSON Schema and the validator with plain-language errors
- [ ] 9.2 Author the routine induction scenario: patient, timeline, objectives, debrief rubric
- [ ] 9.3 Implement the prebriefing screen with the fiction contract, per the INACSL standard
- [ ] 9.4 Implement the PEARLS debrief: reactions, description, analysis, summary and application, in that order, learner account first
- [ ] 9.5 Implement counterfactuals by re-running the engine on the modified transcript, not by asserting an outcome
- [ ] 9.6 Implement the Why panel driven by the attribution mechanism from task 5.7
- [ ] 9.7 Write the concept explainers this slice demonstrates: hysteresis, preoxygenation and safe apnea time, hypnotic–opioid synergy

## 10. Region, Governance, And Truthfulness

- [ ] 10.1 Implement the practice-region setting with United States and United Kingdom profiles as data files
- [ ] 10.2 Implement the region-driven formulary, units, and the not-FDA-approved labeling path for target-controlled infusion
- [ ] 10.3 Implement the `clinical_review` record format and the build gate that excludes unreviewed content
- [ ] 10.4 Write `GOVERNANCE.md`, `CORRECTIONS.md`, the limitations register, and the maintenance and succession statement
- [ ] 10.5 Implement the not-for-clinical-use acknowledgement, the persistent simulator marker, and the statement embedded in every export
- [ ] 10.6 Write the architecture tests: no inverse control in the kernel, no real-patient input path, no foreign origin, no external pharmacology dependency

## 11. The Front Door

- [ ] 11.1 Build the landing page front matter: name, one-line description, live ECG hero reusing the waveform generator only, single primary action to `/anesthesia`
- [ ] 11.2 Add the reduced-motion and no-JavaScript static hero fallback with no layout shift on takeover
- [ ] 11.3 Add the three supporting facts and the module directory rendering from module declarations, with cardiology and others marked Planned and no dates
- [ ] 11.4 Write the below-the-fold prose: what it teaches, who it is for, what is in the anesthesia module, where the pharmacology comes from, what it does not do, how to use it in a course
- [ ] 11.5 Write the questions section, answering the module timing question honestly as no date promised
- [ ] 11.6 Build the footer trust block linking the validation report, governance, limitations register, license, repository, and citation
- [ ] 11.7 Enforce the landing route's own 150 KB and 1.2 s budgets in CI, separate from the simulator budget
- [ ] 11.8 Add the low-priority prefetch of the anesthesia entry bundle, skipped on save-data or slow connections
- [ ] 11.9 Prerender every indexable route to static HTML; assert content is present with scripting disabled
- [ ] 11.10 Per-route title, description, and canonical, with uniqueness and length assertions in CI; keep `/anesthesia` metadata minimal and copy-free
- [ ] 11.11 JSON-LD: `WebSite` and `Organization` at the root, `SoftwareApplication` for the simulator, `LearningResource` for the scenario briefing; validate in CI and source reviewer names from the governance records
- [ ] 11.12 Build-time Open Graph image generation from design tokens; sitemap and robots generated and asserted against the prerendered route set
- [ ] 11.13 Verify the service worker is not registered for crawlers and never serves stale metadata
- [ ] 11.14 Audit link text for descriptiveness; confirm no tracking parameters anywhere

## 12. Ship It Offline And Measure It

- [ ] 12.1 Implement the cache-first service worker with explicit update acceptance and the double-failure unregister escape
- [ ] 12.2 Web app manifest and installability across Android, iOS, and desktop
- [ ] 12.3 Assert zero network requests during a complete session after first load
- [ ] 12.4 Enforce the 1.5 MB interactive and 8 MB full-bundle budgets in CI
- [ ] 12.5 Deploy to `opensimlab.com/anesthesia` behind an honest alpha status notice
- [ ] 12.6 Publish the first validation report, including everything not yet validated

## 13. The Gate

- [ ] 13.1 Recruit at least three credentialed clinician reviewers — started in parallel from task 1, not here
- [ ] 13.2 Write the face-validity rubric covering waveform realism and physiological plausibility, not feature coverage
- [ ] 13.3 Run the review; record every rating and every objection verbatim
- [ ] 13.4 Triage: correct the model, or record the limitation and label it in the interface
- [ ] 13.5 Decide explicitly — extend this change, or open the next one. Do not start breadth work on an unconvincing patient
