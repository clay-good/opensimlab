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
- [x] Wire validated exact-module/scenario/version quality records into both catalog generation
  and release checking. Reject duplicate, stale, unknown, and malformed records before writes or
  gate continuation; publish accepted payloads rather than trusting presence flags. Hypocalcemia
  supplies training-value, authored-defaults, and hazard records. Its state-space matrix and
  inclusive-runtime evidence remain missing, and every scenario's playable count remains zero.
- [x] Verify quality ingestion with 96 new checks, including actual catalog/release consumer
  execution, all four schema payloads, exact identities, duplicate/stale refusal, detached evidence,
  array/getter boundary regressions, and 39 hypocalcemia default entries checked against code and
  visible content. Full CI passes 3,856 tests across 476 files and all 30 specs; this change's delta
  specification also validates. Only the endocrine quality audit changes among generated catalogs;
  all 207 historical report records remain byte-identical. Static-host checks cover 224 routes and
  44 catalog artifacts. Compressed budgets are 147.9 KiB landing, 1,487.3 KiB cockpit, and 3,316.2 KiB
  offline; the final indexable build verifies 221 routes. An explicit preview-release attempt still
  refuses unmet gates, including hypocalcemia's completion and matrix evidence. No production
  service was changed.
- [x] Add literal dependency receipts for supplied quality records and verify them in both catalog
  and release consumers before writes or publication evaluation. Pin complete record bodies and
  declared file bytes, require shared boundaries and cited local files, and reject drift without
  refreshing receipts. The initial hypocalcemia snapshot covers 31 files and its three records;
  it does not add matrix evidence, clinical review, or playable credit.
- [x] Verify receipt integrity with 91 new tests, including real build/development/preview/reviewed
  consumer refusals, payload identity, missing coverage, file drift, path/symlink safety, reference
  grammar, and no automatic writes. All 108 focused checks and full CI's 3,971 tests across 480
  files pass, along with 30 specs and the change delta. Final static-host checks cover 224 routes
  and 44 catalog artifacts; 221 routes remain indexable. Compressed budgets remain 148.2 KiB
  landing, 1,487.6 KiB cockpit, and 3,319.9 KiB offline. All generated catalogs and 207 historical
  report records are unchanged. A real preview-release attempt still refuses outstanding gates.
- [ ] Complete dependency-bound invalidation with public stale-gate reporting, applicable maturity
  downgrade, and comprehensive transitive dependency coverage. The prepublication receipt check
  does not update a previously deployed catalog or establish remote-source currency, review expiry,
  test execution, or independent review. See `docs/quality-evidence-receipts.md`.
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

- [x] Replace the crowded shared header with a closed native Browse disclosure, preserving all
  15 destinations, SSR discovery, current markers, extra links, and the first skip link. Keep the
  expanded panel in document flow; stack narrow controls to avoid the measured 200% text overlap.
  Verify native no-script Enter/Space/Tab, 44 px link heights, scroll reachability, and independent
  reporting dismissal. The header measures 69 px on desktop and 113 px at a 320 px phone viewport.
  Full CI passes 3,878 tests across 478 files; 38 focused checks also pass after adding two final
  layout safeguards. Final lint, typecheck, 30 specs, change delta, 224 static routes, 44 catalog
  artifacts, and 221 indexable routes pass. Final compressed budgets are 148.2 KiB landing,
  1,487.6 KiB cockpit, and 3,319.9 KiB offline. All 207 historical report records are unchanged;
  no clinical content, review status, or production service changes. Screen-reader and actual
  400% zoom validation remain open; details are in the accessibility audit.
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
- [x] Keep the complete scenario route catalog out of the initial landing shell while retaining
  synchronous prerendering, canonical metadata, social previews, sitemap coverage, and offline routes.
  Production chunking now leaves lazy clinical, document, review, and educator routes outside the
  landing entry. CI follows Vite's emitted static-import manifest, includes the largest direct lab
  document and solver worker in the cockpit measurement, and still measures the entire artifact
  against the separate offline ceiling. The interface font is preloaded; the event-log-only mono
  face loads on demand. The engine-generated still ECG uses two-pixel min/max columns while the live
  sweep retains one-pixel density. Verified compressed totals are 148.1 KB landing, 1,153.9 KB to an
  interactive cockpit, and 2,502.3 KB for the complete offline artifact.
- [x] Keep cockpit-only waveform generators out of the landing route's shared ECG chunk. At the
  198-scenario checkpoint, the compressed landing total falls from 149.6 to 147.3 KiB under the
  unchanged 150 KiB ceiling; the interactive cockpit is 1,462.6 KiB and complete offline artifact
  3,245.3 KiB. The actual build-graph regression fails under the old whole-directory rule and passes
  with only the hero's ECG dependencies shared, with no duplicated main-thread waveform modules.
  Full CI and the 219-route indexable build pass. Production-browser checks retain the live ECG,
  four cockpit traces, and centered 160-character report form with focus return and manual pause.
  After stopping the local server, an unvisited endocrine catalog and myxedema briefing still open,
  and a fresh session advances and accepts a qualified-care choice from the cached build. This is
  local offline smoke evidence, not a physical-phone frame measurement, clinical signoff, or live
  Turnstile/D1 submission verification; those checks remain pending.
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

- [x] Specify and implement the exact report request/response schemas and generated scenario report
  catalog.
- [x] Add one shared report control to prebrief, live, debrief, source, and limitation surfaces.
- [x] Implement the accessible payload-preview dialog, category-only submission, optional 160-
  character note, and opt-in bounded recent context.
- [x] Structurally exclude reflections, local history, progress, imported files, arbitrary storage,
  real-world timestamps, identity, locale, user agent, and device data.
- [x] Implement a separately routed API-only Worker for exact config and POST paths with no asset,
  preview, `workers.dev`, public-read, or broader API surface.
- [x] Add server-derived metadata, origin/URL/content-type/body/schema/control-character validation,
  Turnstile Siteverify hostname/action checks, daily HMAC quotas, verified-attempt quotas, global
  ceilings, dedupe, generic accepted responses, and fail-closed errors.
- [x] Add D1 migrations for reports, counters, triage, severity, resolution evidence, and public
  correction links.
- [x] Add daily scheduled retention for 30-day reports and 14-day counters plus manual recovery
  commands.
- [ ] Add a zone WAF rate-limit launch requirement, secret-handling runbook, test keys, cost model,
  live verification checklist, kill switch, and self-hosting behavior. The repository now enforces
  fail-closed self-host identity, same-origin privacy ownership, exact routes, bounded costs, test
  guidance, and the kill switch; the production WAF rule and blocked-flood evidence remain live
  launch gates.
- [x] Test offline and report-service failures without disrupting the simulator.
  The shared dialog now bounds config, submission, and lazy Turnstile waits; UI tests prove that
  unavailable configuration and failed submission leave practice controls usable, while Worker
  tests cover Siteverify outages and generic fail-closed D1 lookup/persistence errors. The complete
  offline suite continues to prove that simulation assets and sessions have no API dependency.

## 6. Safe maintenance automation

- [x] Document the fixed sanitized report projection supplied to maintenance agents and quote notes
  as untrusted evidence. The dependency-free projector accepts only the fixed read-only export
  shape, rejects incomplete immutable evidence, omits private administration fields, groups and
  caps exact duplicates, and preserves every note only as a typed untrusted quotation. Adversarial
  tests cover hostile instructions, malformed context, duplicate floods, stale releases,
  withdrawn maturity, privacy exclusions, deterministic ordering, and overflow.
- [ ] Implement a daily batch triage job with read-only production access and a separate branch-only
  repository credential; do not trigger one agent per report. The daily read-only export,
  fail-closed projection, authenticated encryption, and 8-day private review artifact are
  implemented; agent and branch credentials remain disabled pending the stated validation gates.
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
- [x] Wave B: complete 25 emergency-medicine and 24 critical-care scenarios.
  Emergency Medicine is complete with 25 of 25 scenarios. These 25 — undifferentiated,
  septic, hemorrhagic,
  tension-pneumothorax, cardiac-tamponade, community anaphylaxis, adult asthma, COPD exacerbation,
  acute pulmonary edema, pulmonary embolism with deterioration, STEMI, unstable narrow-complex
  tachycardia, unstable bradycardia, persistent VF arrest, PEA arrest, status epilepticus, acute
  ischemic stroke, intracranial hemorrhage deterioration, diabetic ketoacidosis, and hyperkalemia
  with ECG change, severe hyponatremia with seizure, opioid toxicity, exertional heat stroke,
  trauma primary survey, and acute aortic syndrome reuse the shared deterministic session, monitor,
  transcript, action, and debrief frame; all 25 are completion-audited, prerendered, available
  offline, and explicitly bounded.
  Critical Care is complete with 24 of 24 scenarios. ARDS lung-protective ventilation, escalating
  hypoxemia, ventilator dyssynchrony, auto-PEEP, mucus plugging, unplanned extubation, and
  spontaneous-breathing trial, post-intubation hypotension, cardiogenic shock, mixed shock, and
  right-ventricular failure, massive pulmonary embolism, upper GI hemorrhage, refractory status
  epilepticus, post-arrest temperature control, intracranial hypertension, and acute kidney injury
  with fluid overload, severe acidemia, ICU handoff with hidden deterioration, and ventilator
  circuit disconnection, delayed vasopressor delivery, pulse-oximeter motion artifact, and
  endotracheal-tube migration after repositioning, and persistent septic-shock resuscitation reuse
  the shared deterministic
  session, monitor, transcript, action, and debrief frame and are completion-audited, prerendered,
  available offline, and explicitly bounded.
- [x] Wave C: complete 17 cardiology and 15 respiratory-medicine scenarios. Cardiology is live with
  all 17 scenarios: stable chest-pain evaluation, STEMI recognition and first actions, NSTEMI risk
  reassessment, acute decompensated heart failure, post-infarction cardiogenic-shock escalation,
  atrial fibrillation with rapid response, regular narrow-complex tachycardia, wide-complex tachycardia,
  symptomatic bradycardia, complete heart block, torsades de pointes, hyperkalemic conduction
  disturbance, pericardial tamponade, right-ventricular infarction, hypertensive emergency, and
  pacemaker capture failure, and transcutaneous pacing mechanical-capture reassessment. Respiratory
  medicine is live with all 15 scenarios: acute severe asthma reassessment after documented initial
  therapy, COPD exacerbation recovery-versus-readiness transition reassessment, hypoxemic
  community-acquired pneumonia reassessment, and persistent dyspnea after pulmonary embolism with
  bounded CTEPD evidence review, expert referral, and unresolved-work handoff, and acute pulmonary
  edema respiratory-support reassessment with progressive-failure recognition, airway-capable
  escalation, and active-care handoff after documented initial treatment, and spontaneous tension
  pneumothorax post-drainage reassessment with parallel drain-system and definitive-planning review
  and an elapsed unresolved-work handoff after experienced-team emergency care, and large unilateral
  pleural-effusion reassessment with image-guided symptom-limited aspiration intent, an authored
  stop checkpoint, open-cause review, and pending-result ownership, and bronchiectasis mucus-
  plugging reassessment with individualized respiratory-physiotherapy intent, a partial fixed
  response, persistent focal-collapse evaluation, and an elapsed unresolved-work handoff, and
  chronic opioid-related hypoventilation reassessment with fixed awake and attended sleep evidence,
  parallel contributor review, shared medication-and-respiratory safety ownership, and an elapsed
  unresolved-work handoff without selecting a taper, reversal, or positive-pressure device, and
  neuromuscular respiratory-failure reassessment in established ALS with serial mechanics and cough
  evidence, parallel urgent escalation and contributor review, patient-centered ownership, and an
  elapsed unresolved-work handoff without selecting respiratory support, airway clearance, or a
  procedure, and stable obesity-hypoventilation reassessment with fixed awake and attended sleep
  evidence, parallel evidence review, bounded pattern recognition, respectful shared ownership, and
  an elapsed unresolved-work handoff without selecting PAP, oxygen, a weight intervention, or
  treatment, and bilevel NIV selection for persistent acute-on-chronic acidotic hypercapnic COPD
  after verified initial care, with calm nonmutating modality feedback, a strictly elapsed fixed
  first-hour response, explicit continuation and failure guards, and another elapsed active-support
  handoff without choosing a device, interface, setting, oxygen target, intubation, or treatment, and
  high-flow nasal oxygen selection for persistent de novo nonhypercapnic hypoxemia after verified
  conventional oxygen, with calm nonmutating modality feedback, a strictly elapsed fixed 30-minute
  response, explicit continuation and whole-patient failure guards, and another elapsed active-support
  handoff without calculating ROX or a PaO₂/FiO₂ ratio or choosing equipment, settings, oxygen,
  intubation, or treatment, and a portable oxygen source interruption during transport with
  pulse-coherent deterioration, immediate separate verified bridge support before troubleshooting,
  fixed source-to-patient localization, checked replacement and independent-backup intent, a
  strictly elapsed response, and another elapsed systems-focused handoff without cylinder math,
  device operation, oxygen delivery, blame, transport clearance, or outcome claims.
  The final lab adds acute obstruction of a declared removable tracheostomy inner cannula with
  anatomy-first recognition, expert help and oxygenation to both possible airways, a canonical
  tracheostomy gas-path correction by qualified staff, a strictly elapsed response, and another
  elapsed active-risk handoff without teaching suction, tube exchange, ventilation, or laryngectomy
  care.
