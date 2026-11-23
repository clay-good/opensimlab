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

- [x] Add a `knowledge` declaration to the module contract: explainers, cards, Why templates.
  `src/platform/knowledge/knowledge-sets.ts` declares one set per available module. Each module's
  explainers now come from `src/platform/knowledge/explainer-registry.ts`, so authoring a set is
  the whole of declaring one. A module that has authored none is declared empty rather than left
  out, so the gap is a stated fact the gate can count.
- [ ] Author at least six explainers per module (fifteen modules × six = ninety minimum), each
  ≤ 250 words with one diagram, one source locator, maturity, and a resolving "show me".
  Eight of sixteen modules are at the floor: anesthesia's ten, emergency medicine's six
  (`src/modules/emergency-medicine/content/explainers.ts`) — perfusion against pressure, the
  tension pneumothorax as an obstruction to filling, calcium as protection rather than treatment,
  fluid and vasopressor as one decision, compressions as what makes a shock work, and
  compensation hiding a bleeding patient. Each cites a source already in the register and names
  the lesson that demonstrates it.
  Critical care's six (`src/modules/critical-care/content/explainers.ts`) follow the same rules:
  lung protection trading the gas numbers for the lung, auto-PEEP as a timing problem that
  imitates other diagnoses, the right ventricle's afterload sensitivity and the septal loop,
  dyssynchrony as two clocks disagreeing, oxygenation against ventilation, and intubation
  removing the compensation that was holding the pressure up. Each cites the publications the
  lesson it points at already declares. Cardiology's six
  (`src/modules/cardiology/content/explainers.ts`) do the same: electrical capture against a
  pulse, wide and regular as ventricular until shown otherwise, fast atrial fibrillation as a
  symptom of the illness, the right ventricular infarct's dependence on the preload a nitrate
  removes, torsades as a repolarisation problem, and the hypertensive emergency defined by the
  organ rather than the number. Respiratory medicine's six
  (`src/modules/respiratory-medicine/content/explainers.ts`) close that group: oxygen prescribed
  to a range with two edges, noninvasive support needing a deadline and a stopping rule, what
  high-flow oxygen does besides supply oxygen, the quiet chest in asthma, the tracheostomy
  patient's one airway or two, and neuromuscular weakness as a pump failure the saturation does
  not track. Pediatrics' six (`src/modules/pediatrics/content/explainers.ts`) are the fifth
  module's: children compensating until they do not, the bradycardic child as a hypoxic child,
  the work of breathing as the measurement the saturation is not, stridor and wheeze naming
  different airways, the brain setting the pace in childhood ketoacidosis, and the glucose check
  in every fitting child. Neurology's six (`src/modules/neurology/content/explainers.ts`) are the
  sixth module's: posterior circulation stroke hiding behind ordinary symptoms, intracranial
  pressure as a cliff rather than a slope, the seizure that is invisible, the waiting that is the
  harm in suspected meningitis, delirium as a symptom whose quiet form is missed, and cord
  compression as a window that closes. Toxicology's six
  (`src/modules/toxicology/content/explainers.ts`) are the seventh module's: the acetaminophen
  clock rather than the symptoms, the oximeter that cannot see carbon monoxide, the falling
  salicylate that is not improvement, sodium-channel blockade read on the ECG, toxidromes sorted
  by the autonomic pattern, and the potassium as the signal in acute digoxin poisoning.
  What made this possible is that the contract and the registry are no longer anesthesia's: the
  types live in `src/platform/knowledge/explainer.ts`, every governance and review surface reads
  the registry, and the cockpit's Learn tab lists the running module's own set rather than
  anesthesia's in all sixteen. The remaining eight modules are authoring, with the same per
  explainer rules enforced over the whole registry by `tests/unit/explainer-registry.test.ts`.
- [ ] Author intervention cards for every shared-formulary agent in every module; link cards to
  model detail where a published model exists.
  Measured, and the card half is smaller than it reads: today every formulary agent in the
  catalogue already has a card. The fifteen state-transition modules declare no drug formulary,
  so they have no shared-formulary agents, and every anesthesia agent has one.
  `tests/unit/knowledge-sets.test.ts` pins that, so a new agent without a card is seen. Cards for
  the non-drug interventions the design names (fluid bolus, blood component, oxygen by device,
  pacing) wait on those modules declaring them as formulary agents.
