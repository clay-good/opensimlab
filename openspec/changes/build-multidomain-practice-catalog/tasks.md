# Implementation plan: multidomain practice catalog

Every checkbox represents implementation work outside this spec-only change. A scenario is not
credited toward the catalog until every item in the completion contract passes.

## 0. Ratify the contract

- [ ] Approve the product position, 256-scenario target catalog, training-versus-runtime-tool
  boundary, fidelity classes, maturity vocabulary,
  privacy exception, report retention, and no-hosted-MCP decision.
- [ ] Resolve every conflict between this change and the master clinical-governance, privacy,
  delivery, module, curriculum, pedagogy, safety, adoption, and sustainability specifications.
- [x] Publish a machine-readable scenario completion schema and validate all existing anesthesia
  scenarios against it without changing their behavior.
- [x] Publish machine-readable training-value, authored-defaults, scenario-hazard, and state-space
  verification schemas; require all four before a scenario counts as playable.
- [x] Add architecture tests rejecting standalone calculators, scores, classifications,
  conversions, lookups, checklist answers, documentation generators, real-patient entry, and public
  compute endpoints while permitting calculations internal to fictional patient response.
- [x] Add architecture tests proving that tutor rules cannot mutate patient state and reporting
  cannot read local progress, reflections, or arbitrary browser storage.

## 1. Public repository and release posture

- [x] Complete secret, license, private-data, history, dependency, and contributor-identity audits
  before changing repository visibility.
- [x] Add public contribution, security, code-of-conduct, governance, reviewer, scenario-author,
  evidence-brief, correction, and organizational-endorsement documentation.
- [x] Add issue and pull-request templates that require scope, source locators, tests, limitations,
  maturity effect, and reviewer-domain impact.
- [x] Add asset-license and evidence-source manifests and fail the build on unclassified assets.
- [ ] Prove a clean public clone can build and self-host the static simulator without Cloudflare
  credentials or the report service.
  Automated CI now proves the clean-checkout artifact is complete, credential-free, and portable;
  anonymous-clone verification remains open until the repository is public.

## 2. Maturity and governance transition

- [x] Implement `draft`, `preview`, `source_checked`, `clinically_reviewed`,
  `institution_endorsed`, and `withdrawn` records with exact content-version binding.
- [ ] Replace unsigned-content exclusion with preview publication rules and persistent honest labels.
  The shared policy now names every preview gate and all six honest labels; scenario metadata,
  catalog cards, no-script briefings, interactive prebriefs, live sessions, debriefs, explainers,
  drug cards, and practice-region context use the exact-version record. Preview and reviewed
  release channels now fail closed against those records. Dedicated source-surface integration
  remains. All 30 current scenarios, explainers, drug cards, and practice regions now carry
  exact-version records.
- [ ] Preserve strict gates for reviewed-only catalog views, adoption packs, review badges,
  curriculum coverage claims, and organization endorsements.
  The reviewed release channel now requires reviewed/endorsed maturity, current exact-version
  review, qualified domain coverage, and completed face validity. Catalog, adoption-pack,
  curriculum, and endorsement consumers remain.
- [ ] Add reviewer qualification, conflict, scope, expiration, revocation, and clinical-diff rules.
- [ ] Add organization endorsement records and exact wording that identifies scope without implying
  certification.
- [ ] Migrate current anesthesia content to preview without fabricating signatures or source checks.
- [ ] Add public dashboards for scenario counts and all maturity, overdue, withdrawn, correction,
  limitation, and endorsement records.
- [x] Test that every status badge resolves offline to the exact machine-readable record.

## 3. Shared catalog and environment shell

- [ ] Implement the catalog manifest, scenario completion validator, static search index, goal paths,
  domain/environment/duration/difficulty/fidelity/maturity filters, and URL state.
  The anesthesia catalog now has bounded local search plus difficulty, duration, and maturity
  filters with compact URL state. A schema-valid public manifest/search artifact is generated from
  the same registry and exact-version completion audit and ships offline. All 10 goal paths are
  versioned, URL-selectable, included in that public artifact, and validated against the registry.
  Authored domain/environment/fidelity filters remain.
- [ ] Implement catalog desktop, tablet, 320 px phone, keyboard, screen-reader, reduced-motion, and
  no-script/prerendered experiences.
  The default prerender contains all 39 anesthesia scenario cards, controls are native keyboard and screen-
  reader fields, result changes use a focused polite status, and browser inspection passes without
  horizontal overflow at 320 px. Tablet and reduced-motion procedures remain.