- [ ] Wave D: complete 16 pediatric, 15 obstetric, and 11 neonatal scenarios.
  - [x] Pediatrics slice 1/16 adds the available module foundation and one undifferentiated
    respiratory-distress lab with whole-child recognition, experienced support, a misleading early
    saturation improvement, a strictly later fatigue pattern, airway-capable rescue ownership, and
    elapsed active-risk handoff without disease-specific treatment, device, dose, or procedure controls.
  - [x] Pediatrics slice 2/16 adds one authored 12-month-old bronchiolitis reassessment with
    illness-day, feeding, hydration, and apnea-risk review; experienced supportive-care ownership;
    a strictly elapsed partial response; contextual restraint of routine imaging and low-value
    medicines; and active-risk handoff without device, route, dose, suction, treatment, or
    disposition controls.
  - [x] Pediatrics slice 3/16 adds one authored 3-year-old croup reassessment with calm
    caregiver-centered support, whole-child upper-airway severity and alternative-red-flag review,
    qualified-team corticosteroid and nebulized epinephrine intent, a strictly elapsed early
    response, later recurrent stridor at rest, and active-risk handoff without learner drug, dose,
    device, airway-procedure, treatment, or disposition controls.
  - [x] Pediatrics slice 4/16 adds one authored 10-year-old established-asthma reassessment after
    verified first-hour qualified care, with whole-child severe-nonresponse recognition, early
    pediatric critical-care and airway-capable escalation, experienced-team ownership and monitoring
    for the supplied second-line plan, a strictly elapsed partial response, and elapsed active-risk handoff without
    learner examination, peak flow, scoring, drug, dose, route, oxygen, device, intravenous access,
    airway, treatment, or disposition controls.
  - [x] Pediatrics slice 5/16 adds one authored 6-year-old infection-associated coagulation-
    dysfunction reassessment without current shock, with supplied Phoenix classification,
    verified qualified evaluation and antimicrobial care, explicit shock surveillance, source and
    organ review, a strictly elapsed partial trajectory, and elapsed active-risk handoff without
    learner examination, screening, score calculation, testing, diagnosis, antimicrobial, dose,
    route, access, fluid, vasoactive, oxygen, device, source-control, treatment, or disposition
    controls.
  - [x] Pediatrics slice 6/16 adds one authored 4-year-old persistent septic-shock reassessment
    after individually reassessed qualified fluid aliquots, with supplied Phoenix cardiovascular
    classification, explicit congestion stop warnings, critical-care and unnamed-vasoactive
    ownership in parallel with source-control escalation, a strictly elapsed partial-stabilization
    report, and elapsed active-risk handoff without learner examination, score calculation, testing,
    imaging interpretation, diagnosis, antimicrobial, fluid, dose, access, vasoactive, oxygen,
    device, procedure, treatment, or disposition controls.
  - [x] Pediatrics slice 7/16 adds one authored 2-year-old compensated dehydration-with-
    hypovolemia reassessment after acute watery gastrointestinal losses, with a reliable same-scale
    weight history treated as context rather than a calculated deficit, explicit no-current-shock
    findings, qualified rehydration ownership in parallel with ongoing-loss and safety review, a
    strictly elapsed partial response, and elapsed active-risk handoff without learner examination,
    weighing, percentage, deficit or maintenance calculation, testing, diagnosis, fluid, route,
    volume, rate, access, electrolyte, feeding, device, treatment, or disposition controls.
  - [x] Pediatrics slice 8/16 adds one authored 9-year-old pediatric diabetic-ketoacidosis
    reassessment with a supplied glucose-ketone-acid-base pattern, explicit no-current-shock and
    no-current-cerebral-injury-warning-cluster findings, qualified DKA care ownership in parallel with neurological
    and metabolic safety review, a strictly elapsed improving-but-unresolved report, and elapsed
    active-risk handoff without learner examination, calculation, testing, diagnosis, fluid,
    insulin, glucose, electrolyte, access, pump, device, treatment, or disposition controls.
  - [x] Pediatrics slice 9/16 adds one authored afebrile 5-year-old hypoglycemic-seizure
    reassessment after a brief generalized convulsion stopped before the learner surface, with a
    supplied qualified glucose result, immediate qualified rescue ownership in parallel with open
    cause and recurrence-risk review, a strictly elapsed improving-but-unresolved report, and
    elapsed active-risk handoff without learner examination, glucose acquisition or interpretation,
    diagnosis, glucose, glucagon, carbohydrate, anticonvulsant, route, concentration, dose, access,
    airway, device, procedure, treatment, or disposition controls.
  - [x] Pediatrics slice 10/16 adds one authored 2-year-old febrile-seizure recovery
    reassessment after a brief stopped bilateral generalized event, with provisional simple
    features to date, qualified fever-source and serious-illness ownership in parallel with
    infection, recurrence, complex-feature, alternative-cause, caregiver-safety, and escalation
    review, a strictly elapsed improving-but-unresolved report, and elapsed active-risk handoff
    without learner examination, seizure timing, routine testing, diagnosis, drug, dose, route,
    access, airway, device, procedure, treatment, communication-performance, or disposition
    controls.
  - [x] Pediatrics slice 11/16 adds one authored 6-year-old persistent convulsive-status
    reassessment after 2 supplied documented appropriate first-line doses, with immediate qualified
    second-line ownership in parallel with airway, cause, and refractory-boundary review, a strictly
    elapsed visible-response report, and elapsed active-risk handoff without learner seizure timing,
    examination, monitoring, glucose acquisition, medication verification, drug, dose, route,
    access, infusion, airway, EEG, procedure, treatment, or disposition controls.
  - [x] Pediatrics slice 12/16 adds one authored 6-year-old persistent anaphylaxis reassessment 5
    minutes after supplied community first-line care, with immediate qualified repeat-care and
    pediatric resuscitation ownership before airway, asthma-overlap, cause, circulation, and
    refractory-boundary review, a strictly elapsed partial-response report, and elapsed
    observation, allergy, recurrence, caregiver, and escalation-risk handoff without learner
    examination, criteria scoring, diagnosis, product, dose, route, injector, oxygen or fluid
    delivery, airway procedure, observation-duration, referral, or disposition controls.
  - [x] Pediatrics slice 13/16 adds one authored 6-year-old probable supraventricular-tachycardia
    reassessment with an abrupt fixed regular narrow rhythm, poor peripheral perfusion despite a
    measurable blood pressure, immediate qualified rhythm-care and resuscitation ownership, a
    strictly elapsed improving response, and elapsed recurrence, cardiology, cause, caregiver, and
    deterioration-risk handoff without learner examination, pulse assessment, ECG acquisition or
    interpretation, vagal maneuver, drug, dose, route, access, oxygen, sedation, pad,
    synchronization, energy, cardioversion, test, procedure, treatment, or disposition controls.
  - [x] Pediatrics slice 14/16 adds one authored 6-year-old bradycardia-to-arrest transition after
    supplied effective ventilation with oxygen, with persistent HR below 60/min, a central pulse,
    and severe compromise triggering qualified CPR and resuscitation ownership before pulse loss;
    a strictly elapsed fixed PEA checkpoint; and elapsed active-resuscitation handoff without
    learner examination, pulse assessment, airway or ventilation assessment, oxygen delivery, CPR
    mechanics, monitoring or rhythm interpretation, drug, dose, route, access, pacing, shock,
    energy, device, procedure, cause treatment, termination, post-arrest care, disposition, or
    outcome controls.
  - [x] Pediatrics slice 15/16 adds one authored 6-year-old foreign-body-airway-obstruction
    trajectory from an effective cough with preserved speech and airflow through a strictly elapsed
    severe responsive obstruction and then a strictly elapsed unresponsive transition, with
    qualified responsive and unresponsive pathway ownership and active-risk handoff without learner
    examination, cough or pulse assessment, back blow, thrust, sweep, suction, oxygen, ventilation,
    compression, CPR-sequence, object removal, airway device, laryngoscopy, bronchoscopy, drug,
    procedure, treatment, disposition, recovery, ROSC, or outcome controls.
  - [x] Pediatrics slice 16/16 completes the wave with one authored stable 2-year-old injury-
    safeguarding presentation whose supplied ear and clustered lateral-torso bruises are not
    adequately explained by one reported forward fall, requiring non-diagnostic concern recognition,
    immediate qualified safeguarding and safety ownership, medical-alternative and information-
    boundary review, a strictly elapsed protected safety state, and elapsed unresolved-risk handoff
    without learner examination, interviewing, bruise identification or dating, photography, body
    mapping, scenario-collected clinical or sensitive free text, screening-rule calculation, testing,
    imaging, abuse or perpetrator
    diagnosis, credibility judgment, confrontation, referral or report submission, jurisdiction or
    law selection, custody action, procedure, treatment, disposition, prognosis, or outcome controls.
  - [x] Obstetrics slice 1/15 adds the available module foundation and one authored early postpartum-
    hemorrhage-from-atony presentation 8 minutes after vaginal birth, with objective 650 mL-and-
    rising loss, abnormal physiology, a supplied boggy uterus, threshold-independent recognition,
    open trauma, tissue, thrombin and concealed-bleeding causes, immediate multidisciplinary and
    dignity-centered ownership, bounded qualified MOTIVE-bundle intent, a strict elapsed partial-
    improvement report, and another elapsed active-risk handoff without learner measurement,
    calculation, examination, diagnosis, drug, dose, route, fluid, blood component, massage,
    tamponade, procedure, surgery, disposition, fertility, or maternal/newborn outcome controls.
  - [x] Obstetrics slice 2/15 adds one authored postpartum infection-plus-organ-dysfunction pattern
    after prolonged membrane rupture and cesarean birth, with recognition that does not depend on
    fever, one score, one value or a confirmed source; immediate qualified sepsis, critical-care,
    source-control, newborn and dignity-centered ownership; parallel infectious, noninfectious,
    perfusion and organ review; bounded immediate-care intent; a strict elapsed partial-improvement
    report; and active-risk handoff without learner examination, scoring, testing, prescribing,
    fluid, vasopressor, oxygen, source-control, procedure, disposition, or outcome controls.
  - [x] Obstetrics slice 3/15 adds one authored concealed placental-abruption hemorrhage pattern
    with deliberately small visible loss beside maternal hypoperfusion, abrupt pain, a supplied
    tense tender uterus, fetal compromise and early coagulation concern; whole-pattern recognition
    without visible-volume, ultrasound or single-cause closure; immediate obstetric hemorrhage,
    anesthesia, blood-bank, operating-room, neonatal and dignity-centered ownership; bounded
    simultaneous resuscitation, coagulation and urgent-delivery intent; a strict elapsed readiness
    report; and active-risk handoff without learner examination, measurement, calculation, fetal-
    trace or ultrasound interpretation, blood, drug, anesthesia, delivery, procedure, disposition,
    fertility, or maternal/newborn outcome controls.
  - [x] Obstetrics slice 4/15 adds de novo day-6 postpartum persistent severe hypertension with
    neurologic symptoms and supplied platelet, renal and hepatic severe-feature evidence after a
    normotensive pregnancy. Two correctly obtained severe-range pressures trigger immediate local-
    protocol and qualified obstetric response without waiting for urine protein; organ and
    dangerous alternative-cause review continues in parallel; a fixed report authored as 30
    minutes after activation remains hypertensive and symptomatic; and active-risk handoff
    preserves maternal-newborn continuity, follow-up and longer-term risk without learner pressure
    measurement, examination, test interpretation, diagnosis, drug, magnesium, dose, target,
    airway or seizure care, separation, feeding, disposition, follow-up, or outcome controls.
  - [x] Obstetrics slice 5/15 adds one authored 38-week first generalized convulsion that has stopped
    before the learner surface, with severe pressure, neurologic symptoms, platelet, renal, hepatic,
    glucose, recovery and fetal context; nonexclusive eclampsia-pattern recognition; immediate
    qualified maternal stabilization, seizure, severe-pressure, airway-ready, obstetric, fetal and
    dignity-centered response before broad cause review; a fixed 20-minute report that proves no
    durable seizure or pressure control or fetal safety; and active-risk handoff without learner
    seizure first aid, examination, measurement, testing, diagnosis, magnesium or other drug, dose,
    route, airway, anesthesia, birth, procedure, disposition, treatment effect, or maternal/newborn
    outcome controls.
  - [x] Obstetrics slice 6/15 adds one authored pulse-present rapid maternal cardiorespiratory-
    collapse-and-coagulopathy pattern 4 minutes after birth and placental delivery, with breathing
    and circulation deterioration preceding diffuse bleeding, a supplied firm uterus, immediate
    coordinated obstetric, anesthesia, critical-care, cardiopulmonary, hemorrhage, newborn and
    dignity-centered ownership, dangerous alternatives left open, a fixed 12-minute report that
    preserves a pulse and unresolved shock, hypoxemia, bleeding and coagulation risk, and active-risk
    handoff without learner examination, measurement, test interpretation, diagnosis, research-
    criteria scoring, oxygen, ventilation, airway, fluid, vasoactive, blood, coagulation, drug, dose,
    route, CPR, defibrillation, ECMO, delivery, procedure, disposition, treatment effect, durable
    control, or maternal/newborn outcome controls.
  - [x] Obstetrics slice 7/15 adds one authored witnessed late-pregnancy pulseless-electrical-
    activity arrest with fundal height above the umbilicus and qualified standard resuscitation
    already underway; immediate prepared pregnancy-arrest, obstetric, anesthesia, in-place delivery,
    newborn, hemorrhage, communication and support ownership; parallel pregnancy-modification,
    reversible-cause and readiness review; a strict minute-4 persistent-arrest report as qualified
    resuscitative delivery begins at the arrest location; and active-risk handoff without learner
    pulse or rhythm assessment, CPR, uterine displacement, airway, access, monitoring, drug, dose,
    shock, fluid, blood, fetal monitoring, ECMO, delivery, procedure, transfer, termination,
    disposition, prognosis, or maternal/newborn outcome controls.
  - [x] Obstetrics slice 8/15 adds one authored shoulder-dystocia cognitive sequence beginning after
    head delivery and failed gentle axial traction; immediate prepared-team, clock, leadership,
    timekeeping, newborn, communication and support ownership; explicit no-fundal-pressure and
    no-forceful-traction boundaries; flexible case-specific first-line and qualified escalation
    review; a fixed completed-birth report without a universal maneuver order; and maternal/newborn
    injury, hemorrhage, documentation, support and outcome handoff without learner examination,
    traction, pushing, positioning, pressure, maneuver, episiotomy, delivery, newborn care, drug,
    dose, procedure, injury determination, disposition or outcome controls.
  - [x] Obstetrics slice 9/15 adds one authored overt umbilical-cord-prolapse escalation after
    membrane rupture, fetal bradycardia and qualified examination; immediate clock, theatre,
    anesthesia, newborn, leadership, communication and support ownership; qualified temporary
    pressure-relief and minimal-handling boundaries that cannot delay birth; case-specific urgency,
    mode, anesthesia and maternal-safety review; a fixed persistent-compromise theatre-transfer
    report; and active-risk handoff without learner examination, monitoring interpretation, cord
    handling or replacement, presenting-part elevation, bladder filling, positioning, medication,
    anesthesia, delivery, newborn care, disposition or outcome controls.
  - [x] Obstetrics slice 10/15 adds one authored suspected uterine-rupture pattern during labour
    after prior caesarean birth with persistent between-contraction pain, abrupt fetal-heart change,
    loss of station, cessation of uterine activity, bleeding and evolving maternal compromise;
    immediate category-1 surgical, anesthesia, blood, newborn, communication and support ownership;
    explicit nonclassic-triad and diagnostic-uncertainty boundaries; parallel maternal-fetal,
    hemorrhage, surgical, fertility and communication readiness; a fixed worsening laparotomy-start
    report; and active-risk handoff without learner examination, CTG interpretation, diagnosis,
    resuscitation, drug, dose, anesthesia, delivery, surgery, hysterectomy, disposition or outcome.
  - [x] Obstetrics slice 11/15 adds one authored postpartum magnesium-sulfate toxicity pattern after
    documented seizure-prophylaxis exposure with oliguria, rising creatinine, drowsiness, weakness,
    reflex loss and respiratory depression; immediate airway-capable obstetric, critical-care,
    pharmacy, renal, newborn, communication and support ownership; explicit level-unit and
    alternative-cause boundaries; parallel qualified source-stop, ventilation, calcium-antidote and
    monitoring readiness; a fixed partial-response report; and active-risk handoff without learner
    examination, monitoring or laboratory interpretation, diagnosis, infusion operation, airway or
    seizure care, oxygen, ventilation, calcium or other drug, dose, route, procedure, newborn
    assessment, disposition or outcome.
  - [x] Obstetrics slice 12/15 adds one authored high-neuraxial-block pattern after qualified
    epidural top-up with ascending sensory and motor findings, arm weakness, breathing and speech
    difficulty, bradycardia, hypotension and fetal bradycardia; immediate airway-capable anesthesia,
    obstetric, theatre, newborn, communication and support ownership; explicit rapid-progression,
    awareness and alternative-cause boundaries; parallel maternal, fetal, airway, circulation,
    uterine-displacement and birth readiness; a fixed partial-support report; and active-risk handoff
    without learner examination, block assessment, monitoring interpretation, diagnosis, infusion
    operation, position, oxygen, ventilation, airway care, fluid, vasopressor or another drug, dose,
    anesthesia, delivery, procedure, newborn assessment, disposition or outcome.
  - [x] Obstetrics slice 13/15 adds one authored failed-intubation pattern after 2 unsuccessful
    qualified-team attempts with declared failure, experienced help, effective second-generation
    supraglottic ventilation and sustained capnography; immediate oxygenation-first anesthesia,
    obstetric, theatre, newborn, communication and support ownership; explicit attempt-limit, CICO,
    aspiration and awareness boundaries; individualized wake-or-proceed review; a fixed qualified
    proceeding-to-essential-surgery report; and active-risk handoff without learner examination,
    monitoring interpretation, diagnosis, airway care, oxygen, ventilation, device, drug, dose,
    anesthesia, surgery, delivery, newborn care, procedure, disposition or outcome.
  - [x] Obstetrics slice 14/15 adds one authored urgent-term-birth maternal-to-neonatal resuscitation
    handoff after qualified assisted ventilation for apnea and a supplied heart rate below 100/min;
    explicit separate maternal and newborn ownership, sender, receiver, shared clock and family-
    communication ownership; antenatal, intrapartum, birth, newborn, timed-intervention, response and
    open-risk reconciliation; ventilation-priority review without stable-transition closure; an
    interruption-limited structured transfer with readback and explicit responsibility; a fixed
    5-minute qualified postresuscitation report; and active-risk handoff without learner examination,
    monitoring or test interpretation, scoring, diagnosis, resuscitation, oxygen, ventilation,
    airway, compressions, access, fluid, blood, glucose, drug, dose, anesthesia, surgery, delivery,
    newborn care, transport, cooling, counseling, procedure, disposition or outcome controls.
  - [x] Obstetrics slice 15/15 completes the wave with one authored oxytocin-associated uterine-
    tachysystole pattern of 6 contractions per 10 minutes averaged over 30 minutes and a supplied
    deteriorating fetal-heart trajectory; immediate qualified obstetric, fetal-surveillance,
    newborn, communication, dignity and support ownership; infusion, contraction, fetal, maternal,
    labour and whole-person reconciliation; whole-pattern recognition without trace or diagnosis
    closure; qualified source-stop, non-supine position, cause, surveillance and birth-readiness
    review that excludes routine oxygen in normoxia and reflex fluid without hypotension or sepsis;
    a fixed early-recovery report; and active-risk handoff without learner examination, palpation,
    monitoring interpretation, infusion operation, position, oxygen, fluid, drug, dose, stimulation,
    amnioinfusion, anesthesia, surgery, delivery, newborn care, procedure, restart or birth decision,
    disposition or outcome controls.
  - [x] Neonatology slice 1/11 adds the available module foundation and one authored stable term-
    newborn transition with a shared birth clock, breathing or crying, good tone, adequate heart rate,
    protected skin-to-skin thermal care, deferred-cord and observation review, a fixed 1-hour
    qualified report, and active-risk handoff without learner examination, scoring, monitoring or
    test interpretation, cord care, positioning, drying, warming, suction, stimulation, separation,
    oxygen, ventilation, airway care, compressions, access, fluid, glucose, drug, dose, feeding,
    resuscitation, transport, counseling, procedure, disposition, or outcome controls.
  - [x] Neonatology slice 2/11 adds one authored term neonatal-apnea pattern after qualified initial
    steps with heart rate 92/min at 40 seconds; prepared ventilation-capable and parent-dyad
    ownership; birth-clock, breathing, heart-rate, tone, thermal and whole-dyad reconciliation;
    assisted-ventilation threshold recognition; qualified ventilation-effectiveness and escalation
    readiness review; a fixed 90-second early-response report; and active-risk handoff without
    learner examination, scoring, monitoring or test interpretation, positioning, drying, warming,
    suction, stimulation, separation, oxygen, ventilation, airway care, corrective steps,
    compressions, access, fluid, glucose, drug, dose, feeding, resuscitation, transport, counseling,
    procedure, disposition, or outcome controls.
  - [x] Neonatology slice 3/11 adds one authored ineffective face-mask ventilation pattern after 30
    seconds of qualified support without chest movement or heart-rate rise; exact birth, interface,
    oxygenation, thermal, parent and whole-dyad reconciliation; effectiveness recognition using
    heart-rate rise as the primary signal; qualified correction, alternative-airway readiness and
    compression-boundary review; a fixed 2-minute correction-response report; and active-risk
    handoff without learner examination, scoring, monitoring or test interpretation, device
    handling, position, suction, stimulation, oxygen or pressure selection, ventilation, corrective
    step, airway placement, compression, access, fluid, glucose, drug, feeding, resuscitation,
    transport, counseling, procedure, disposition, or outcome controls.
  - [x] Neonatology slice 4/11 adds one authored persistent heart rate 48/min pattern after 30 seconds
    of qualified ventilation that visibly inflates the lungs through an alternative airway;
    advanced-team and parent-dyad ownership; adequate-ventilation, airway, heart-rate, oxygenation,
    thermal, bleeding-risk and whole-dyad reconciliation; compression-threshold recognition only
    after ventilation verification; qualified coordination, reassessment, access-readiness and later
    epinephrine-boundary review; a fixed 3-minute early-response report; and active-risk handoff
    without learner examination, scoring, monitoring interpretation, device handling, oxygen or
    ventilation delivery, airway placement or verification, compression, access, fluid, blood,
    glucose, drug, feeding, resuscitation, transport, counseling, procedure, disposition, or outcome
    controls.
  - [x] Neonatology slice 5/11 adds one authored vigorous term transition through thin meconium-
    stained fluid; prepared newborn-airway and parent-dyad ownership; fluid, breathing, cry, tone,
    heart-rate, airway-visibility, thermal and whole-dyad reconciliation; recognition that meconium
    alone is not a routine oral, nasal or tracheal suction indication; qualified protected-care,
    observation, obstruction-triggered selective-airway-clearing and escalation-boundary review; a
    fixed 30-minute respiratory report; and active-risk handoff without learner examination,
    scoring, monitoring interpretation, positioning, drying, warming, suction, stimulation,
    separation, device handling, oxygen, ventilation, airway care, compression, access, fluid,
    glucose, drug, feeding, resuscitation, transport, counseling, procedure, diagnosis, disposition,
    or outcome controls.
  - [x] Neonatology slice 6/11 adds one authored 29-week spontaneous-breathing respiratory-distress
    pattern; prepared preterm-newborn, respiratory, thermal, transfer and parent-dyad ownership;
    gestation, birth-clock, breathing, work, heart-rate, preductal-oxygenation, temperature and
    whole-dyad reconciliation; qualified CPAP-first recognition without routine intubation;
    pulse-oximetry-guided oxygen-titration, wrap, hat, temperature-surveillance and escalation-
    boundary review; a fixed 10-minute respiratory and thermal report; and active-risk handoff
    without learner examination, scoring, monitoring interpretation, positioning, drying,
    stimulation, thermal care, device handling, CPAP, oxygen or setting selection, suction,
    ventilation, airway care, compression, access, fluid, glucose, surfactant, drug, feeding,
    resuscitation, transport, counseling, procedure, diagnosis, disposition, or outcome controls.
  - [x] Neonatology slice 7/11 adds one authored symptomatic confirmed low-glucose pattern in a term
    infant of a mother with diabetes; newborn, glucose, feeding, neurologic, escalation and parent-
    dyad ownership; risk, clock, signs, bedside and laboratory glucose, thermal and whole-dyad
    reconciliation; urgent-pattern recognition without a universal definition or injury threshold;
    qualified local-protocol treatment, confirmation, serial-reassessment and recurrent-cause
    boundary review; a fixed 30-minute glucose and symptom report; and active-risk handoff without
    learner history, examination, scoring, monitoring, glucose or test acquisition or interpretation,
    diagnosis, feeding, glucose gel, IV dextrose, fluid, drug, dose, access, thermal care, device
    handling, oxygen, ventilation, airway care, resuscitation, transport, counseling, procedure,
    disposition, or outcome controls.
  - [x] Neonatology slice 8/11 adds one authored clinically ill term-newborn infection-risk pattern
    after maternal fever, prolonged rupture, unknown GBS status and late maternal antibiotics;
    newborn, infection, respiratory, circulatory, laboratory, pharmacy, transport and parent-dyad
    ownership; maternal-risk, clock, clinical-change, physiology and whole-dyad reconciliation;
    urgent sepsis-risk recognition without calculator, isolated-laboratory, diagnosis or exclusion
    closure; qualified culture, empiric antimicrobial, respiratory, circulatory, glucose, thermal,
    investigation, reassessment and stewardship-boundary review; a fixed 1-hour partial-response
    and pending-culture report; and active-risk handoff without learner history, examination,
    scoring, monitoring or test work, risk calculation, diagnosis, support, access, fluid, glucose,
    antimicrobial, drug, dose, feeding, device, ventilation, airway care, resuscitation, transport,
    counseling, procedure, duration, disposition, or outcome controls.
  - [x] Neonatology slice 9/11 adds one authored late-preterm unintentional-hypothermia pattern
    after a transfer and warming-continuity gap; newborn, thermal, glucose, feeding, respiratory,
    escalation and parent-dyad ownership; gestation, admission and current temperature,
    environment, transfer, behavior, physiology and whole-dyad reconciliation; urgent rewarming
    recognition without rate, cause, diagnosis or therapeutic-cooling closure; qualified warm-chain,
    frequent or continuous monitoring, glucose, feeding, cause, serial-reassessment and
    hyperthermia-prevention boundary review; a fixed 45-minute partial report; and active-risk
    handoff without learner history, examination, scoring, temperature, monitoring or test work,
    diagnosis, warming, cooling, skin-to-skin care, device operation, set-point or rate selection,
    feeding, glucose, fluid, drug, access, oxygen, respiratory support, ventilation, airway care,
    resuscitation, transport, counseling, procedure, disposition, or outcome controls.
  - [x] Neonatology slice 10/11 adds one authored late-preterm postresuscitation transfer from the
    delivery room to NICU; named sending, receiving, transport, respiratory, monitoring,
    documentation, escalation and parent-dyad ownership; perinatal, birth, intervention-response,
    current-state, absent-action, pending-data and whole-dyad reconciliation; patient, assessment,
    situation, safety, background, actions, timing, ownership and next-step content review;
    qualified support continuity, route, destination, receiver-question, check-back, documentation,
    escalation, dignity and reunification boundaries; a fixed receiver confirmation and 10-minute
    arrival report; and active-risk handoff without learner history, examination, scoring,
    monitoring or record work, diagnosis, thermal or respiratory care, device or setting operation,
    ventilation, airway care, access, glucose, fluid, blood, drug, feeding, resuscitation,
    positioning, transport, communication, check-back, documentation, counseling, procedure,
    disposition, or outcome controls.
  - [x] Neonatology slice 11/11 adds one authored sudden asymmetric ventilation and rapid
    cardiopulmonary deterioration pattern during qualified neonatal positive-pressure support;
    neonatal emergency, respiratory, decompression, drain, monitoring, analgesia, imaging,
    escalation and family ownership; support, device-report, clock, oxygenation, circulation,
    unilateral-finding, perfusion and whole-dyad reconciliation; urgent suspected tension-
    pneumothorax recognition without radiography delay in an unstable newborn; qualified
    oxygenation, ventilation, decompression, locally protocolized equipment and site, analgesia,
    drain, imaging and serial-reassessment boundary review; a fixed 2-minute partial
    postdecompression report; and active-risk handoff without learner history, examination,
    auscultation, transillumination, imaging, monitoring or test work, circuit or airway checking,
    device operation, setting, equipment or site selection, positioning, oxygenation, ventilation,
    airway care, decompression, drain, access, analgesia, fluid, blood, drug, resuscitation,
    transport, communication, documentation, counseling, procedure, diagnosis, disposition, or
    outcome controls.
