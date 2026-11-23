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

256 bounded labs across 16 specialties:

| Module | Labs | Where |
| --- | --- | --- |
| Anesthesia | 39 | `/anesthesia` |
| Emergency medicine | 25 | `/emergency-medicine` |
| Critical care | 24 | `/critical-care` |
| Cardiology | 17 | `/cardiology` |
| Pediatrics | 16 | `/pediatrics` |
| Neurology | 15 | `/neurology` |
| Obstetrics | 15 | `/obstetrics` |
| Respiratory medicine | 15 | `/respiratory-medicine` |
| Toxicology | 15 | `/toxicology` |
| Endocrine & metabolic | 12 | `/endocrine-metabolic` |
| Neonatology | 11 | `/neonatology` |
| Infectious disease | 10 | `/infectious-disease` |
| Nursing | 9 | `/medical-surgical-nursing` |
| Renal & electrolyte | 12 | `/renal-electrolyte` |
| Oncology | 11 | `/oncology` |
| Surgery and trauma | 10 | `/surgery-trauma` |

Counts are the registered scenarios the build audits, not a roadmap. Every module is at its full
planned count, and 256 is the number the catalogue was ratified against.

Each lab is a closed-loop scenario: the physiology keeps running while you decide, and
what you do changes where the patient goes next.

Every lab also carries a **worked example** you can watch and take the controls back from at
any point, and a private tutor that reads only what you have actually done. The tutor is silent
unless you ask for it, says nothing at all on the unassisted setting, and never supplies the
diagnosis a lesson exists to leave open. All sixteen specialties are complete on both counts --
renal, oncology, endocrine, nursing, infectious-disease, neonatology, toxicology, neurology,
obstetrics, respiratory-medicine, pediatrics, cardiology, critical-care, emergency-medicine,
anesthesia, and surgery and trauma, whose ten labs are the newest.

## How it works

**Your practice stays on your device.** No accounts, no analytics, no telemetry. Progress,
transcripts, reflections, and debriefs live in your browser. Nothing is sent anywhere
unless you open the problem-report form, preview exactly what it contains, and submit it
yourself. Every file you export — transcript, event log, concentration CSV, reviewer notes,
practice history — carries both statements with it: that this is not for clinical use, and that
no clinician has reviewed it. A file that leaves the interface leaves the labels behind, so it
says so itself.

**The debrief compares your run with a reference one, and refuses to score either.** After a
closed-loop lesson, the transcript it ships with is replayed on *your* patient — your seed, your
region — and drawn beside what you did: four parameters, both runs' actions on one timeline, and
one line per objective saying when each run met it. Where the replay is no longer the same
patient within a measured tolerance, it says which parameter moved and draws nothing rather than
putting two people on one axis. There is no total anywhere and there will not be one: two runs
can differ for reasons that are not better or worse, and a single number hides every one of them.
Each objective also gets a question built from what the model attributed the change to at the
moment it was measured — a question, never a verdict, and one that says what the model
attributed rather than what you caused.

**What you wrote during a run is yours to keep or not.** Notes you type in the moment stay out of
the transcript, out of the reporting package and out of the progress file, which is what lets
each of those move without a preview. They leave the device only through one export that shows
you every word first, because nothing here can tell whether a note names a patient, a colleague
or you.

**The pharmacology is ours.** Model parameters are transcribed by hand from the primary
literature, each carrying its citation and the range it is valid over. Nothing is fetched
at build or run time, and tests assert published reference values so a mistyped digit
fails immediately.

