/**
 * Emergency medicine concept explainers
 * (knowledge-layer → the minimum knowledge set).
 *
 * Six concepts, one per recurring reasoning error in this module's labs, each
 * under 250 words with a caption, a source, a stated simplification, and the
 * lesson that demonstrates it. Every one is clinical content and carries the
 * unsigned review record until a clinician signs it.
 *
 * Each explainer explains; none instructs a dose. The doses this module teaches
 * live in its lessons, inside the envelope those lessons declare.
 */

import { UNSIGNED_REVIEW, type Explainer } from '@platform/knowledge/explainer';

export const EMERGENCY_MEDICINE_EXPLAINERS: readonly Explainer[] = [
  {
    id: 'shock-is-a-perfusion-problem',
    maturity: 'preview',
    title: 'Shock is a perfusion problem, not a pressure one',
    body:
      'Shock is a state in which tissue is not getting the oxygen it needs. Blood pressure is one '
      + 'of the signals that state produces, and it is the least sensitive one, because the body '
      + 'defends pressure first. Vessels constrict, the heart speeds up, and the number on the '
      + 'monitor holds while the skin cools, the urine stops, the lactate climbs, and the patient '
      + 'stops making sense.\n\n'
      + 'That is why a shock assessment reads several things at once rather than one. Capillary '
      + 'refill, skin temperature and mottling, mental state, urine output and lactate all speak '
      + 'about flow. A mean arterial pressure speaks about the pressure the flow is being driven '
      + 'at. The two can disagree, and when they disagree the perfusion signals are the ones that '
      + 'describe the patient.\n\n'
      + 'The practical consequence is about what a single reassurance is worth. A pressure that '
      + 'comes back up after a fluid challenge tells you the pressure came back up. Whether '
      + 'perfusion followed is a separate question, answered by the same perfusion signals, '
      + 'measured again.\n\n'
      + 'In this module the undifferentiated-shock lab holds a patient whose pressure and '
      + 'perfusion disagree, and asks which one is driving the next decision.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'Pressure holds flat while perfusion signals — refill, mental state, urine, lactate — all deteriorate.',
    },
    showMe: { scenarioId: 'undifferentiated-shock' },
    reflects: 'ESICM guidelines on circulatory shock and hemodynamic monitoring, 2025 (PMID 41236566).',
    simplifies:
      'Treats perfusion as one idea with several signals. It does not rank those signals against '
      + 'each other, give a threshold for any of them, or tell you which shock state a patient is in.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: ['ESICM guidelines on circulatory shock and hemodynamic monitoring 2025, PMID 41236566'],
    },
  },
  {
    id: 'tension-pneumothorax-obstructs-filling',
    maturity: 'preview',
    title: 'A tension pneumothorax starves the heart of filling',
    body:
      'Air that enters the pleural space and cannot leave raises the pressure around the lung and '
      + 'around the great veins. The lung on that side collapses, which is the part most people '
      + 'picture. The part that kills is upstream of the lung: the pressure in the chest now '
      + 'opposes venous return, so less blood reaches the right heart between beats.\n\n'
      + 'Less filling means less output, whatever the heart itself is doing. So the patient '
      + 'presents as shock with a respiratory story attached — hypoxia and a quiet hemithorax '
      + 'alongside tachycardia, a falling pressure, and distended neck veins. Positive-pressure '
      + 'ventilation makes it worse, because every breath delivered adds to the trapped volume.\n\n'
      + 'This is the reason the decision is made at the bedside. The mechanism is mechanical, the '
      + 'obstruction is progressive, and the treatment removes the pressure rather than supporting '
      + 'the circulation around it. Fluid and vasopressors push against an obstruction that is '
      + 'still tightening.\n\n'
      + 'This simulator shows the hemodynamic consequence and its relief. It does not model the '
      + 'procedure, the needle, the drain, or anything about where they go; the obstructive-shock '
      + 'lab is about recognising the pattern early enough for that decision to matter.',
    diagram: {
      kind: 'obstructive-filling',
      caption: 'Rising pleural pressure opposes venous return, so filling falls and output falls with it.',
    },
    showMe: { scenarioId: 'obstructive-shock-tension-pneumothorax' },
    reflects: 'Coccolini et al., Thoracic trauma WSES-AAST guidelines, World Journal of Emergency Surgery 2025 (PMID 41094688).',
    simplifies:
      'Explains why the obstruction causes shock and why relieving it is the treatment. It teaches '
      + 'no technique, no landmark, and no equipment, and it does not help you tell a tension '
      + 'pneumothorax from the other causes of a shocked, hypoxic patient.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: ['Coccolini et al., Thoracic trauma WSES-AAST guidelines, PMID 41094688'],
    },
  },
  {
    id: 'calcium-protects-without-lowering-potassium',
    maturity: 'preview',
    title: 'Calcium protects the heart; it does not lower the potassium',
    body:
      'Hyperkalemia kills through the conduction system. A high extracellular potassium brings the '
      + 'resting membrane potential closer to threshold, which first makes cells irritable and then '
      + 'leaves them unable to depolarise properly at all. On the monitor that progression runs '
      + 'from peaked T waves to a widening QRS, a lost P wave, and finally a sine-wave pattern '
      + 'before arrest.\n\n'
      + 'Three different jobs get confused here, and they are worth keeping separate.\n\n'
      + 'Calcium stabilises the membrane. It raises the threshold back away from the resting '
      + 'potential, so conduction improves within minutes. The potassium is unchanged. Nothing has '
      + 'left the body, and the protection wears off.\n\n'
      + 'Insulin with glucose, and nebulised beta-agonists, move potassium into cells. The '
      + 'measured level falls, which looks like a cure, but the total body load is the same and the '
      + 'level rebounds as the shift reverses.\n\n'
      + 'Only elimination — renal, gastrointestinal, or dialysis — removes potassium. It is the '
      + 'slowest of the three and the only one that resolves the problem.\n\n'
      + 'So the sequence protects, then shifts, then eliminates, and the monitoring continues '
      + 'through all of it because the first two buy time rather than fix anything. The '
      + 'hyperkalemia lab moves through those phases and shows the rebound.',
    diagram: {
      kind: 'membrane-stabilisation',
      caption: 'Protect, shift, eliminate: three separate jobs, on three different clocks, with only one removing potassium.',
    },
    showMe: { scenarioId: 'hyperkalemia-with-ecg-change' },
    reflects: 'UK Kidney Association, Clinical Practice Guideline: Management of Hyperkalaemia in Adults, 2023, and the KDIGO conference summary on acute hyperkalemia in the emergency department, 2020.',
    simplifies:
      'Separates the three jobs and says nothing about how any of them is done: no agent, no '
      + 'quantity, no interval, and no threshold at which a given step becomes appropriate. Local '
      + 'guidance sets all of that, and the choice of elimination route is a renal decision.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'UK Kidney Association, Management of Hyperkalaemia in Adults, 2023',
        'Lindner et al., Acute hyperkalemia in the emergency department: a KDIGO conference summary, 2020',
      ],
    },
  },
  {
    id: 'fluid-then-vasopressor-in-septic-shock',
    maturity: 'preview',
    title: 'In septic shock, fluid and vasopressor are one decision',
    body:
      'Sepsis drops the pressure two ways at once. The vessels dilate, so the same volume fills a '
      + 'bigger container, and the capillaries leak, so some of that volume leaves the circulation '
      + 'altogether. Fluid addresses the second mechanism and partly compensates for the first.\n\n'
      + 'It stops there. Past the point where the heart is filled, more fluid adds oedema without '
      + 'adding output: the lungs get wetter, the gut and kidneys swell, and the pressure stays '
      + 'down because the problem is tone, not volume. A vasoconstrictor addresses tone directly.\n\n'
      + 'That is why these are not sequential phases to be completed in order. Resuscitation starts '
      + 'with crystalloid and frequent reassessment, and a vasopressor is started while fluid '
      + 'continues when the pressure does not come up, rather than after some volume has been '
      + 'exhausted. Waiting for a fixed total before starting one leaves the patient hypotensive '
      + 'for no benefit.\n\n'
      + 'The reassessment is the skill. Each challenge is followed by a look at whether perfusion '
      + 'improved, and that answer decides whether the next step is more volume or more tone.\n\n'
      + 'The septic-shock lab runs that loop, and it declares its own fluid and pressure targets so '
      + 'what you are practising against is visible.',
    diagram: {
      kind: 'oxygen-delivery',
      caption: 'Output rises with filling, then flattens; past the flat part only vascular tone moves the pressure.',
    },
    showMe: { scenarioId: 'septic-shock' },
    reflects: 'Surviving Sepsis Campaign, International Guidelines for Management of Sepsis and Septic Shock, 2026.',
    simplifies:
      'Explains why the two act together and names neither a volume, a rate, a pressure target, nor '
      + 'an agent. It also treats the infection as a given: finding and controlling the source is '
      + 'the other half of septic-shock care and is not in this explanation.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: ['Surviving Sepsis Campaign, International Guidelines for Management of Sepsis and Septic Shock 2026'],
    },
  },
  {
    id: 'compressions-make-the-shock-work',
    maturity: 'preview',
    title: 'Compressions are what make a shock work',
    body:
      'A defibrillator does not restart a heart. It stops the fibrillation, leaving a myocardium '
      + 'that has to generate its own organised beat immediately afterwards. Whether it can depends '
      + 'on what it has been perfused with up to that moment.\n\n'
      + 'Chest compressions are the only thing generating coronary perfusion during an arrest, and '
      + 'the pressure they build takes several compressions to establish and collapses as soon as '
      + 'they stop. Every pause — for a rhythm check, for charging, for an airway attempt, for '
      + 'someone to swap — resets that pressure to nothing and starts the rebuild from zero.\n\n'
      + 'So the proportion of the arrest spent compressing is not a quality metric bolted on '
      + 'afterwards. It is the mechanism by which a shock succeeds. Shortening pauses, charging '
      + 'while compressions continue, and swapping compressors on the rhythm check all exist to '
      + 'protect the same pressure.\n\n'
      + 'The same logic explains why rhythm checks are short and why the next cycle begins '
      + 'immediately after a shock rather than waiting to see what the monitor does.\n\n'
      + 'The persistent-VF lab holds a rhythm that keeps coming back, so the thing being practised '
      + 'is the sequence and its pauses rather than the diagnosis.',
    diagram: {
      kind: 'compression-fraction',
      caption: 'Coronary perfusion pressure builds over several compressions and falls to nothing at every pause.',
    },
    showMe: { scenarioId: 'persistent-vf-arrest' },
    reflects: 'Wigginton et al., Part 9: Adult Advanced Life Support, 2025 American Heart Association Guidelines for CPR and ECC.',
    simplifies:
      'Argues for minimising pauses and says nothing about rate, depth, recoil, energy, device, or '
      + 'how long a resuscitation should continue. It also leaves out the reversible causes, which '
      + 'are what determine whether any of this works.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: ['Wigginton et al., Part 9: Adult Advanced Life Support, 2025 AHA Guidelines for CPR and ECC'],
    },
  },
  {
    id: 'normal-pressure-can-hide-hemorrhage',
    maturity: 'preview',
    title: 'A normal blood pressure can hide a bleeding patient',
    body:
      'A healthy adult can lose a substantial fraction of their blood volume with a blood pressure '
      + 'that still reads normal. Constriction holds the pressure up while the volume falls, so the '
      + 'number stays reassuring until the compensation is spent. When it is spent, the pressure '
      + 'does not drift down; it falls.\n\n'
      + 'What moves earlier is everything about flow and effort. A rising heart rate, a narrowing '
      + 'pulse pressure, cool peripheries with slow refill, an anxious or confused patient, and a '
      + 'rising respiratory rate all appear while the systolic pressure is intact. A lactate that '
      + 'is still climbing on repeat measurement says the same thing.\n\n'
      + 'The young compensate best and therefore hide the most. Older patients, and those whose '
      + 'heart rate is held down by their medication, can lose the tachycardia that would otherwise '
      + 'be the warning.\n\n'
      + 'The practical consequence is that a normal pressure is not a negative finding in someone '
      + 'with a mechanism to bleed. It is one measurement inside a trend, and the trend is what '
      + 'the next decision rests on — including the decision to stop resuscitating and start '
      + 'controlling the bleeding.\n\n'
      + 'The hemorrhagic-shock lab holds concealed ongoing loss, so the pattern arrives before the '
      + 'pressure does.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'Pressure stays flat as volume falls, then drops steeply once compensation is exhausted.',
    },
    showMe: { scenarioId: 'hemorrhagic-shock' },
    reflects: 'Rossaint et al., The European guideline on management of major bleeding and coagulopathy following trauma, sixth edition, Critical Care 2023 (PMID 36859355).',
    simplifies:
      'Describes compensation and its failure. It gives no volume-loss classes, no thresholds, and '
      + 'no transfusion or coagulation management, and it assumes the bleeding source is being '
      + 'looked for in parallel rather than after the numbers change.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: ['Rossaint et al., European guideline on management of major bleeding and coagulopathy following trauma, sixth edition, PMID 36859355'],
    },
  },
];