- [ ] Wave E: complete 15 neurology, 12 endocrine/metabolic, and 12 renal/electrolyte scenarios.
  - [x] Neurology slice 1/15 adds one authored 62-year-old minor nondisabling acute ischemic-stroke
    reassessment with patient-specific function rather than NIHSS alone, fixed no-hemorrhage and
    no-LVO imaging context, qualified antiplatelet-strategy and surveillance intent, a strict later
    persistent-but-not-worsened sensory trajectory, and another elapsed etiology, recurrence,
    prevention, rehabilitation, and active-risk handoff without learner examination, scoring,
    imaging or test acquisition or interpretation, diagnosis, disability or eligibility
    adjudication, antiplatelet product, combination, dose, duration, route, access, prescription,
    preparation or delivery, thrombolytic, blood-pressure treatment, reperfusion, procedure,
    rehabilitation prescription, disposition, prognosis, treatment-effect, or outcome controls.
  - [x] Neurology slice 2/15 adds one authored late-window basilar-artery-occlusion escalation with a
    10-hour posterior syndrome, supplied baseline function, NIHSS, CT, CTA, and pc-ASPECTS context,
    immediate qualified endovascular and airway-capable ownership, strict later surveillance, and
    another elapsed unresolved-risk handoff without learner examination, scoring, imaging or test
    acquisition or interpretation, diagnosis, eligibility adjudication, drug, dose, route,
    blood-pressure target, airway device, transfer, thrombectomy, reperfusion grading, procedure,
    treatment, disposition, prognosis, treatment-effect, or outcome controls.
  - [x] Neurology slice 3/15 adds one authored spontaneous cerebellar ICH with initial
    fourth-ventricle effacement, early qualified neurocritical, neurosurgical, and airway-capable
    ownership, strict later drowsiness, vomiting, weaker cough, hematoma expansion, obstructive
    hydrocephalus, and brainstem compression, and another elapsed active-risk handoff without
    learner examination, scoring, volume calculation, imaging or test acquisition or interpretation,
    diagnosis, drug, pressure target, reversal, airway device, drain, surgery, procedure, transfer,
    treatment, disposition, prognosis, treatment-effect, or outcome controls.
  - [x] Neurology slice 4/15 adds one authored day-7 aneurysmal-SAH delayed deterioration after a
    supplied secured-aneurysm and scheduled-care record, with a new focal deficit, fixed CT, CTA,
    CTP, glucose, and sodium context, possible-DCI recognition without equating angiographic
    narrowing with DCI, qualified neurocritical, neurovascular, and rescue-capable ownership, a
    strict later neurological and captured-interval EEG report, and another elapsed active-risk
    handoff without learner examination, scoring, imaging, EEG or test acquisition or interpretation,
    diagnosis, drug, dose, route, fluid, pressure target, oxygen, airway device, angiography,
    endovascular treatment, procedure, transfer, treatment, disposition, prognosis, treatment-effect,
    or outcome controls.
  - [x] Neurology slice 5/15 adds one authored 58-year-old 18-minute evolving focal-to-bilateral
    seizure whose bilateral movements become less dramatic after supplied qualified initial rescue
    care while overt left face and arm clonus and absent meaningful recovery persist, requiring
    focal-motor-status recognition, qualified seizure, resuscitation, and airway-capable ownership,
    parallel whole-patient safety and open-cause review, a strict minute-26 visible-motor report, and
    another elapsed active-risk handoff without learner history, examination, seizure timing,
    monitoring, glucose acquisition, EEG, imaging or laboratory acquisition or interpretation,
    diagnosis, drug, dose, route, access, oxygen, airway device, infusion, anesthetic, procedure,
    treatment, movement cessation, electrographic control, disposition, prognosis, or outcome
    controls.
  - [x] Neurology slice 6/15 adds one authored 72-year-old 95-minute fluctuating language and
    awareness pattern with intermittent speech arrest, inattention, and brief gaze deviation but no
    convulsion or sustained clonus, requiring suspicion of a nonconvulsive seizure and urgent
    qualified EEG without a clinical-only NCSE diagnosis, qualified neurology, neurophysiology,
    resuscitation, and airway-capable ownership, parallel safety and alternative-cause review, a
    strict later supplied 60-minute report of 24 minutes of evolving electrographic seizures that
    meets the ACNS electrographic-status definition, and another elapsed active-risk handoff without
    learner history, examination, seizure timing, monitoring, glucose or sodium acquisition, EEG,
    imaging or laboratory acquisition or interpretation, diagnosis, drug, dose, route, access,
    oxygen, airway device, procedure, treatment, seizure control, disposition, prognosis, or outcome
    controls.
  - [x] Neurology slice 7/15 adds one authored 45-year-old with established generalized myasthenia
    and a 36-hour rapid fatigable bulbar and respiratory decline, requiring multimodal impending-
    crisis recognition without saturation, carbon dioxide, or one mechanics cutoff, qualified
    neurocritical and airway-capable ownership, parallel secretion, aspiration, infection,
    medication, test-quality, and alternative-cause review, a strict later supplied invasive-
    ventilation requirement establishing manifest crisis, and another elapsed active-risk handoff
    without learner examination, mechanics or test acquisition or interpretation, diagnosis, drug,
    dose, route, IVIG, plasma exchange, antimicrobial, oxygen, ventilation, suction, airway device,
    procedure, treatment, weaning, disposition, prognosis, or outcome controls.
  - [x] Neurology slice 8/15 adds one authored previously independent 33-year-old with a
    postinfectious 48-hour ascending symmetric weakness and reflex-loss pattern, rapid functional
    decline, bulbar and cough weakness, falling serial FVC, single-breath count and MIP, supportive
    CSF and electrodiagnostic reports, and monitored heart-rate and pressure lability. The learner
    reviews diagnostic support and mimics, recognizes high-risk respiratory decline without
    saturation, a score, one test, or one mechanics cutoff, activates qualified neurocritical,
    respiratory, airway-capable, nursing, and cardiac-monitoring ownership, reviews a strict 4-hour
    respiratory, bulbar, and autonomic deterioration, and completes another elapsed active-risk
    handoff without learner history, examination, score calculation, test acquisition or
    interpretation, diagnosis, IVIG, plasma exchange, drug, dose, route, access, oxygen,
    ventilation, suction, airway device, rhythm or pressure treatment, procedure, treatment,
    disposition, prognosis, or outcome controls.
  - [x] Neurology slice 9/15 adds one authored previously independent 28-year-old with a 14-hour
    acute fever, headache, photophobia, vomiting, neck-stiffness, and inflammatory-evidence pattern
    but GCS 15, equal reactive pupils, symmetric function, stable airway, breathing and perfusion,
    and no seizure, bleeding, purpura, severe immunocompromise, or evolving-lesion warning. The
    learner activates qualified ownership, reviews prompt LP without routine prior imaging in this
    exact state and all supplied deferral triggers, activates early qualified empiric antimicrobial
    and adjunctive pathways without diagnostic delay, reviews a strict later qualified LP and
    bacterial-pattern CSF report, and completes another elapsed organism, treatment, complication,
    public-health, hearing, and active-risk handoff without learner history, examination, score,
    test or imaging acquisition or interpretation, LP, diagnosis, drug, dose, route, access,
    isolation equipment, procedure, treatment, contact decision, disposition, prognosis, or outcome
    controls.
  - [x] Neurology slice 10/15 adds one authored previously independent 37-year-old with fever,
    headache, new irritability, repetitive questions, impaired recent memory, anomia, and one
    stopped focal seizure. The learner reconciles the encephalitic whole-patient trajectory,
    activates qualified neurological, infection, neurocritical, airway-capable, nursing, seizure,
    and diagnostic ownership, activates immediate qualified empiric antiviral care without waiting
    for MRI, EEG, CSF, or PCR certainty, reviews supplied inflammatory CSF and open etiologies, then
    reviews a strict 4-hour temporal MRI, specialist EEG without sampled electrographic seizure,
    persistent dysfunction, and early negative HSV PCR without premature closure before another
    elapsed repeat-testing, treatment-safety, seizure, autoimmune, cognitive, rehabilitation, and
    active-risk handoff. No learner history, examination, test acquisition or interpretation,
    diagnosis, drug, dose, route, access, oxygen, fluid, airway, LP, imaging, EEG, procedure,
    treatment, durable stability, disposition, prognosis, or outcome control exists.
  - [x] Neurology slice 11/15 adds one authored stable alert 31-year-old with 5 weeks of new
    pressure-pattern headache, pulsatile tinnitus and transient visual obscurations plus 3 days of
    diplopia, specialist-confirmed bilateral papilledema and sixth-nerve palsy, supplied visual
    function, MRI and venography exclusions, and qualified LP opening pressure 34 cm CSF with normal
    composition. The learner reviews the syndrome without demographic or one-value closure,
    activates qualified ownership, reviews eye and diagnostic boundaries, then reviews a strict
    24-hour worsening visual field despite preserved 20/20 acuity before another elapsed urgent
    sight-rescue and active-risk handoff without learner examination, testing, interpretation,
    diagnosis, drug, dose, route, access, LP, procedure, treatment, herniation, visual rescue,
    disposition, prognosis, or outcome control.
  - [x] Neurology slice 12/15 adds one authored 58-year-old with a recently identified right
    temporal mass and a 12-minute decline from GCS 14 to GCS 9, new right pupillary nonreactivity,
    left-arm extension, bradycardia, hypertension, and supplied CT mass effect. The learner
    reconciles the whole pattern, recognizes the emergency without an isolated pupil or complete
    triad, activates qualified airway, neurocritical, neurosurgical, and brain-rescue ownership,
    reviews individualized systemic, osmotic, imaging, and definitive-control boundaries, then
    reviews a strict 15-minute supplied qualified-rescue report with the pupil still nonreactive
    before another elapsed lesion, airway, pressure, seizure, surgery, complication, and active-risk
    handoff without learner examination, scoring, monitoring, imaging interpretation, diagnosis,
    airway management, oxygen, ventilation, drug, dose, route, access, drain, decompression,
    procedure, treatment effect, recovery, disposition, prognosis, or outcome control.
  - [x] Neurology slice 13/15 adds one authored previously independent 68-year-old with metastatic
    prostate cancer, progressive movement-sensitive thoracic pain, 48 hours of bilateral pyramidal
    leg weakness, gait loss, a T8 sensory level, and urinary dysfunction. The learner reconciles the
    cord-level clock, recognizes suspected metastatic cord compression as an oncologic emergency
    before imaging confirmation, activates qualified spinal, oncology, radiology, radiotherapy,
    nursing, pharmacy, rehabilitation, pain, bladder, skin, and thrombosis-prevention ownership,
    reviews individualized stability, movement, whole-spine MRI, early corticosteroid, supportive,
    and definitive-care boundaries, then reviews a strict 4-hour qualified MRI confirming T6
    epidural compression with persistent deficits before another elapsed level, stability,
    function, bladder, cancer, definitive-care, complication, rehabilitation, and active-risk
    handoff without learner history, examination, gait testing, movement, imaging acquisition or
    interpretation, diagnosis, drug, dose, route, access, catheter, surgery, radiotherapy, biopsy,
    procedure, treatment effect, recovery, disposition, prognosis, or outcome control.
  - [x] Neurology slice 14/15 adds one authored independently functioning 82-year-old with a verified
    normal morning baseline and 10 hours of alternating withdrawal, restlessness, visual
    misperception, disorganized answers, and inattention. The learner reconciles baseline and
    fluctuation, recognizes a qualified 4AT and expert-diagnosis boundary without dementia or
    single-cause closure, activates medical, nursing, pharmacy, family, safety, capacity, mobility,
    and supportive ownership, reviews reversible contributors and familiar least-restrictive care,
    then reviews a strict 6-hour report with urinary retention, recent anticholinergic exposure,
    poor intake, pain, fragmented sleep, absent hearing aids, and unresolved fluctuating attention
    before another elapsed cause, capacity, safety, medicine, function, recurrence, follow-up, and
    active-risk handoff without learner history, examination, scoring, capacity assessment, test,
    diagnosis, observation, restraint, reorientation, mobility, drug, dose, route, access, catheter,
    procedure, treatment effect, recovery, disposition, prognosis, or outcome control.
  - [x] Neurology slice 15/15 adds one authored 36-year-old with a declared chronic complete T4
    spinal cord injury, verified usual seated BP 98/62 mmHg, sudden headache, flushing, sweating,
    piloerection, BP 178/106 mmHg, and sinus bradycardia 48/min after a routine chair transfer. The
    learner reconciles lesion and baseline, recognizes the urgent baseline-relative autonomic-
    dysreflexia pattern without diagnostic or alternative-cause closure, activates upright support,
    frequent pressure and pulse surveillance, and qualified spinal-injury ownership, then reviews a
    urinary-first supplied trigger survey and releases one visible external drainage-tubing kink.
    Canonical pressure and pulse transition through authored support, trigger-release, and elapsed
    reassessment states before another elapsed baseline, trigger, recurrence, complication,
    prevention, and active-risk handoff without accepting a real lesion or baseline, learner history,
    examination, monitoring acquisition, definitive diagnosis, catheter insertion, disconnection,
    irrigation or replacement, bowel care, drug, dose, route, access, oxygen, fluid, device,
    procedure, treatment-effect prediction, disposition, prognosis, or outcome control.
  - [x] Endocrine/metabolic slice 1/12 establishes the indexable `/endocrine-metabolic` module with
    one authored late-treatment DKA resolution and transition case, distinct from the Emergency
    Medicine initial pathway. The learner activates qualified endocrine, nursing, pharmacy,
    electrolyte, nutrition, education, transition and follow-up support; connects the initial triad,
    treatment clock, glucose, ketone, acid-base, potassium, kidney, intake, access and whole-person
    trajectory; recognizes persistent DKA despite lower glucose and a closed gap; reviews qualified
    insulin-dextrose continuity, monitoring, potassium, resolution and basal-overlap boundaries;
    reviews a fixed 4-hour resolution and overlap report; and hands off recurrence risk without
    learner history, examination, laboratory acquisition, calculation or interpretation, diagnosis,
    fluid, electrolyte, dextrose, insulin, bicarbonate, drug, dose, rate, route, access, infusion,
    nutrition, basal administration, IV-insulin stop, precipitant treatment, education, prescription,
    follow-up, transition, disposition, or outcome controls.
  - [x] Endocrine/metabolic slice 2/12 adds HHS correction and reassessment in an older adult with
    heart and kidney disease. The learner confirms support, connects hyperglycemia, osmolality,
    dehydration, cognition and whole-person context, recognizes the coupled illness, and reviews
    qualified cautious correction and harm-prevention boundaries. A strict later report supplies
    lower glucose, rising sodium, persistent hyperosmolality, reduced urine output, and cognition
    below baseline before elapsed active-risk handoff. No learner testing, calculation, diagnosis,
    fluid, insulin, electrolyte, drug, dose, rate, route, infusion, nutrition, procedure, disposition,
    or outcome control exists.
  - [x] Endocrine/metabolic slice 3/12 registers severe hypoglycemia with hidden glucose and
    medication findings, dose-free qualified rescue decisions, 10-minute post-rescue checks,
    authored recurrence, and an instructor-takeover branch. Unsafe oral choices are refused;
    premature monitoring closure does not stop the patient clock. Expert, error, and recovery
    fixtures preserve early mistakes in the debrief. This is a registered preview, not full
    completion-contract approval. Content 0.1.1 adds eight observed-state tutor rules with source
    links and exact-version completion evidence. Expert, error, and recovery whole-state hashes
    match across all guidance modes. Content 0.1.2 adds the optional observed-state worked example,
    with pause, single-dispatch actions, and non-resetting takeover through the real session and
    worker protocol. Clinical review, complete inclusive runtime, and four-surface reporting
    verification remain pending; anesthesia prompts stay suppressed.
  - [x] Endocrine/metabolic slice 4/12 registers adrenal crisis with independent qualified steroid
    and saline decisions, immediate treatment before diagnostic or history prerequisites, elapsed
    incomplete-rescue and combined-response branches, fresh bedside reassessment, and continuity
    handoff. Five source-linked in-tray tutor rules remain readable during alarms and respect
    Unassisted mode. Exact-version expert, common-error, and recovery traces retain early mistakes
    without allowing stale post-treatment actions to invent a prior delay. Numeric states and
    clocks are authored, not kinetics or safe waiting intervals. Content 0.1.1 adds an optional
    seven-decision worked example driven by accepted state, with pause, single-dispatch actions,
    and non-resetting takeover. Clinical review, full inclusive-runtime evidence, and four-surface
    report verification remain pending.
  - [x] Severe-hypoglycemia content 0.1.3 and adrenal-crisis content 0.1.2 add learner-paced
    worked-example decisions. The patient pauses for reading, Continue sends one action and
    resumes observation, and takeover cancels pending automation without resetting the patient.
    A stable disabled Continue control preserves the reading layout during observation. Clinical
    and inclusive validation gates remain pending.
  - [x] Repair shared worked-example and reporting accessibility defects: independently
    scroll narration without hiding Continue/takeover, keep mobile sheets clear, use page flow
    on short screens, isolate cockpit shortcuts from controls/dialogs/reading, and unlock/focus
    the successful report confirmation. Browser geometry and DOM regressions are recorded in
    `docs/accessibility-audit.md`; moderated and live-service review gates remain pending.
  - [x] Preserve the source drawer beneath a report modal, assign Escape and focus handling
    to the top dialog, and keep the compact security check reachable through narrow-screen
    rotation without recreating it. Shared regressions and a public test-widget browser check
    do not replace exact-version reporting evidence or production Turnstile/D1 verification.
  - [x] Endocrine/metabolic slice 5/12 registers thyroid storm with parallel urgent treatment,
    circulation-informed rate-control review, the declared one-hour antithyroid-before-iodine
    sequence, independent deterioration and partial-support states, fresh reassessment, and
    ongoing critical-care handoff. The August 2026 consensus and Japanese alternative are
    distinguished from authored clocks. Exact-version replay, five-objective debrief, quiet
    inline tutoring, and bounded report context are implemented. Clinical, inclusive-runtime,
    and complete four-surface reporting evidence remain pending.
  - [x] Thyroid-storm content 0.1.0 adds a learner-paced nine-decision worked example with
    explicit early and later reassessments, source-derived iodine sequencing, and an authored
    partial-support wait. Shared-session transcript replay verifies both intervals. Reading,
    reporting, takeover, reset, and stale callbacks preserve learner control; restarting manual
    practice after an example restores 1× speed. Local route/form tests cover briefing, live,
    example, debrief, replay, and source reporting without claiming production submission.
  - [x] Endocrine/metabolic slice 6/12 registers myxedema coma with qualified ventilation,
    empiric hydrocortisone before IV levothyroxine, parallel supportive care, fresh respiratory
    and later whole-person reassessment, and ongoing-treatment handoff. Same-tick ordered steroid
    and thyroid actions need no artificial wait or laboratory gate. Oxygen-only support does not
    clear carbon-dioxide retention; blood-gas values remain explicit historical observations.
    Refused thyroxine-first and rapid-rewarming choices, diagnostic delay, and omitted care remain
    visible after correction. Quiet tutoring and an eight-decision learner-paced example use
    accepted state and label every response clock as authored rather than clinical kinetics.
    Model, UI, real-engine replay, and worked-example checks pass. The registry now has 198 scenarios, six endocrine/metabolic
    previews, and 219 indexable routes; these counts do not establish full scenario completion.
  - [x] Myxedema local verification passes full CI with 3,530 tests across 458 files, real-engine
    replay, report-surface privacy and pause checks, and desktop/320 px browser inspection.
    Keyboard summaries, automatic announcements, and the Why panel preserve unavailable readings
    and authored-state boundaries. A promptly corrected oxygen-only bridge remains visible without
    being graded as delayed ventilation. Temporary browser fixtures and owned tabs are removed.
  - [ ] Complete myxedema inclusive-runtime verification, independent clinical review, and
    production Turnstile/D1 evidence. Local automated and browser checks do not substitute for
    these separate gates.
  - [x] Endocrine/metabolic slice 7/12 registers severe malignancy-associated hypercalcemia with
    tailored hydration, an independent short calcitonin bridge, supplied cardiorenal review,
    qualified antiresorptive care, fresh response observations, and continuing-care handoff.
    Circulation improvement does not normalize calcium; antiresorptive effect is not simulated.
    Earlier unrestricted-fluid, routine-diuresis, renal-review, and cause-delay choices remain
    visible after correction. The eight-decision worked example preserves the full four-hour
    simulated observation, reading pauses, and explicit historical calcium results. Metadata
    honestly declares 240 simulated minutes; the bounded longitudinal schema allows up to six
    hours while keeping the original anesthesia-library duration requirement unchanged.
  - [x] Hypercalcemia local verification passes full CI with 3,599 tests across 464 files,
    including whole-tick engine replays, the complete eight-decision worked example, and
    report-surface privacy and pause checks. Desktop and 320 px browser inspection covers the
    action drawer and report dialog. The optional update notice now hides during modal reading
    and returns afterward; a DOM/CSS regression checks both states. The registry has 199 scenarios,
    seven endocrine/metabolic previews, and 220 indexable routes, not 199 completed scenarios.
  - [ ] Complete hypercalcemia inclusive-runtime verification, independent clinical review,
    and production Turnstile/D1 evidence. Local model, replay, report, and browser checks do not
    substitute for those separate gates.
  - [x] Correct thyroid-storm and myxedema duration metadata through new content versions
    0.1.1: thyroid is about 180 simulated minutes (60 before iodine, then 120 to the authored
    complete-care checkpoint), and myxedema is about 60 (ventilatory observation runs within
    that interval). The former 15- and 12-minute labels understated both paths. Six failing-first
    checks now pass, binding durations to model/fixture ticks, new versions, and search metadata.
    Prerendered labels, structured data, and maturity links agree. Treatment rules, defaults,
    sources, limitations, and worked-example narration are unchanged; exact-version eligibility
    and evidence bind to the new content. All 204 prior report records remain identical, with
    two new records added; old and new versions pass Worker validation in both practice regions.
    Clinical, inclusive-runtime, and production reporting gates remain pending. Final CI passes
    3,683 tests across 467 files and all 30 specs. The indexable build verifies 220 routes;
    final static-host checks verify 223 routes and 44 catalog artifacts. Compressed budgets are
    147.9 KiB landing, 1,474.7 KiB cockpit, and 3,281.6 KiB offline. The registry remains at
    199 scenarios, including seven endocrine previews, not 199 completed scenarios.
  - [x] Endocrine/metabolic slice 8/12 registers postoperative hypocalcemic tetany with immediate
    qualified monitored calcium rescue, independent risk and cause review, magnesium correction,
    continuing calcium/cause care, explicit historical reassessment, and continuing-risk handoff.
    Authored relief and recurrence distinguish rescue from sustained care; corrected omissions
    remain visible. Fixed QTc and hidden cause findings never become live monitor measurements.
    A nine-decision learner-paced example preserves reading pauses and separate observation phases.
    Missing an earlier observation loses observation credit, not permission for an otherwise
    appropriate continuing-care handoff. The registry now has 200 scenarios, eight endocrine
    previews, and 221 indexable routes; registration does not establish scenario completion.
  - [x] Hypocalcemia local verification passes full CI: all 30 specs and 3,760 tests across
    472 files, including exact whole-state replay, recurrence-first and late-only assessment,
    all nine worked-example decisions, and report-surface privacy. Desktop browser checks confirm
    a centered 160-character form and paused takeover focused on Play; a 320 × 568 layout check
    covers compact cockpit/action entry and a scrolling centered form with reachable cancellation.
    No production report was sent. The temporary fixture, browser tabs, and preview server were
    removed. Static-host verification covers 224 routes and 44 catalog artifacts; compressed
    budgets are 147.9 KiB landing, 1,487.3 KiB cockpit, and 3,308.8 KiB offline. The final indexable
    build verifies 221 routes; development publication blockers remain explicit, not overridden.
    All 206 historical report records remain identical, with one new record added.
  - [ ] Complete hypocalcemia independent clinical review, full inclusive-runtime verification,
    the remaining version-bound state-space record, and production Turnstile/D1 evidence. Local tests and browser
    checks do not satisfy these separate gates. Deploy the reports Worker's updated catalog before
    publishing the new client content version; retain all 206 previously published report records.
  - [x] Endocrine/metabolic slice 9/12 registers post-rescue hyponatremia with emerging water
    diuresis, the original 106 mmol/L baseline and first correction hour, qualified water-loss
    management, conditional relowering in either request order, fresh historical observations,
    retained observed peak, and continuing-care handoff. The seven-decision worked example
    pauses for reading; the scheduled reassessment timer and notifications depend only on public
    requests and observations, not a hidden correction breach. Debrief prevention credit requires
    a later requested response, not merely a treatment button. The registry has 201 scenarios,
    nine endocrine previews, and 222 indexable routes; registration is not completion.
  - [x] Hyponatremia local verification passes the indexable full CI run: 4,041 tests across
    485 files, 30 specs, typecheck, lint, 225 static routes, 44 catalog artifacts, fonts, and
    222 crawlable routes. Compressed budgets are 148.2 KiB landing, 1,500.8 KiB cockpit, and
    3,343.3 KiB offline. Desktop browser checks confirm a centered 160-character report form,
    opt-in context disabled by default, learner-confirmed example decisions, and takeover focus
    on Play. A 320 × 568 iframe check confirms wrapped briefing and report-dialog content; it
    does not establish full phone keyboard or screen-reader coverage. Temporary fixtures, tabs,
    and preview server were removed. All 207 historical client and Worker report records remain
    unchanged; one new record is added. Existing hypocalcemia checks revalidate its six changed
    shared dependency hashes without changing its three quality records. The actual preview
    release command still refuses 216 unmet publication items; no production report was sent.
  - [x] Add exact-version hyponatremia training-value, authored-defaults, and ten-category hazard
    records without supplying an unverified state-space pass. Bind their literal values to the
    actual model, fixtures, tutor, objectives, and named implementation dependencies. Exercise the
    worked example through the real session store, clock, recorder, protocol, and in-process
    engine transport, including full-frame replay, both observation waits, stale-result recovery,
    takeover, reset, and disposed callbacks. These checks do not certify native assistive technology.
  - [x] Fix sodium report attribution: a refusal no longer labels unrelated same-tick requests
    refused. Only unique action-specific outcome evidence is included; pending, duplicate,
    malformed, shared-refusal, and replay-discarded evidence is omitted, not guessed. Preserve
    the last-20-request bound, optional context, scalar allowlists, and legacy lesson behavior.
    Verification passes 4,104 tests in 488 files, including 14 literal-quality checks, 22 outcome
    attribution checks, 16 sodium report-surface checks, and three real-session tests. Full
    indexable CI, 30 specs, the catalog-change spec, 225 static routes, 44 catalog artifacts,
    and 222 crawlable routes pass. Compressed budgets are 148.2 KiB landing, 1,501.5 KiB cockpit,
    and 3,352.1 KiB offline; fonts are 86.2 KiB. The three new records cover 42 defaults and
    ten hazards, with 47 explicit dependency pins. Hypocalcemia's unchanged records are
    revalidated against the shared route change. All 208 client and Worker report records
    remain byte-identical; only the endocrine quality audit changes among generated catalogs.
    The actual preview release still refuses 216 publication blockers. No production report
    was sent, and no clinical, state-space, or inclusive-runtime gate was waived.
  - [ ] Complete hyponatremia independent clinical review, version-bound state-space verification,
    full inclusive-runtime coverage, and production Turnstile/D1 evidence. The selected high-risk
    ceiling is not a universal regional rule, and authored checkpoints predict neither drug
    kinetics nor ODS prevention. Deploy the updated reports catalog before new client content;
    all 208 registered report identities must remain intact. Local engineering checks do not waive
    these publication gates.
  - [x] Endocrine/metabolic slice 10/12 registers hypernatremic dehydration in known AVP deficiency
    with independent volume, water, desmopressin, monitoring, reassessment, and continuing-care
    choices. Circulation restoration has no administrative or laboratory gate. Subsequent water
    and desmopressin requests are independently available after circulation improves. Requested
    sodium and urine results remain historical; hidden findings and unobserved peaks are never
    invented. Late combined care improves sodium from 165 to 164 mmol/L, not to normal.
    Earlier delay, rapid-normalization attempts, and blanket withholding remain learning evidence.
  - [x] Add the nine-decision, learner-confirmed worked example, source-linked quiet tutor, five
    debrief objectives, bounded teaching stops, real-engine reference fixtures, and private shared
    reporting. Twenty-eight model tests, 12 full-frame integration tests, three real-session tests,
    ten tutor/UI tests, nine nonvisual tests, 23 report-attribution/identity tests, and 18 shared
    report-surface tests pass. Guidance modes preserve every engine frame and waveform; reading
    pauses, duplicate/stale callbacks, takeover, reset, and disposal cannot send extra decisions.
    No native assistive-technology or production Turnstile/D1 pass is inferred from these checks.
    Local browser checks confirm the desktop centered dialog, optional context off, 160-character
    limit, focus return, preserved paused example, and takeover at 1× without reset. A 320-pixel
    briefing smoke check is not a full phone or zoom matrix. Temporary layout fixtures were removed.
    Full indexable CI passes 4,213 tests in 495 files, 30 specs, the change specification, 226 static
    routes, 44 catalog artifacts, and 223 crawlable routes. Compressed budgets are 148.2 KiB landing,
    1,513.7 KiB cockpit, and 3,373.2 KiB offline; fonts are 86.2 KiB. Six stale integration/count
    expectations failed first and passed after their scenario, protocol, and SEO updates. Existing
    hypocalcemia and hyponatremia evidence was revalidated before explicitly repinning six and ten
    changed shared dependencies, respectively; their records and prior audit entries are unchanged.
    The actual preview release still refuses 217 publication blockers. No production report was sent.
  - [x] Correct AVP circulation scoring in content 0.1.1: otherwise equivalent complete-care paths
    at ticks 17,999 and 18,000 no longer receive different credit solely from the authored
    deterioration cutoff. The real-engine regression failed first and passes after the correction.
    Actual volume-start seconds and deterioration remain in debrief; fresh reassessment is still
    required, and normalization/withholding mistakes are retained. Patient values and clocks did
    not change. Fixtures, tutor/example eligibility, completion evidence, and report identity are
    bound to the corrected version; all 209 earlier client and Worker report records are preserved.
  - [x] Supply AVP training-value, authored-defaults, and hazard records with 47 literal defaults,
    ten hazard categories, and a 47-file dependency receipt. Sixteen new quality checks compare
    records with actual model state, transitions, fixtures, tutor, objectives, and shared defaults.
    Thirty-six new drift cases cover nine AVP dependencies across catalog, development, preview,
    and reviewed-release consumers; all refuse stale evidence before writes or publication checks.
    The report regression pins original 0.1.0 evidence, accepts 0.1.1, and refuses client manifest
    overrides. Neither structural validity nor local checks supply a state-space or clinical pass.
  - [x] Verify the AVP 0.1.1 correction with full CI: 4,267 tests across 496 files, 30 strict specs,
    type/lint, public readiness, 226 static routes, and 44 catalog artifacts pass. All 223 crawlable
    routes pass indexability checks. Landing/cockpit/offline budgets are 148.2/1,513.9/3,382.9 KiB;
    fonts are 86.2 KiB. The strict catalog change validates. Existing hypocalcemia and hyponatremia
    evidence was rechecked before repinning only their shared debrief dependency; their authored
    records remain unchanged. The actual preview release still refuses 217 publication blockers.
    No production report was sent, and no pending review was converted into a pass.
  - [ ] Complete AVP-deficiency independent clinical review, its state-space verification record,
    full inclusive-runtime verification, and production reporting evidence. Sources were checked
    August 27, 2026; the 2026 joint-guideline abstract describes forthcoming guidance. All response
    clocks and sodium/urine branches remain authored, with no dose, rate, deficit calculation,
    automatic redose, neurologic-injury prediction, or discharge claim. Deploy the reports catalog
    before new client content; 210 current and historical report identities remain available.
  - [x] Endocrine/metabolic slice 11/12 registers feeding-associated electrolyte deterioration with
    independent qualified electrolyte, thiamine, nutrition-review, and surveillance decisions.
    Phosphate-only treatment is accepted partial care, not a complete response or automatic error.
    Explicit assessments expose authored early improvement, incomplete-care recurrence, and later
    combined-care partial response. Prior choices and observed recurrence survive recovery; new
    laboratory values never arrive through elapsed clocks. ASPEN and AuSPEN feeding-policy
    differences remain visible without a universal rate, calorie calculation, or stop-feeding rule.
    The registry now contains 203 scenarios, including 11 endocrine previews, not 203 completed labs.
  - [x] Add a nine-decision learner-paused refeeding example, observed-state private tutor, causal
    debrief, nonvisual summaries, and the shared centered 160-character report on its route surfaces.
    Twenty-seven model checks, ten full-engine path checks, and five real-session checks cover
    partial/comprehensive care, alternative orders, timing boundaries, every-frame expert/error/
    recovery/no-action replay, reading pauses, takeover, stale callbacks, reset, and reporting pauses.
    Twenty-two report-mapping checks and ten real-form route checks restrict opt-in context to seven
    live vitals, 24 observed equipment scalars, and uniquely matched action outcomes. No production
    report was submitted. All 210 previous client and Worker report records remain immutable.
  - [x] Repair the shared empty-episode debrief inference: not crossing two pressure/oxygen
    thresholds no longer asserts a good outcome or rules out other deterioration. Four rendered
    refeeding debrief regressions failed first, then passed for expert, recovery, partial-care, and
    no-action runs; 24 shared debrief checks also pass. Scenario scoring and other patient models
    were not changed by this wording correction.
  - [x] Verify refeeding integration with full CI: 4,370 tests across 504 files, 30 strict specs,
    type/lint, public readiness, 227 static routes, and 44 catalog artifacts pass. All 224 crawlable
    routes pass indexability checks. Landing/cockpit/offline budgets are 148.2/1,526.1/3,404.4 KiB;
    fonts are 86.2 KiB. Rechecked neighboring model, replay, UI, reporting, and quality tests before
    repinning only changed shared dependencies: six hypocalcemia, ten hyponatremia, and twelve AVP
    entries. Their authored quality records remain unchanged. The actual preview release refuses
    218 publication blockers; local verification does not supply missing clinical or runtime gates.
  - [ ] Complete refeeding independent clinical review, four exact-version quality records,
    full inclusive-runtime verification, and production Turnstile/D1 evidence. Desktop browser
    checks at 1,280 × 720 confirmed paused reading and a centered 560 × 619 report dialog, its
    160-character limit, unchecked optional context, cancel focus return, and unchanged patient
    clock. This does not establish phone, assistive-technology, or live-service validation. Deploy
    the reports catalog before new client content; 211 current/historical report identities exist.
  - [x] Endocrine/metabolic slice 12/12 registers interrupted insulin delivery during delayed elective
    surgery in a fasting adult with type 1 diabetes. Qualified verified alternative coverage is
    independent of new laboratory, support, or planning prerequisites. Glucose-only checks remain
    valid partial observations with separate timestamps; older full ketone and bedside findings
    stay historical. Authored untreated, early-response, and later-response paths preserve delay
    without an arbitrary grading cutoff. Individualized fasting planning does not cause a response.
    The registry contains 204 scenarios, including all 12 planned endocrine previews, not 204
    clinically completed labs. ADA and Association/JBDS 2026 sources were checked August 27, 2026.
  - [x] Add the eight-decision learner-paused example, observed-state private tutor, five-objective
    debrief, nonvisual summaries, and the shared centered report on all new scenario surfaces.
    Nineteen model, ten full-engine, five real-session, 21 report-attribution, and five rendered
    debrief checks pass, alongside 19 new UI/accessibility and ten shared-form route checks.
    Expert/error/recovery/no-action replay compares every engine frame across
    guidance modes. Glucose-only checks cannot earn full-response credit; earlier mistakes do not
    block appropriate later handoff. Independent code review found no remaining concrete blocker.
    Opt-in context contains seven live vitals and at most 24 observed equipment scalars; all 211
    previous client and Worker report identities remain unchanged, with 212 identities now accepted.
  - [x] Verify perioperative integration with full CI: 4,464 tests across 512 files, 30 strict specs,
    type/lint, public readiness, 228 static routes, and 44 catalog artifacts pass. All 225 crawlable
    routes pass indexability checks. Landing/cockpit/offline budgets are 148.2/1,537.7/3,424.1 KiB;
    fonts are 86.2 KiB. Neighboring replay, UI, accessibility, reporting, and quality checks were
    re-run before repinning only changed shared dependencies: six hypocalcemia, ten hyponatremia,
    and twelve AVP entries. Their authored quality records remain unchanged. The actual preview
    release refuses 219 publication blockers; local CI does not replace missing clinical evidence.
  - [ ] Complete perioperative-diabetes independent clinical review, four exact-version quality
    records, full inclusive-runtime verification, and production Turnstile/D1 evidence. Desktop
    browser checks at 1,280 × 720 confirmed the paused example, a centered 560 × 619 report dialog,
    160-character limit, unchecked context, cancel focus return, and unchanged clock. Continuing
    the example performs one decision and pauses again. This does not establish phone, native
    assistive-technology, or live-service validation. No production report was sent. Deploy the
    updated reports catalog before new client content; do not relabel pending gates as passes.
  - [x] Renal/electrolyte slice 1/12 registers `hyperkalemia-cardioprotection-and-rebound@0.1.0`
    as a distinct preview, preserving the older Emergency Medicine scenario. The catalog now has
    205 scenarios across 12 modules. Qualified calcium, shifting, and delivered elimination have
    independent authored consequences; consultation and planning do not lower potassium. Calcium
    benefit is temporary, partial observations do not refresh potassium, and later recovery does
    not erase observed rebound. UKKA 2023, KDIGO 2020, and RCUK 2025 sources were checked August 27.
  - [x] Add renal navigation, static metadata, the private tutor, ten-decision paused example,
    five-objective debrief, qualitative waveform, nonvisual summaries, and shared report controls.
    Thirteen choices include retained ECG-resolution and glucose-monitoring refusals. Sparse clock
    jumps preserve checkpoint order and stop boundaries. Debrief assessment-after-treatment credit
    respects event order even when two actions occur at the same tick. Optional report context has
    seven live vital signs and at most 30 equipment scalars, excluding hidden labs, clocks, and prose.
    All 212 prior client and Worker identities remain unchanged; 213 are now accepted.
  - [x] Verify renal model, replay, and UI integration: 26 model, 12 full-engine, five real-session,
    12 tutor/UI, nine accessibility, six rendered-debrief, 23 action-attribution, and ten shared-form
    checks pass. The indexable build serves 230 static routes, 227 crawlable routes, and 47 catalog
    artifacts. Full indexable CI passes 4,579 tests across 521 files, 30 strict specs, typecheck,
    lint, public readiness, build, and static-host checks. Landing/cockpit/offline budgets are
    148.4/1,551.4/3,458.3 KiB; fonts are 86.2 KiB.
    Neighboring replay, UI, accessibility, reporting, and quality checks passed before repinning
    seven hypocalcemia, eleven hyponatremia, and thirteen AVP shared dependencies. Their authored
    quality records did not change. The actual preview release refuses 220 publication blockers.
  - [ ] Complete renal hyperkalemia independent clinical review, four exact-version quality records,
    full inclusive-runtime verification, and production Turnstile/D1 evidence. Desktop browser QA
    at 1,280 × 720 confirmed a centered 560 × 619 report dialog, 160-character limit, unchecked
    context, cancel focus return, and an unchanged paused clock. Continuing the example performs
    one decision and pauses again. This does not establish phone or assistive-technology validation.
    Local report submission remains disabled; no production report was sent. Deploy the updated
    Worker report catalog before new client content and keep pending validation explicit.
  - [x] Renal/electrolyte slice 2/12 registers `hypokalemia-magnesium-and-ongoing-losses@0.1.0`
    as a distinct preview. Potassium and magnesium care are independent; potassium alone has
    partial benefit. Delivered continuing-loss care differs from planning and does not instantly
    stop diarrhea. Recurrence cannot improve untreated magnesium; later recovery retains earlier
    observed recurrence. NHS SPS 2024, the ESC collaborative review (2021), and RCUK 2025 were
    checked August 27. Authored values and timing bounds are recorded in its evidence brief.
  - [x] Add twelve choices, private tutor, nine-decision paused example, five-objective debrief,
    qualitative flattened-T waveform, nonvisual summaries, and shared centered reporting. Partial
    potassium and ECG findings retain older magnesium; debrief care credit respects later event
    order even at one tick. Optional report context excludes hidden results, timers, and prose,
    with seven live vitals and at most 28 observed/care equipment scalars.
  - [x] Verify hypokalemia with 24 model, 13 full-engine, five real-session, 12 tutor/UI, nine
    accessibility, seven rendered-debrief, 24 action-attribution, and ten shared-form tests.
    Final indexable CI passes 4,696 tests in 529 files, 30 strict specs, typecheck, lint, public
    readiness, build, static-host checks, budgets, and fonts. The catalog has 206 scenarios across
    12 modules, 231 static routes, 228 crawlable routes, and 47 artifacts. All 213 prior client and
    Worker identities are unchanged; 214 are accepted. Landing/cockpit/offline budgets are
    148.7/1,563.9/3,480.2 KiB; fonts are 86.2 KiB. Neighbor checks passed before repinning six
    hypocalcemia, ten hyponatremia, and twelve AVP shared dependencies; authored quality records
    are unchanged. Fix the exact-source link allowance found by CI; do not allow background
    foreign-origin requests. Confirmed host deep-idle interruptions required an awake rerun,
    which passed without changing assertions or timeouts. Actual release refuses 221 blockers.
  - [ ] Complete hypokalemia independent clinical review, four exact-version quality records,
    full inclusive-runtime verification, and production Turnstile/D1 evidence. Desktop QA at
    1,280 × 720 confirms a centered 560 × 619 report dialog, 160-character limit, unchecked
    context, cancel focus return, and unchanged paused clock. Continuing applies one decision
    and pauses again. This is not phone or native assistive-technology validation. Local reporting
    is disabled; no production report was sent. Publish the updated Worker catalog before the
    new client and keep pending gates explicit.
  - [x] Renal/electrolyte slice 3/12 registers `hyponatremia-symptoms-and-reassessment@0.1.0`
    as a distinct persistent-symptom preview. Selected qualified rescue improves authored sodium
    from 118 to 123 and then 124 while confusion, headache, and nausea persist. Current full
    assessment gates additional rescue; initial rescue and parallel neurologic investigation do
    not wait for administrative steps. SfE 2022, European 2014, and the 2024 CJASN review were
    checked August 27, including rendered treatment and diagnostic figures. The selected pathway
    is not a universal regional pace; +6 is not a treatment-stop rule. See the evidence brief.
  - [x] Add thirteen choices, nine-decision paused example, private tutor, five-objective debrief,
    nonvisual summaries, and shared centered reporting. Partial sodium and neurologic findings
    retain full-panel history. Care credit requires later event order, even at one tick. Optional
    reports have seven live vitals and at most 31 observed/care scalars, excluding hidden results,
    timers, and prose. All 509 neighboring checks passed before repinning 6/10/12 shared quality
    dependencies; authored records remain unchanged.
  - [x] Verify final indexable CI: 4,805 tests in 537 files, all 30 strict specifications,
    typecheck, lint, public readiness, build, static-host checks, budgets, and fonts pass. There
    are 207 scenarios, 232 static routes, 229 crawlable routes, and 47 artifacts. All 214 prior
    report identities remain unchanged; 215 are accepted. Landing/cockpit/offline assets total
    148.7/1,576.2/3,501.2 KiB, with 86.2 KiB fonts. Final audit caught premature additional-response
    debrief credit; targeted regressions and 99 affected neighbor checks pass after correction.
    Re-pin only the changed debrief hashes. Actual release still refuses 222 publication blockers.
  - [ ] Complete hyponatremia independent clinical review, four exact-version quality records,
    full inclusive-runtime validation, and production Turnstile/D1 evidence. Desktop QA at
    1,280 × 720 confirms a centered 560 × 619 dialog, 160-character cap, unchecked context,
    cancel focus return, and paused reading/reporting clock. One continuation applies one rescue
    decision and pauses again. Local reporting is disabled; no production report was sent.
    Publish the additive Worker identity catalog before the new client; keep pending gates explicit.
  - [x] Renal/electrolyte slice 4/12 registers `hypernatremia-water-access-and-losses@0.1.0`
    as a distinct water-access and continuing-diarrhea preview. Circulation improves before sodium;
    water-only care partially improves sodium but can recur without delivered loss care. Assisted
    access is not a biochemical gate. Pretreatment urine remains historical and does not establish
    current clearance. Yun 2023, NICE CG174, NHS Ayrshire and Arran 2026, and Chacon-Palma 2025 were
    checked August 27. No source validates the authored sodium trajectory or a universal rate.
  - [x] Add thirteen choices, ten-decision paused example, private tutor, five-objective debrief,
    nonvisual summaries, and shared centered reporting. Current recurrence can be transferred
    after loss care is delivered while its response remains pending. Combined-response credit
    requires its actual later full checkpoint. Partial findings retain separate timestamps.
    Optional reports have seven live vitals and at most 32 observed/care scalars, excluding hidden
    results, timers, and prose. See the evidence brief for numerical and source boundaries.
  - [x] Verify final indexable CI: 4,919 tests in 545 files, all 30 strict specifications,
    typecheck, lint, public readiness, build, static-host checks, budgets, and fonts pass. There
    are 208 scenarios, 233 static routes, 230 crawlable routes, and 47 artifacts. All 215 prior
    report identities are unchanged; 216 are accepted. Landing/cockpit/offline assets total
    148.7/1,588.1/3,523.3 KiB, with 86.2 KiB fonts. All 613 neighboring checks passed before
    repinning 6/10/12 shared dependency hashes; authored quality records remain unchanged.
    Independent code audit found no additional issues. Actual release still refuses 223 blockers.
  - [ ] Complete hypernatremia independent clinical review, four exact-version quality records,
    full inclusive-runtime validation, and production Turnstile/D1 evidence. Desktop QA at
    1,280 × 720 confirms a centered 560 × 619 dialog, 160-character cap, unchecked context,
    cancel focus return, and paused reading/reporting clock. One continuation applies one
    circulation decision and pauses again. Local reporting is disabled; no production report
    was sent. Publish the additive Worker catalog before the new client; keep pending gates explicit.
  - [x] Renal/electrolyte slice 5/12 registers `hypocalcemia-ionized-calcium-and-ckd@0.1.0`
    as a distinct measurement and kidney-context preview. Low measured ionized calcium and
    symptoms are not erased by reassuring adjusted total calcium. Monitored rescue and immediate
    continuing calcium have no administrative or repeat-test gate. Mineral care and follow-up
    do not drive biochemical response. Gauci 2008, SfE 2016/2019, FDA 2024, and June 2026 Prolia
    prescribing information were checked August 27. No source validates the authored trajectory.
  - [x] Add fourteen choices, ten-decision paused example, private tutor, five-objective debrief,
    nonvisual summaries, and shared reporting. Partial ionized and symptom observations retain
    separate histories. Handoff can transfer current recurrence with continuing-care response
    pending; response credit requires its later full checkpoint. Optional reports have seven
    live vitals and at most 30 explicit observed/care scalars, excluding hidden values and prose.
  - [x] Verify all CI components with `SITE_INDEXABLE=true`, using `npm run test -- --maxWorkers=2`
    for unchanged full-suite coverage and timeouts: 5,035 tests in 553 files pass in 704.33 seconds.
    All 30 strict specifications, typecheck, lint, public readiness, build, static-host checks,
    budgets, fonts, and the additional indexability check pass. There are 209 scenarios,
    234 static routes, 231 crawlable routes, 47 catalog artifacts, and 239 classified media assets.
    All 216 prior report identities are unchanged; 217 are accepted. Landing/cockpit/offline
    assets total 148.7/1,600.5/3,546.1 KiB, with 86.2 KiB fonts. After 718 neighboring checks
    passed, repin only 6/10/12 changed shared dependency hashes; quality records remain unchanged.
    An initial contention-related replay timeout passed on the constrained rerun without relaxed
    assertions or limits. Actual release still refuses 224 blockers; independent audit found no
    additional source issues. See the evidence brief for desktop QA and verification details.
  - [ ] Complete renal hypocalcemia independent clinical review, four exact-version quality records,
    complete inclusive-runtime validation, and production Turnstile/D1 evidence. No local check
    substitutes for clinical approval or production validation. Publish the additive Worker
    identity catalog before the new client; retain pending gates explicitly.
  - [x] Renal/electrolyte slice 6/12 registers `hypermagnesemia-antagonism-and-removal@0.1.0`
    as a distinct nonobstetric toxicity preview. Respiratory support, temporary calcium antagonism,
    stopping further exposure, and delivered removal are independent responsibilities. Recurrent
    clinical toxicity is not a measured magnesium rebound. Nishikawa 2018, Bansal 2016, Jou 2023,
    and current Hospira prescribing information were checked August 27. The values and response
    clocks are authored, not validated calcium durations, dialysis kinetics, or clinical waits.
  - [x] Add thirteen choices, a twelve-decision paused example, private tutor, five-objective
    debrief, nonvisual summaries, and shared reporting. Repeat calcium requires an explicit
    confirmation, not automatic redosing. Partial observations preserve full-panel history;
    supported breathing remains supported. Handoff can transfer current toxicity with removal
    pending; an observed removal response does not require unnecessary late calcium. Optional
    reports have seven live vitals and at most 31 observed/care scalars, excluding hidden values,
    timers, and learner prose. An incorrect citation title was corrected and regression-tested.
  - [x] Verify all 5,154 tests in 561 files with two workers, plus all CI components and the
    additional indexability check. The build contains 210 scenarios, 235 static routes,
    232 crawlable routes, 47 catalog artifacts, and 240 classified media assets. Budgets pass
    at 148.6/1,613.3/3,568.3 KiB for landing/cockpit/offline and 86.2 KiB for fonts. Revalidate
    824 neighboring tests in 62 files before repinning only 6/10/12 changed shared hashes;
    quality records and all 217 older report identities remain unchanged. The catalog now
    contains 218 report identities. Fix the privacy test's accidental seed substring match
    with a precise forbidden-scalar assertion; preserve the exact field allowlist. Actual
    release still refuses 225 blockers. See the evidence brief for desktop QA and test details.
  - [ ] Complete hypermagnesemia independent clinical review, four exact-version quality records,
    complete inclusive-runtime validation, and production Turnstile/D1 evidence. Local checks
    do not replace those requirements. Publish the additive Worker identity catalog before
    the new client, and preserve pending gates explicitly.
  - [x] Repair service-worker release consistency. Build-stamped SHA-256 integrity checks reject
    mixed or incomplete installations; active snapshots are immutable. Explicit acceptance waits
    for the intended controller before reloading only that tab. Durable per-client release pins
    and a two-phase activation fallback protect old pages, solver workers, worker restarts, and
    storage-failure paths. Initializing clients survive cleanup; confirmed closed-client pins are
    pruned outside activation, and a later activation retires unused releases. Uncontrolled pages
    are not claimed, so first-install offline readiness requires a subsequent controlled navigation.
  - [x] Verify release behavior with 36 real-worker VM regressions and 19 update-registration/
    notice UI tests, plus production-style local browser smoke checks. All 300 precache responses
    match their integrity digests through the configured Cloudflare static-asset preview. Accepting
    one update changes only that tab's script version; the older paused session retains its choice.
    With the server stopped, the old solver accepts another choice, a new navigation loads the
    current release's untouched document, and a fresh scenario worker starts and advances. The
    offline report dialog fails closed without interrupting practice. Old lazy-asset version
    isolation is covered by the VM regressions, not claimed from full-document browser navigation.
    Final CI passes 3,653 tests across 466 files, all 30 specifications, static-host checks, and
    font budgets; the indexable build verifies 220 routes. Compressed budgets are 147.6 KiB for
    landing, 1,474.2 KiB for the interactive cockpit, and 3,285.2 KiB for the full offline bundle.
    This infrastructure evidence does not replace independent clinical, inclusive-runtime, or
    production Turnstile/D1 verification.
  - [x] Keep optional updates out of the cockpit transport row. A shared provider preserves
    readiness, dismissal, and retry state; More options offers the update with an explicit
    unsaved-progress warning, while other pages use an in-flow notice. Opening the menu focuses
    an ordinary speed control, not reload. A waiting-worker reconciliation covers early readiness
    events. Desktop speed controls no longer wrap into clipping; the compact bar is 48 px high
    for 44 px controls, with 8 px between Play and More options at narrow widths.
  - [x] Verify the update placement with full CI (3,677 tests across 467 files) and a final
    indexable build, followed by 189 focused UI, release, offline, and static-host checks after
    the final spacing adjustment. A real local release transition leaves desktop and 320 px
    transport geometry unchanged, keeps paused clocks unchanged, and restores focus on closing
    More options. At 320 × 180, both 44 px controls remain fully visible; the warning wraps and
    the dialog's Close control is reachable by scrolling. The temporary iframe layout harness
    permits same-origin framing only in its test copy; production framing restrictions remain
    unchanged. This is a layout smoke check, not physical-device, screen-reader, zoom, clinical,
    or production reporting signoff. Final indexable checks verify 220 routes, 223 static routes,
    and 44 catalog artifacts. Compressed budgets are 147.9 KiB landing, 1,474.6 KiB cockpit, and
    3,281.4 KiB offline. Scenario counts and pending independent gates are unchanged.
