# Myxedema coma: breathing support and treatment sequence

Content 0.1.0 rehearses a fictional 72-year-old woman with interrupted levothyroxine,
progressive drowsiness, hypothermia, bradycardia, hypotension, and hypoventilation. The lesson
separates oxygenation from ventilation, starts qualified treatment without waiting for tests,
preserves steroid-before-thyroxine sequencing, and returns to fresh reassessment and handoff.
It is a state-transition preview, not independently clinically reviewed.

## Sources checked August 27, 2026

- [ATA 2014 hypothyroidism guideline, recommendations 21a–21d](https://doi.org/10.1089/thy.2014.0028):
  initial intravenous levothyroxine, empiric stress glucocorticoids before levothyroxine,
  individualized treatment in older adults or cardiac disease, supportive care, and clinical
  endpoints. The recommendations have low-quality evidence. Optional liothyronine is not
  universally required or universally prohibited; this dose-free example selects the T4 pathway.
- [Joint European/British endocrine consensus, July 2026](https://doi.org/10.1530/ETJ-26-0044):
  full text verified through NCBI EFetch, PMCID PMC13452032, after publisher/PDF access failed.
  Sections Treatment, Thyroid hormone replacement, Glucocorticoid treatment, Warming,
  Hypoventilation, and Ongoing management support prompt therapy, early empiric steroids,
  individualized IV T4, passive blankets rather than active peripheral warming, respiratory
  support, and continuing clinical/metabolic surveillance. The paper describes expert consensus
  without formal evidence grading; it acknowledges clinician-selected T4/T3 alternatives.

The model invents no minimum steroid-to-thyroxine delay: ordered actions at the same tick are
accepted. Diagnostic blood sampling may proceed alongside treatment but is not an action gate.
Thyroid recovery takes longer than this rehearsal. No TSH normalization, dose, drug concentration,
validated diagnostic score, or guaranteed outcome is generated.

## Authored defaults and contrasts

The fixed profile is age 72, female, 160 cm, 68 kg, with primary hypothyroidism, coronary artery
disease, interrupted replacement, poor intake, and a possible respiratory infection. The initial
supplied PaCO2 is 68 mmHg; no complete blood-gas, thyroid, cortisol, sodium, or glucose panel is
invented. Serial qualified metabolic and precipitant care remain part of the handoff.

Presentation is BP 88/54 mmHg, MAP 65 mmHg, HR 42/min, RR 8/min, SpO2 90%, and temperature
34°C with drowsiness. Missing ventilation at five minutes, or missing steroid/thyroxine treatment
at 15 minutes, selects a worse systemic state: BP 80/46, MAP 57, HR 38, temperature 33.8°C,
and harder-to-rouse alertness. Without effective ventilatory support, RR is 6 and PaCO2 78.
Oxygen alone raises the authored SpO2 to 94% but neither clears carbon dioxide nor removes the
missing-ventilation consequence. It can be a bridge, not adequate treatment of hypoventilation.

Five minutes after qualified ventilation begins, RR is 12 under support, SpO2 94%, and PaCO2 54;
systemic abnormalities persist. Sixty minutes after the complete package, the authored contrast
is BP 96/58, MAP 71, HR 46, and temperature 34.2°C, still drowsy and support-dependent. These
are teaching states, not estimates of an individual's respiratory or thyroid-hormone kinetics.
All numeric values and clocks are authored. Observation is explicit and becomes stale.
No capnogram or delivered oxygen fraction is supplied by this dose-free model. Their monitor
tiles are unavailable, not inherited numeric defaults. Optional report context includes CO2
only from the last requested observation, never the hidden current arterial value.

The package includes qualified help, ventilation, empiric steroids, subsequent levothyroxine,
and supportive/precipitant care. Missing ventilation or either endocrine pathway ends at an
authored 30-minute instructor takeover; any unfinished episode ends at 180 minutes. Neither
limit is a safe clinical delay. A handoff requires fresh respiratory and later whole-person
reassessments and does not establish readiness for extubation, discharge, or treatment cessation.

## Hazards and verification plan

Oxygen-only reassurance, diagnostic delay, thyroid treatment before steroids, and indiscriminate
rapid peripheral rewarming remain visible choices or retained refused attempts. Correction must
not erase earlier evidence. Qualified supportive care bundles monitored thermal protection,
individualized circulation and metabolic support, and investigation/treatment of precipitants;
it does not demonstrate a warming device, airway procedure, fluid load, or electrolyte correction.

The exact-version expert, common-error, recovery, and no-action fixtures use seed 4904. Required
checks include independent respiratory/endocrine clocks, just-before/exact boundaries, partial
care, stale observations, retained mistakes, hostile/generic action rejection, real-engine replay,
five debrief findings, read-only guidance, a learner-paced example, and bounded report context.
Shared reporting must cap the optional note at 160 characters and opt-in equipment at 32 scalars;
feedback, alertness prose, reflections, and unobserved results must not be serialized.

Clinical signoff, full inclusive-runtime verification, and production Turnstile/D1 submission
remain pending. Development checks are not a substitute for those gates.

## Recorded local checks

Full `npm run ci` passes 3,530 tests across 458 files, strict specifications, TypeScript,
lint, source and asset provenance, static-host checks, bundle budgets, and fonts.
`npm run build:indexable` also passes, with 219 crawlable routes and no temporary QA page.
The registry has 198 scenarios, including six endocrine previews; the development publication gate
still reports 213 preview-channel blockers. No pending gate was changed to approved.

The real-engine fixtures cover expert, error, recovery, and no-action runs, including whole-tick
replay hashes, fresh versus historical observations, retained mistakes, and all five debrief
outcomes. An oxygen-only bridge remains visible in the debrief without failing prompt subsequent
ventilation. The real session-clock example completes eight accepted decisions, two separate
observation periods, and exact transcript replay without counting reading time as patient time.

Local route/form tests cover briefing, practice, example, debrief, replay, and source reporting.
They stub the session and cockpit, while the separate demonstration integration exercises the
real scheduler and engine. No test sends a real report or calls production Turnstile/D1.

Browser checks used a 1280 × 720 desktop viewport and a same-origin 320 × 720 iframe. The report
dialog was centered, bounded, and scrollable; the textarea declared a 160-character maximum.
Cancel restored launcher focus and left the worked example at the same decision and clock.
The narrow action tray wrapped labels and exposed the oxygen-only contrast: SpO2 94% with a
requested historical PaCO2 of 68 mmHg. The unsupported EtCO2 and oxygen-setting tiles were
subsequently verified unavailable. The temporary iframe page and owned browser tabs were removed.

Nonvisual regression tests exercise the real cockpit keyboard handling, store subscription,
live-region output, and explanation panel with rendering-only monitor stubs. Spoken care uses
accepted qualified ventilation and the last explicit blood-gas observation, not generic device
settings. Unavailable capnography is not described as a normal waveform; the explanation panel
does not attribute authored values to unrelated physiology. These are automated checks, not a
screen-reader user study or complete inclusive-runtime approval.
