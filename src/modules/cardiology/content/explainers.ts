/**
 * Cardiology concept explainers
 * (knowledge-layer → the minimum knowledge set).
 *
 * Six concepts, each the reasoning behind a recurring mistake in this module's
 * labs, under 250 words with a caption, a source, a stated simplification, and
 * the lesson that demonstrates it. Each cites the publications the lesson it
 * points at already declares.
 *
 * Every one explains; none instructs a dose. The drugs this module teaches live
 * in its lessons, inside the envelope those lessons declare.
 */

import { UNSIGNED_REVIEW, type Explainer } from '@platform/knowledge/explainer';

export const CARDIOLOGY_EXPLAINERS: readonly Explainer[] = [
  {
    id: 'electrical-capture-is-not-perfusion',
    maturity: 'preview',
    title: 'Electrical capture is not a pulse',
    body:
      'When a pacemaker fires and the heart depolarises, the monitor shows a spike followed by a '
      + 'wide complex. That is electrical capture, and it is genuinely good news: the stimulus '
      + 'reached the muscle and the muscle responded.\n\n'
      + 'It says nothing about whether the muscle contracted hard enough to move blood. A heart '
      + 'that is ischemic, acidemic, empty, or obstructed can depolarise on every beat and eject '
      + 'almost nothing. The rhythm strip looks like a rescue, and the patient is still in arrest '
      + 'or still unperfused.\n\n'
      + 'Mechanical capture is the separate question, and it is answered away from the monitor: a '
      + 'femoral or carotid pulse timed to the paced complexes, a pressure, an end-tidal carbon '
      + 'dioxide that rises. Muscle contraction from the pacing current can be felt as movement '
      + 'and mistaken for a pulse, which is the trap worth naming in advance.\n\n'
      + 'The reason this matters more than it sounds is what follows it. A paced rhythm accepted '
      + 'as a perfusing one ends the resuscitation that was keeping the patient alive, and the '
      + 'pacing itself then delays nothing else from being looked for.\n\n'
      + 'The pacing lab holds that reassessment open: electrical capture arrives, and the next '
      + 'decision depends on what the pulse says rather than what the strip says.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'A spike and a wide complex prove depolarisation; only a pulse or a pressure proves ejection.',
    },
    showMe: { scenarioId: 'transcutaneous-pacing-mechanical-capture-reassessment' },
    reflects: 'Wigginton et al., Part 9: Adult Advanced Life Support, 2025 American Heart Association Guidelines for CPR and ECC, and Kusumoto et al., 2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay.',
    simplifies:
      'Separates the two captures and says nothing about output, current, placement, sedation, or '
      + 'when pacing is the right answer at all. The causes of the bradycardia, which decide '
      + 'whether pacing is a bridge or the treatment, are outside it.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Wigginton JG, Agarwal S, Bartos JA, et al. Part 9: Adult Advanced Life Support: 2025 American Heart Association Guidelines for CPR and ECC. Circulation. 2025;152(suppl 2):S538-S577.',
        'Kusumoto FM, Schoenfeld MH, Barrett C, et al. 2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay. Circulation. 2019;140:e382-e482.',
      ],
    },
  },
  {
    id: 'wide-and-regular-is-ventricular-until-shown-otherwise',
    maturity: 'preview',
    title: 'Wide and regular is ventricular until shown otherwise',
    body:
      'A fast, wide, regular rhythm can be ventricular tachycardia, or a supraventricular rhythm '
      + 'conducted down a diseased or rate-limited pathway. The two look similar enough on a strip '
      + 'that experienced readers disagree, and the consequences of the two mistakes are not '
      + 'symmetrical.\n\n'
      + 'Treating ventricular tachycardia as though it were supraventricular can be actively '
      + 'harmful: agents chosen to block the atrioventricular node do nothing to a ventricular '
      + 'rhythm and can destabilise the patient who has one. Treating a supraventricular rhythm as '
      + 'ventricular is usually inefficient rather than dangerous. So the default is the dangerous '
      + 'diagnosis, and the burden of proof sits on the reassuring one.\n\n'
      + 'The other thing that decides the next step is not the diagnosis at all. A patient who is '
      + 'unstable with this rhythm is treated as unstable, electrically, whatever the strip is '
      + 'eventually called. The argument about origin belongs to the stable patient, where there '
      + 'is time for a twelve-lead, an old tracing, and someone else to look.\n\n'
      + 'Context carries more weight than morphology: known structural disease or prior infarct '
      + 'moves the odds decisively toward ventricular.\n\n'
      + 'The wide-complex lab makes the stability question come first, before the rhythm argument.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'Two readings, two errors: one is inefficient and the other destabilises the patient who has the rhythm.',
    },
    showMe: { scenarioId: 'wide-complex-tachycardia' },
    reflects: 'Wigginton et al., Part 9: Adult Advanced Life Support, 2025 American Heart Association Guidelines for CPR and ECC, and Al-Khatib et al., 2017 AHA/ACC/HRS Guideline for Management of Patients With Ventricular Arrhythmias and the Prevention of Sudden Cardiac Death.',
    simplifies:
      'States the default and the asymmetry. It teaches none of the morphology criteria used to '
      + 'tell the two apart, names no agent or energy, and does not cover the irregular wide '
      + 'rhythms, which are a different problem with a different answer.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Wigginton JG, Agarwal S, Bartos JA, et al. Part 9: Adult Advanced Life Support: 2025 American Heart Association Guidelines for CPR and ECC. Circulation. 2025;152(suppl 2):S538-S577.',
        'Al-Khatib SM, Stevenson WG, Ackerman MJ, et al. 2017 AHA/ACC/HRS Guideline for Management of Patients With Ventricular Arrhythmias and the Prevention of Sudden Cardiac Death. Circulation. 2018;138:e272-e391.',
      ],
    },
  },
  {
    id: 'fast-af-in-an-ill-patient-is-often-a-symptom',
    maturity: 'preview',
    title: 'Fast atrial fibrillation in an ill patient is often a symptom',
    body:
      'Atrial fibrillation that appears during an acute illness is frequently the circulation '
      + 'responding to something else: sepsis, pain, hypovolaemia, hypoxia, an electrolyte '
      + 'disturbance, a pulmonary embolism, a surgical stress. The fast ventricular rate is doing '
      + 'work in that setting, however unwelcome it looks.\n\n'
      + 'Which changes what rate control costs. Slowing a heart that is fast because its stroke '
      + 'volume is inadequate removes the compensation and drops the output further, and the '
      + 'agents used to slow it depress contractility at the same time. The reflex to treat the '
      + 'number can leave a sicker patient with a tidier monitor.\n\n'
      + 'So the first question is what the rhythm is responding to, and the second is whether the '
      + 'rate itself is causing harm — ischemia, failing perfusion, pulmonary oedema — rather than '
      + 'simply being high. Treating the trigger often slows the rate without anything aimed at '
      + 'the heart at all.\n\n'
      + 'The instability question overrides both: a patient who is unstable because of the rhythm '
      + 'is treated for the rhythm.\n\n'
      + 'The rapid-response lab holds a patient whose rate has a reason, and asks what is being '
      + 'treated before anything is given.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'A rate that is compensating for low stroke volume keeps the output up; slowing it removes the compensation.',
    },
    showMe: { scenarioId: 'atrial-fibrillation-with-rapid-response' },
    reflects: 'Joglar et al., 2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation (PMID 38033089), and Chyou et al., Atrial Fibrillation Occurring During Acute Hospitalization, American Heart Association scientific statement 2023 (PMID 36912134).',
    simplifies:
      'Frames the decision and names no agent, rate target or anticoagulation plan — and '
      + 'anticoagulation, which is where most of the long-term harm and benefit sits, is a whole '
      + 'separate decision this does not touch.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Joglar JA, Chung MK, Armbruster AL, et al. 2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation. Circulation. 2024;149:e1-e156. PMID 38033089.',
        'Chyou JY, Barkoudah E, Dukes JW, et al. Atrial Fibrillation Occurring During Acute Hospitalization: A Scientific Statement From the American Heart Association. Circulation. 2023;147:e676-e698. PMID 36912134.',
      ],
    },
  },
  {
    id: 'the-right-ventricular-infarct-needs-its-preload',
    maturity: 'preview',
    title: 'A right ventricular infarct depends on the preload you are about to remove',
    body:
      'An inferior infarct often involves the right ventricle, and an infarcted right ventricle '
      + 'stops being a pump and becomes something closer to a passive conduit. Blood reaches the '
      + 'left side because the pressure behind it pushes it through, so filling pressure is '
      + 'carrying the circulation.\n\n'
      + 'That is why the usual reflexes for chest pain can be dangerous here. Nitrates and other '
      + 'venodilators work by reducing preload, which is exactly the thing this patient is '
      + 'depending on, and the pressure can fall steeply and immediately. Diuresis does the same '
      + 'thing more slowly.\n\n'
      + 'The recognisable pattern is hypotension with clear lungs in someone with an inferior '
      + 'infarct — a low pressure that is not from fluid overload and does not look like left '
      + 'heart failure. Right-sided chest leads are how the involvement is confirmed, and they are '
      + 'not recorded unless someone thinks to ask for them.\n\n'
      + 'Management runs the other way from the reflex: preserve filling, and keep the rhythm, '
      + 'because the atrial contribution to filling matters more than usual when the ventricle '
      + 'cannot compensate.\n\n'
      + 'The right-ventricular-infarction lab puts that decision in front of a patient whose '
      + 'presentation invites the opposite one.',
    diagram: {
      kind: 'obstructive-filling',
      caption: 'The infarcted right ventricle passes blood on filling pressure; removing preload removes the circulation.',
    },
    showMe: { scenarioId: 'right-ventricular-infarction' },
    reflects: 'Rao et al., 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes (PMID 40014670), and Konstam et al., Evaluation and Management of Right-Sided Heart Failure, American Heart Association scientific statement 2018.',
    simplifies:
      'Explains the dependence and gives no volume, no agent and no limit: a right ventricle can '
      + 'also be over-filled, and nothing here says how to tell when that point has been reached. '
      + 'Reperfusion, which is the treatment, is outside it.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Rao SV, O’Donoghue ML, Ruel M, et al. 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes. Circulation. 2025;151:e771-e862. PMID 40014670.',
        'Konstam MA, Kiernan MS, Bernstein D, et al. Evaluation and Management of Right-Sided Heart Failure: A Scientific Statement From the American Heart Association. Circulation. 2018;137:e578-e622.',
      ],
    },
  },
  {
    id: 'torsades-is-a-repolarisation-problem',
    maturity: 'preview',
    title: 'Torsades is a repolarisation problem wearing a tachycardia costume',
    body:
      'Torsades de pointes is polymorphic ventricular tachycardia arising on a prolonged QT '
      + 'interval. The QT is the time the ventricle spends repolarising, and when it is long there '
      + 'is a window in which a beat landing at the wrong moment starts a rhythm that twists '
      + 'around the baseline.\n\n'
      + 'Treating it as an ordinary ventricular tachycardia misses the point in both directions. '
      + 'The agents that suppress ordinary ventricular rhythms mostly work by prolonging '
      + 'repolarisation further, which is the mechanism that produced this one. And the thing that '
      + 'makes it stop recurring is removing the cause: the medicines that lengthen the interval, '
      + 'the low potassium or magnesium that do the same, and the slow underlying rate that widens '
      + 'the window on every beat.\n\n'
      + 'So the sequence is defibrillate the pulseless patient, correct what is prolonging the '
      + 'interval, replace the electrolytes, and think about raising the underlying rate — because '
      + 'faster repolarisation is shorter repolarisation.\n\n'
      + 'The practical reading skill is noticing the long QT before the arrhythmia, on a tracing '
      + 'taken for something else, in a patient collecting more than one interval-prolonging '
      + 'medicine.\n\n'
      + 'The torsades lab runs that whole arc, from the interval to the rhythm and back.',
    diagram: {
      kind: 'membrane-stabilisation',
      caption: 'A long repolarisation leaves a window in which one mistimed beat starts the twisting rhythm.',
    },
    showMe: { scenarioId: 'torsades-de-pointes' },
    reflects: 'Wigginton et al., Part 9: Adult Advanced Life Support, 2025 American Heart Association Guidelines for CPR and ECC, and Tisdale et al., Drug-Induced Arrhythmias, American Heart Association scientific statement 2020.',
    simplifies:
      'Names the mechanism and the direction of treatment, and gives no interval threshold, no '
      + 'agent, no quantity and no rate. Congenital long QT, and which of a patient’s medicines '
      + 'can safely be stopped, are both outside it.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Wigginton JG, Agarwal S, Bartos JA, et al. Part 9: Adult Advanced Life Support: 2025 American Heart Association Guidelines for CPR and ECC. Circulation. 2025;152(suppl 2):S538-S577.',
        'Tisdale JE, Chung MK, Campbell KB, et al. Drug-Induced Arrhythmias: A Scientific Statement From the American Heart Association. Circulation. 2020;142:e214-e233.',
      ],
    },
  },
  {
    id: 'a-hypertensive-emergency-is-defined-by-the-organ',
    maturity: 'preview',
    title: 'A hypertensive emergency is defined by the organ, not the number',
    body:
      'Severely raised blood pressure with no sign of acute organ injury and severely raised blood '
      + 'pressure with it are different problems that share a number. What separates them is '
      + 'damage happening now: the brain, the eyes, the heart, the kidneys, the aorta, '
      + 'the pregnancy.\n\n'
      + 'The reason the distinction carries the whole decision is autoregulation. Organs used to a '
      + 'chronically high pressure have shifted the range over which they keep their own blood '
      + 'flow constant. Bringing the pressure down quickly to a textbook value can take those '
      + 'organs below the range they have adapted to, and the result is the injury the treatment '
      + 'was meant to prevent — a stroke, in the organ least able to tolerate it.\n\n'
      + 'So where there is acute injury, the pressure is lowered in a controlled, monitored way '
      + 'toward a partial target rather than a normal one, and the specific injury decides how '
      + 'fast and how far. Where there is none, the number is a reason to arrange reliable '
      + 'treatment and follow-up rather than to act within the hour.\n\n'
      + 'The hypertensive-emergency lab makes the assessment the decision point: what is examined '
      + 'and measured before anything is aimed at the pressure.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'An adapted organ holds its flow over a shifted range; a fast drop takes it below the range it adapted to.',
    },
    showMe: { scenarioId: 'hypertensive-emergency' },
    reflects: 'Jones et al., 2025 AHA/ACC multisociety Guideline for the Prevention, Detection, Evaluation and Management of High Blood Pressure in Adults, and Bress et al., The Management of Elevated Blood Pressure in the Acute Care Setting, American Heart Association scientific statement 2024.',
    simplifies:
      'Draws the line and gives no threshold, agent, target or rate of reduction, and the targets '
      + 'differ by injury in ways that matter. Chronic management, which is where most of the '
      + 'benefit of treating blood pressure comes from, is not here at all.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Jones DW, Ferdinand KC, Taler SJ, et al. 2025 AHA/ACC/AANP/AAPA/ABC/ACCP/ACPM/AGS/AMA/ASPC/NMA/PCNA/SGIM Guideline for the Prevention, Detection, Evaluation and Management of High Blood Pressure in Adults. Circulation. 2025.',
        'Bress AP, Anderson TS, Flack JM, et al. The Management of Elevated Blood Pressure in the Acute Care Setting: A Scientific Statement From the American Heart Association. Hypertension. 2024;81:e94-e106.',
      ],
    },
  },
];