- [ ] Demonstrate with 20 moderated learners that named and need-based cases are found within the
  specified threshold; record the procedure and results without production telemetry.
- [ ] Build shared operating-room, emergency-department, ICU, ward, delivery-room, neonatal, clinic,
  and prehospital frames from one interaction grammar.
- [ ] Add static domain-pack loading with integrity, version compatibility, atomic offline caching,
  storage budgeting, and safe pack rollback.
- [ ] Ensure planned titles are distinct from playable scenarios and excluded from complete counts.

## 4. Private tutor

- [x] Define tutor-rule schema with trigger, earliest time, cooldown, prerequisite observation,
  assistance level, explanation, source, maturity, and suppression fields.
  Every current rule declares schema and content versions, a named trigger, objective, earliest
  time, at least a 30-second cooldown, prerequisite observations, urgency, assistance level,
  source explainer, exact maturity, applicability, and suppression conditions.
- [x] Implement Orient, Notice, Connect, Prioritize, Direct, and Explain interventions.
  The preoxygenation behavior now exercises the complete ladder from the smallest useful orientation
  through a direct action, followed by an observable post-action explanation. Each rule appears once
  per session and same-objective escalation waits at least 30 simulated seconds.
- [x] Preserve identical patient trajectories across Guided, Coached, and Unassisted modes.
  Guidance remains a presentational read of canonical state and accepted actions; deterministic
  trace-hash tests prove the engine receives no guidance-level input.
- [x] Add tutor-collapse, pause, replay decision point, explanation depth, and permanently dismissible
  onboarding controls.
  The first objective-linked replay-safe decision point, paused deterministic branch, and dismissible
  branch notice are implemented. Opening a tutor source also pauses the simulated patient before
  the explanation modal appears. Compact prompt, situational “Why this now?”, and full sourced
  explanation depths are implemented. Every prompt collapses to one labeled expansion control. The
  nonblocking local introduction can be permanently dismissed, remains reachable from More options,
  and stays absent with all other tutor UI in Unassisted mode.
- [x] Add the 10 goal-based preparation paths and local next-scenario recommendation logic.
  Recommendations are ordered locally from the selected versioned path, explain the chosen goal,
  carry the scenario's exact maturity link, and accept local completed-scenario evidence. Goal
  context now reaches the debrief and a suggestion may be dismissed locally for exactly 7 days.
  Persisted attempt history remains tracked by the next task.
- [x] Add private local practice history, self-comparison, targeted repetition, and export/import.
  Bounded exact-version attempt summaries, objective-word self-comparison, goal-path continuation,
  atomic export/import/erase, and objective-linked replay-safe targeted repetition are implemented
  locally. A branch reconstructs the authored tick, preserves the original run, and records new
  actions separately.
- [x] Prohibit leaderboards, cross-learner percentiles, streak loss, public performance, points for
  irrelevant speed, and tutor network calls through tests and copy review.
  Architecture tests scan all shipped source for the prohibited incentive mechanics and scan tutor,
  history, recommendation, and debrief surfaces for browser network primitives. Hostile fixtures
  prove every detector fires, while copy assertions preserve the explicit no-score, no-ranking,
  local-only promises where learner performance and tutor behavior are discussed.
- [x] Verify every tutor observation and claimed outcome against deterministic expert, common-error,
  and recovery transcripts.
  Fixed-seed routine-induction fixtures now replay prepared, rushed, and corrected courses through
  the real engine. The matrix covers every current rule and trigger family, proves deterministic
  hashes, checks each named observation from visible state/actions, requires recovery triggers to
  turn off, and verifies the oxygen-reserve, effect-site-lag, and saturation-curve claims from traces.

## 5. Report-a-problem foundation

- [ ] Specify and implement the exact report request/response schemas and generated scenario report
  catalog.
- [ ] Add one shared report control to prebrief, live, debrief, source, and limitation surfaces.
- [ ] Implement the accessible payload-preview dialog, category-only submission, optional 500-
  character note, and opt-in bounded recent context.
- [ ] Structurally exclude reflections, local history, progress, imported files, arbitrary storage,
  real-world timestamps, identity, locale, user agent, and device data.
- [ ] Implement a separately routed API-only Worker for exact config and POST paths with no asset,
  preview, `workers.dev`, public-read, or broader API surface.