- [ ] Wave F: complete 10 infectious-disease and 15 toxicology scenarios.
  - [x] Infectious-disease slice 1/10 establishes the indexable `/infectious-disease` module with one
    authored meningococcal sepsis lab. A previously well MenACWY-vaccinated 15-year-old presents with
    fever, heart rate 138/min, BP 88/44 mmHg, capillary refill 4 s, conscious level 14/15, lactate
    4.1 mmol/L, platelets 96, leucopenia, C-reactive protein 48 mg/L, and non-blanching petechiae
    including two lesions larger than 2 mm. The learner reconciles the rash with the whole patient;
    recognizes a strongly suspected pattern without closing on one marker, on an absent rash, or on
    vaccination; activates a senior clinical decision maker, blood culture and whole-blood PCR
    sampling that does not delay care, and critical-care review of vasoactive and access needs;
    reviews the one-hour antimicrobial target, the refusal to delay transfer, and the contested
    United Kingdom versus international fluid ceiling; records bounded qualified-team antimicrobial
    and fluid intent; then meets one of two strict authored contrasts. Without intent, a ten-minute
    untreated state supplies heart rate 152/min, BP 76/36 mmHg, conscious level 10/15, lactate
    6.8 mmol/L, and spreading purpura, moving Phoenix 2 to Phoenix 5. With intent, a one-hour review
    supplies a deliberately inadequate response and a risen C-reactive protein of 96 mg/L, and only
    that state gates handoff on alerting a consultant to attend in person, which is distinct from
    earlier telephone ownership. Practice ends with shock unresolved and the diagnosis unconfirmed.
    No learner history, examination, monitoring or test acquisition, sepsis scoring, diagnosis,
    antimicrobial selection, dose, route, access, infusion, fluid volume, vasoactive choice, oxygen
    setting, lumbar-puncture or imaging decision, source control, public-health notification, contact
    prophylaxis, disposition, prognosis, or outcome control exists.
  - [x] Verify the module launch with a green suite. Ten engine-contract checks cover the authored
    deterioration and one-hour states, the attendance gate and its absence before the review,
    instructor takeover, refused generic and malformed actions, and the absence of any named agent or
    dose. Twenty-four reporting checks confirm only uniquely attributable outcomes enter optional
    context and that event prose and injected payloads never do. Eight foundation checks and seven
    tray checks cover registration, routing, prerendering, structured data, catalog artifacts, the
    160-character shared report door, and screen-reader-visible state. The published report catalog
    grows to 219 records, and the twelve earlier modules' immutable evidence is confirmed byte for
    byte unchanged. The front-door word budget now measures prose separately from the module
    directory, so a module launch can no longer silently relax the one-screen guarantee. This
    infrastructure evidence does not replace independent clinical, inclusive-runtime, or production
    Turnstile/D1 verification, and four quality records remain outstanding for this scenario.
  - [x] Infectious-disease slice 2/10 adds the infected obstructed kidney, where antimicrobials are
    not source control. A 58-year-old woman has three days of flank pain and rigors with appropriate
    intravenous antimicrobials already running as a supplied premise; authored state is temperature
    38.9 C, heart rate 118/min, BP 104/58 mmHg, respiratory rate 26/min, track-and-trigger score 8,
    lactate 2.6 mmol/L, creatinine 148 µmol/L against a baseline near 70, platelets 148, and a
    supplied 8 mm obstructing distal ureteric stone with moderate hydronephrosis. The learner
    reconciles the infection with the obstruction; recognizes an undrained source rather than a more
    severe infection; involves urology and interventional radiology early with blood, urine, and
    collecting-system cultures; reviews a timing and modality boundary in which no guideline states
    an hour threshold, a strong urological recommendation rests on Grade C evidence, a six-hour
    sepsis figure is conditional on very-low-certainty evidence, and neither nephrostomy nor stenting
    is separated by outcome evidence; records bounded decompression intent; and defers definitive
    stone treatment until the infection is treated. Still obstructed, a strict six-hour contrast
    supplies heart rate 132/min, BP 86/44 mmHg, new confusion, score 15, lactate 4.2 mmol/L, and
    creatinine 212 µmol/L. After recorded intent, a strict six-hour assessment supplies heart rate
    104/min, score 5, lactate 2.1 mmol/L, and a C-reactive protein of 268 mg/L that is higher than
    the presenting 210, because the marker lags and is not the success signal. Timing of intervention
    belongs to the receiving team after senior advice. No learner history, examination, observation
    or test acquisition, imaging interpretation, scoring, diagnosis, antimicrobial, dose, route,
    fluid, oxygen setting, drainage modality, access, operator, procedure, disposition, prognosis, or
    outcome control exists.
  - [x] Verify slice 2 with a green suite and repair one real modelling defect found by its own
    tests: instructor takeover was originally set before the untreated six-hour contrast, so a
    learner who did nothing was stopped before the deterioration the lesson exists to show; takeover
    now sits after it. Eleven contract checks cover both six-hour states, the refusal to mark either
    drainage route correct, the handoff gate including the deferred stone decision, takeover, and
    refused generic and malformed actions. Twenty-three reporting checks confirm only uniquely
    attributable outcomes enter optional context. Eight tray checks and five screen-reader checks
    confirm the antimicrobial premise is stated rather than implied, that neither modality is
    presented as correct, and that the rising-marker caveat survives into the accessible summary.
    The published report catalog grows to 220 records and every earlier module's immutable evidence
    is unchanged. This infrastructure evidence does not replace independent clinical, inclusive-
    runtime, or production Turnstile/D1 verification, and four quality records remain outstanding.
  - [x] Infectious-disease slice 3/10 adds febrile neutropenia, where the examination is blind. A
    61-year-old on day 10 after chemotherapy walks in looking well with one fever reading and no
    localizing findings; authored state is temperature 38.4 C, heart rate 104/min, BP 118/72 mmHg,
    capillary refill 2 s, neutrophils 0.2 x10^9/L, white cells 0.8, platelets 96, C-reactive protein
    42 mg/L, and lactate 1.8 mmol/L. The learner reconciles the fever, count, chemotherapy day, and
    absent local signs; recognizes an emergency despite a blind examination; activates the
    neutropenic sepsis pathway and acute oncology team with the arrival clock recorded and requests
    peripheral and line cultures without delaying therapy; reviews a boundary in which the one-hour
    figure is a system-design safety margin rather than a validated threshold, the United Kingdom
    guideline says only immediately, and risk scores address disposition rather than whether
    antimicrobials are given; then records bounded intent for immediate empiric intravenous therapy
    per local protocol. Without intent, a strict contrast supplies temperature 36.1 C, heart rate
    128/min, BP 86/48 mmHg, capillary refill 4 s, neutrophils 0.1, and lactate 3.9 mmol/L, with no
    rise in the white cell count. With intent, a strict later assessment supplies temperature 37.6 C,
    heart rate 96/min, and lactate 1.9 mmol/L alongside a C-reactive protein of 126 mg/L that exceeds
    the presenting 42 because the marker lags. Neutropenia persists in every branch. No learner
    history, examination, observation or test acquisition, imaging, risk scoring, diagnosis,
    antimicrobial, dose, route, combination, duration, de-escalation, antifungal, growth-factor,
    prophylaxis, fluid, oxygen, procedure, disposition, prognosis, or outcome control exists.
  - [x] Correct a clinical framing error before authoring. The initial premise held that a
    neutropenic patient mounts no inflammatory response; that is false. Neutropenia blunts local,
    neutrophil-dependent signs, while fever, tachycardia, and C-reactive protein are preserved and
    merely lag. The scenario, its limitations, and its brief now say so, and the authored values are
    built on it: a falling temperature and a flat white cell count are deterioration rather than
    reassurance, and a marker rising after treatment is lag rather than failure.
  - [x] Verify slice 3 with a green suite: ten contract checks, twenty-two reporting checks, and
    eight tray checks, covering both contrasts, all four refusals, the handoff gate, takeover
    ordering after the untreated contrast, and the absence of any named agent in either the snapshot
    or the rendered tray. The published report catalog grows to 221 records.
  - [x] Close the report-coverage gap the earlier audit identified. The module list feeding the
    report catalog is hand-maintained in scripts/build-completion-catalog.ts and nothing tied it to
    the module registry, so a module could be routed and playable while the Worker rejected every
    report from it as an unknown scenario. Two guards now assert that the table matches
    availableModules() in both directions and that every authored scenario has a current-version
    record the Worker will accept. Both were mutation-tested by removing records and confirming they
    fail with a named message. Measured coverage is 13 of 13 modules and 213 of 213 scenarios; an
    apparent 212-versus-211 discrepancy resolved to `status-epilepticus` being authored in two
    modules, not a missing record.
