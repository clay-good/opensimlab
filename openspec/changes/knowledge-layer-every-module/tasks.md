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
  The core is built; the page is not. `src/modules/anesthesia/sandbox/pharmacology-sandbox.ts`
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
- [x] Make sandbox state addressable by URL (model, preset, inputs only); test that the URL
  carries no transcript, progress, or identifier.
  `sandboxQuery` writes exactly `model`, `patient`, `dose`, `minutes` and `vary`.
  `parseSandboxQuery` refuses an unknown key, a malformed number or a value no lesson authored
  rather than correcting it, so a link opens exactly what it says or says why it cannot.
- [x] Extend the forward-only architecture test to the sandbox module; assert no target or
  dose-solving control exists. `tests/arch/boundaries.test.ts` enumerates the sandbox's exports
  and reads every file under a `sandbox/` directory for target-solving names.
- [ ] Replay the sandbox healthy-adult apnea state through the Benumof benchmark test.
- [ ] Reverse-link: the sandbox suggests the scenario an explainer demonstrates.

## 4. Offline, translation, and budget

- [ ] Explainers and cards ship in the module's domain pack, not the shell; measure against the
  precache and interactive budgets in Brotli and record the headroom used.
- [ ] Externalise all explainer and card strings into the translation catalogs.