- [ ] Catalog gate: explainer floor, dangling "show me", agent without a card, card text failing
  the safety-scope rule.
  `npm run gate` now reports the floor and the gaps on every run: modules below the six-explainer
  floor, formulary agents without a card, and any "show me" outside its own module (today: 8 of
  16, none, none). It reports rather than blocks, for the same reason the guide gaps do.
  Dangling "show me" is checked: `tests/unit/explainer-show-me.test.ts` fails when an explainer's
  lesson does not exist or its sandbox state is one the sandbox would refuse. The other three
  checks wait on the explainers and cards section 2 authors.
- [x] List knowledge items on the review-status page by module with maturity labels.
  `/review-status` has a table of explainers and intervention cards for every available module,
  with each maturity present and its count, and "None yet" where a module has none. Every module
  is listed so a zero is stated rather than implied by absence. Today that is anesthesia's
  explainers and cards, six explainers each for emergency medicine, critical care, cardiology,
  respiratory medicine, pediatrics, neurology and toxicology, and eight rows of "None yet",
  which is the section 2 authoring this change still owes
  (`tests/unit/knowledge-by-module.test.ts`).

## 3. Sandbox

- [ ] Build the pharmacology sandbox as the capability specifies: any modeled drug, any in-envelope
  preset, hold/vary one covariate, overlay curves, envelope enforcement.
  Built. The page is `/anesthesia/sandbox`, linked from the
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
  Per-kilogram doses are offered too, which is what brought rocuronium in: no lesson gives it as an
  absolute dose. A per-kilogram dose is converted once, by the chosen patient's weight, and that
  absolute amount goes to every compared curve. Converting per curve would vary the dose along
  with weight and stop isolating one variable, and the page says so beside the conversion.
- [ ] Add physiology inputs from the shared respiratory, hemodynamic, fluid, and electrolyte
  capabilities with a published/teaching label per input.
  Respiratory and hemodynamic are done; fluid and electrolyte are not. The circulation view
  (`?view=circulation`, `src/modules/anesthesia/sandbox/circulation-sandbox.ts`) takes one lesson's
  authored patient baseline. At time zero it applies vasodilation, blood loss, a vasopressor or a
  mix, and runs the engine's `stepHemodynamics`, so the baroreflex answers. Its labels are read
  from the engine's own influence records rather than asserted: vasodilation and blood loss come
  back "not marked as a teaching term", the vasopressor as a teaching term. The baroreflex is
  left unblunted by anaesthetic depth, and the page says so rather than tying it silently to an
  input.
  Respiratory first: the sandbox's physiology view
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
- [x] Reverse-link: the sandbox suggests the scenario an explainer demonstrates.
  An explainer's "show me" may now carry a sandbox state as its URL query, and three do. Effect-site
  lag opens the pharmacology view, safe apnoea time the breathing view, and vasodilation versus
  hypovolaemia the circulation view. The cockpit's explainer drawer links there. Each sandbox view
  finds the explainer pointing at it and links the lesson that explainer demonstrates, drawn from
  the explainers rather than listed, so a new one appears on its own.

## 4. Offline, translation, and budget

- [ ] Explainers and cards ship in the module's domain pack, not the shell; measure against the
  precache and interactive budgets in Brotli and record the headroom used.
- [ ] Externalise all explainer and card strings into the translation catalogs.
  Not done, deliberately, and worth deciding before anyone does it. The catalog's own rule
  (`src/platform/i18n/catalog.ts`) is that clinical content never enters an interface catalog: it
  stays English, marked by the clinical-content notice, until a clinically reviewed translation
  exists. Explainer and card bodies are clinical, so externalising them today would relabel English
  text as `clinical` keys and translate nothing. The words around them (the "reflects" line, the
  sandbox link, the drawer controls) are already catalog keys. The useful version of this task
  arrives with the first clinically reviewed locale, and it should move the bodies into a
  per-locale clinical pack rather than the session group, which ships with every lesson's cockpit.