- [x] Split each clinical module into its own lazily loaded route chunk so a learner downloads one
  module's catalogue rather than all thirteen. All thirteen module configurations previously lived in
  `src/routes/AnesthesiaRoute.tsx`, so the bundler had no seam and opening any scenario pulled every
  scenario in the project. Each module now owns `src/routes/modules/<id>.tsx`; the shared frame,
  including the one report control, stays in an exported `ClinicalModuleRoute`.
  - [x] Measured, not asserted: the interactive cockpit budget falls from 1,654.3 KB to 1,389.0 KB,
    turning 9.7 KB of headroom into 275 KB. The built output now carries thirteen catalogue chunks of
    8.6 to 39.9 KB in place of one 264 KB chunk, so opening infectious disease costs 8.6 KB of
    scenario data instead of 264 KB. Growth is now per module rather than global.
  - [x] Repoint the cockpit budget at `src/routes/modules/anesthesia.tsx`, because the old target
    stopped being a chunk root. This makes the budget measure what its own comment always claimed,
    the entry plus the selected clinical route, using the heaviest module as the honest worst case.
  - [x] Add `tests/unit/module-chunking.test.ts` to hold the seam open: every available module has a
    distinct route chunk, each pulls at least one asset no other module pulls, and no module's graph
    contains another module's catalogue. Mutation-tested by re-importing a module catalogue into the
    shared file, rebuilding, and confirming the guard fails with the offending module named.
  - [x] Repair two real regressions the suite caught: a bundle-boundary test and a module-foundation
    test both pinned the old single-file layout. Landing stays within budget at 149.5 KB of 150.0 KB;
    it is dominated by the entry chunk and fonts rather than scenario data, so it does not grow per
    scenario. Anesthesia's own catalogue remains in the shared chunk because the goal-path and
    catalog features that use it are anesthesia-only and still live in the shared file.
  - [x] Infectious-disease slice 4/10 adds necrotizing soft-tissue infection, where a ruled-out
    result changes nothing. A 55-year-old with diabetes returns after 36 hours of oral antibiotics
    for a limb infection that has not settled, with severe pain extending past the edge of the
    redness. Authored state is temperature 37.4 C, heart rate 104/min, BP 118/72 mmHg, white cells
    14.8 x10^9/L, C-reactive protein 132 mg/L, sodium 136 mmol/L, creatinine 118 µmol/L, glucose
    11.4 mmol/L, haemoglobin 12.6 g/dL, lactate 2.4 mmol/L, no crepitus and no bullae, and a derived
    laboratory risk score of 3 against a cutoff of 6. Every component is deliberately inside a band
    that keeps the score low, and lactate is the only frankly abnormal value and not one the score
    counts. The learner reconciles the pain and the failed oral course; recognizes that a score below
    its cutoff excludes nothing, because pooled sensitivity at that cutoff is near two-thirds and the
    score counts late physiology; marks and times the erythema border; requests urgent surgical
    review for consideration of exploration; reviews the sensitivity, late-sign, imaging, and timing
    boundaries; and records bounded antimicrobial intent alongside rather than instead of surgery.
    After four authored hours the erythema is 4 cm beyond its mark, the skin is dusky, and the score
    reads 11. That progression occurs whatever the learner records, because only an operation treats
    this and the operation happens after the rehearsal; what the learner changes is whether the
    surgical team is already mobilized when it arrives. No learner history, examination, observation
    or test acquisition, imaging order or interpretation, scoring, diagnosis, antimicrobial, dose,
    route, incision, extent, theatre time, procedure, disposition, prognosis, or outcome control
    exists.
  - [x] Verify slice 4 with eleven contract checks, twenty-one reporting checks, eight tray checks,
    and five screen-reader checks. The contract checks assert that the presenting score is below the
    cutoff, that both an idle and an actively managed run reach identical vitals at the progression,
    that only `surgeryRequestedBeforeProgression` distinguishes them, that all four exclusion
    shortcuts are refused, and that no antimicrobial is ever named. The published report catalog
    grows to 222 records.
  - [x] Infectious-disease slice 5/10 adds endocarditis with new heart failure, where the
    antimicrobial course is working and the patient is dying. A 44-year-old on day 3 of appropriate
    therapy for confirmed aortic-valve endocarditis becomes breathless; authored state is heart rate
    118/min, BP 104/62 mmHg with a pulse pressure of 42, RR 26/min, SpO2 92% in air, a supplied 12 mm
    vegetation with new severe regurgitation, C-reactive protein 180 mg/L and falling, and cultures
    with no growth. The learner recognizes mechanical failure rather than antimicrobial failure;
    convenes the multidisciplinary endocarditis team with a valve-surgery centre; reviews a boundary
    in which acute severe regurgitation narrows rather than widens the pulse pressure, vegetation
    size is not a standalone trigger, and the surgical timing tiers are consensus rather than
    randomised-trial thresholds; and records bounded intent for urgent surgical assessment and
    transfer. After 45 authored minutes the pulse pressure narrows to 18 mmHg, oxygen requirement
    rises to 15 L, lactate reaches 4.3 mmol/L, and the C-reactive protein falls further to 128 mg/L.
    That divergence is the lesson. The decompensation occurs whatever the learner records, because
    the treatment is an operation outside this rehearsal. No learner history, examination,
    echocardiography acquisition or interpretation, diagnosis, antimicrobial, dose, route, fluid,
    diuretic, vasoactive agent, oxygen setting, operation, prosthesis, theatre time, anaesthetic
    plan, disposition, prognosis, or outcome control exists.
  - [x] Infectious-disease slice 6/10 adds severe community-acquired pneumonia, where the score
    answered a different question. A 62-year-old with multilobar consolidation presents with
    respiratory rate 30/min, SpO2 92% on an inspired fraction of 0.35 giving an oxygenation ratio of
    171, BP 106/64 mmHg, urea 8.4 mmol/L, C-reactive protein 284 mg/L, and sodium 129 mmol/L. Two
    supplied instruments are both correctly calculated and disagree: the mortality score reads 2,
    placing him in a ward band, while three severity criteria are met, which defines severe
    pneumonia. Nothing is hidden and nothing is mismeasured, so the failure is interpretive rather
    than perceptual. The learner holds both together; recognizes that the mortality score answers
    thirty-day death rather than level of care, with pooled discrimination for predicting
    critical-care admission of about 0.69; requests critical-care review while the patient is still
    on a ward trajectory, citing the criteria rather than the band; reviews a boundary in which no
    severity tool has randomised outcome evidence for triage, the delay-harm evidence is confounded
    by indication, the criteria have never been re-derived, and the C-reactive protein and sodium
    appear in neither instrument; and records bounded escalation intent. After two authored hours the
    ratio falls to 92 while the saturation falls only two points, confusion appears, and the mortality
    score catches up to 4, which was always going to happen. No learner history, examination,
    observation or test acquisition, blood gas, imaging, scoring, diagnosis, antimicrobial, dose,
    route, fluid, oxygen device or setting, ventilation mode, vasoactive agent, steroid, procedure,
    bed allocation, disposition, prognosis, or outcome control exists.
  - [x] Verify slice 6 with twelve contract checks, twenty-one reporting checks, eight tray checks,
    and five screen-reader checks, including that the saturation falls exactly two points while the
    ratio collapses, that an idle and an actively managed run reach identical vitals, and that only
    `criticalCareBeforeDeterioration` distinguishes them. The published report catalog grows to 224
    records.
  - [x] Infectious-disease slice 7/10 adds toxic shock as a confirmation-deferral lesson. A
    previously well 22-year-old presents with diffuse macular erythroderma, mucosal hyperaemia,
    vomiting and diarrhoea from onset, temperature 39.4 C, heart rate 128/min, BP 88/44 mmHg,
    platelets 118 x10^9/L, creatinine 1.9 mg/dL, alanine aminotransferase 78 U/L, creatine kinase
    640 U/L, and lactate 3.4 mmol/L, with cultures pending. Neither surveillance case definition is
    met and they fail for different reasons: one requires desquamation one to two weeks after the
    rash, which cannot have happened, and the other requires isolation of the organism, which has not
    grown. The same pending culture answers one definition and violates the other, because one
    requires negative cultures and the other requires an isolate. The creatinine is deliberately
    split at 1.9 mg/dL, above twice normal for one definition's renal criterion and below the other's
    2.0 threshold. After four authored hours the creatinine reaches 2.4 and the platelets 84, so more
    criteria are satisfied on both definitions and neither closes. The learner recognizes the
    pattern, activates critical care on it, requests cultures, records bounded treatment intent,
    records the definition status openly with its reason and a one-to-two-week re-check horizon, and
    hands over an explicitly open diagnosis. Source control was completed off-stage so this scenario
    carries only the definitional lesson. No learner history, examination, observation or test
    acquisition, case classification, diagnosis, antimicrobial, dose, route, adjunct, immunoglobulin,
    fluid, vasoactive agent, procedure, disposition, prognosis, or outcome control exists.
  - [x] Verify slice 7 with twelve contract checks, twenty-two reporting checks, eight tray checks,
    and five screen-reader checks, including that both definitions read unmet in every state, that
    desquamation stays absent and cultures stay pending throughout, and that all four closure and
    exclusion shortcuts are refused. The published report catalog grows to 225 records.
  - [x] Infectious-disease slice 8/10 adds possible sepsis without shock as a bounded-clock lesson,
    written against the risk that a three-hour tier reads as permission to wait. A 71-year-old
    presents with temperature 38.4 C, heart rate 108/min, BP 118/72 mmHg with no hypotension,
    respiratory rate 22/min, alert, lactate 2.4 mmol/L, C-reactive protein 96 mg/L, and no
    identified source. Infection cannot be excluded and neither can a non-infective cause. The
    lesson exposes no waiting action at all: the learner records the time infection was first
    suspected, records the uncertainty as it stands without assigning a tier, requests a
    time-limited course of rapid investigation against a displayed ceiling, reviews the tiers and
    their certainty, arranges the close monitoring the deferral tier is conditional on, records
    bounded qualified-team antimicrobial intent, and hands over the running clock with the
    classification open. The ceiling counts down in the tray and is announced first in the
    screen-reader summary. Observing and reviewing later, assigning the likelihood tier, ruling
    infection out on one biomarker, and deferring with no time limit are all refused choices. The
    assessment returns at 90 authored minutes with concern persisting and a source found; the
    ceiling is reported as passed at 180 minutes rather than hidden; the branch then collapses to
    the immediate path at 195 minutes with no learner discretion; instructor takeover bounds an
    abandoned run at 225 minutes. No learner history, examination, tier assignment, diagnosis,
    antimicrobial, dose, route, combination, fluid, vasoactive agent, procedure, disposition,
    prognosis, or outcome control exists.
  - [x] Verify slice 8 with fourteen contract checks, twenty-two reporting checks, eleven tray
    checks, and seven screen-reader checks, including that no action name reads as waiting, that
    recording the time zero late buys no extra time, that the ceiling and the shock collapse are
    both reachable in order, and that the snapshot carries no tier field. Writing the contract
    checks found a real authoring dead-end: shock at 150 minutes always preceded the 180-minute
    ceiling, so the passed-ceiling feedback branch was unreachable. The ceiling now precedes the
    deterioration, and a regression check pins that order. The published report catalog grows to
    226 records.
