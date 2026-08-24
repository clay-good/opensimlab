# Build the multidomain practice catalog

## Summary

Turn Open Sim Lab from a single-specialty alpha into a free, public, browser-native practice
laboratory with a 240-scenario catalog across 16 medical domains. The product should feel like a
private tutor attached to a responsive simulated patient: it orients a novice, watches observable
decisions, offers progressively smaller hints, explains the resulting physiology, and recommends
the next rehearsal without creating an account or sending learner activity off the device.

This change also replaces the current publish-blocking review model with a truthful maturity model.
Complete scenarios may ship as clearly labeled preview content before clinical sign-off. Named
reviewers and organizations can later sign a specific content version and scope. A correction
control in every scenario creates a bounded anonymous report in Cloudflare D1, while the simulation,
progress, transcripts, reflections, and tutoring remain local and offline-capable.

## Why

The anesthesia module proves that deterministic physiology, authentic monitor behavior, and a
structured debrief can teach something a static question bank cannot. Its current constraints now
work against the larger mission:

- one specialty cannot prepare students for the range of simulation laboratories they encounter;
- a release gate that excludes every unsigned item prevents the public from using complete work
  while the reviewer network is still being built;
- a GitHub-issue correction path is too much effort during a session and does not reliably capture
  reproducible context;
- the current guidance is scenario-local rather than a coherent tutor that remembers the learner's
  own prior practice on that device;
- the catalog and cockpit are not yet designed to hold hundreds of scenarios without feeling like a
  directory of disconnected cases.

The opportunity is not to imitate a paid mannequin or VR laboratory. Open Sim Lab is rehearsal
before that laboratory: repeatable cognitive, prioritization, monitoring, and treatment practice
that helps a learner arrive ready to use scarce supervised simulation time well.

## Outcomes

When this change is complete:

1. A learner can find an appropriate scenario in no more than three interactions from the catalog,
   understand its prerequisites and maturity, and begin without an account.
2. Every scenario uses the same learning loop: orient, assess, act, observe, reflect, explain,
   rehearse.
3. Guided, coached, and unassisted practice use identical patient behavior; only the tutor changes.
4. The repository contains exactly 240 registered scenarios across the 16 domains defined in the
   design, with no placeholder scenario counted as complete.
5. Every scenario is source-grounded, bounded, deterministic, accessible, and accompanied by a
   debrief, limitations, provenance, and a report control.
6. A user can report a suspected error or defect in under 60 seconds without an account. Only the
   report they knowingly submit leaves the device.
7. Unreviewed scenarios may be publicly usable as `preview`; reviewed or institution-endorsed
   labels are cryptographically tied to the exact content version and public review record.
8. Organizations can audit a release, sign a defined scope, and distribute a stable adoption pack
   without receiving learner data.
9. The static application continues working without D1, Turnstile, the report Worker, or a network
   connection after installation.
10. The full project remains MIT licensed, buildable from the public repository, and deployable on
    Cloudflare's free tiers under the documented capacity ceilings.

## What changes

### Product and catalog

- Add a catalog information architecture for 240 scenarios across anesthesia, emergency medicine,
  critical care, cardiology, respiratory medicine, pediatrics, obstetrics, neonatology, neurology,
  endocrine and metabolic medicine, renal and electrolyte medicine, infectious disease, toxicology,
  hematology and oncology, surgery and trauma, and medical-surgical nursing.
- Add environment-specific lab shells for operating room, emergency department, ICU, ward,
  delivery room, neonatal unit, clinic, and prehospital care without forking the engine or design
  system.
- Define a scenario maturity, fidelity, source, and capability contract so catalog size never hides
  shallow or unsupported cases.

### Private tutor

- Replace isolated hints with a deterministic authored tutor that can orient, nudge, explain,
  recommend targeted rehearsal, and compare a learner only with their own prior local attempts.
- Add preparation paths organized around simulation-lab readiness rather than specialty browsing
  alone: first lab, deteriorating patient, airway, shock, rhythm, respiratory failure, pediatric,
  obstetric, medication safety, and team-leadership rehearsal.
- Preserve unassisted rehearsal and transcript export for learners who want exam-like conditions.

### Clinical publication and organizational sign-off

- Allow complete, source-grounded `preview` scenarios to publish before named clinical review.
- Reserve `clinically reviewed` and `institution endorsed` for exact-version public records signed
  by qualified people or organizations.
- Keep limitations, review gaps, superseded guidance, and correction history visible at item,
  scenario, module, and release levels.
- Separate build integrity gates from claims of clinical authority.

### Correction loop

- Add one shared `Report a problem` control to every prebrief, live scenario, debrief, and provenance
  surface.
- Add an API-only Cloudflare Worker, server-validated Turnstile, bounded D1 records, duplicate and
  quota suppression, retention cleanup, and a private maintainer query workflow.