- [ ] Add server-derived metadata, origin/URL/content-type/body/schema/control-character validation,
  Turnstile Siteverify hostname/action checks, daily HMAC quotas, verified-attempt quotas, global
  ceilings, dedupe, generic accepted responses, and fail-closed errors.
- [ ] Add D1 migrations for reports, counters, triage, severity, resolution evidence, and public
  correction links.
- [ ] Add daily scheduled retention for 30-day reports and 14-day counters plus manual recovery
  commands.
- [ ] Add a zone WAF rate-limit launch requirement, secret-handling runbook, test keys, cost model,
  live verification checklist, kill switch, and self-hosting behavior.
- [ ] Test offline and report-service failures without disrupting the simulator.

## 6. Safe maintenance automation

- [ ] Document the fixed sanitized report projection supplied to maintenance agents and quote notes
  as untrusted evidence.
- [ ] Implement a daily batch triage job with read-only production access and a separate branch-only
  repository credential; do not trigger one agent per report.
- [ ] Permit agents to reproduce, source-check, add a failing regression, and draft a PR only.
- [ ] Prevent report text from selecting tools, changing instructions, accessing secrets, writing
  D1, merging, deploying, or changing review/endorsement records.
- [ ] Require human or named clinical review according to severity before merge and release.
- [ ] Add weekly open-report review, duplicate grouping, urgent-content withdrawal, resolution,
  correction-log, retention, and false-report procedures.
- [ ] Measure prompt-injection, malformed-context, duplicate-flood, stale-version, and withdrawn-
  scenario cases in an adversarial test suite.

## 7. Shared clinical capabilities

- [ ] General observations, histories, focused examinations, orders, results, trends, and canonical
  units with region-aware display.
- [ ] Medication and infusion intent with scenario-bounded formularies; never expose a real-patient
  calculator or accept real-patient details.
- [ ] Oxygen devices, airway states, spontaneous/assisted ventilation, noninvasive support,
  mechanical ventilation, gas exchange, and device failure.
- [ ] Fluids, blood components, hemorrhage, vascular tone, cardiac output, oxygen delivery, and
  shock composition.
- [ ] Rhythm generation, conduction, pacing, synchronized cardioversion, defibrillation,
  compressions, and bounded arrest/ROSC states.
- [ ] Neurologic responsiveness, seizure, paralysis, sedation, intracranial-pressure, and airway-
  protection teaching states with explicit non-examination limits.
- [ ] Glucose, sodium, potassium, calcium, magnesium, renal clearance, fluid balance, acid-base, and
  temperature teaching models with calibration envelopes.
- [ ] Infection source, inflammatory trajectory, antimicrobial timing as authored treatment intent,
  perfusion failure, and reassessment.
- [ ] Maternal physiology, fetal-tracing teaching state where licensed/sourced, delivery events,
  hemorrhage, hypertensive disorders, and neonatal handoff.
- [ ] Neonatal transition, respiratory support, thermoregulation, glucose, and bradycardia.
- [ ] Toxicologic syndrome drives, decontamination boundaries, antidote intent, and elimination
  limits without individual outcome prediction.
- [ ] Communication events for help, escalation, consultation, handoff, and disposition without
  claiming to simulate team performance.
- [ ] For every capability: sources, applicability, calibration, invariants, hostile inputs,
  deterministic replay, nonvisual representation, limitations, and cross-scenario regression.
- [ ] Add equipment-state capabilities for endotracheal-tube position, tracheostomy patency, and
  neonatal pleural-pressure deterioration; circle-system carbon-dioxide rebreathing is complete;
  state changes must alter canonical flow/ventilation rather than display text alone.
- [ ] Add bounded state-transition capabilities for evolving aortic malperfusion, autonomic
  dysreflexia, methemoglobinemia saturation gap, and cellular-therapy cytokine-release syndrome,
  each with explicit differential, escalation, and definitive-diagnosis boundaries.

## 8. Catalog production waves

- [x] Wave A: migrate and complete 39 anesthesia scenarios — all 39 are authored, registered,
  completion-audited, prerendered, available offline, and verified at 320 px.
