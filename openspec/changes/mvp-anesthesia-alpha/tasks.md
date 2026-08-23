## 1. Prove The Riskiest Thing First: Waveforms

- [x] 1.1 Scaffold the Vite + TypeScript repo, pinned toolchain, lockfile, CI running lint and test on every push
- [x] 1.2 Implement the McSharry et al. electrocardiogram ordinary differential equations from the paper, with per-event angle, amplitude, and width parameters; record the licensing note that no GPL reference code was consulted
- [x] 1.3 Render lead II to a bare unstyled canvas at 25 mm/s equivalent; no design system, no layout, no interface
- [x] 1.4 Add respiratory sinus arrhythmia and rate-dependent QT shortening; assert both with automated tests
- [x] 1.5 Implement the arterial pressure generator with upstroke, dicrotic notch, and runoff driven by pressure, rate, and systemic vascular resistance
- [x] 1.6 Implement the capnogram generator with the four phases and an explicit alpha angle parameter
- [x] 1.7 Implement the plethysmogram generator, phase-locked to the cardiac cycle; assert phase coherence across all three by cross-correlation
- [ ] 1.8 Informal review: show the traces to two clinicians and record what they say before going further — **NOT DONE. Needs people.** No clinician has seen these traces. This is the gate the whole change is sequenced around and it has not opened.

## 2. Prove The Second Riskiest Thing: The Frame Budget

- [ ] 2.1 Acquire or identify the reference device: a mid-range 2020 Android handset, physical hardware, not an emulator — **NOT DONE. Needs hardware.**
- [x] 2.2 Render five simultaneous traces with a sweep and erase bar; measure 95th-percentile frame time over a 60-second run — the harness is built at `/frame-budget` and measures exactly this. **It has not been run on the reference device**, so no result exists.
- [x] 2.3 Run the solver in a Web Worker at the 100 ms tick alongside rendering; re-measure — the harness has a toggle for it. Same caveat.
- [ ] 2.4 If the budget fails, apply the degradation ladder in order and record where the device lands — the ladder is implemented and switchable from the harness. Nothing to record until 2.1 is done.
- [x] 2.5 Wire the long-task observer and frame-time measurement into CI as a budget gate — the observer and the recorder are wired; CI reports that no device measurement has been committed rather than letting silence imply one has.

## 3. The Foundations Everything Else Depends On

- [x] 3.1 Write the design token module emitting both CSS custom properties and TypeScript constants from one source
- [x] 3.2 Add the automated contrast test asserting every specified token pair, including `--text-tertiary` on `--surface-3` at 4.76:1
- [x] 3.3 Add the token lint rule rejecting off-scale spacing, radius, and any saturated color outside the trace, alarm, and focus sets
- [x] 3.4 Self-host and subset Inter and JetBrains Mono; assert the combined Latin subset stays under 120 KB compressed — pinned OFL subsets from Inter 4.1 and JetBrains Mono 2.304 total 86.2 KB compressed, carry both license notices, preload on every route, and are included in the offline precache. The modified Inter subset is renamed Open Sim Lab Inter to respect its Reserved Font Name.
- [x] 3.5 Design the solver worker protocol for the full specification: complete state vector, attribution terms, waveform sample buffers, versioned message shape
- [x] 3.6 Define the transcript format with engine version, content version, model-set revision, practice region, seed, and ordered actions; write the replay harness and the state-trace hash comparison

## 4. Pharmacology, Transcribed And Checked

- [x] 4.1 Implement the three-compartment mammillary solver with the analytic matrix-exponential step and the effect-site compartment
- [x] 4.2 Transcribe propofol Eleveld 2018 including the corrigendum; record source locator, second source, and checker for every parameter — transcribed with its locator. **The second source and the checker are recorded as outstanding**, which blocks the Published label.
- [x] 4.3 Transcribe remifentanil Minto 1997; record the same transcription metadata — same caveat.
- [x] 4.4 Implement the shared body-composition equations once, used by both
- [ ] 4.5 Assert published reference-individual parameters and at least one published concentration-time point per model — reference-individual parameters are asserted for every model. No shipped model yet has a numeric published concentration-time assertion: the existing Eleveld bolus test is an internally derived qualitative profile, and the cited paper does not publish that 2 mg/kg reference-adult curve. This remains open pending traceable source data and a fully specified administration protocol, or an approved change to the requirement.
- [x] 4.6 Implement the sigmoid Emax mapping and the propofol–remifentanil response surface; assert synergy exceeds additivity and degrades to the single-drug curve at zero
- [x] 4.7 Implement the envelope evaluator and the James lean-body-mass failure predicate; assert Schnider demotion at body mass index 47.3
- [x] 4.8 Property tests: non-negative amounts, mass conservation without elimination, Hill monotonicity

## 5. Physiology For One Induction