- [x] Repair four defects an adversarial audit found in possible sepsis within an hour of shipping
  it, and pin each with a regression test.
  - [x] The 90-minute assessment return was gated on elapsed time alone rather than on the request,
    so a result arrived for an assessment nobody ordered. Requesting it at 100 minutes produced the
    return at 90, inverting cause and effect in the one lesson whose point is that waiting is not a
    plan. The return now runs from the request.
  - [x] The ceiling countdown goes null when a run ends, and both the tray and the screen-reader
    summary read null as "the time of first suspicion has not been recorded" - directly above a line
    reporting the time it was recorded at. Both surfaces now branch on the recorded fact.
  - [x] The debrief accepted a reassessment taken before the authored change as evidence that the
    learner had reviewed it, so an eight-tick run certified all six objectives with finding text
    describing events it never saw. Only the returned or collapsed assessment now qualifies.
  - [x] An authored event named an infected upper urinary tract on imaging, confirming a source the
    scenario's own boundary forbids and interpreting imaging the controls exclude, in a mangled
    phrase. It now uses the wording every other artifact already carried.
- [x] Harden the problem-reporting service against an audit of its privacy, abuse-prevention, and
  accessibility boundaries.
  - [x] Per-reporter throttles hashed the full client address, so one ordinary IPv6 /64 allocation
    supplied 2^64 identities and both daily limits were unbounded in practice. Throttling now counts
    the /64 network, and rotation across it collapses to one reporter.
  - [x] Acceptance was capped globally and per reporter but never per scenario, so one subject could
    spend the whole day's budget and silence every other scenario's reports behind an indistinguishable
    202. A per-scenario daily cap now bounds that.
  - [x] The patient-information check missed separator-free numbers and dates, so a bare ten-digit
    number or a date of birth reached the note column. Both copies of the check now reject them, and
    a parity test runs the corpus through the worker's validator as well as the client's.
  - [x] Success was announced into a live region mounted with its text already present, which screen
    readers do not reliably read, while focus moved to a button - so a report succeeded silently. One
    always-mounted region now carries both outcomes.
  - [x] The character counter was an aria-live region and spoke after every keystroke. It is now
    referenced by the textarea instead, so it is read on focus.
