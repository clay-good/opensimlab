/**
 * Endocrine and metabolic concept explainers
 * (knowledge-layer → the minimum knowledge set).
 *
 * Six concepts, each the reasoning behind a recurring mistake in this module's
 * labs, under 250 words with a caption, a source, a stated simplification, and
 * the lesson that demonstrates it. Each cites the publications the lesson it
 * points at already declares.
 *
 * Every one explains; none instructs a dose, a rate or a correction schedule.
 * This module's lessons are built around exactly those numbers being local, and
 * they stay inside the lessons.
 */

import { UNSIGNED_REVIEW, type Explainer } from '@platform/knowledge/explainer';

export const ENDOCRINE_METABOLIC_EXPLAINERS: readonly Explainer[] = [
  {
    id: 'in-adrenal-crisis-the-sample-waits-not-the-treatment',
    maturity: 'preview',
    title: 'In adrenal crisis, the sample waits; the treatment does not',
    body:
      'Adrenal crisis is a shortage of cortisol in a patient who needs it, and the circulation '
      + 'cannot hold itself up without it. Vasopressors work poorly, fluid alone works poorly, and '
      + 'the thing that works is replacing the hormone.\n\n'
      + 'The diagnostic problem is that the test which proves it is a cortisol measured during the '
      + 'crisis, and treatment changes that measurement. The resolution is sequence rather than '
      + 'choice: take the blood, then treat immediately, and interpret the result afterwards. '
      + 'Waiting for a laboratory result in a shocked patient is the error this is designed to '
      + 'prevent.\n\n'
      + 'Recognition is the harder half, because the presentation is unremarkable: weakness, '
      + 'vomiting, abdominal pain, fever, confusion, a low pressure, often a low sodium and '
      + 'sometimes a low glucose. It is routinely treated as sepsis or gastroenteritis — and may '
      + 'genuinely be sepsis as well, because infection is what commonly precipitates it.\n\n'
      + 'What raises the suspicion is the history: known adrenal insufficiency, long-term steroid '
      + 'treatment that has been stopped or not increased during illness, or pigmentation and '
      + 'weight loss over months. Patients at risk often carry a card or a warning.\n\n'
      + 'The treatment-before-tests lab holds that order, with a patient who could be several '
      + 'things at once.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'The circulation does not respond to pressors without the hormone; the sample is taken, then treatment starts.',
    },
    showMe: { scenarioId: 'adrenal-crisis-treatment-before-tests' },
    reflects: 'Endocrine Society, Diagnosis and Treatment of Primary Adrenal Insufficiency, 2016, and the Society for Endocrinology adrenal crisis emergency guidance.',
    simplifies:
      'Explains the ordering and gives no agent, dose, fluid or steroid regimen, and no criteria '
      + 'for the later taper. Interpreting a cortisol taken in crisis is a specialist matter this '
      + 'does not cover.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Endocrine Society. Diagnosis and Treatment of Primary Adrenal Insufficiency. 2016. Recommendations 1.1-1.3 and 4.1-4.6.',
        'Society for Endocrinology. Adrenal Crisis Information. Emergency treatment and prevention guidance.',
      ],
    },
  },
  {
    id: 'ketoacidosis-resolves-on-ketones',
    maturity: 'preview',
    title: 'Ketoacidosis resolves on the ketones, not the glucose',
    body:
      'The glucose is the number everyone watches, and it is the first thing to normalise. The '
      + 'disease, though, is the ketoacidosis: insulin lack has switched the body to breaking down '
      + 'fat, and the acid produced is what makes the patient ill.\n\n'
      + 'Those two recover on different clocks. Insulin and fluid bring the glucose down within '
      + 'hours, while ketone production takes longer to switch off. So a patient can have a normal '
      + 'glucose and still be acidotic, still be producing ketones, and still need insulin — which '
      + 'is why glucose is added to the fluid rather than the insulin being stopped.\n\n'
      + 'That distinction drives the resolution criteria. What ends the treatment is the ketones '
      + 'and the acid-base state, read together, rather than the glucose arriving at a target.\n\n'
      + 'The same thinking explains the commonest serious error at the end: stopping intravenous '
      + 'insulin before longer-acting subcutaneous insulin has had time to take effect. Insulin '
      + 'given into a vein is gone within minutes, so a gap between the two restarts the whole '
      + 'process, and the overlap exists precisely to prevent that.\n\n'
      + 'Potassium moves the other way throughout — it looks adequate at presentation and falls as '
      + 'treatment drives it into cells.\n\n'
      + 'The resolution lab holds that transition, with the glucose already looking fine.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'Glucose normalises in hours while ketone production takes longer, so the two end on different clocks.',
    },
    showMe: { scenarioId: 'dka-resolution-transition' },
    reflects: 'Umpierrez et al., Hyperglycemic Crises in Adults With Diabetes: A Consensus Report, Diabetes Care 2024, and the ADA Standards of Care in Diabetes 2026, Diabetes Care in the Hospital.',
    simplifies:
      'Explains what resolution means and gives no insulin rate, fluid, potassium replacement, '
      + 'overlap interval or resolution threshold. Local protocols set all of them, and the '
      + 'measurements available differ between hospitals.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Umpierrez GE, Davis GM, ElSayed NA, et al. Hyperglycemic Crises in Adults With Diabetes: A Consensus Report. Diabetes Care. 2024;47(8):1257-1275.',
        'American Diabetes Association Professional Practice Committee. Diabetes Care in the Hospital: Standards of Care in Diabetes-2026. Diabetes Care. 2026;49(Suppl 1):S339-S363.',
      ],
    },
  },
  {
    id: 'the-hyperosmolar-state-is-a-water-problem',
    maturity: 'preview',
    title: 'The hyperosmolar state is a water problem with a slow clock',
    body:
      'Hyperosmolar hyperglycaemic state and ketoacidosis are both consequences of insulin '
      + 'shortage, but they are different illnesses to manage. Here there is enough insulin to '
      + 'suppress ketone production, so the patient does not become acidotic early, does not feel '
      + 'as ill, and presents days later — by which time the water deficit is very large and the '
      + 'osmolality very high.\n\n'
      + 'Brain cells adapt to that osmolality over those days. Correcting it quickly pulls water '
      + 'into cells that have adjusted to being in a concentrated environment, and that shift is '
      + 'what causes harm. So the correction is deliberately gradual, on a schedule measured in '
      + 'a day or more, and the number being watched is the osmolality trajectory rather than the '
      + 'glucose alone.\n\n'
      + 'The patients are typically older, often with kidney impairment and other illness, so the '
      + 'same slow approach also protects a circulation that tolerates neither dehydration nor '
      + 'rapid filling.\n\n'
      + 'Two things stay in view alongside the fluid. The precipitating illness — infection, '
      + 'infarction, a new medicine — is usually what brought them in. And the hyperviscosity of a '
      + 'very concentrated circulation carries a real thrombosis risk.\n\n'
      + 'The osmolality lab holds that trajectory, where a number improving too quickly is the '
      + 'problem.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'Cells adapted over days; correcting the osmolality faster than that moves water into them.',
    },
    showMe: { scenarioId: 'hhs-osmolality-trajectory' },
    reflects: 'Umpierrez et al., Hyperglycaemic crises in adults with diabetes: a consensus report, Diabetologia 2024, and Mustafa et al., Management of Hyperosmolar Hyperglycaemic State in Adults, Joint British Diabetes Societies 2023.',
    simplifies:
      'Explains why the correction is slow and gives no rate, target, fluid choice or osmolality '
      + 'figure. Mixed presentations with ketoacidosis are common and are not described here.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Umpierrez GE, Davis GM, ElSayed NA, et al. Hyperglycaemic crises in adults with diabetes: a consensus report. Diabetologia. 2024;67:1455-1479.',
        'Mustafa OG, Haq M, Dashora U, Castro E, Dhatariya KK. Management of Hyperosmolar Hyperglycaemic State (HHS) in Adults: An updated guideline from the Joint British Diabetes Societies for Inpatient Care Group. Diabetic Medicine. 2023;40:e15005.',
      ],
    },
  },
  {
    id: 'sodium-correction-has-a-speed-limit',
    maturity: 'preview',
    title: 'Sodium correction has a speed limit, and it is not negotiable',
    body:
      'When sodium has been low for days, brain cells lose solute to match their surroundings, '
      + 'which is how they avoid swelling. That adaptation is what makes rapid correction '
      + 'dangerous: raising the sodium faster than the cells can re-accumulate solute draws water '
      + 'out of them, and the resulting injury — osmotic demyelination — appears days later, after '
      + 'the biochemistry has been fixed, and may be permanent.\n\n'
      + 'So there is a limit on how much the sodium may rise in a day, and the limit is lower in '
      + 'the patients most at risk: chronic hyponatraemia, alcohol use, malnutrition, liver '
      + 'disease, low potassium.\n\n'
      + 'The trap is that the limit can be exceeded without anyone giving anything. Once the cause '
      + 'of water retention is removed — fluid given for hypovolaemia, a drug stopped, cortisol '
      + 'replaced — the kidneys dump free water rapidly, and the sodium climbs on its own, often '
      + 'overnight. Replacing potassium raises it too.\n\n'
      + 'That is why the surveillance is frequent rather than daily, and why the plan includes what '
      + 'to do if the rise overshoots: relowering with free water is a recognised rescue, and it '
      + 'has to be considered immediately rather than after the next round.\n\n'
      + 'The aquaresis lab holds that overshoot, with nothing having been given to cause it.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'Remove the cause of water retention and the kidneys raise the sodium themselves, past the limit.',
    },
    showMe: { scenarioId: 'hyponatremia-aquaresis-and-overcorrection' },
    reflects: 'Sterns et al., Treatment Guidelines for Hyponatremia: Stay the Course, Clinical Journal of the American Society of Nephrology 2024, and Spasovski et al., Clinical practice guideline on diagnosis and treatment of hyponatraemia, European Journal of Endocrinology 2014.',
    simplifies:
      'Explains the risk and the overshoot and gives no limit, no monitoring interval and no '
      + 'relowering regimen. The exact figures differ between the cited guidance, which is part of '
      + 'why they are not reproduced here.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Sterns RH et al. Treatment Guidelines for Hyponatremia: Stay the Course. Clin J Am Soc Nephrol. 2024;19:129-135.',
        'Spasovski G et al. Clinical practice guideline on diagnosis and treatment of hyponatraemia. Eur J Endocrinol. 2014;170:G1-G47.',
      ],
    },
  },
  {
    id: 'in-myxedema-the-steroid-comes-first',
    maturity: 'preview',
    title: 'In myxoedema coma, the steroid comes first',
    body:
      'Severe hypothyroidism slows everything: consciousness, the heart, the gut, the breathing, '
      + 'and the production of heat. Patients present cold, bradycardic, hypoventilating and '
      + 'drowsy, and the hypoventilation is what commonly kills them, because the respiratory '
      + 'drive itself is depressed.\n\n'
      + 'Thyroid hormone replacement is the treatment, and there is a sequencing rule attached to '
      + 'it. Adrenal insufficiency coexists often enough — either as part of an autoimmune '
      + 'pattern or from pituitary disease — that giving thyroid hormone first can precipitate an '
      + 'adrenal crisis, because restoring metabolic rate increases the demand for cortisol that '
      + 'the patient cannot meet. So glucocorticoid is given before, or alongside, the thyroid '
      + 'hormone.\n\n'
      + 'The supportive care follows the same slow physiology. Warming is passive and gradual, '
      + 'because rapid external warming dilates vessels in a circulation that cannot compensate. '
      + 'Ventilation is supported rather than assumed, and carbon dioxide is measured rather than '
      + 'inferred from a saturation.\n\n'
      + 'And there is nearly always a precipitant — infection, cold, a missed medicine, a '
      + 'sedative — which is looked for while the hormone is being replaced.\n\n'
      + 'The sequence lab holds both the ventilation decision and the order of the two hormones.',
    diagram: {
      kind: 'membrane-stabilisation',
      caption: 'Restoring metabolic rate raises cortisol demand, so the glucocorticoid precedes the thyroid hormone.',
    },
    showMe: { scenarioId: 'myxedema-coma-ventilation-and-steroid-sequence' },
    reflects: 'Taylor et al., joint consensus statement for management of myxoedema coma, 2026, and Jonklaas et al., American Thyroid Association Guidelines for the Treatment of Hypothyroidism, 2014.',
    simplifies:
      'Gives the order and the reasoning, and no agent, dose, route, warming method or '
      + 'ventilation setting. Whether and how fast to give thyroid hormone is itself contested, '
      + 'and this does not resolve it.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Taylor P et al. Management of endocrine emergencies: joint consensus statement for management of myxoedema coma. 2026.',
        'Jonklaas J et al. Guidelines for the Treatment of Hypothyroidism. American Thyroid Association. 2014. Recommendations 21a-21d.',
      ],
    },
  },
  {
    id: 'refeeding-moves-electrolytes-into-cells',
    maturity: 'preview',
    title: 'Refeeding moves electrolytes into cells, and the danger follows the food',
    body:
      'A starved person runs on fat and protein, and their stores of phosphate, potassium and '
      + 'magnesium are depleted even when the blood concentrations look normal — because without '
      + 'insulin those minerals sit outside the cells rather than inside them.\n\n'
      + 'Feeding reverses that in hours. Carbohydrate triggers insulin, insulin drives glucose '
      + 'into cells, and phosphate, potassium and magnesium follow it. The blood concentrations '
      + 'fall, sometimes steeply, and the consequences are cardiac, respiratory and neurological. '
      + 'Thiamine is consumed at the same time by the sudden carbohydrate metabolism.\n\n'
      + 'So the danger arrives with the treatment, and it arrives early. Which is why the '
      + 'electrolytes are measured before feeding starts, replaced before and during it rather '
      + 'than once they fall, and watched for the first days rather than checked once.\n\n'
      + 'Two distinctions matter. Being at risk of refeeding syndrome is not the same as having '
      + 'developed it: risk is assessed from how long and how poorly someone has eaten and from '
      + 'their body mass, while the syndrome is a measured deterioration. And advancing nutrition '
      + 'slowly is a response to the measurements, not a fixed schedule — underfeeding a starved '
      + 'patient is its own harm.\n\n'
      + 'The electrolyte-shift lab holds the first days, with numbers that were normal at '
      + 'admission.',
    diagram: {
      kind: 'membrane-stabilisation',
      caption: 'Insulin drives glucose into cells and phosphate, potassium and magnesium follow, so feeding is when they fall.',
    },
    showMe: { scenarioId: 'refeeding-electrolyte-shift' },
    reflects: 'Matthews-Rensch et al., The Australasian Society of Parenteral and Enteral Nutrition consensus statements on refeeding syndrome, Nutrition & Dietetics 2025.',
    simplifies:
      'Explains the mechanism and gives no feeding rate, no replacement dose, no thiamine regimen '
      + 'and no monitoring schedule. The definitions of risk and of the syndrome itself differ '
      + 'between guidance, which the cited statement says explicitly.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Matthews-Rensch K et al. The Australasian Society of Parenteral and Enteral Nutrition: Consensus statements on refeeding syndrome. Nutrition & Dietetics. 2025.',
      ],
    },
  },
];
