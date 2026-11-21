# Implementation plan: knowledge layer for every module

## 1. Why panel across fidelity classes

- [ ] Extend the Why panel data contract with a per-fidelity-class explanation source: ranked
  contributors (closed loop), transition record (state transition), branch record (branching).
- [ ] Require every `state_transition` scenario to declare a transition table with source
  locators and a teaching-convention flag; fail the catalog gate on a transition without a source
  or a flag.
- [ ] Gate the panel behind reveal conditions: it names only observed evidence before reveal.
- [ ] Test over the full catalog that every reachable state answers "why" with a source or a
  convention label, and that no hidden-diagnosis term appears before reveal.

## 2. Knowledge sets per module

- [ ] Add a `knowledge` declaration to the module contract: explainers, cards, Why templates.
- [ ] Author at least six explainers per module (fifteen modules × six = ninety minimum), each
  ≤ 250 words with one diagram, one source locator, maturity, and a resolving "show me".
- [ ] Author intervention cards for every shared-formulary agent in every module; link cards to
  model detail where a published model exists.
- [ ] Catalog gate: explainer floor, dangling "show me", agent without a card, card text failing
  the safety-scope rule.
- [ ] List knowledge items on the review-status page by module with maturity labels.

## 3. Sandbox

- [ ] Build the pharmacology sandbox as the capability specifies: any modeled drug, any in-envelope
  preset, hold/vary one covariate, overlay curves, envelope enforcement.
  Built, apart from rocuronium (below). The page is `/anesthesia/sandbox`, linked from the
  anesthesia lesson index. It has two SVG plots and a table that doubles as their key and
  carries the numbers for anyone not reading the plots. It lives under the anesthesia module and
  loads lazily from that chunk, and it is left out of the first-visit precache like the
  facilitator guide, because a noindex page cannot open offline on a first visit anyway.
  Getting it in without growing every lesson took one structural change. The envelope evaluator
  imported the whole model registry for a single constant, which tied it to a chunk every lesson
  loads, so `MODEL_SET_REVISION` now lives in `pharmacology/model-set.ts`. The cockpit graph stays
  at 573.8 KB gz against its 575 KB guard (573.3 before). Checked in headless Chrome on a plain
  static host: no console errors, the curves draw, and the URL follows the controls.
  `src/modules/anesthesia/sandbox/pharmacology-sandbox.ts`
  gives one bolus to one patient and returns plasma and effect-site curves sampled every 10 s,
  exact at each sample. It can also hold the bolus and vary age or weight across 2 to 4 values,
  each curve carrying its model's envelope verdict. An out-of-range curve is still drawn and labelled,
  as in a scenario. Every input comes from the catalogue, so nothing typed can describe a real
  patient: the 34 distinct patients the anaesthesia lessons author, the absolute bolus doses their
  formularies offer, and for a varied covariate only values some authored patient has.
  `tests/unit/pharmacology-sandbox.test.ts` checks the spec's own example: the same bolus under
  Schnider gives an older patient a higher early plasma concentration.
  One gap, stated rather than papered over: rocuronium has a model but no lesson offers it as an
  absolute dose, only per kilogram, so the sandbox cannot give it yet. Holding a per-kilogram dose
  "fixed" while weight varies would quietly vary the dose, which is the opposite of isolating one
  variable.
- [ ] Add physiology inputs from the shared respiratory, hemodynamic, fluid, and electrolyte
  capabilities with a published/teaching label per input.
  Respiratory is done; hemodynamic, fluid and electrolyte are not. The sandbox's physiology view
  (`?view=physiology`, `src/modules/anesthesia/sandbox/physiology-sandbox.ts`) offers four inputs:
  the respiratory profile, the oxygen breathed for three minutes beforehand, then apnoea, normal
  breathing or half the tidal volume, and the duration. It runs the lessons' own gas exchange at
  the engine's tick. Each input carries its label. "Held to a published result" covers the three
  Benumof profiles, apnoea, and inspired oxygen (the alveolar gas equation). "Teaching
  calibration" covers term pregnancy and both breathing patterns, which run through the carbon
  dioxide store's taught coefficient. A run stops below 50% saturation and says why: carried on,
  the model drives oxygen to zero in a patient whose circulation it never lets fail. The other
  three capabilities each need their own inputs, labels and stopping rule, and are left for
  their own pass.
- [x] Make sandbox state addressable by URL (model, preset, inputs only); test that the URL
  carries no transcript, progress, or identifier.
  `sandboxQuery` writes exactly `model`, `patient`, `dose`, `minutes` and `vary`.
  `parseSandboxQuery` refuses an unknown key, a malformed number or a value no lesson authored
  rather than correcting it, so a link opens exactly what it says or says why it cannot.
- [x] Extend the forward-only architecture test to the sandbox module; assert no target or
  dose-solving control exists. `tests/arch/boundaries.test.ts` enumerates the sandbox's exports
  and reads every file under a `sandbox/` directory for target-solving names.
- [x] Replay the sandbox healthy-adult apnea state through the Benumof benchmark test.
  `tests/unit/physiology-sandbox.test.ts` runs the sandbox's apnoea state for the healthy,
  moderately ill and obese adult against Benumof, Dagg and Benumof 1997 at the declared 20%
  tolerance. It also asserts that the result equals `timeToDesaturationMinutes`, so this is the
  benchmarked model and not a second one that happens to agree.
- [ ] Reverse-link: the sandbox suggests the scenario an explainer demonstrates.
  Half done. The sandbox suggests a lesson: the patient's own lesson if its formulary carries the
  drug, otherwise the first lesson that does. Drawing the suggestion from explainer links waits on
  explainers that link to a sandbox state, which section 2 has not authored.

## 4. Offline, translation, and budget

- [ ] Explainers and cards ship in the module's domain pack, not the shell; measure against the
  precache and interactive budgets in Brotli and record the headroom used.
- [ ] Externalise all explainer and card strings into the translation catalogs.