- [x] Repair four defects a consistency audit found in already-published infectious-disease
  scenarios, and cover each with a regression test.
  - [x] The necrotizing-infection tray rendered a live derived risk score inside its static
    supplied-findings paragraph, so after the progression it read "score 11, below its usual cutoff
    of 6" and revealed the progression before the learner reassessed, in the one lesson whose point
    is that the score informs only after it stops mattering. It now shows the authored presenting
    value.
  - [x] `escalate-consultant` in the meningococcal lesson was ungated. Pressed at tick 0 it placed
    the patient in the best authored state, masked the ten-minute untreated deterioration entirely,
    pre-satisfied the handoff gate it exists to enforce, and emitted a message asserting an hour had
    passed. It is now gated on the authored one-hour review, with a refusal that enters report
    context and a regression test covering both the refusal and the still-reachable contrast.
  - [x] The obstructed-kidney completion evidence asserted a two-hour instructor takeover; the
    constant is eight hours, deliberately after the six-hour untreated contrast.
  - [x] The screen-reader summary narrated live derived scores, a risk score and a track-and-trigger
    score computed from laboratory values the learner must request, that no tray rendered and that
    both surfaces promise are historical. Screen-reader users were receiving state sighted users had
    to ask for. Both narrations are removed and both fields deleted from the protocol so nothing can
    leak them again. Live alertness is deliberately retained, being the house convention across all
    sixteen lessons and consistent with the live vitals on the monitor.