**The drugs can be explored without a case.** The
[pharmacology sandbox](https://opensimlab.com/anesthesia/sandbox) at `/anesthesia/sandbox` gives
one bolus to one of the anesthesia lessons' own patients and draws plasma and effect-site
concentration. It can also hold the dose and vary age or weight across up to four values. Every
input is a choice the lessons already authored, with nothing typed, so nothing can describe a real
patient. It is forward-only: a dose goes in and a curve comes out. Each curve carries its model's
envelope verdict, and an out-of-range curve is drawn dimmed and dashed rather than hidden. The
state lives in the URL. A physiology view does the same for breathing. It preoxygenates one of
the respiratory profiles, then stops or keeps the breathing, and draws saturation and oxygen
tension. The healthy, moderately ill and obese adults reproduce Benumof's published apnoea times,
and each input says whether it is held to a published result or is a teaching calibration. A
per-kilogram dose is converted once, by the chosen patient's weight, and held as that amount
across compared weights. A circulation
view takes a lesson's own patient, applies vasodilation, blood loss or a vasopressor, and draws
the baroreflex's answer. Its labels are read from the engine's own teaching-term flags. Three
explainers open their sandbox view from the cockpit, and each view links back to the case its
explainer demonstrates. Not yet: fluid and electrolyte inputs, which have no shared model to
expose.

**The concepts behind a lesson are read beside it.** The cockpit's Learn tab lists the running
module's own concept explainers — each under 250 words, with a figure caption, the guideline or
publication it reflects, a statement of where it simplifies, and the lesson that demonstrates it.
Anesthesia has ten; emergency medicine, critical care, cardiology, respiratory medicine,
pediatrics, neurology, toxicology, obstetrics, neonatology, endocrine/metabolic,
renal/electrolyte and infectious disease six each. The other three modules have authored none
yet and
show the shared physiology set until they do, which is a gap rather than a claim: `npm run gate`
reports every module below the six-explainer floor by name, and the
[review-status page](https://opensimlab.com/review-status) counts explainers and intervention
cards per module, zeros included.

**It can be run in a room, not only alone.** Every lesson has a printable
[facilitator guide](https://opensimlab.com/facilitator/anesthesia/scenario/routine-induction) at
`/facilitator/<module>/scenario/<id>`, generated from the scenario rather than written beside it,
so it cannot drift from the lesson it describes. Each one carries the objectives, the patient, the
timeline, the debrief questions, and the lesson's three checked-in reference transcripts: what an
expert does, the error the lesson exists to make visible, and a path that recovers from it. Each
also exports a **run sheet** — plain text or JSON — for running the lesson on a mannequin or on
paper, with the model's own vital signs at each state for the 39 closed-loop labs. A classroom
mode forces the unassisted setting, enables authored pause points, and offers the lesson's
**bookmarks**: named moments on its reference transcripts that restart the room there, paused,
with a notice saying the actions before it were the reference run's and not the room's.
Honestly incomplete: 2 of 256 lessons declare pause points and bookmarks, and the guides are
deliberately outside the offline precache.

**Mappings name the document they read, and the lessons they cannot cover.** Each lesson's
objectives are mapped to published framework domains — the NBCRNA certification content outline,
the COA standards, seven ACGME milestone sets, the AAMC Core EPAs, and the NCSBN clinical
judgment model — as this project's own reading, which no body has reviewed or endorsed, and each
carrying whatever its own document says about the uses it was designed for. The ACGME's, for
instance, say they are "designed only for use in evaluation of residents" in accredited
programmes and are not "designed to be relevant in any other context", so those readings claim
subject-matter overlap and nothing else, and record no milestone levels at all. Program directors read the coverage table at `/curriculum`, where a domain no
lesson touches is listed as uncovered rather than dropped, and export the whole mapping as CSV.
Learners read the same data the other way round at
[`/preparing-for`](https://opensimlab.com/preparing-for): pick the examination you are working
toward and see which lessons touch each of its categories, grouped by category, with the date that
reading was taken and when it is due to be checked again. All 256 of 256 lessons
carry a mapping, and from here an unmapped lesson fails the build. What stays incomplete is the
other direction: most of what each framework contains is touched by nothing here, so every
uncovered domain is listed with the reason it is uncovered. Four of the fourteen readings are
examination blueprints and so appear in the filter — the NCLEX-RN client-needs categories, the
USMLE content outline's eighteen systems, and two certification outlines — and nothing on either surface predicts
anything about an examination.

**Claims are sourced and correctable.** Crisis protocols trace to their issuing bodies,
physiology is checked against published benchmarks, the limitations register is public,
and confirmed mistakes stay in a permanent [corrections log](CORRECTIONS.md) — published
in the product at `/corrections`, not only in this repository. The release gate refuses to
publish without it.

## Status: public and unreviewed, on purpose

Everything above is what the project is *for*. This is what it currently *is*.

There is no alpha, beta, or 1.0 here, and no staged content vocabulary either. Open Sim Lab is one
evergreen product in one state: the catalog grows and gets corrected continuously, and every item
ships labeled **"Educational use only. Not clinically reviewed."** That label is the whole claim.
A build identifies itself by its date and the commit it came from, not by a stage, and
`npm run lint` fails on a prerelease version or staged-release wording anywhere a reader can
reach it.

- **No clinician has signed any content.** The editorial board is empty and published as empty.
  Nothing is described anywhere in the interface as reviewed, validated, or endorsed. The
  [review-status page](https://opensimlab.com/review-status) lists every item, the label it is
  published under, and the board state — no count without the list behind it. It is linked from
  the front page, and the release gate refuses to publish without it.
- **No pharmacology parameter has had its independent second-source check.** Values are
  transcribed from the primary publications, but the second-person verification this project
  requires has not happened. Every number is marked as pending. The
  [verification queue](https://opensimlab.com/verification-queue) lists all 31 parameters still
  awaiting it, how to check one, and the record format; a check needs no clinical credential and
  is never a clinical review.
- **Face-validity review and on-device frame-budget measurement have not been run.** Both need
  people and hardware rather than more code.

Publishing anyway is a deliberate decision, recorded in
[`openspec/changes/release-evergreen-preview/`](openspec/changes/release-evergreen-preview/). An
unreviewed corpus nobody can open does not get more accurate by waiting. A public one with a
working correction path does. So the trade is explicit: you get the material, you are told plainly
that nothing in it is signed, and the **report a problem** control in every scenario is how you
tell us we are wrong. Confirmed errors are appended permanently to [CORRECTIONS.md](CORRECTIONS.md).

The `reviewed` release channel still exists and still refuses to publish. It is what institutional
adoption packs are built from, and it will stay refused until named clinicians sign specific
content versions.

What is done: the waveform engine, compartment solver, physiology, design system, cockpit, sound,
accessibility, debrief, practice regions, and offline shell — with over 14,000 automated tests and
the Benumof apnea benchmarks inside 5% of published times.

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

Two contributions need no clinical credential: a second-source check of a pharmacology parameter
from the [verification queue](https://opensimlab.com/verification-queue), and translating the
interface. Interface translators can check a locale catalog entirely in the browser at
[`/translation-coverage`](https://opensimlab.com/translation-coverage) before committing;
CONTRIBUTING.md has both paths.

## License

Code is MIT. Educational content is openly licensed per scenario. See [LICENSE](LICENSE).
