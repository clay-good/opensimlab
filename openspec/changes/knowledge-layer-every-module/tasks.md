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
- [ ] Add physiology inputs from the shared respiratory, hemodynamic, fluid, and electrolyte
  capabilities with a published/teaching label per input.
- [ ] Make sandbox state addressable by URL (model, preset, inputs only); test that the URL
  carries no transcript, progress, or identifier.
- [ ] Extend the forward-only architecture test to the sandbox module; assert no target or
  dose-solving control exists.
- [ ] Replay the sandbox healthy-adult apnea state through the Benumof benchmark test.
- [ ] Reverse-link: the sandbox suggests the scenario an explainer demonstrates.

## 4. Offline, translation, and budget

- [ ] Explainers and cards ship in the module's domain pack, not the shell; measure against the
  precache and interactive budgets in Brotli and record the headroom used.
- [ ] Externalise all explainer and card strings into the translation catalogs.
