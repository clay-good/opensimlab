/**
 * Respiratory medicine concept explainers
 * (knowledge-layer → the minimum knowledge set).
 *
 * Six concepts, each the reasoning behind a recurring mistake in this module's
 * labs, under 250 words with a caption, a source, a stated simplification, and
 * the lesson that demonstrates it. Each cites the publications the lesson it
 * points at already declares.
 *
 * Every one explains; none instructs a setting or a dose. The numbers this
 * module teaches live in its lessons, inside the envelope those lessons declare.
 */

import { UNSIGNED_REVIEW, type Explainer } from '@platform/knowledge/explainer';

export const RESPIRATORY_MEDICINE_EXPLAINERS: readonly Explainer[] = [
  {
    id: 'oxygen-is-prescribed-to-a-range',
    maturity: 'preview',
    title: 'Oxygen is prescribed to a range, with two edges',
    body:
      'Oxygen is treatment for low oxygen, not treatment for breathlessness, and it has a dose '
      + 'with a top as well as a bottom. Too little is obvious. Too much is not, which is why it '
      + 'persists: a saturation sitting at the top of the scale looks safe on every round.\n\n'
      + 'Two harms sit at that end. In people who retain carbon dioxide, generous oxygen worsens '
      + 'the retention — partly by releasing the constriction that was diverting blood away from '
      + 'poorly ventilated lung, so more blood flows past lung that is not clearing carbon '
      + 'dioxide. And in anyone, a saturation held near the top hides deterioration, because the '
      + 'relationship between saturation and oxygen tension flattens there: the lung can get a lot '
      + 'worse before the number moves at all.\n\n'
      + 'So oxygen is written as a target range for that patient, delivered by a named device, '
      + 'and adjusted toward the range from either direction. The patient at risk of retention '
      + 'gets a lower range, not no oxygen, because hypoxia is still the thing that kills '
      + 'first.\n\n'
      + 'The equipment half matters as much: the range only means something if what is set is what '
      + 'is being delivered. The oxygen-device lab breaks that link and leaves the number to '
      + 'explain it.',
    diagram: {
      kind: 'oxygen-delivery',
      caption: 'The saturation curve flattens near the top, so a reassuring number can hide a falling oxygen tension.',
    },
    showMe: { scenarioId: 'oxygen-device-failure' },
    reflects: 'O’Driscoll et al., BTS guideline for oxygen use in adults in healthcare and emergency settings, BMJ Open Respiratory Research 2017 (PMID 28883921), and the NHS England patient safety alert on oxygen cylinders, 2023.',
    simplifies:
      'Gives the shape of the decision and no target range, device or flow for any patient or '
      + 'condition. The local prescription chart sets those, and the retention risk is a property '
      + 'of the patient rather than of a diagnosis label.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'O’Driscoll BR, Howard LS, Earis J, Mak V. BTS guideline for oxygen use in adults in healthcare and emergency settings. BMJ Open Respir Res. 2017;4:e000170. PMID 28883921.',
        'NHS England. Use of oxygen cylinders where patients do not have access to medical gas pipeline systems. National Patient Safety Alert NatPSA/2023/001/NHSPS. 2023.',
      ],
    },
  },
  {
    id: 'noninvasive-support-needs-a-stopping-rule',
    maturity: 'preview',
    title: 'Noninvasive support needs a deadline and a stopping rule',
    body:
      'Noninvasive ventilation works well for the failures it suits — the carbon dioxide retention '
      + 'of an exacerbation, the flooded lung of cardiogenic pulmonary oedema — because it unloads '
      + 'the breathing muscles and recruits lung without a tube.\n\n'
      + 'It also delays intubation for the patient it does not suit, and that delay is the harm. A '
      + 'patient breathing hard on a mask looks supported. The signs that it is not working — '
      + 'tiring, a rising carbon dioxide, a falling consciousness, a volume the machine is '
      + 'delivering that the patient keeps exceeding — develop while everyone is reassured by the '
      + 'equipment.\n\n'
      + 'Which is why it is started with two things attached: a time at which it will be '
      + 'reassessed, and a statement of what would mean stopping. Deciding in advance what failure '
      + 'looks like is what stops it being recognised an hour late, and a trajectory reassessed '
      + 'soon after starting is more informative than any single reading.\n\n'
      + 'The selection half is the other part: who it is for, who it is not for, and who is on it '
      + 'because intubation is not what they want, which is a different decision with a different '
      + 'endpoint.\n\n'
      + 'The selection lab puts a patient in front of you whose numbers improve while the work of '
      + 'breathing does not.',
    diagram: {
      kind: 'compensation-curve',
      caption: 'The mask holds the numbers up while the patient tires; the deadline is what makes the tiring visible.',
    },
    showMe: { scenarioId: 'noninvasive-ventilation-selection' },
    reflects: 'Goel et al., Noninvasive Respiratory Support for Adult Patients with Acute Respiratory Failure, an Official American Thoracic Society Clinical Practice Guideline 2026 (PMID 42371750), and Rochwerg et al., ERS/ATS clinical practice guidelines: noninvasive ventilation for acute respiratory failure, 2017 (PMID 28860265).',
    simplifies:
      'Argues for a deadline and names no interval, no setting and no threshold for any of the '
      + 'failure signs. Which patients benefit differs by cause of failure in ways this does not '
      + 'cover, and the interface and sedation problems that make it fail in practice are not '
      + 'here.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Goel NN, Ferreyro BL, Pitre T, et al. Noninvasive Respiratory Support for Adult Patients with Acute Respiratory Failure: An Official American Thoracic Society Clinical Practice Guideline. Am J Respir Crit Care Med. 2026. PMID 42371750.',
        'Rochwerg B, Brochard L, Elliott MW, et al. Official ERS/ATS clinical practice guidelines: noninvasive ventilation for acute respiratory failure. Eur Respir J. 2017;50:1602426. PMID 28860265.',
      ],
    },
  },
  {
    id: 'high-flow-does-more-than-supply-oxygen',
    maturity: 'preview',
    title: 'High-flow oxygen does more than supply oxygen',
    body:
      'A conventional mask delivers less oxygen than its label suggests to a breathless patient, '
      + 'because a patient pulling a high inspiratory flow entrains room air around whatever the '
      + 'device is giving. Matching the flow to the patient’s own is the first thing a high-flow '
      + 'system does: the delivered fraction is closer to the set one.\n\n'
      + 'Three other effects come with it. The constant flow washes exhaled gas out of the nose '
      + 'and throat, so the next breath starts from a reservoir containing less carbon dioxide — '
      + 'dead space the patient no longer has to re-breathe. The flow generates a small positive '
      + 'pressure in the airway, which helps hold lung open, though it is modest and lost when the '
      + 'mouth opens. And the gas is warmed and humidified, which is what makes high flows '
      + 'tolerable for hours and protects mucus clearance.\n\n'
      + 'Those are also the reasons it can mask deterioration: a comfortable patient at a high '
      + 'flow is still a patient in respiratory failure, and the same reassessment rules that '
      + 'apply to a mask apply here.\n\n'
      + 'The escalation lab tracks that: what improves, what the improvement proves, and what has '
      + 'to be rechecked anyway.',
    diagram: {
      kind: 'oxygen-delivery',
      caption: 'Matched flow, washed-out dead space, a small airway pressure, and gas warm enough to tolerate.',
    },
    showMe: { scenarioId: 'high-flow-nasal-oxygen-escalation' },
    reflects: 'Oczkowski et al., ERS clinical practice guidelines: high-flow nasal cannula in acute respiratory failure, 2022 (PMID 34649974), and Goel et al., Noninvasive Respiratory Support for Adult Patients with Acute Respiratory Failure, ATS 2026 (PMID 42371750).',
    simplifies:
      'Explains the mechanisms and gives no flow, no oxygen fraction and no escalation threshold. '
      + 'How much airway pressure any particular patient gets is not predictable at the bedside, '
      + 'and it is not a substitute for ventilation when the problem is carbon dioxide.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Oczkowski S, Ergan B, Bos L, et al. ERS clinical practice guidelines: high-flow nasal cannula in acute respiratory failure. Eur Respir J. 2022;59:2101574. PMID 34649974.',
        'Goel NN, Ferreyro BL, Pitre T, et al. Noninvasive Respiratory Support for Adult Patients with Acute Respiratory Failure: An Official American Thoracic Society Clinical Practice Guideline. Am J Respir Crit Care Med. 2026. PMID 42371750.',
      ],
    },
  },
  {
    id: 'a-quiet-chest-in-asthma-is-worse',
    maturity: 'preview',
    title: 'A quiet chest in asthma is worse, not better',
    body:
      'Wheeze is the sound of gas moving fast through narrowed airways. It needs two things: the '
      + 'narrowing, and enough flow to make a noise in it. When a severe attack worsens far '
      + 'enough, the second one fails.\n\n'
      + 'So the chest goes quiet, and the quiet is the most ominous finding in the room. The same '
      + 'reversal applies across the examination: a patient who stops being agitated, stops '
      + 'speaking in short phrases, or settles after an hour of struggling may be improving or may '
      + 'be exhausted, and exhaustion arrives shortly before respiratory arrest.\n\n'
      + 'The numbers reverse too. Carbon dioxide is low in an attack that is being compensated '
      + 'for, because the patient is breathing hard. A normal carbon dioxide in a patient who is '
      + 'still visibly working is therefore not reassurance; it is the compensation failing. A '
      + 'rising one is late.\n\n'
      + 'What stays honest is effort, consciousness and trajectory: how hard the patient is '
      + 'working, how awake they are, and which way both are moving over minutes.\n\n'
      + 'The severe-asthma lab holds a patient whose findings soften while the obstruction has not '
      + 'moved, so the reassuring sign and the dangerous one arrive together.',
    diagram: {
      kind: 'apnea-curve',
      caption: 'Wheeze needs flow; as the attack worsens the flow fails and the sound disappears with it.',
    },
    showMe: { scenarioId: 'acute-severe-asthma' },
    reflects: 'Global Initiative for Asthma, Global Strategy for Asthma Management and Prevention, 2026 update, sections on assessing and managing acute exacerbations.',
    simplifies:
      'Names the reversals and gives no treatment, no threshold and no disposition rule. Severity '
      + 'assessment uses measurements this does not describe, and the same quiet chest has other '
      + 'causes in other patients.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Global Initiative for Asthma. Global Strategy for Asthma Management and Prevention, 2026 update. Boxes 9-4 and 9-6; pp. 180-188.',
      ],
    },
  },
  {
    id: 'a-tracheostomy-patient-has-two-airways',
    maturity: 'preview',
    title: 'A tracheostomy patient may have two airways, or one',
    body:
      'An emergency at a tracheostomy starts with a question that changes everything after it: is '
      + 'the mouth and throat still connected to the trachea, or has the upper airway been removed '
      + 'or closed off?\n\n'
      + 'If it is patent, there are two routes to the lungs. Oxygen can be applied to the face and '
      + 'to the stoma at once, and if the tube is blocked or displaced, the patient can be '
      + 'oxygenated from above while the tube is dealt with. If the upper airway is not patent — a '
      + 'laryngectomy — then the stoma is the only airway there is, and anything applied to the '
      + 'face is wasted effort at the moment it is least affordable.\n\n'
      + 'That is why the answer belongs at the bedside before the emergency: on the bed head, on '
      + 'the notes, in a form that does not depend on finding the person who knows.\n\n'
      + 'The rest of the sequence follows from it. A tube that may be blocked is assessed by '
      + 'whether gas moves through it, not by how it looks, and exhaled carbon dioxide is the '
      + 'measurement that answers that. Removing an inner cannula and passing a suction catheter '
      + 'are checks, in order, of the two commonest causes.\n\n'
      + 'The tracheostomy lab runs the patent-upper-airway version of that algorithm.',
    diagram: {
      kind: 'capnogram-phases',
      caption: 'Two routes to the lungs, or one: what is applied to the face is wasted when the stoma is the only airway.',
    },
    showMe: { scenarioId: 'acute-tracheostomy-obstruction' },
    reflects: 'National Tracheostomy Safety Project, Emergency tracheostomy management: patent upper airway (green algorithm), and McGrath et al., Multidisciplinary guidelines for the management of tracheostomy and laryngectomy airway emergencies, Anaesthesia 2012 (PMID 22731935).',
    simplifies:
      'Explains why the question comes first and teaches no technique: no suctioning, no tube '
      + 'exchange, no rescue airway, and nothing about the laryngectomy algorithm, which differs '
      + 'at almost every step.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'National Tracheostomy Safety Project. Emergency tracheostomy management: patent upper airway (GREEN algorithm). Review date 2024-01-01.',
        'McGrath BA, Bates L, Atkinson D, Moore JA. Multidisciplinary guidelines for the management of tracheostomy and laryngectomy airway emergencies. Anaesthesia. 2012;67:1025-1041. PMID 22731935.',
      ],
    },
  },
  {
    id: 'neuromuscular-failure-is-a-pump-failure',
    maturity: 'preview',
    title: 'In neuromuscular weakness the lungs are fine; the pump is failing',
    body:
      'When the muscles that move air weaken, the lung tissue itself can be entirely normal. Gas '
      + 'exchange across the membrane works. What is failing is the bellows, and the signs of '
      + 'bellows failure are not the signs of lung disease.\n\n'
      + 'Saturation, in particular, is a poor sentinel. It stays normal while the breaths get '
      + 'smaller, because the oxygen in each remaining breath is still crossing normally. It falls '
      + 'late, often at the point of collapse, and often only once secretions and collapsed lung '
      + 'have been added on top. By then the carbon dioxide has been rising for a while.\n\n'
      + 'What tracks the pump instead is the pump: a vital capacity that falls over hours, an '
      + 'inability to count far in one breath, a weak cough, orthopnoea, and a patient who sleeps '
      + 'badly and wakes with a headache. Serial measurements matter more than any single value, '
      + 'because the trajectory is the warning.\n\n'
      + 'Bulbar weakness is the parallel problem. A patient who cannot protect the airway or clear '
      + 'secretions can fail from aspiration and plugging while the breathing muscles still have '
      + 'something left.\n\n'
      + 'The neuromuscular lab runs that reassessment, where the saturation keeps saying nothing '
      + 'is wrong.',
    diagram: {
      kind: 'apnea-curve',
      caption: 'Normal lungs, failing bellows: saturation holds while vital capacity falls, then drops late.',
    },
    showMe: { scenarioId: 'neuromuscular-respiratory-failure-reassessment' },
    reflects: 'Khan et al., Respiratory Management of Patients With Neuromuscular Weakness: An American College of Chest Physicians Clinical Practice Guideline and Expert Panel Report, Chest 2023, and NICE guideline NG42 on motor neurone disease.',
    simplifies:
      'Says which signals track the pump and gives no threshold for any of them, no intubation '
      + 'criterion, and nothing about the airway-clearance and ventilation options that make up '
      + 'the long-term management. The thresholds in common use are population rules applied to '
      + 'individuals.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Khan A, Frazer-Green L, Amin R, et al. Respiratory Management of Patients With Neuromuscular Weakness: An American College of Chest Physicians Clinical Practice Guideline and Expert Panel Report. Chest. 2023;164:394-413.',
        'National Institute for Health and Care Excellence. Motor neurone disease: assessment and management. NICE guideline NG42. Updated 2019.',
      ],
    },
  },
];
