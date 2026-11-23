/**
 * Obstetrics concept explainers
 * (knowledge-layer → the minimum knowledge set).
 *
 * Six concepts, each the reasoning behind a recurring mistake in this module's
 * labs, under 250 words with a caption, a source, a stated simplification, and
 * the lesson that demonstrates it. Each cites the publications the lesson it
 * points at already declares.
 *
 * Every one explains; none instructs a dose, a manoeuvre or a procedure. Those
 * stay in the lessons, which declare what they do and do not assess.
 */

import { UNSIGNED_REVIEW, type Explainer } from '@platform/knowledge/explainer';

export const OBSTETRICS_EXPLAINERS: readonly Explainer[] = [
  {
    id: 'obstetric-blood-loss-is-underestimated',
    maturity: 'preview',
    title: 'Obstetric blood loss is underestimated twice over',
    body:
      'Two things hide a postpartum haemorrhage. The first is the estimate: blood on drapes, '
      + 'swabs and the floor is consistently judged to be less than it is, and the error grows as '
      + 'the volume grows. Weighing what has been collected replaces a guess with a measurement.\n\n'
      + 'The second is the patient. Pregnancy raises circulating volume substantially by term, so '
      + 'a woman can lose a great deal before her pulse and pressure move, and she is usually '
      + 'young and otherwise well, which makes her compensation better still. The observations '
      + 'that reassure are measuring a reserve that is being spent.\n\n'
      + 'When they do move, they move in the order compensation fails: a rising pulse and '
      + 'narrowing pulse pressure, then agitation or air hunger, then a pressure that falls '
      + 'steeply. By then the loss is large.\n\n'
      + 'So the triggers are cumulative volume and trend rather than a single set of observations, '
      + 'and the uterus is examined early because a soft, poorly contracted uterus is the '
      + 'commonest cause and the one with the quickest answer. Retained tissue, trauma to the '
      + 'birth canal, and clotting failure make up the rest of the list, and more than one can be '
      + 'present at once.\n\n'
      + 'The atony lab holds the gap between what the numbers say and what has been lost.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'An expanded volume and a young circulation hold the observations normal while the loss accumulates.',
    },
    showMe: { scenarioId: 'postpartum-hemorrhage-uterine-atony' },
    reflects: 'World Health Organization, FIGO and ICM consolidated guidelines for the prevention, diagnosis and treatment of postpartum haemorrhage, 2025, and ACOG Practice Bulletin No. 183: Postpartum Hemorrhage, reaffirmed 2024.',
    simplifies:
      'Explains the underestimation and names no volume trigger, no drug, no dose and no '
      + 'procedure. It also treats the causes as a list when they overlap, and says nothing about '
      + 'the transfusion and clotting management that a large haemorrhage needs.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'World Health Organization, FIGO, and ICM. Consolidated guidelines for the prevention, diagnosis and treatment of postpartum haemorrhage. 2025.',
        'American College of Obstetricians and Gynecologists. Practice Bulletin No. 183: Postpartum Hemorrhage. 2017; reaffirmed 2024.',
      ],
    },
  },
  {
    id: 'eclampsia-is-not-an-ordinary-seizure',
    maturity: 'preview',
    title: 'An eclamptic seizure is not treated like an ordinary one',
    body:
      'Most eclamptic convulsions are brief and stop on their own. The emergency is not the '
      + 'convulsion; it is what the convulsion says about the pregnancy and what is likely to '
      + 'happen next.\n\n'
      + 'That changes the response in three ways. The agent used to prevent the next seizure is '
      + 'magnesium rather than a standard antiepileptic, and that is specific to this condition. '
      + 'The blood pressure is treated in its own right, because the risk of stroke is a separate '
      + 'threat from the seizure. And the definitive treatment is delivery, so the obstetric '
      + 'decision runs in parallel with the medical one rather than after it.\n\n'
      + 'The immediate care is the same care any seizing patient gets — airway, oxygen, position, '
      + 'protect from injury, do not restrain — with the pregnancy adding left lateral positioning '
      + 'and a second patient to think about.\n\n'
      + 'Two traps remain. Eclampsia can occur without prior diagnosis of hypertension and after '
      + 'birth as well as before it, so a first seizure in a recently pregnant woman belongs here '
      + 'until shown otherwise. And the other causes of seizure do not disappear because she is '
      + 'pregnant: bleeding, infection, low glucose and sodium all stay open.\n\n'
      + 'The first-seizure lab holds that moment, with the convulsion already stopped.',
    diagram: {
      kind: 'membrane-stabilisation',
      caption: 'The convulsion stops itself; the pressure, the prevention and the delivery decision are the emergency.',
    },
    showMe: { scenarioId: 'eclampsia-first-seizure-response' },
    reflects: 'ACOG Practice Bulletin No. 222: Gestational Hypertension and Preeclampsia, reaffirmed 2026, and WHO recommendations for prevention and treatment of pre-eclampsia and eclampsia, 2011.',
    simplifies:
      'Explains why the response differs and gives no dose, regimen, pressure target or timing. '
      + 'Whether and how quickly to deliver is an individualised obstetric judgement this does '
      + 'not make.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'American College of Obstetricians and Gynecologists. Practice Bulletin No. 222: Gestational Hypertension and Preeclampsia. 2020; reaffirmed 2026.',
        'World Health Organization. WHO recommendations for prevention and treatment of pre-eclampsia and eclampsia. 2011.',
      ],
    },
  },
  {
    id: 'pregnancy-changes-the-arrest',
    maturity: 'preview',
    title: 'Pregnancy changes the arrest, and the clock',
    body:
      'A term uterus compresses the great vessels when the woman lies flat, so the blood returning '
      + 'to the heart is reduced before compressions even start. Chest compressions that would '
      + 'generate some circulation in anyone else generate much less here, which is why manual '
      + 'displacement of the uterus to the left is part of the resuscitation rather than an '
      + 'adjunct to it.\n\n'
      + 'That is also why delivery is a resuscitative act. Emptying the uterus removes the '
      + 'obstruction, and the aim is for it to happen early — around the fourth or fifth minute if '
      + 'circulation has not returned — at the place the arrest happened, while resuscitation '
      + 'continues. Moving the patient to an operating theatre costs the minutes the decision was '
      + 'meant to save.\n\n'
      + 'The rest of the resuscitation is the standard one: the same compressions, the same '
      + 'rhythms, the same reversible causes, with the pregnancy-specific ones added. Pregnancy '
      + 'also makes the airway and oxygenation harder and less forgiving.\n\n'
      + 'And there are two patients with one clock, which means the team has to be summoned as one '
      + 'team at the moment of recognition rather than assembled as each need appears.\n\n'
      + 'The maternal arrest lab runs that clock, with the minute-four decision in front of you.',
    diagram: {
      kind: 'obstructive-filling',
      caption: 'The term uterus obstructs venous return, so displacement and early delivery are part of the resuscitation.',
    },
    showMe: { scenarioId: 'maternal-cardiac-arrest-coordinated-response' },
    reflects: 'American Heart Association, 2025 Guidelines for CPR and ECC: Adult and Pediatric Special Circumstances of Resuscitation, maternal cardiac arrest section.',
    simplifies:
      'Names the pregnancy-specific changes and teaches no technique, no drug and no procedure. '
      + 'Gestational age changes whether delivery helps, and the prognosis and family care that '
      + 'surround this are outside it entirely.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'American Heart Association. 2025 Guidelines for CPR and ECC: Adult and Pediatric Special Circumstances of Resuscitation, section 19.3.',
      ],
    },
  },
  {
    id: 'shoulder-dystocia-is-a-rehearsed-sequence',
    maturity: 'preview',
    title: 'Shoulder dystocia is a rehearsed sequence, not an effort',
    body:
      'Shoulder dystocia is a bony problem: the shoulder is caught behind the pelvis, and no '
      + 'amount of pulling moves bone past bone. Harder traction does not deliver the baby; it '
      + 'injures the nerves of the arm, and that injury is the one most often attributed to the '
      + 'dystocia itself.\n\n'
      + 'What does work is changing the geometry. Manoeuvres alter the relationship between the '
      + 'shoulder and the pelvic brim or rotate the baby so the shoulders sit in a wider diameter. '
      + 'They are learned, practised, and performed in an order, and each one takes seconds.\n\n'
      + 'Which is why the response is a sequence rather than an effort. The emergency is '
      + 'recognised and named out loud, help is summoned, someone records the time and what was '
      + 'done, and the manoeuvres proceed in their rehearsed order. The naming matters because the '
      + 'room cannot help with an emergency nobody has declared, and the timing matters because '
      + 'the record afterwards is often the only account.\n\n'
      + 'The physiology sets the urgency: the cord is compressed and the baby is not breathing, so '
      + 'the clock is minutes rather than tens of minutes — enough time to work in order, and not '
      + 'enough to improvise.\n\n'
      + 'The cognitive-sequence lab runs the declaration, the order and the record, with the head '
      + 'already delivered.',
    diagram: {
      kind: 'compression-fraction',
      caption: 'Traction does not move bone past bone; the manoeuvres change the geometry, in a rehearsed order.',
    },
    showMe: { scenarioId: 'shoulder-dystocia-cognitive-sequence' },
    reflects: 'ACOG Practice Bulletin No. 178: Shoulder Dystocia, reaffirmed 2024, and RCOG Green-top Guideline No. 42: Shoulder Dystocia, 2012.',
    simplifies:
      'Explains why the sequence exists and teaches none of it: no manoeuvre, no order, no '
      + 'technique and no timing. It also says nothing about who is at risk, which is poorly '
      + 'predictable, or about the newborn care that follows.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'American College of Obstetricians and Gynecologists. Practice Bulletin No. 178: Shoulder Dystocia. 2017; reaffirmed 2024.',
        'Royal College of Obstetricians and Gynaecologists. Shoulder Dystocia, Green-top Guideline No. 42. 2012.',
      ],
    },
  },
  {
    id: 'cord-prolapse-is-a-perfusion-emergency',
    maturity: 'preview',
    title: 'Cord prolapse is a perfusion emergency with a short clock',
    body:
      'When the umbilical cord comes down ahead of the baby, two things threaten it. The '
      + 'presenting part presses the cord against the pelvis and occludes it, and the cord, '
      + 'exposed and handled, constricts.\n\n'
      + 'The baby’s entire oxygen supply runs through that cord, so this is a perfusion emergency '
      + 'measured in minutes. The fetal heart rate falls, and what happens in the next few minutes '
      + 'determines the outcome.\n\n'
      + 'Everything before delivery is a holding action: taking the pressure off the cord, '
      + 'changing the mother’s position so gravity helps, and handling the cord as little as '
      + 'possible. None of these solve anything — they buy the time in which the birth is '
      + 'organised, and they are not substitutes for organising it.\n\n'
      + 'So the whole management is parallel rather than sequential: relieve the pressure, summon '
      + 'the team, and prepare for urgent birth at the same moment, because the clock started when '
      + 'the cord came down.\n\n'
      + 'The circumstances that produce it are worth knowing in advance: a high or unengaged '
      + 'presenting part, an abnormal lie, a second twin, and anything that ruptures the membranes '
      + 'when the baby is not yet filling the pelvis.\n\n'
      + 'The urgent-birth lab holds the holding action and the coordination, with the fetal heart '
      + 'rate already low.',
    diagram: {
      kind: 'obstructive-filling',
      caption: 'The presenting part occludes the cord; everything before delivery only buys time.',
    },
    showMe: { scenarioId: 'umbilical-cord-prolapse-urgent-birth-coordination' },
    reflects: 'RCOG Green-top Guideline No. 50: Umbilical Cord Prolapse, 2014, reviewed 2024, and the RCOG patient information on umbilical cord prolapse in late pregnancy, 2025.',
    simplifies:
      'Names the mechanism and the urgency and teaches no manoeuvre, position, or birth decision. '
      + 'Which mode of birth is quickest depends on the stage of labour and on what the unit can '
      + 'do, and that judgement is not here.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Royal College of Obstetricians and Gynaecologists. Umbilical Cord Prolapse, Green-top Guideline No. 50. 2014; reviewed 2024.',
        'Royal College of Obstetricians and Gynaecologists. Umbilical cord prolapse in late pregnancy. 2025.',
      ],
    },
  },
  {
    id: 'magnesium-is-monitored-on-the-patient',
    maturity: 'preview',
    title: 'Magnesium is monitored on the patient, not on the level',
    body:
      'Magnesium given to prevent eclamptic seizures works in a range whose top is close to its '
      + 'bottom, and it is cleared almost entirely by the kidneys. So the same infusion that is '
      + 'therapeutic in a woman making urine accumulates in one whose kidney function is falling — '
      + 'which is a feature of the disease being treated.\n\n'
      + 'The toxicity appears in a fairly reliable order, and it is clinical. Deep tendon reflexes '
      + 'go first: they disappear before anything dangerous happens, which makes them the warning '
      + 'the bedside has. Then drowsiness, slurred speech and weakness, then slow and shallow '
      + 'breathing, and finally cardiac effects.\n\n'
      + 'That order is why reflexes, respiratory rate, conscious level and urine output are checked '
      + 'on a schedule, and why those checks are not replaced by a concentration. A level takes '
      + 'time, describes a past moment, and overlaps between women; absent reflexes in a drowsy '
      + 'patient needs no laboratory to act on.\n\n'
      + 'The first action is stopping and isolating the infusion, and the antidote is calcium, '
      + 'prepared in advance wherever magnesium is running rather than found when it is needed.\n\n'
      + 'The toxicity lab holds that recognition, with the infusion already stopped and the '
      + 'patient still drowsy.',
    diagram: {
      kind: 'membrane-stabilisation',
      caption: 'Reflexes go first, then consciousness and breathing: the order is the warning, and it is clinical.',
    },
    showMe: { scenarioId: 'magnesium-sulfate-toxicity-recognition' },
    reflects: 'ACOG Practice Bulletin No. 222: Gestational Hypertension and Preeclampsia, reaffirmed 2026, and WHO recommendations for prevention and treatment of pre-eclampsia and eclampsia, 2011.',
    simplifies:
      'Describes the order of toxicity and gives no regimen, no concentration range, no '
      + 'monitoring interval and no antidote dose. Local protocols set all of it, and the order '
      + 'of signs is a generalisation rather than a guarantee.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'American College of Obstetricians and Gynecologists. Practice Bulletin No. 222: Gestational Hypertension and Preeclampsia. 2020; reaffirmed 2026.',
        'World Health Organization. WHO recommendations for prevention and treatment of pre-eclampsia and eclampsia. 2011.',
      ],
    },
  },
];