- [x] 5.1 Implement the state vector with typed units and hard bounds
- [x] 5.2 Implement cardiac output, systemic vascular resistance, and mean arterial pressure as derived rather than set, with propofol acting on the physiologic terms
- [x] 5.3 Implement the baroreflex with anesthetic-depth and opioid attenuation
- [x] 5.4 Implement alveolar ventilation, carbon dioxide stores, oxygen uptake, and the oxyhemoglobin dissociation curve
- [x] 5.5 Assert the Benumof apnea benchmark for healthy, ill, and obese profiles within declared tolerance — all three within 5% of the published times, against a declared tolerance of 20%
- [x] 5.6 Implement surgical stimulus and its opposition by hypnotic and opioid effect
- [x] 5.7 Implement the attribution mechanism so every state change reports its ranked contributing terms
- [x] 5.8 Implement laryngoscopy returning a Cormack-Lehane grade, with attempts consuming time and worsening the grade

## 6. The Cockpit, Built From The Design System

- [x] 6.1 Build the four-region layout at the `md` breakpoint and above; assert zero cumulative layout shift after initial render — geometry is asserted structurally: the grid is fixed, alarm treatment changes no box, numerics are tabular, flashing animates opacity only. **A real Core Web Vitals measurement has not been taken**, for the same reason as task 2.
- [x] 6.2 Build the component inventory subset this slice needs, plus the component gallery route rendering every state
- [x] 6.3 Build the VitalTile with its alarm treatment and its invalid-value state
- [x] 6.4 Build the WaveformCanvas drawing only from the sample buffer, with device-pixel-ratio scaling — the renderer is now built once and mutated in place. It was previously re-created whenever the cockpit re-rendered, which cleared the canvas faster than a trace could be drawn, so **no waveform ever appeared**. `tests/ui/waveform-render.test.tsx` fails against the old behaviour.
- [x] 6.5 Build the AlarmRail and Banner with IEC 60601-1-8 priorities, colors, and flash rates; assert flash rates in an automated timing test — the rates are tokens derived from the standard's bands and asserted; the CSS animation periods come from those tokens.
- [x] 6.6 Build the Status Bar with transport controls and speed multipliers; assert identical trajectories across speeds
- [x] 6.7 Build the Syringes tray and the Airway and Ventilator tray for this slice's drugs and actions — the tray now renders the ENGINE's equipment snapshot rather than hard-coded props. Ventilator settings, refused settings, syringe volume, running infusions, intubation status and the Cormack-Lehane grade were all previously frozen at their defaults whatever the learner did.
- [x] 6.8 Build the concentration plot with plasma and effect-site curves and the time-to-peak-effect annotation — the stacking annotation is computed live from the recorded actions and is scoped to the drug that was stacked. It was previously always empty.
- [x] 6.9 Build the event log with severity, filtering, and cross-panel time navigation
- [x] 6.10 Reflow to `sm` and `xs`; verify a full induction is completable at 360 by 780 CSS pixels — **verified by hand at 360 by 780**: preoxygenation, induction, videolaryngoscopy, intubation and the debrief. Three defects were fixed to get there: bare `1fr` grid tracks let a non-wrapping row widen the whole cockpit past the viewport, the status bar carried more than fits a phone, and the vital value's tap target could shrink to two characters wide.

## 7. Sound

- [x] 7.1 Implement the Web Audio variable-pitch pulse tone with a declared monotonic saturation-to-frequency mapping; assert the mapping
- [x] 7.2 Implement IEC 60601-1-8 alarm burst patterns per priority
- [x] 7.3 Implement the one-time opt-in prompt explaining what the pulse tone is for
- [x] 7.4 Add the audit asserting every audio event has a paired visual event

## 8. Accessibility, Not Retrofitted

- [x] 8.1 Keyboard operation of the entire induction sequence, with visible focus and a logical order
- [x] 8.2 Live region announcing on threshold crossings rather than on every change; on-demand full state summary
- [x] 8.3 Text description of current waveform morphology for each trace
- [x] 8.4 Reduced-motion path: transitions to zero, stepped 4 Hz waveform update, static alarm priority treatment
- [x] 8.5 Automated accessibility scan in CI at zero serious or critical violations
- [ ] 8.6 Manual audit: keyboard-only completion, screen reader narration, 400% zoom reflow; commit the results — **PARTLY DONE.** Keyboard operability, visible focus, accessible names, target sizes and reflow to 360 by 780 have been exercised in a browser and recorded in `docs/accessibility-audit.md`. Screen reader narration, 400% zoom and a keyboard-only run by someone who did not write the code are still owed, and only a person can do them.

## 9. The Scenario And The Debrief

