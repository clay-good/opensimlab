/**
 * Renal and electrolyte concept explainers
 * (knowledge-layer → the minimum knowledge set).
 *
 * Six concepts, each the reasoning behind a recurring mistake in this module's
 * labs, under 250 words with a caption, a source, a stated simplification, and
 * the lesson that demonstrates it.
 *
 * This module's lessons are about numbers that mislead, and these explainers
 * keep that voice: what each measurement is actually measuring, and what it
 * cannot establish. Every one explains; none prescribes a dose, a rate or a
 * target, because the lessons are built around exactly those being local.
 */

import { UNSIGNED_REVIEW, type Explainer } from '@platform/knowledge/explainer';

export const RENAL_ELECTROLYTE_EXPLAINERS: readonly Explainer[] = [
  {
    id: 'magnesium-gates-potassium-repletion',
    maturity: 'preview',
    title: 'Magnesium gates potassium repletion, and its own number is weak',
    body:
      'Potassium leaves the body partly through a channel in the distal nephron whose activity is '
      + 'normally restrained by magnesium inside the cell. When intracellular magnesium is low, '
      + 'that restraint goes, the channel secretes more potassium, and the kidney keeps losing it '
      + 'however much is replaced.\n\n'
      + 'That is the mechanism behind a hypokalaemia that will not correct. The replacement is not '
      + 'failing to arrive; it is being lost through a door that magnesium was holding shut.\n\n'
      + 'The complication is the magnesium measurement. Most magnesium in the body is '
      + 'intracellular or in bone, and the serum value is a small, poorly correlated fraction of '
      + 'it. So a reading inside the reference range does not rule out deficiency, and a patient '
      + 'with the risk factors — diuretics, alcohol use, poor intake, gastrointestinal losses, '
      + 'certain drugs — can be depleted with a normal number on the screen.\n\n'
      + 'What that justifies is modest and worth stating precisely: an in-range magnesium is not '
      + 'reassurance in a refractory hypokalaemia. It does not establish that magnesium is the '
      + 'cause, and the mechanistic review this rests on says plainly that magnesium deficiency '
      + 'alone does not necessarily produce hypokalaemia.\n\n'
      + 'The refractory-potassium lab holds that: a potassium that will not rise, and a magnesium '
      + 'that looks fine.',
    diagram: {
      kind: 'membrane-stabilisation',
      caption: 'Low intracellular magnesium releases the distal potassium channel, so replacement is lost as it arrives.',
    },
    showMe: { scenarioId: 'hypomagnesemia-refractory-potassium-and-the-normal-number' },
    reflects: 'Huang and Kuo, Mechanism of hypokalemia in magnesium deficiency, Journal of the American Society of Nephrology 2007 (PMID 17804670), a mechanistic review rather than a comparative study.',
    simplifies:
      'Gives the mechanism and no dose, route, rate or reference range. It also states a weaker '
      + 'claim than it is often used for: that an in-range value does not exclude deficiency, not '
      + 'that the reference range is wrong, a proposal that is contested and not adopted here.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Huang CL, Kuo E. Mechanism of hypokalemia in magnesium deficiency. J Am Soc Nephrol. 2007;18:2649-2652. PMID 17804670.',
      ],
    },
  },
  {
    id: 'total-calcium-misleads-in-kidney-disease',
    maturity: 'preview',
    title: 'Total calcium misleads exactly where it is used most',
    body:
      'Calcium in the blood travels in three states: bound to albumin, complexed with anions, and '
      + 'free. Only the free, ionised fraction acts on nerve and muscle, and only that fraction '
      + 'explains symptoms.\n\n'
      + 'A total calcium measures all three. When albumin is low, the total falls while the '
      + 'ionised fraction may be untouched, which is why adjustment formulas exist. Those formulas '
      + 'were derived in populations without kidney disease, and in kidney disease the things they '
      + 'assume are all disturbed at once: albumin is low, the pH is shifted, phosphate and '
      + 'citrate are raised, and the binding behaviour changes with them.\n\n'
      + 'So the adjusted number can be wrong in either direction in exactly the patients whose '
      + 'calcium is checked most often, and being adjusted makes it look more trustworthy rather '
      + 'than less. An ionised calcium measures the fraction that matters directly.\n\n'
      + 'The clinical consequence is about which question is being answered. A symptomatic '
      + 'patient — tingling, cramps, twitching, a prolonged interval on the ECG — is a reason to '
      + 'measure the ionised fraction and to treat on the whole picture, rather than to recompute '
      + 'a total.\n\n'
      + 'The ionised-calcium lab holds that: a patient with symptoms, a total calcium, and an '
      + 'adjustment that was never built for her.',
    diagram: {
      kind: 'membrane-stabilisation',
      caption: 'Only the free fraction acts; the adjustment formulas assume binding conditions that kidney disease disturbs.',
    },
    showMe: { scenarioId: 'hypocalcemia-ionized-calcium-and-ckd' },
    reflects: 'Gauci et al., Pitfalls of measuring total blood calcium in patients with CKD, Journal of the American Society of Nephrology 2008, and the Society for Endocrinology guidance on emergency management of acute hypocalcaemia in adults, 2016.',
    simplifies:
      'Explains what each measurement means and gives no formula, threshold, calcium dose or '
      + 'rate. The source is observational work in kidney disease, so it establishes that the '
      + 'adjustment is unreliable there, not what any individual’s ionised calcium will be.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Gauci C, Moranne O, Fouqueray B, et al. Pitfalls of measuring total blood calcium in patients with CKD. J Am Soc Nephrol. 2008;19:1592-1598.',
        'Society for Endocrinology. Emergency management of acute hypocalcaemia in adult patients. Endocrine Connections. 2016;5:G7-G8.',
      ],
    },
  },
  {
    id: 'a-rise-after-exposure-attributes-nothing',
    maturity: 'preview',
    title: 'A rise after an exposure attributes nothing by itself',
    body:
      'A creatinine that rises in the days after a contrast-enhanced scan is a common and real '
      + 'observation. What it does not contain is a comparison: the same patient was unwell '
      + 'enough to need the scan, and sick patients with poor perfusion, new drugs and ongoing '
      + 'illness have rising creatinines whether or not they are scanned.\n\n'
      + 'Attribution needs a group that was not exposed and is otherwise similar. When that '
      + 'comparison has been made — with controls, and with matching on how ill the patients were '
      + '— the association the label assumes has largely not been found, and a multisociety '
      + 'consensus statement now says the risk has been overstated.\n\n'
      + 'Two things follow, and both are limits rather than conclusions. The statement is a '
      + 'position rather than a settled fact; it does not claim contrast never injures a kidney, '
      + 'and it keeps a smaller group at genuine risk.\n\n'
      + 'The harm the label does is in what it ends. A rise explained by the scan is a rise nobody '
      + 'investigates, so the hypovolaemia, the sepsis, the obstruction or the medicine that was '
      + 'actually responsible goes unlooked-for. The cost of a wrong attribution is the search it '
      + 'stopped.\n\n'
      + 'The attribution lab holds exactly that moment, with a plausible label already attached.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'Without a comparable unexposed group, a rise after exposure is sequence rather than cause.',
    },
    showMe: { scenarioId: 'contrast-attribution-a-label-that-stopped-the-search' },
    reflects: 'Davenport et al., Use of Intravenous Iodinated Contrast Media in Patients with Kidney Disease: Consensus Statements from the American College of Radiology and the National Kidney Foundation, Radiology 2020 (PMID 31961246) — a consensus statement, with published comments on the record.',
    simplifies:
      'Argues about attribution and gives no threshold, imaging decision, fluid decision or '
      + 'protocol. It does not say contrast is harmless, and who remains at genuine risk is a '
      + 'judgement the cited statement makes and this does not reproduce.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Davenport MS, Perazella MA, Yee J, Dillman JR, et al. Use of Intravenous Iodinated Contrast Media in Patients with Kidney Disease: Consensus Statements from the American College of Radiology and the National Kidney Foundation. Radiology. 2020;294:660-668. PMID 31961246.',
      ],
    },
  },
  {
    id: 'an-estimated-filtration-is-an-inference',
    maturity: 'preview',
    title: 'An estimated filtration rate is an inference about muscle',
    body:
      'A creatinine-based estimate does not measure filtration. It infers it from a waste product '
      + 'whose production depends on muscle, using an equation fitted to a population, and '
      + 'expresses the answer indexed to a standard body surface area that belongs to nobody in '
      + 'particular.\n\n'
      + 'Each of those steps can fail for an individual without anything happening to their '
      + 'kidney. Low muscle mass, frailty, malnutrition, a limb amputation and a long illness all '
      + 'reduce creatinine production, so the estimate reads higher than the truth. Large muscle '
      + 'mass does the reverse. The indexing to a standard surface area matters most at the '
      + 'extremes of body size, which is also where drug dosing decisions are hardest.\n\n'
      + 'The equations also assume a steady state. In a patient whose function is changing today, '
      + 'the creatinine is reporting where things were rather than where they are, and it lags by '
      + 'a day or more.\n\n'
      + 'None of that makes the number useless. It makes it a population estimate with a known '
      + 'spread, which means a single value should not be read as a measurement of this person '
      + 'without asking what generated it.\n\n'
      + 'The estimated-filtration lab holds that question: what the figure was computed from, and '
      + 'which of this patient’s features move the input rather than the kidney.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'Muscle sets the input, an equation fits a population, and the index belongs to nobody in particular.',
    },
    showMe: { scenarioId: 'estimated-filtration-a-number-she-was-never-measured-by' },
    reflects: 'Inker et al., New creatinine- and cystatin C-based equations to estimate GFR without race, New England Journal of Medicine 2021, whose quoted accuracy is a population statistic, and Iversen et al., Performance of panel-estimated GFR among hospitalized older adults, American Journal of Kidney Diseases 2023.',
    simplifies:
      'Describes what the estimate is and names no equation, no accuracy figure and no dosing '
      + 'rule. It does not say which marker is right for a given patient, and the work it rests '
      + 'on is accuracy data from particular cohorts rather than a guarantee for anyone.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Inker LA, Eneanya ND, Coresh J, Tighiouart H, et al. New creatinine- and cystatin C-based equations to estimate GFR without race. N Engl J Med. 2021;385:1737-1749.',
        'Iversen E, Bengaard AK, Leegaard Andersen A, Tavenier J, et al. Performance of panel-estimated GFR among hospitalized older adults. Am J Kidney Dis. 2023;82:715-724.',
      ],
    },
  },
  {
    id: 'a-surrogate-is-not-the-outcome',
    maturity: 'preview',
    title: 'A surrogate is not the outcome it stands in for',
    body:
      'Phosphate is associated with cardiovascular death in kidney disease, and treatments that '
      + 'lower it are widely used. The step between those two facts is the assumption that moving '
      + 'the marker moves the outcome, and that step is where surrogates fail.\n\n'
      + 'A marker can be associated with harm because it tracks the severity of the underlying '
      + 'disease rather than because it causes the harm. Lowering it then changes the number '
      + 'without changing the disease. The treatment can also act elsewhere: a published '
      + 'comparison in moderate kidney disease lowered phosphate as intended and found more '
      + 'vascular calcification in the treated group, which is the direction nobody wanted.\n\n'
      + 'That finding deserves the same scepticism as the assumption it undermines. It was small, '
      + 'ran for months rather than years, and the calcification results were secondary with '
      + 'borderline statistical support; the authors concluded that safety and efficacy remain '
      + 'uncertain, not that the treatment is harmful.\n\n'
      + 'The usable lesson is about what a target can and cannot promise. A number brought to '
      + 'target is a number brought to target, and whether the patient benefited is a separate '
      + 'question that needs the outcome itself.\n\n'
      + 'The phosphate-target lab holds a surrogate that moved the right way while something else '
      + 'moved the wrong way.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'Moving the marker is not moving the disease; the treated group’s calcification went the other way.',
    },
    showMe: { scenarioId: 'phosphate-target-a-surrogate-that-moved-the-wrong-way' },
    reflects: 'Block et al., Effects of phosphate binders in moderate CKD, Journal of the American Society of Nephrology 2012 (PMID 22822075): 148 patients over nine months, with the phosphorus change primary and the calcification findings secondary.',
    simplifies:
      'Argues about surrogate reasoning and gives no target, agent or dose. It also does not '
      + 'settle the clinical question in either direction: one small study with secondary '
      + 'findings is a reason for uncertainty, not a reason to withhold treatment.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Block GA, Wheeler DC, Persky MS, Kestenbaum B, et al. Effects of phosphate binders in moderate CKD. J Am Soc Nephrol. 2012;23:1407-1415. PMID 22822075.',
      ],
    },
  },
  {
    id: 'the-creatine-kinase-does-not-carry-the-risk',
    maturity: 'preview',
    title: 'In rhabdomyolysis, the enzyme does not carry the risk',
    body:
      'Creatine kinase says that muscle has broken down. It does not say what the kidney is doing, '
      + 'and the correlation between the peak value and whether a patient develops kidney injury '
      + 'is loose enough that no threshold separates the two groups reliably.\n\n'
      + 'What carries the risk is the situation around the number: how long the muscle was '
      + 'compressed or working, how depleted the circulation is, what else is damaging the kidney '
      + 'at the same time, what the urine is doing, and what the potassium, calcium and phosphate '
      + 'are doing as cell contents leave the muscle.\n\n'
      + 'So the assessment runs on the patient and the trend rather than on one enzyme crossing a '
      + 'line, and the treatments are directed at the circulation and the complications rather '
      + 'than at the value.\n\n'
      + 'The published guidance is unusually honest about its own limits. The practice management '
      + 'guideline that covers this rates the quality of the underlying work as very low, notes '
      + 'that most of it is retrospective, and opens by saying the treatment remains '
      + 'controversial.\n\n'
      + 'Which cuts both ways, and is worth holding carefully: an absence of demonstrated benefit '
      + 'is not a demonstrated absence of benefit. The honest position is uncertainty, not '
      + 'confidence in either direction.\n\n'
      + 'The rhabdomyolysis lab holds a large number and a patient whose risk lives elsewhere.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'The enzyme measures the muscle; the circulation, the urine and the released cell contents carry the risk.',
    },
    showMe: { scenarioId: 'rhabdomyolysis-a-number-that-does-not-carry-the-risk' },
    reflects: 'Sawhney et al., Management of rhabdomyolysis: a practice management guideline from the Eastern Association for the Surgery of Trauma, The American Journal of Surgery 2022 (PMID 34836603), which rates its own underlying work as very low quality.',
    simplifies:
      'Says what the enzyme does and does not establish, and gives no threshold, fluid regimen, '
      + 'urine target or dialysis criterion. The uncertainty is genuine: the cited guideline '
      + 'describes the treatment as controversial, and this does not resolve that.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Sawhney JS, Kasotakis G, Goldenberg A, Abramson S, et al. Management of rhabdomyolysis: a practice management guideline from the Eastern Association for the Surgery of Trauma. Am J Surg. 2022;224:196-204. PMID 34836603.',
      ],
    },
  },
];