- Treat every report as untrusted data. A scheduled maintenance agent may summarize or draft a fix,
  but reports never directly execute code, alter content, merge a pull request, or publish a release.
- Maintain an append-only public corrections record for confirmed clinical or educational errors.

### Privacy and delivery

- Keep the simulator, tutor, progress, transcripts, reflections, and content static and local-first.
- Narrow the network exception to a user-initiated report whose exact payload is previewed before
  submission.
- Isolate static assets from the report Worker so ordinary use creates no D1 or Worker request.

## Explicit non-goals

- Replacing supervised clinical education, mannequin simulation, standardized patients, task
  trainers, or vendor-specific orientation.
- Teaching psychomotor technique from a screen or certifying competence.
- Accepting real-patient data, offering clinical decision support, calculating a dose for a real
  patient, or representing simulated outcomes as individual predictions.
- Runtime generative AI, remote tutoring, learner accounts, cloud progress, telemetry, advertising,
  leaderboards, public failure records, or instructor surveillance.
- A public administrative dashboard, reporter contact collection, attachments, screenshots, or a
  reply thread in the first reporting release.
- Automatically turning untrusted reports into code changes or releases.
- A hosted MCP server in this change. The design records why a machine-readable static catalog is
  sufficient and what evidence would justify revisiting MCP later.

## Success measures

Measures are obtained from tests, documented moderated sessions, opt-in institutional evaluation,
and local user-visible counters. The production application contains no telemetry.

- Catalog completeness: 240 registered scenarios, all passing the scenario completion contract.
- Findability: at least 90% of 20 moderated learners can locate one named case and one case matching
  a stated learning need within 30 seconds.
- First use: median time from module arrival to first meaningful scenario action is at most 45
  seconds in moderated testing.
- Tutor usefulness: at least 16 of 20 moderated novice learners can explain the scenario's primary
  causal mechanism after the debrief without being shown a score.
- Rehearsal: every scenario has at least one deterministic expert transcript, one common-error
  transcript, and one recovery transcript.
- Correction access: every scenario surface exposes the shared report control and a keyboard-only
  user can submit a report in under 60 seconds in testing.
- Privacy: a complete session without report submission produces zero application API requests;
  report submission sends only the reviewed payload.
- Governance: every catalog card shows maturity; every reviewed or endorsed badge resolves to the
  exact public record; no preview content is described as signed off.
- Sustainability: a clean checkout can build, test, and self-host the static application without
  Cloudflare credentials; report infrastructure is optional and fails closed.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Breadth produces shallow simulations | Count only scenarios meeting the completion contract; build shared physiological capabilities before scenario volume. |
| Learners mistake preview content for authority | Persistent maturity labels, source/limitations access, no reviewed styling on preview content, and release-level coverage lists. |
| Organizations treat one signature as blanket approval | Sign-offs bind reviewer, organization, scope, scenario IDs, versions, region, and expiration. |
| A correction button is mistaken for validation | Reporting is a detection mechanism only; status changes require source verification and named review. |
| Reports leak learner reflections or patient data | Context is opt-in, reflections are structurally excluded, payload preview is mandatory, and real-patient inputs remain prohibited. |
| Reports create abuse or free-tier cost | Separate API Worker, WAF rule, Turnstile Siteverify, strict body/schema limits, daily HMAC quotas, dedupe, retention, and kill switch. |
| Report text prompt-injects maintenance agents | Reports are untrusted quoted evidence; agents receive fixed instructions, no production credentials, and cannot merge or deploy. |
| Tutor becomes nagging or game-like in the wrong way | Guidance is dismissible, unassisted mode is first-class, rewards describe mastery behaviors, and no streak loss, ranking, or variable reward exists. |
| Vendor-specific preparation creates trademark or endorsement problems | Teach transferable behaviors, identify any nominative mapping plainly, and never imply vendor sponsorship or exact replica status. |

## Dependencies

- The existing deterministic kernel, scenario schema, transcript, debrief, curriculum, review,
  accessibility, offline, and design-system capabilities.
- New shared patient-state and environment capabilities built in the order defined by `tasks.md`.
- Cloudflare Static Assets for the site and a separately routed Worker with D1 and Turnstile for
  reports. Reporting is not required to build or self-host the simulator.
- Named clinical and educational reviewers for status advancement, but not for publishing honest
  preview content.

## License and ownership

All new application code, schemas, authored scenarios, documentation, tests, and infrastructure
configuration are intended for the public repository under the MIT License unless a checked-in
third-party asset carries a compatible license recorded in the asset manifest. Clinical facts and
public algorithms are implemented from primary or authoritative sources; copyrighted tables,
question banks, vendor scenarios, proprietary monitor behavior, and protected media are not copied.
