/**
 * Neonatology concept explainers
 * (knowledge-layer → the minimum knowledge set).
 *
 * Six concepts, each the reasoning behind a recurring mistake in this module's
 * labs, under 250 words with a caption, a source, a stated simplification, and
 * the lesson that demonstrates it. Each cites the publications the lesson it
 * points at already declares.
 *
 * Every one explains; none instructs a pressure, an oxygen setting or a dose.
 * The newborn lessons declare what they do and do not let a learner do, and the
 * numbers stay inside them.
 */

import { UNSIGNED_REVIEW, type Explainer } from '@platform/knowledge/explainer';

export const NEONATOLOGY_EXPLAINERS: readonly Explainer[] = [
  {
    id: 'the-newborn-emergency-is-the-lungs',
    maturity: 'preview',
    title: 'Almost every newborn emergency is the lungs',
    body:
      'Before birth the lungs are full of fluid and the circulation bypasses them. The first '
      + 'effective breaths clear that fluid, open the lung, and drop the pressure in the pulmonary '
      + 'circuit, which is what redirects blood through the lungs and completes the transition.\n\n'
      + 'So a newborn who is not breathing effectively has not made that change. The heart slows '
      + 'because the myocardium is hypoxic, not because of a conduction problem, and the '
      + 'circulation stays in its fetal pattern. Which is why ventilation is the first, second and '
      + 'third priority in newborn resuscitation, and why compressions come late and rarely.\n\n'
      + 'It also explains what counts as a measure of success. A rising heart rate is the primary '
      + 'sign that the lungs are being ventilated; visible chest movement is secondary, because '
      + 'the chest can move without the lung being recruited. The heart rate is the lung’s '
      + 'report.\n\n'
      + 'The practical consequence is about sequencing under pressure. When a newborn is not '
      + 'responding, the next action is almost always to make the ventilation better rather than '
      + 'to add something new, and the whole corrective sequence exists for that one purpose.\n\n'
      + 'The apnea lab holds the first minute, where the decision is whether ventilation has '
      + 'started early enough.',
    diagram: {
      kind: 'oxygen-delivery',
      caption: 'Effective breaths clear the lung and open the pulmonary circulation; the heart rate reports whether that happened.',
    },
    showMe: { scenarioId: 'neonatal-apnea' },
    reflects: 'Lee et al., Part 5: Neonatal Resuscitation: 2025 American Heart Association and American Academy of Pediatrics Guidelines for CPR and ECC, Pediatrics 2026.',
    simplifies:
      'States the priority and gives no pressure, rate, oxygen concentration or timing. It also '
      + 'treats the newborn as a lung problem when a few are not: a blocked airway, a '
      + 'pneumothorax, blood loss and a congenital anomaly all behave differently.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Lee HC, Strand ML, Finan E, et al. Part 5: Neonatal Resuscitation: 2025 American Heart Association and American Academy of Pediatrics Guidelines for Cardiopulmonary Resuscitation and Emergency Cardiovascular Care. Pediatrics. 2026;157(1):e2025074352.',
      ],
    },
  },
  {
    id: 'before-anything-new-fix-the-ventilation',
    maturity: 'preview',
    title: 'Before adding anything, make the ventilation work',
    body:
      'Mask ventilation of a newborn fails in a small number of predictable ways: the mask leaks, '
      + 'the head is in the wrong position, the mouth is closed or the airway obstructed, '
      + 'secretions are in the way, the pressure is too low, or a different airway is needed.\n\n'
      + 'Those failures are the reason a newborn does not respond, far more often than anything '
      + 'wrong with the baby. So when the heart rate is not rising, the response is a fixed '
      + 'corrective sequence through each of those causes — not a decision to escalate.\n\n'
      + 'Escalation that skips it is worse than slow. Chest compressions on a lung that has not '
      + 'been inflated circulate blood that is not being oxygenated, which is why compressions are '
      + 'held back until ventilation has been optimised, preferably through a secured airway. '
      + 'Adrenaline into an unventilated circulation has the same problem.\n\n'
      + 'The discipline is therefore to resist the instinct to do the next, bigger thing while the '
      + 'simplest one is still unverified, in a room where everyone can see that nothing is '
      + 'working. Naming the sequence out loud as it is performed is how a team stays on it.\n\n'
      + 'The correction lab holds that moment: a baby not responding, and the question of what is '
      + 'checked before anything is added.',
    diagram: {
      kind: 'compression-fraction',
      caption: 'Compressions circulate unoxygenated blood until the lung is inflated, so correction comes before escalation.',
    },
    showMe: { scenarioId: 'ineffective-ventilation-correction' },
    reflects: 'Lee et al., Part 5: Neonatal Resuscitation: 2025 AHA/AAP Guidelines for CPR and ECC, Pediatrics 2026, and the ILCOR Neonatal Life Support 2025 consensus on science with treatment recommendations.',
    simplifies:
      'Explains why correction precedes escalation and teaches no step of it: no hold, no '
      + 'position, no pressure, no device and no airway technique. The thresholds at which '
      + 'compressions and medication become appropriate are in the algorithm, not here.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Lee HC, Strand ML, Finan E, et al. Part 5: Neonatal Resuscitation: 2025 American Heart Association and American Academy of Pediatrics Guidelines for Cardiopulmonary Resuscitation and Emergency Cardiovascular Care. Pediatrics. 2026;157(1):e2025074352.',
        'Wyckoff MH, Greif R, Morley PT, et al. Neonatal Life Support: 2025 International Liaison Committee on Resuscitation Consensus on Science With Treatment Recommendations. Pediatrics. 2026;157(1):e2025074766.',
      ],
    },
  },
  {
    id: 'a-newborn-cools-faster-than-you-expect',
    maturity: 'preview',
    title: 'A newborn cools faster than anyone expects',
    body:
      'A newborn is wet, has a large surface area for their weight, little insulating fat, and no '
      + 'ability to shiver. All four work in the same direction, and the temperature can fall '
      + 'within minutes of birth in a room that feels comfortable to the people in it.\n\n'
      + 'Heat leaves four ways, and each has its own countermeasure: evaporation from wet skin, '
      + 'conduction to cold surfaces, convection into moving air, and radiation to cold walls and '
      + 'windows. Drying, warm covering, a warmed surface, a hat, closed doors, and skin-to-skin '
      + 'contact each address one of them.\n\n'
      + 'The reason it is treated as part of resuscitation rather than as comfort is what cold '
      + 'does. A cold newborn consumes more oxygen, uses up glucose, becomes acidotic, and '
      + 'resuscitates less well — so hypothermia makes every other problem in the room worse, and '
      + 'it is associated with worse outcomes in its own right.\n\n'
      + 'Prevention is also almost entirely about preparation: the room, the surfaces and the '
      + 'coverings are warm before the birth or they are not warm in time.\n\n'
      + 'Preterm babies lose heat faster still, which is why their care adds further measures. The '
      + 'thermoregulation lab holds a newborn already cooling, where the question is which route '
      + 'is losing the heat.',
    diagram: {
      kind: 'oxygen-delivery',
      caption: 'Evaporation, conduction, convection and radiation each take heat, and each has its own countermeasure.',
    },
    showMe: { scenarioId: 'thermoregulation-failure' },
    reflects: 'Part 5: Neonatal Resuscitation: 2025 AHA/AAP Guidelines for CPR and ECC, Pediatrics 2026, and the World Health Organization practical guide to thermal protection of the newborn.',
    simplifies:
      'Names the routes of loss and gives no temperature target, no equipment setting and no '
      + 'rewarming method. Rewarming a cold newborn has its own hazards, and therapeutic cooling '
      + 'after birth asphyxia is a different matter entirely.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'American Heart Association and American Academy of Pediatrics. Part 5: Neonatal Resuscitation: 2025 Guidelines for Cardiopulmonary Resuscitation and Emergency Cardiovascular Care. Pediatrics. 2026;157(1):e2025074352.',
        'World Health Organization. Thermal protection of the newborn: a practical guide. 1997.',
      ],
    },
  },
  {
    id: 'newborn-glucose-has-no-single-number',
    maturity: 'preview',
    title: 'Newborn glucose has no single number',
    body:
      'Blood glucose falls in every newborn after birth and then recovers as feeding and the '
      + 'baby’s own glucose production establish themselves. That dip is normal, which is why no '
      + 'single concentration separates a healthy transition from a dangerous one, and why '
      + 'published operational thresholds differ.\n\n'
      + 'What makes a low number matter is the company it keeps. A baby with signs — jitteriness, '
      + 'poor feeding, abnormal tone, apnea, a seizure — is in a different situation from a '
      + 'well-feeding baby with the same reading, and the signs are what move the decision.\n\n'
      + 'The signs are also non-specific. They belong equally to infection, to hypoxic injury, to '
      + 'drug exposure and to metabolic disease, so finding a low glucose does not close the '
      + 'question of what is wrong.\n\n'
      + 'Two measurement facts shape the response. Bedside devices are least accurate at the low '
      + 'values that matter, so a laboratory confirmation is sent while treatment proceeds rather '
      + 'than before it. And the babies at risk — those of mothers with diabetes, the small, the '
      + 'large, the preterm and the stressed — are screened on a schedule rather than when someone '
      + 'notices something, because the first sign in a newborn is often subtle.\n\n'
      + 'The hypoglycemia lab holds a confirmed low value with signs, and the open causes behind '
      + 'it.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'Every newborn dips and recovers; the signs beside the number decide what the number means.',
    },
    showMe: { scenarioId: 'neonatal-hypoglycemia' },
    reflects: 'Adamkin and the AAP Committee on Fetus and Newborn, Postnatal Glucose Homeostasis in Late-Preterm and Term Infants, Pediatrics 2011, which the AAP currently marks as under review.',
    simplifies:
      'Argues that the threshold is operational and gives none, nor any treatment, screening '
      + 'schedule or monitoring interval. Its main source is a report the issuing body has placed '
      + 'under review, and local pathways differ on exactly the numbers this leaves out.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Adamkin DH; Committee on Fetus and Newborn. Postnatal Glucose Homeostasis in Late-Preterm and Term Infants. Pediatrics. 2011;127(3):575-579. AAP currently marks this report under review.',
      ],
    },
  },
  {
    id: 'newborn-sepsis-is-a-change-in-behaviour',
    maturity: 'preview',
    title: 'Newborn sepsis shows up as a change in behaviour',
    body:
      'A septic newborn frequently has no fever. What they have is a change: feeding less well, '
      + 'less interested, floppier, quieter, breathing a little faster, mottled, or simply "not '
      + 'right" according to whoever has been handling them. Temperature instability in either '
      + 'direction counts, and low is as concerning as high.\n\n'
      + 'The reason the threshold for acting is low is speed. Early-onset sepsis can go from that '
      + 'subtle change to collapse within hours, and the margin for watching is correspondingly '
      + 'small.\n\n'
      + 'The laboratory cannot settle it. No blood count, inflammatory marker, or risk score '
      + 'diagnoses or excludes early-onset sepsis, and a risk calculator built to structure '
      + 'assessment cannot overrule a baby who looks ill. Culture takes time; the decision does '
      + 'not wait for it.\n\n'
      + 'So the perinatal history is read as risk rather than as background: maternal fever, '
      + 'prolonged rupture of membranes, group B streptococcal status and what antibiotics the '
      + 'mother received all change the prior probability before the baby is examined.\n\n'
      + 'And treatment started on suspicion is reviewed on the trajectory: the question after a '
      + 'day is what the cultures and the baby now say, not whether the initial decision was '
      + 'right.\n\n'
      + 'The sepsis lab holds that subtle deterioration after a normal transition.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'No fever, no decisive test: the change in feeding, tone and behaviour is the finding.',
    },
    showMe: { scenarioId: 'neonatal-sepsis' },
    reflects: 'Puopolo et al. and the AAP Committees on Fetus and Newborn and Infectious Diseases, Management of Neonates Born at 35 0/7 Weeks Gestation With Suspected or Proven Early-Onset Bacterial Sepsis, Pediatrics 2018.',
    simplifies:
      'Describes the presentation and names no antimicrobial, dose, duration or investigation '
      + 'set. It covers the late-preterm and term baby; the more preterm are a different '
      + 'population with different risks and pathways.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Puopolo KM, Benitz WE, Zaoutis TE; AAP Committees on Fetus and Newborn and Infectious Diseases. Management of Neonates Born at 35 0/7 Weeks Gestation With Suspected or Proven Early-Onset Bacterial Sepsis. Pediatrics. 2018;142(6):e20182894.',
      ],
    },
  },
  {
    id: 'a-handoff-carries-the-negatives-too',
    maturity: 'preview',
    title: 'A newborn handoff has to carry the negatives too',
    body:
      'What makes a delivery-room handoff hard is not the list of what happened. It is that the '
      + 'things which did not happen matter just as much, and nobody thinks to say them.\n\n'
      + 'No access obtained. No adrenaline. No alternative airway. A glucose sent and still '
      + 'pending. A cord gas not back. Each of those is a fact the receiving team needs, and each '
      + 'of them is an absence, so each is easy to leave out of a narrative about what was done.\n\n'
      + 'The other half is the clock. When the baby was born, when ventilation started, when the '
      + 'heart rate responded, and when breathing became spontaneous are the timings that let '
      + 'someone who was not in the room judge the trajectory. A summary that says the baby '
      + 'responded, without when, cannot be reasoned from.\n\n'
      + 'Which is why these handoffs are structured rather than narrated, why the receiver reads '
      + 'back what they heard, and why ownership is stated explicitly: who holds the baby’s care '
      + 'now, and from what moment. Continuity gaps are created by assumption, not by refusal.\n\n'
      + 'There is also a parent, usually separated from the baby, with their own thread of '
      + 'information to keep intact.\n\n'
      + 'The handoff lab runs that transfer, with pending results and absent interventions in it.',
    diagram: {
      kind: 'capnogram-phases',
      caption: 'What was not done and what is still pending are facts; a narrative of actions drops both.',
    },
    showMe: { scenarioId: 'delivery-room-to-nicu-handoff' },
    reflects: 'Part 5: Neonatal Resuscitation: 2025 AHA/AAP Guidelines for CPR and ECC, Pediatrics 2026, on the post-resuscitation transfer of care.',
    simplifies:
      'Says what a handoff has to carry and prescribes no format, no mnemonic and no checklist, '
      + 'and nothing about the care that follows the transfer. Units differ on structure, and the '
      + 'structure matters less than whether the negatives and the timings survive it.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'American Heart Association and American Academy of Pediatrics. Part 5: Neonatal Resuscitation: 2025 Guidelines for Cardiopulmonary Resuscitation and Emergency Cardiovascular Care. Pediatrics. 2026;157(1):e2025074352.',
      ],
    },
  },
];
