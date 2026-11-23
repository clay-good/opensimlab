/**
 * Pediatrics concept explainers
 * (knowledge-layer → the minimum knowledge set).
 *
 * Six concepts, each the reasoning behind a recurring mistake in this module's
 * labs, under 250 words with a caption, a source, a stated simplification, and
 * the lesson that demonstrates it. Each cites the publications the lesson it
 * points at already declares.
 *
 * Every one explains; none instructs a dose. Weight-based dosing is the part of
 * pediatrics most likely to be misread out of context, so it stays in the
 * lessons, inside the envelope they declare.
 */

import { UNSIGNED_REVIEW, type Explainer } from '@platform/knowledge/explainer';

export const PEDIATRICS_EXPLAINERS: readonly Explainer[] = [
  {
    id: 'children-compensate-until-they-do-not',
    maturity: 'preview',
    title: 'Children compensate well, then stop compensating all at once',
    body:
      'A child in shock defends their blood pressure far more effectively than an adult does. '
      + 'Heart rate rises, peripheral vessels clamp down, and the pressure stays in the normal '
      + 'range through a large loss of circulating volume or a long period of poor perfusion.\n\n'
      + 'So hypotension in a child is not an early warning. It is a late one, arriving when the '
      + 'compensation is exhausted, and the fall after it is steep rather than gradual.\n\n'
      + 'What moves earlier is everything about flow: a heart rate that is high for the child’s '
      + 'age and staying there, cool or mottled peripheries, a capillary refill that lengthens, '
      + 'fewer wet nappies, and — the one families notice first — a child who has stopped behaving '
      + 'like themselves. Drowsiness, irritability that cannot be settled, and a refusal to feed '
      + 'are perfusion signs in a small child.\n\n'
      + 'Normal also changes with age, which is why a heart rate or respiratory rate has to be '
      + 'read against the child’s own age band rather than against an adult’s intuition.\n\n'
      + 'The practical consequence is that reassessment is the whole skill: a single set of '
      + 'observations says much less than the same set repeated and compared.\n\n'
      + 'The sepsis lab holds a child whose pressure is normal throughout and whose perfusion is '
      + 'not.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'A child holds their pressure through a large loss, then falls steeply once compensation is spent.',
    },
    showMe: { scenarioId: 'pediatric-sepsis' },
    reflects: 'Weiss et al., Surviving Sepsis Campaign international guidelines for the management of sepsis and septic shock in children 2026, and Schlapbach et al., International Consensus Criteria for Pediatric Sepsis and Septic Shock, JAMA 2024.',
    simplifies:
      'Names the pattern and gives no age-band numbers, no thresholds and no treatment. It also '
      + 'treats compensation as one thing, when a child with heart disease, a chronic condition, '
      + 'or a very young infant may not compensate like this at all.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Weiss SL, Peters MJ, Oczkowski SJ, et al. Surviving Sepsis Campaign international guidelines for the management of sepsis and septic shock in children 2026. Pediatr Crit Care Med. 2026;27(4):379-434.',
        'Schlapbach LJ, Watson RS, Sorce LR, et al. International Consensus Criteria for Pediatric Sepsis and Septic Shock. JAMA. 2024;331(8):665-674.',
      ],
    },
  },
  {
    id: 'a-slow-child-is-a-hypoxic-child',
    maturity: 'preview',
    title: 'A bradycardic child is a hypoxic child until proven otherwise',
    body:
      'Adult cardiac arrest is usually a rhythm problem arriving in a heart that was perfusing a '
      + 'moment earlier. Childhood arrest is usually the end of a respiratory one: the breathing '
      + 'fails, oxygen falls, the heart slows as the myocardium runs out, and arrest follows.\n\n'
      + 'That changes what bradycardia means. In a child it is rarely a conduction problem to be '
      + 'paced or blocked; it is the myocardium telling you how long it has been hypoxic. The '
      + 'treatment is therefore the airway and the oxygen, and the heart rate is the thing that '
      + 'responds to those rather than the thing to be treated directly.\n\n'
      + 'It also means the window is before the arrest. A slowing heart rate in a child who has '
      + 'been working hard to breathe is not a new problem; it is the previous one reaching the '
      + 'heart, and the child who is recognised at that point does far better than the child '
      + 'recognised a few minutes later.\n\n'
      + 'The corollary is that a bradycardic, poorly perfused child is treated as peri-arrest even '
      + 'while a pulse is present, with the response aimed at oxygenation and ventilation first.\n\n'
      + 'The bradycardic-arrest lab runs that sequence from before the pulse is lost.',
    diagram: {
      kind: 'apnea-curve',
      caption: 'Breathing fails, oxygen falls, the heart slows: the bradycardia is the last step, not the first.',
    },
    showMe: { scenarioId: 'pediatric-bradycardic-arrest' },
    reflects: 'Lasa et al., Part 8: Pediatric Advanced Life Support, 2025 AHA/AAP Guidelines for CPR and ECC, and the AHA/AAP Pediatric Bradycardia With a Pulse Algorithm, 2025.',
    simplifies:
      'States the usual cause and gives no rate threshold, no agent and no technique. The '
      + 'exceptions are real — congenital heart block, poisoning, raised intracranial pressure — '
      + 'and this does not help you spot them.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Lasa JJ, Dhillon GS, Duff JP, et al. Part 8: Pediatric Advanced Life Support: 2025 AHA/AAP Guidelines for CPR and ECC. Circulation. 2025;152(suppl 2):S479-S537.',
        'American Heart Association and American Academy of Pediatrics. Pediatric Bradycardia With a Pulse Algorithm. 2025.',
      ],
    },
  },
  {
    id: 'work-of-breathing-is-the-measurement',
    maturity: 'preview',
    title: 'In a child, the work of breathing is the measurement',
    body:
      'Small airways are small, and resistance to flow rises very steeply as a tube narrows — a '
      + 'little swelling in an infant’s airway costs far more than the same swelling in an '
      + 'adult’s. A child compensates for that by working harder, and the work is visible from '
      + 'the end of the bed.\n\n'
      + 'Nasal flaring, head bobbing, tracheal tug, intercostal and subcostal recession, and '
      + 'grunting are the signs of that work. Grunting in particular is the child closing the '
      + 'glottis against expiration to hold their own lung open, and it belongs with the most '
      + 'worrying findings rather than with noisy breathing generally.\n\n'
      + 'The saturation does not measure any of this. It can sit in the normal range through a '
      + 'great deal of effort, and it falls when the effort stops working — which is also when a '
      + 'tiring child starts to look calmer. A child whose recession softens and whose rate slows '
      + 'while nothing has been treated is not improving.\n\n'
      + 'So the observation that matters is the effort and its direction over minutes, read '
      + 'beside how awake the child is. The respiratory-distress lab tracks exactly that: the '
      + 'number holds while the effort tells the story, and the two eventually swap places.',
    diagram: {
      kind: 'apnea-curve',
      caption: 'Effort rises long before saturation falls, and a child who stops working is tiring, not improving.',
    },
    showMe: { scenarioId: 'pediatric-respiratory-distress' },
    reflects: 'Part 6: Pediatric Basic Life Support, 2025 American Heart Association and American Academy of Pediatrics Guidelines for CPR and ECC, and the World Health Organization guideline on paediatric emergency triage, assessment and treatment, 2016.',
    simplifies:
      'Lists the signs of effort and gives no severity score, no age-specific rates and no '
      + 'treatment. It does not distinguish the causes, and the response to each differs; a child '
      + 'with an obstructing upper airway is a different emergency from one with stiff lungs.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'American Heart Association and American Academy of Pediatrics. Part 6: Pediatric Basic Life Support: 2025 American Heart Association Guidelines for Cardiopulmonary Resuscitation and Emergency Cardiovascular Care. Pediatrics. 2026;157:e2025074350.',
        'World Health Organization. Paediatric emergency triage, assessment and treatment: care of critically-ill children. Updated guideline. 2016.',
      ],
    },
  },
  {
    id: 'stridor-and-wheeze-name-different-airways',
    maturity: 'preview',
    title: 'Stridor and wheeze name different airways',
    body:
      'Noise on breathing in comes from above the chest: the larynx and the trachea, where the '
      + 'airway narrows and the pressure of inspiration pulls it narrower still. Noise on breathing '
      + 'out comes from below: small airways collapsing as the chest empties. Stridor and wheeze '
      + 'are therefore not two grades of the same finding, they are two locations.\n\n'
      + 'Croup is the upper version. The swelling sits where the airway is already narrowest, the '
      + 'child has a barking cough and stridor, and the most useful early intervention is keeping '
      + 'the child calm: crying and struggling increase the inspiratory effort that collapses the '
      + 'airway further, so an examination that upsets the child can make the obstruction worse in '
      + 'front of you.\n\n'
      + 'That is the reverse of the usual instinct to examine thoroughly and quickly, and it is '
      + 'why much of the assessment is done by watching rather than touching, with the child on a '
      + 'parent.\n\n'
      + 'Stridor at rest, rather than only on exertion or crying, marks the step up in severity, '
      + 'and a quiet chest in either location is the same bad sign it is in an adult.\n\n'
      + 'The croup lab runs that assessment and the decisions that follow from the noise.',
    diagram: {
      kind: 'capnogram-phases',
      caption: 'Noise breathing in points above the chest; noise breathing out points below it.',
    },
    showMe: { scenarioId: 'croup' },
    reflects: 'Canadian Paediatric Society, Acute management of croup in the emergency department, updated 2026, and the Royal Children’s Hospital Melbourne clinical practice guideline on croup, 2024.',
    simplifies:
      'Separates the two locations and names no treatment, severity score or disposition rule. '
      + 'Stridor has causes other than croup — some of them emergencies where the approach is '
      + 'entirely different — and telling them apart is not covered here.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Canadian Paediatric Society, Acute Care Committee. Acute management of croup in the emergency department. Updated 2026 Mar 6.',
        'Royal Children’s Hospital Melbourne. Clinical Practice Guidelines: Croup (Laryngotracheobronchitis). Updated 2024 Sep.',
      ],
    },
  },
  {
    id: 'in-pediatric-dka-the-brain-sets-the-pace',
    maturity: 'preview',
    title: 'In childhood ketoacidosis, the brain sets the pace',
    body:
      'A child in diabetic ketoacidosis is dehydrated, acidotic and salt-depleted, and the '
      + 'instinct to correct all three quickly is strong. The reason the correction is '
      + 'deliberately unhurried is the brain.\n\n'
      + 'Cerebral injury is the complication that kills children in ketoacidosis. It is uncommon, '
      + 'it can appear hours after treatment starts and after the numbers have begun to improve, '
      + 'and once it declares itself the outcome is often poor. Severity of acidosis at '
      + 'presentation and how the first hours are managed both matter, which makes the pace part '
      + 'of the treatment rather than a detail of it.\n\n'
      + 'So fluid is replaced over a long, planned schedule, insulin follows fluid rather than '
      + 'leading it, and the glucose is deliberately brought down gradually. The acidosis resolves '
      + 'as ketone production stops, not as the glucose number falls.\n\n'
      + 'The monitoring that matters is neurological as much as biochemical: headache, a falling '
      + 'conscious level, a rising blood pressure with a slowing heart rate, irritability, or a '
      + 'child who was improving and is now not. Those are checked on a schedule because they '
      + 'arrive while everything else looks better.\n\n'
      + 'The pediatric ketoacidosis lab runs that window, where the numbers improve and the child '
      + 'does not.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'The biochemistry improves on one clock; the neurological risk runs on another, later one.',
    },
    showMe: { scenarioId: 'pediatric-diabetic-ketoacidosis' },
    reflects: 'Glaser et al., ISPAD Clinical Practice Consensus Guidelines 2022: Diabetic ketoacidosis and hyperglycemic hyperosmolar state, and NICE guideline NG18 on diabetes in children and young people.',
    simplifies:
      'Explains why the pace is slow and gives no fluid volume, rate, insulin regimen or '
      + 'monitoring interval, and no criteria for any of them. Local protocols set all of it, and '
      + 'the mechanism of the cerebral injury itself remains debated.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Glaser N, Fritsch M, Priyambada L, et al. ISPAD Clinical Practice Consensus Guidelines 2022: Diabetic ketoacidosis and hyperglycemic hyperosmolar state. Pediatric Diabetes. 2022;23(7):835-856.',
        'National Institute for Health and Care Excellence. Diabetes (type 1 and type 2) in children and young people: diagnosis and management. NICE guideline NG18. Section 1.4.',
      ],
    },
  },
  {
    id: 'check-the-glucose-in-every-seizing-child',
    maturity: 'preview',
    title: 'Check the glucose in every child who is fitting',
    body:
      'Hypoglycemia is one of the few causes of a seizure that can be found in seconds and '
      + 'reversed completely, and it is one of the few in which the delay does the damage. That '
      + 'combination is why it sits inside the first assessment rather than in the list of things '
      + 'to investigate afterwards.\n\n'
      + 'Children are more vulnerable to it than adults. Their glycogen stores are smaller '
      + 'relative to their needs, so an illness that stops them eating for a day can be enough, '
      + 'and the younger the child the shorter the margin.\n\n'
      + 'The presentation does not announce itself. A fitting child looks like a fitting child, '
      + 'and the sweating, pallor and irritability that might point at glucose are also features '
      + 'of the seizure and of the illness around it. Low glucose is found by measuring, not by '
      + 'recognising.\n\n'
      + 'There is a second step that is easy to lose in the moment: in a child with no known '
      + 'diagnosis, the sample that explains why the glucose was low has to be taken while it is '
      + 'still low. Once it has been corrected, that diagnostic window has closed, and for a '
      + 'recurrent or unexplained hypoglycemia it does not reopen.\n\n'
      + 'The hypoglycemic-seizure lab holds both: the reversal, and the sample that gets lost.',
    diagram: {
      kind: 'membrane-stabilisation',
      caption: 'The reversible cause is found by measuring; the sample that explains it expires on correction.',
    },
    showMe: { scenarioId: 'pediatric-hypoglycemic-seizure' },
    reflects: 'Thornton et al., Recommendations from the Pediatric Endocrine Society for Evaluation and Management of Persistent Hypoglycemia in Neonates, Infants, and Children, Journal of Pediatrics 2015, and the Royal Children’s Hospital Melbourne clinical practice guideline on hypoglycaemia, 2025.',
    simplifies:
      'Argues for measuring early and for the diagnostic sample, and names no glucose threshold, '
      + 'no treatment and no sample list. Which tests belong in that sample depends on the '
      + 'suspected cause and on what the local laboratory can run.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Thornton PS, Stanley CA, De Leon DD, et al. Recommendations from the Pediatric Endocrine Society for Evaluation and Management of Persistent Hypoglycemia in Neonates, Infants, and Children. Journal of Pediatrics. 2015;167(2):238-245.',
        'Royal Children’s Hospital Melbourne. Clinical Practice Guideline: Hypoglycaemia. Last updated August 2025.',
      ],
    },
  },
];