- [x] 9.1 Write the scenario JSON Schema and the validator with plain-language errors
- [x] 9.2 Author the routine induction scenario: patient, timeline, objectives, debrief rubric
- [x] 9.3 Implement the prebriefing screen with the fiction contract, per the INACSL standard
- [x] 9.4 Implement the PEARLS debrief: reactions, description, analysis, summary and application, in that order, learner account first — the description phase now lists what the learner DID, not only what went wrong; and the preoxygenation objective is judged on the engine's count rather than a hard-coded zero, which used to tell a learner who preoxygenated for four minutes that they had not.
- [x] 9.5 Implement counterfactuals by re-running the engine on the modified transcript, not by asserting an outcome
- [x] 9.6 Implement the Why panel driven by the attribution mechanism from task 5.7
- [x] 9.7 Write the concept explainers this slice demonstrates: hysteresis, preoxygenation and safe apnea time, hypnotic–opioid synergy — those three plus four more the slice exercises
- [x] 9.8 Implement the three guidance levels, with prompts that say what to do and why, and a test proving the patient is identical at every level

## 10. Region, Governance, And Truthfulness

- [x] 10.1 Implement the practice-region setting with United States and United Kingdom profiles as data files
- [x] 10.2 Implement the region-driven formulary, units, and the not-FDA-approved labeling path for target-controlled infusion
- [x] 10.3 Implement the `clinical_review` record format and the build gate that excludes unreviewed content — the gate runs in every build and currently excludes every registered content item, because none are signed
- [x] 10.4 Write `GOVERNANCE.md`, `CORRECTIONS.md`, the limitations register, and the maintenance and succession statement
- [x] 10.5 Implement the not-for-clinical-use acknowledgement, the persistent simulator marker, and the statement embedded in every export
- [x] 10.6 Write the architecture tests: no inverse control in the kernel, no real-patient input path, no foreign origin, no external pharmacology dependency

## 11. The Front Door

- [x] 11.1 Build the landing page front matter: name, one-line description, live ECG hero reusing the waveform generator only, single primary action to `/anesthesia`
- [x] 11.2 Add the reduced-motion and no-JavaScript static hero fallback with no layout shift on takeover
- [x] 11.3 Add the three supporting facts and the module directory rendering from module declarations, with cardiology and others marked Planned and no dates
- [x] 11.4 Write the below-the-fold prose: what it teaches, who it is for, what is in the anesthesia module, where the pharmacology comes from, what it does not do, how to use it in a course
- [x] 11.5 Write the questions section, answering the module timing question honestly as no date promised
- [x] 11.6 Build the footer trust block linking the validation report, governance, limitations register, license, repository, and citation
- [x] 11.7 Enforce the landing route's own 150 KB and 1.2 s budgets in CI, separate from the simulator budget — the 150 KB weight budget is enforced and currently measures 24 KB. **The 1.2 s paint budget needs the reference device**, like task 2.
- [x] 11.8 Add the low-priority prefetch of the anesthesia entry bundle, skipped on save-data or slow connections
- [x] 11.9 Prerender every indexable route to static HTML; assert content is present with scripting disabled
- [x] 11.10 Per-route title, description, and canonical, with uniqueness and length assertions in CI; keep `/anesthesia` metadata minimal and copy-free
- [x] 11.11 JSON-LD: `WebSite` and `Organization` at the root, `SoftwareApplication` for the simulator, `LearningResource` for the scenario briefing; validate in CI and source reviewer names from the governance records — reviewer names are sourced from the governance records, which is why the markup names nobody
- [x] 11.12 Build-time Open Graph image generation from design tokens; sitemap and robots generated and asserted against the prerendered route set
- [x] 11.13 Verify the service worker is not registered for crawlers and never serves stale metadata
- [x] 11.14 Audit link text for descriptiveness; confirm no tracking parameters anywhere

## 12. Ship It Offline And Measure It

- [x] 12.1 Implement the cache-first service worker with explicit update acceptance and the double-failure unregister escape
- [x] 12.2 Web app manifest and installability across Android, iOS, and desktop
- [x] 12.3 Assert zero network requests during a complete session after first load — asserted by running a full session with every network primitive replaced by a throw
- [x] 12.4 Enforce the 1.5 MB interactive and 8 MB full-bundle budgets in CI
- [ ] 12.5 Deploy to `opensimlab.com/anesthesia` behind an honest alpha status notice — **NOT DONE. Needs the domain and hosting credentials.** The build is a static directory ready to copy, and the honest alpha notice is on the front page.
- [x] 12.6 Publish the first validation report, including everything not yet validated — at `/validation`, generated from the same constants the tests assert against. Its unvalidated list is longer than its validated one, which is the honest state.

## 13. The Gate

- [ ] 13.1 Recruit at least three credentialed clinician reviewers — started in parallel from task 1, not here — **NOT DONE. Needs people.** The board is empty and `GOVERNANCE.md` says so first.
- [x] 13.2 Write the face-validity rubric covering waveform realism and physiological plausibility, not feature coverage
- [ ] 13.3 Run the review; record every rating and every objection verbatim — **blocked on 13.1.**
- [ ] 13.4 Triage: correct the model, or record the limitation and label it in the interface — **blocked on 13.3.** The limitations register and the labelling mechanism are built and in use.
- [ ] 13.5 Decide explicitly — extend this change, or open the next one. Do not start breadth work on an unconvincing patient — **blocked on 13.4. This change is NOT complete and the next one must not start.**