- [ ] Wave B: complete 25 emergency-medicine and 24 critical-care scenarios.
  Emergency Medicine is available with 18 of 25 scenarios. These first 18 — undifferentiated,
  septic, hemorrhagic,
  tension-pneumothorax, cardiac-tamponade, community anaphylaxis, adult asthma, COPD exacerbation,
  acute pulmonary edema, pulmonary embolism with deterioration, STEMI, unstable narrow-complex
  tachycardia, unstable bradycardia, persistent VF arrest, PEA arrest, status epilepticus, acute
  ischemic stroke, and intracranial hemorrhage deterioration reuse the shared deterministic session,
  monitor, transcript, action, and debrief frame; all 18 are completion-audited, prerendered,
  available offline, and explicitly bounded. The remaining 7 titles are scope only.
- [ ] Wave C: complete 17 cardiology and 15 respiratory-medicine scenarios.
- [ ] Wave D: complete 16 pediatric, 15 obstetric, and 11 neonatal scenarios.
- [ ] Wave E: complete 15 neurology, 12 endocrine/metabolic, and 12 renal/electrolyte scenarios.
- [ ] Wave F: complete 10 infectious-disease and 15 toxicology scenarios.
- [ ] Wave G: complete 11 hematology/oncology, 10 surgery/trauma, and 9 medical-surgical-nursing
  scenarios.
- [ ] After every wave, verify the exact cumulative count, distinctness, capability reuse, path and
  competency coverage, sources, maturity labels, domain-pack budget, offline behavior, mobile
  layout, and complete regression fixtures.

## 9. Evidence and review for every scenario

- [ ] Write the evidence brief before implementation and identify disputed regional practice.
- [ ] Record primary/authoritative sources, exact locators, date consulted, applicability, review-by
  date, and copyrighted-material boundary.
- [ ] Define 2–5 observable objectives and explicitly mark psychomotor, physical-examination, team,
  and communication claims the browser cannot assess.
- [ ] Produce expert, common-error, and recovery transcripts before calling the scenario complete.
- [ ] Document every default, preselection, hidden trait, scripted delay, and randomization range;
  remove browser/framework defaults from clinical behavior.
- [ ] Complete the hazard analysis for premature closure, cue leakage, negative transfer,
  unsupported precision, omitted alternatives, invalid actions, model boundaries, catastrophic
  outcomes, accessibility misunderstanding, and regional variation.
- [ ] Pass expert, common-error, recovery, no-action, unsafe/refused, boundary-timing, region,
  seeded-extrema, guidance, keyboard, screen-reader, reduced-motion, phone, offline, replay, and
  report-context matrix rows.
- [ ] Add PEARLS debrief, causal attribution, bounded counterfactual, tutor rules, limitations,
  accessibility summary, and report coverage.
- [ ] Advance maturity only through independently verified, exact-version records.

## 10. Institutional adoption

- [ ] Generate a static adoption pack for a selected release containing catalog, competency maps,
  scenario maturity, sources, limitations, corrections, accessibility conformance, privacy/data
  flow, security model, build provenance, review records, and endorsement records.
- [ ] Support reviewed-only course links and pinned static content-pack versions without learner
  accounts or observation.
- [ ] Add local instructor import and cohort analysis while preserving learner-controlled export.
- [ ] Pilot with at least 3 distinct programs and record adoption objections, review scope, and
  corrections without collecting production learner telemetry.
- [ ] Publish organization endorsements only after authority, scope, version, region, expiration,
  conflicts, and revocation paths are complete.

## 11. Release verification

- [ ] Run full type, lint, architecture, unit, property, golden trace, deterministic replay,
  accessibility, responsive, performance, offline, content, maturity, privacy, report-security,
  source, license, and static-build gates.
- [ ] Verify exactly 256 complete scenario IDs at target completion, zero placeholder cards, zero
  waived quality gates, and zero scenarios failing the intrinsic training-versus-runtime-tool
  boundary; earlier releases publish their smaller honest passing count.
- [ ] Verify a full session makes no API call, then preview and submit one bounded report and inspect
  the D1 row.
- [ ] Verify all preview, reviewed, endorsed, overdue, and withdrawn labels against public records.
- [ ] Verify report Worker failure, D1 exhaustion, Turnstile failure, domain-pack failure, and offline
  installation leave playable cached scenarios intact.
- [ ] Re-run moderated catalog, first-action, tutor-understanding, and report-access procedures.
- [ ] Publish the release changelog with capability changes, scenario counts by maturity, known
  limitations, corrections, review coverage, and no unsupported efficacy claim.