- [x] Correct the meningococcal evidence brief, which presented the antimicrobial-timing dispute as
  ongoing. IDSA declined to endorse the 2016 and 2021 Surviving Sepsis Campaign editions, but the
  2026 edition answers that objection with a tiered structure reserving the one-hour target for
  septic shock and probable or definite sepsis, and IDSA now lists the 2026 adult and paediatric
  guidelines as endorsed. The brief says so, dates the correction, and explains why the resolution
  does not weaken this scenario's clock: a named high-probability syndrome is exactly the population
  both sides always agreed should be treated immediately.
  - [x] Toxicology slice 1/15 establishes the indexable `/toxicology` module with one authored
    methemoglobinemia lab after documented topical benzocaine exposure. The learner reconciles
    cyanosis, symptoms, pulse-coherent SpO2 85%, PaO2 238 mmHg, chocolate-brown blood, and supplied
    co-oximetry methemoglobin 32%; recognizes an urgent dyshemoglobin pattern without one-number or
    diagnostic closure; activates qualified support, source control, poison-center or medical-
    toxicology consultation, and critical-care ownership; reviews G6PD-deficiency hemolysis and
    serotonergic-drug hazards; records bounded qualified-team methylene-blue intent; then reviews a
    strict elapsed fixed symptom, heart-rate, and co-oximetry response before another elapsed
    exposure, rebound, hemolysis, serotonin, rescue, and active-risk handoff. No learner history,
    examination, monitoring or test acquisition, gas calculation, diagnosis, oxygen setting, drug,
    dose, route, access, infusion, treatment delivery, rescue procedure, disposition, prognosis, or
    outcome control exists.
  - [x] Toxicology slice 2/15 adds carbon monoxide with a reassuring monitor. The learner reconciles
    a documented shared generator-exhaust exposure, transient loss of consciousness, confusion,
    conventional SpO2 99%, elapsed time, and the whole patient; recognizes that conventional pulse
    oximetry cannot exclude poisoning and one supplied COHb value cannot independently grade severity;
    activates source and co-exposed-person safety, qualified oxygen and monitoring, poison-center or
    medical-toxicology consultation, and emergency ownership; reviews supplied COHb 28% with sample
    timing plus neurologic and cardiac context; records selected-patient hyperbaric consultation; then
    reviews a strict elapsed fixed symptom, heart-rate, respiratory-rate, and COHb response before
    another elapsed delayed-neurologic, cardiac, exposure, follow-up, and active-risk handoff. No
    learner history, examination, monitoring or test acquisition, diagnosis, oxygen setting, drug,
    hyperbaric eligibility or treatment, chamber or transport selection, procedure, disposition,
    prognosis, or outcome control exists.
  - [x] Toxicology slice 3/15 adds acetaminophen where the clock changes the meaning. The learner
    reconciles a witnessed acute immediate-release ingestion, exact 6-hour clock, nausea, uncertain
    reported quantity, stable whole-patient state, supplied acetaminophen 132 µg/mL, qualified
    above-treatment-line plot, and baseline liver evidence; recognizes which exposure patterns permit
    or defeat acute nomogram use; activates poison-center or medical-toxicology, emergency, laboratory,
    monitoring, and compassionate safety ownership; records bounded qualified-team acetylcysteine
    intent; then reviews a strict elapsed fixed 22-hour report before another elapsed serial-level,
    liver-failure, individualized-stopping, safety, disposition, and active-risk handoff. No learner
    history, examination, monitoring or test acquisition, nomogram calculation, diagnosis,
    decontamination, drug, dose, route, preparation, access, infusion, adverse-reaction management,
    automatic stop, procedure, safety disposition, prognosis, or outcome control exists.
  - [x] Toxicology slice 4/15 adds salicylate where the falling number can be worse. The learner
    reconciles an acute aspirin exposure, 7-hour clock, tinnitus, vomiting, tachypnea, volume clues,
    supplied 52 mg/dL concentration and units, mixed respiratory alkalosis and metabolic acidosis,
    potassium, glucose, renal state, and whole patient; activates toxicology, emergency, critical-care,
    nephrology, monitoring, and compassionate safety ownership; reviews the serial, acid-base,
    volume, electrolyte, and high-risk airway boundary; records bounded qualified alkalinization and
    early dialysis preparedness; then reviews a strict elapsed falling concentration with worsening
    acidemia and confusion before another elapsed CNS, pulmonary, absorption, renal, electrolyte,
    extracorporeal, safety, and active-risk handoff. No learner history, examination, monitoring or
    test acquisition, acid-base calculation, diagnosis, fluid or electrolyte prescription, drug,
    dose, route, access, infusion, airway or ventilation setting, dialysis eligibility or delivery,
    procedure, safety disposition, prognosis, or outcome control exists.
  - [x] Toxicology slice 5/15 adds declared amitriptyline sodium-channel cardiotoxicity. The learner
    reconciles product, 90-minute clock, anticholinergic and CNS clues, a stopped seizure, hypotension,
    tachycardia, supplied QRS widening and terminal-aVR pattern, pH, electrolytes and whole patient;
    recognizes the whole pattern without QRS-only closure; activates toxicology, emergency, critical-
    care, nursing, pharmacy, airway, seizure, cardiac, perfusion and compassionate safety ownership;
    reviews ECG, perfusion, acid-base, electrolyte, coingestion and refractory-rescue boundaries;
    records bounded qualified bicarbonate and rescue intent; then reviews a strict elapsed fixed ECG,
    pressure and mental-state report before another elapsed conduction, shock, seizure, acidemia,
    recurrence, rescue and active-risk handoff. No learner history, examination, monitoring, ECG or
    test acquisition or interpretation, diagnosis, drug, dose, target, route, access, infusion, airway,
    ventilation, rhythm treatment, shock, pacing, lipid, ECLS, procedure, safety disposition,
    prognosis, or outcome control exists.
  - [x] Toxicology slice 6/15 adds declared immediate-release metoprolol cardiogenic shock. The
    learner reconciles product, 2-hour clock, bradycardia, shock, impaired mentation, vomiting, low
    glucose, supplied ECG and contractility, acid-base, lactate, electrolyte, renal and reported
    initial-care evidence; recognizes the whole beta-blocker pattern without pulse-only or pacing-
    only closure; activates toxicology, resuscitation, cardiac, metabolic, airway, monitoring and
    compassionate safety ownership; reviews phenotype, coingestion, glucose-potassium-volume and
    refractory-rescue boundaries; records bounded qualified vasopressor, glucagon, high-dose-
    insulin/euglycemia, surveillance and rescue intent; then reviews a strict elapsed fixed
    perfusion and metabolic report before another elapsed shock, bradycardia, hypoglycemia,
    electrolyte, volume, rescue and active-risk handoff. No learner history, examination,
    monitoring, ECG, imaging or test acquisition or interpretation, diagnosis, decontamination,
    glucose, electrolyte, fluid, drug, dose, rate, target, route, access, infusion, airway,
    ventilation, pacing, dialysis, lipid, ECLS, procedure, safety disposition, prognosis, or outcome
    control exists.
  - [x] Toxicology slice 7/15 adds declared extended-release diltiazem mixed shock. The learner
    reconciles product, formulation, 5-hour clock, bradycardia, complete AV block, shock, impaired
    mentation, hyperglycemia, supplied ECG, contractility and vascular-tone evidence, acid-base,
    lactate, electrolyte, renal and reported initial-care evidence; recognizes the whole calcium-
    channel-blocker pattern without glucose-only, pulse-only, or pacing-only closure; activates
    toxicology, resuscitation, cardiac, metabolic, airway, monitoring and compassionate safety
    ownership; reviews phenotype, coingestion, prolonged-absorption, glucose-potassium-volume and
    refractory-rescue boundaries; records bounded qualified vasopressor, calcium, high-dose-insulin/
    euglycemia, surveillance and rescue intent; then reviews a strict elapsed fixed perfusion, rhythm
    and metabolic report before another elapsed shock, AV-block, glucose, electrolyte, volume,
    prolonged-absorption, rescue and active-risk handoff. No learner history, examination,
    monitoring, ECG, imaging or test acquisition or interpretation, diagnosis, decontamination,
    glucose, electrolyte, fluid, drug, dose, rate, target, route, access, infusion, airway,
    ventilation, pacing, lipid, methylene blue, ECLS, procedure, safety disposition, prognosis, or
    outcome control exists.
  - [x] Toxicology slice 8/15 adds declared acute digoxin rhythm-potassium toxicity. The learner
    reconciles product, 7-hour clock, GI and visual clues, bradycardia, complete AV block,
    ventricular ectopy, shock, hyperkalemia, supplied ECG, properly timed pre-antidote level,
    acid-base, lactate, magnesium, renal and reported initial-care evidence; recognizes the whole
    life-threatening digoxin pattern without level-only, rhythm-only, potassium-only or pacing-only
    closure; activates toxicology, resuscitation, cardiac, electrolyte, airway, monitoring and
    compassionate safety ownership; reviews coingestion, sample-timing, assay, antidote and rescue
    boundaries; records bounded qualified immune-Fab, rhythm-potassium surveillance and rescue
    intent; then reviews a strict elapsed fixed perfusion, rhythm and potassium report before another
    elapsed arrhythmia, potassium-shift, renal, assay-interference, rescue and active-risk handoff.
    No learner history, examination, monitoring, ECG, digoxin level or test acquisition or
    interpretation, diagnosis, charcoal, glucose, electrolyte, fluid, Fab, vial count, drug, dose,
    rate, target, route, access, infusion, airway, ventilation, pacing, dialysis, cardioversion,
    antiarrhythmic, procedure, safety disposition, prognosis, or outcome control exists.
  - [x] Toxicology slice 9/15 adds declared organophosphate cholinergic respiratory failure. The
    learner reconciles product, dermal and inhalational route, 45-minute clock, wet-clothing
    secondary-contamination risk, secretions, bronchospasm, hypoxemia, bradycardia, vomiting,
    fasciculations, weakness, CNS change, supplied respiratory and laboratory evidence; recognizes
    the coupled muscarinic, nicotinic and CNS pattern without mnemonic-only or cholinesterase-only
    closure; activates qualified PPE, contamination, decontamination, airway, resuscitation,
    toxicology, occupational and co-worker ownership; reviews coformulant, seizure, airway and
    neuromuscular-blocker boundaries; records bounded qualified atropine, organophosphate-specific
    pralidoxime, benzodiazepine-if-needed, early airway and ventilation, decontamination and
    surveillance intent; then reviews a strict elapsed fixed respiratory report with persistent
    weakness before another elapsed recurrence, intermediate-syndrome, secondary-exposure, seizure
    and active-risk handoff. No learner history, examination, monitoring, blood-gas, cholinesterase
    or test acquisition or interpretation, diagnosis, PPE selection, clothing removal, irrigation,
    decontamination, oxygen, suction, fluid, atropine, pralidoxime, benzodiazepine, drug, dose, rate,
    target, route, access, infusion, airway, ventilation, neuromuscular blocker, procedure, workplace
    clearance, safety disposition, prognosis, or outcome control exists.
  - [x] Toxicology slice 10/15 adds declared isolated anticholinergic hyperthermia and delirium. The
    learner reconciles product, 3-hour clock, severe delirium, mydriasis, dry flushed skin and mucosa,
    absent sweating, reduced bowel sounds, urinary retention, sinus tachycardia, core T 40.3°C,
    supplied normal-width QRS, acid-base, lactate, renal and CK evidence; recognizes the coupled
    central and peripheral antimuscarinic pattern without mnemonic-, temperature-, pupil- or dryness-
    only closure; activates qualified cooling, resuscitation, airway, toxicology, monitoring, bladder,
    renal and compassionate-safety ownership; reviews coingestion, exposure-purity, seizure,
    rhabdomyolysis and competing-syndrome boundaries; records bounded qualified cooling, supportive,
    sedation, seizure, serial laboratory, bladder and toxicologist-led physostigmine-eligibility
    intent; then reviews a strict elapsed fixed cooling report with persistent confusion and urinary
    retention before another elapsed rebound, hyperthermia, renal, CK, seizure, coingestion and
    active-risk handoff. No learner history, examination, monitoring, ECG, temperature, blood-gas,
    chemistry, CK, urine or test acquisition or interpretation, diagnosis, differential exclusion,
    cooling, fluid, restraint, catheter, sedation, physostigmine, drug, dose, rate, target, route,
    access, infusion, airway, ventilation, procedure, safety disposition, prognosis, or outcome
    control exists.
  - [x] Toxicology slice 11/15 adds declared serotonin toxicity with hyperthermia and clonus. The
    learner reconciles a first linezolid dose during stable sertraline therapy, a 6-hour clock,
    agitation, confusion, diaphoresis, tremor, ocular and inducible ankle clonus, lower-limb
    hyperreflexia and increased tone, hyperactive bowel sounds, diarrhea, sinus tachycardia, core
    T 40.1°C, supplied normal-width QRS, acid-base, lactate, renal and CK evidence; recognizes the
    coupled mental, autonomic and neuromuscular pattern without Hunter-, clonus-, temperature- or
    medication-list-only closure; activates qualified source cessation, cooling, resuscitation,
    airway, toxicology, monitoring, renal and compassionate-safety ownership; reviews infection,
    coingestion, seizure, rhabdomyolysis and competing-syndrome boundaries; records bounded qualified
    source cessation, cooling, support, sedation, seizure, serial laboratory, airway-preparedness and
    specialist serotonin-antagonist rescue intent; then reviews a strict elapsed fixed cooling report
    with persistent clonus and hyperreflexia before another elapsed rebound-hyperthermia, rigidity,
    seizure, rhabdomyolysis, coingestion, airway and active-risk handoff. No learner history,
    examination, monitoring, ECG, temperature, blood-gas, chemistry, CK or test acquisition or
    interpretation, rule calculation, diagnosis, differential exclusion, cooling, fluid, sedation,
    serotonin antagonist, drug, dose, rate, target, route, access, infusion, airway, ventilation,
    procedure, safety disposition, prognosis, or outcome control exists.
  - [x] Toxicology slice 12/15 adds declared sympathomimetic hyperadrenergic hyperthermia. The learner
    reconciles a methamphetamine exposure, 70-minute clock, hypervigilance, severe motor agitation,
    paranoia, diaphoresis, mydriasis, tachycardia, hypertension, core T 40.4°C and supplied ECG,
    acid-base, lactate, renal and CK evidence; recognizes the coupled pattern without screen-, pupil-,
    pressure-, temperature- or agitation-only closure; activates qualified de-escalation, cooling,
    resuscitation, cardiac, airway, toxicology, monitoring, psychiatric and compassionate-safety
    ownership; reviews ischemia, arrhythmia, seizure, rhabdomyolysis, coingestion and differential
    boundaries; records bounded qualified support, GABAergic sedation, cooling, surveillance, airway-
    preparedness and specialist persistent-hyperadrenergic adjunct intent; then reviews a strict
    elapsed fixed report before another elapsed medical, psychiatric and active-risk handoff. No
    learner history, examination, monitoring, ECG, temperature, toxicology-screen, blood-gas,
    chemistry, CK or test acquisition or interpretation, diagnosis, differential exclusion,
    restraint, cooling, fluid, sedation, cardiovascular therapy, drug, dose, rate, target, route,
    access, infusion, airway, ventilation, procedure, safety disposition, prognosis, or outcome
    control exists.
  - [x] Toxicology slice 13/15 adds declared methanol visual-acidosis toxicity. The learner reconciles
    a windshield-washer-fluid exposure, 14-hour clock, visual symptoms, tachypnea, confusion,
    high-anion-gap metabolic acidosis, measured osmolality and authored complementary gaps;
    recognizes the coupled pattern without source-, vision-, anion-gap-, osmolar-gap- or level-only
    closure; activates qualified resuscitation, airway, antidote, extracorporeal, toxicology,
    laboratory, nephrology and ophthalmic ownership; reviews acid-base, osmolar, electrolyte, renal,
    visual, coingestion and competing-cause boundaries; records bounded qualified source,
    fomepizole, cofactor, acid-base, electrolyte, surveillance, airway and extracorporeal intent;
    then reviews a strict elapsed report before another elapsed active-risk handoff. No learner
    history, examination, monitoring, ECG, blood-gas, chemistry, osmolality, concentration or test
    acquisition or interpretation, calculation, diagnosis, differential exclusion, antidote,
    cofactor, fluid, buffer, electrolyte, drug, dose, rate, target, route, access, infusion, airway,
    ventilation, dialysis, procedure, safety disposition, prognosis, or outcome control exists.
  - [x] Toxicology slice 14/15 adds delayed local-anesthetic systemic toxicity after a declared
    continuous ropivacaine catheter. The learner reconciles a 38-hour source clock, short subjective
    prodrome, seizure, drowsiness, shallow breathing, bradycardia, hypotension, QRS prolongation and
    ventricular ectopy; recognizes the variable coupled CNS-cardiac pattern without classic-
    sequence-, clock-, symptom-, seizure- or ECG-only closure; activates qualified source, airway,
    seizure, cardiac, toxicology, lipid and ECLS ownership; reviews source-delivery, CNS, ECG,
    perfusion, acid-base, electrolyte, coingestion and competing-cause boundaries; records bounded
    qualified source cessation, oxygenation and ventilation, seizure, 20% lipid, acid-base,
    LAST-modified resuscitation, surveillance and refractory-rescue intent; then reviews a strict
    elapsed report before another elapsed active-risk handoff. No learner history, examination,
    monitoring, ECG, blood-gas, laboratory or source-delivery acquisition or interpretation,
    catheter, pump or line handling, diagnosis, oxygen, ventilation, seizure care, lipid, fluid,
    buffer, vasopressor, antiarrhythmic, drug, dose, rate, target, route, access, airway, pacing,
    cardioversion, ECLS, procedure, safety disposition, prognosis, or outcome control exists.
  - [x] Toxicology slice 15/15 adds opioid poisoning with persistent sedation after reported
    community naloxone and rescue breathing. The learner reconciles unknown exposure, prehospital
    rescue, severe hypoventilation, hypoxemia, hypercapnia, sedation, pupils, bradycardia,
    hypotension, hypothermia, and whole-patient state; recognizes an opioid-compatible respiratory
    emergency with possible non-opioid adulterant effects without pupil-, naloxone-response-,
    routine-screen-, wound- or single-agent closure; activates qualified respiratory, toxicology,
    addiction, wound, harm-reduction and dignity-centered ownership; reviews supplied respiratory,
    circulatory, temperature, glucose, ECG, blood-gas, chemistry, routine-screen, skin, coingestion
    and competing-cause boundaries; records bounded continued-support and opioid-antagonist intent
    while excluding veterinary antagonists; then reviews a strict elapsed respiratory report before
    another elapsed active-risk handoff. No learner history, examination, monitoring, ECG, blood-gas,
    chemistry, toxicology-screen or skin acquisition or interpretation, product identification,
    diagnosis, oxygen, ventilation, opioid or veterinary antagonist, fluid, vasopressor, glucose,
    rewarming, wound or withdrawal care, drug, dose, rate, target, route, access, airway, transport,
    procedure, observation, disposition, prognosis, or outcome control exists.
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
