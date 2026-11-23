/**
 * Medical-surgical nursing concept explainers
 * (knowledge-layer → the minimum knowledge set).
 *
 * Six concepts, each the reasoning behind a recurring mistake in this module's
 * labs, under 250 words with a caption, a source, a stated simplification, and
 * the lesson that demonstrates it.
 *
 * This module's lessons are about observations that were never made, thresholds
 * asked to exclude, and scores compared against the wrong range. These keep
 * that voice. Every one explains; none prescribes an action or a dose.
 */

import { UNSIGNED_REVIEW, type Explainer } from '@platform/knowledge/explainer';

export const MEDICAL_SURGICAL_NURSING_EXPLAINERS: readonly Explainer[] = [
  {
    id: 'a-counted-rate-has-to-be-counted',
    maturity: 'preview',
    title: 'A respiratory rate has to be counted to mean anything',
    body:
      'Respiratory rate is the observation that moves earliest when a patient deteriorates, and '
      + 'it is the one most often recorded without being measured. A plausible number — sixteen, '
      + 'eighteen — gets written because it is the number that was there last time, and the chart '
      + 'then looks complete.\n\n'
      + 'The reason this matters more than the other observations is what the rate is doing in the '
      + 'score. It is weighted because it changes first: a patient compensating for a metabolic '
      + 'problem, early sepsis, a pulmonary embolism or an opioid effect moves their rate before '
      + 'their pulse or pressure. An uncounted rate removes the earliest signal and replaces it '
      + 'with reassurance.\n\n'
      + 'It also fails quietly. A copied pulse or pressure is implausible soon enough — the '
      + 'machine disagrees — while a copied rate agrees with everything, because nothing else '
      + 'measures it.\n\n'
      + 'Counting takes a full period of watching the chest with a hand or a watch, and the '
      + 'depth, the effort and the pattern are part of the same observation: shallow or laboured '
      + 'breathing at a normal rate is not a normal observation.\n\n'
      + 'The practical consequence is that a rate is either counted or absent, and recording it as '
      + 'absent is more honest than recording a number nobody counted.\n\n'
      + 'The counted-rate lab holds a chart whose most important figure was never measured.',
    diagram: {
      kind: 'apnea-curve',
      caption: 'The earliest-moving observation is the one most easily copied, and nothing else disagrees with it.',
    },
    showMe: { scenarioId: 'counted-rate-a-number-nobody-counted' },
    reflects: 'Cretikos et al., Respiratory rate: the neglected vital sign, Medical Journal of Australia 2008, and Palmer et al., How registered nurses measure and record respiratory rate: an integrative review, Journal of Clinical Nursing 2023, which documents charted rates over-representing 16, 18 and 20.',
    simplifies:
      'Makes one point about one observation and gives no counting method, duration, normal range '
      + 'or escalation threshold. It also does not cover the patients whose rate is misleading: '
      + 'the sedated, the neurologically injured, and anyone whose breathing is being supported.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Cretikos MA, Bellomo R, Hillman K, et al. Respiratory rate: the neglected vital sign. Med J Aust. 2008;188(11):657-659.',
        'Palmer J, et al. How registered nurses measure and record respiratory rate: an integrative review. J Clin Nurs. 2023.',
      ],
    },
  },
  {
    id: 'a-low-score-does-not-exclude',
    maturity: 'preview',
    title: 'A low score does not exclude what it was not built to exclude',
    body:
      'Screening scores are built to raise a hand. They are tuned to catch patients who need a '
      + 'closer look, which means a high value is informative and a low value is weak — the '
      + 'patients who deteriorate without ever scoring are a known population rather than a '
      + 'surprise.\n\n'
      + 'Sepsis is the clearest case. Current guidance recommends against using one particular '
      + 'score on its own as a screening tool for sepsis, and all of the commonly used ones share '
      + 'the same limitation: a patient can be septic with a reassuring total, particularly early, '
      + 'particularly if they are old, immunosuppressed, or on medicines that blunt the signs the '
      + 'score counts.\n\n'
      + 'So the reasoning that matters is what the score is added to. Concern from the person at '
      + 'the bedside, a change from how the patient was earlier, a family member saying this is '
      + 'not them — none of those appear in the total, and none of them are cancelled by it.\n\n'
      + 'That gives a usable rule: a low score in a patient someone is worried about is a low '
      + 'score, not an answer. The escalation that the worry justified before the score is '
      + 'calculated is still justified afterwards.\n\n'
      + 'The low-score lab holds that: a total that does not reach the threshold, and a patient '
      + 'who has changed.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'A screening score raises a hand; a low total is weak, and it does not cancel the concern beside it.',
    },
    showMe: { scenarioId: 'low-score-what-the-threshold-does-not-exclude' },
    reflects: 'Evans et al., Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021, which recommends against a single score as a screening tool for sepsis.',
    simplifies:
      'Makes one point about screening and names no score, threshold or escalation pathway. Which '
      + 'tool a service uses, and what its local triggers are, decide the actual behaviour and are '
      + 'not here.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Evans L, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021. Recommendation against a single score as a sepsis screening tool.',
      ],
    },
  },
  {
    id: 'the-afferent-limb-is-where-the-system-fails',
    maturity: 'preview',
    title: 'The call, not the chart, is where escalation systems fail',
    body:
      'An escalation system has two halves. One recognises that a patient has crossed a threshold. '
      + 'The other brings someone with more authority to the bedside. The second half is the one '
      + 'that fails.\n\n'
      + 'Thresholds are met, written down, and not called. The reasons are human rather than '
      + 'technical: the patient looks alright, the figure is nearly normal, the round is in an '
      + 'hour, the person to call was short last time, it will be rechecked at the next set of '
      + 'observations, someone senior has already seen them. Each is reasonable on its own and '
      + 'each produces the same outcome, which is a documented trigger and no response.\n\n'
      + 'That is why these systems specify who is called, within what time, and what is said — and '
      + 'why they treat the call as mandatory on the trigger rather than as a judgement about '
      + 'whether the trigger was meaningful. The judgement happens after the call, with the person '
      + 'the call brought.\n\n'
      + 'It is also why a system includes a route that does not depend on the score at all: '
      + 'concern alone is a valid reason to escalate, and a patient who worries you below the '
      + 'threshold is the case that route exists for.\n\n'
      + 'The afferent-limb lab holds that gap, with the threshold met and recorded.',
    diagram: {
      kind: 'compression-fraction',
      caption: 'Recognition works and the call does not: a documented trigger with no response at the bedside.',
    },
    showMe: { scenarioId: 'afferent-limb-a-threshold-met-and-a-call-not-made' },
    reflects: 'Difonzo, Performance of the Afferent Limb of Rapid Response Systems in Managing Deteriorating Patients: A Systematic Review, Critical Care Research and Practice 2019, and Johnston et al., A systematic review to identify the factors that affect failure to rescue and escalation of care in surgery, Surgery 2015.',
    simplifies:
      'Names where the failure sits and gives no trigger, timescale, or local pathway. It also '
      + 'leaves out the other half of the problem, which is what happens when the call is made and '
      + 'the response does not arrive.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Difonzo M. Performance of the Afferent Limb of Rapid Response Systems in Managing Deteriorating Patients: A Systematic Review. Crit Care Res Pract. 2019;2019:6902420.',
        'Johnston MJ, Arora S, King D, et al. A systematic review to identify the factors that affect failure to rescue and escalation of care in surgery. Surgery. 2015;157(4):752-763.',
      ],
    },
  },
  {
    id: 'a-behavioural-score-is-not-an-intensity-score',
    maturity: 'preview',
    title: 'A behavioural pain score is not an intensity score',
    body:
      'When a patient cannot report their own pain, observation tools exist to help. What they '
      + 'produce is a number describing observed behaviour, and that number is not interchangeable '
      + 'with the self-reported intensity it resembles. There is no standard to calibrate it '
      + 'against, because the standard was the patient’s own report and that is what is '
      + 'missing.\n\n'
      + 'The published hierarchy of assessment puts the steps in order: attempt self-report '
      + 'anyway, consider whether a cause of pain is present, observe behaviours, obtain a proxy '
      + 'report from someone who knows the patient, and consider time-limited analgesia with '
      + 'reassessment. Physiological signs sit at the bottom of that list — a pulse and a pressure '
      + 'are poor pain measures and move for many other reasons.\n\n'
      + 'What goes wrong when the tool is read as an intensity score is in both directions. A low '
      + 'behavioural score in a patient with an obvious cause of pain is taken as absence of pain, '
      + 'and a quiet, withdrawn patient scores low precisely because they have stopped responding.\n\n'
      + 'So the score is documented as what it is, beside the cause and the proxy report, and the '
      + 'response to treatment becomes part of the assessment rather than a separate question.\n\n'
      + 'The proxy-scale lab holds that: a number with no standard behind it.',
    diagram: {
      kind: 'perfusion-versus-pressure',
      caption: 'Self-report, cause, observed behaviour, proxy report, then time-limited analgesia: physiological signs sit last.',
    },
    showMe: { scenarioId: 'proxy-scale-a-number-without-a-standard' },
    reflects: 'Herr et al., Pain assessment in the nonverbal patient: position statement with clinical practice recommendations, American Society for Pain Management Nursing, Pain Management Nursing 2006.',
    simplifies:
      'Describes the hierarchy and names no tool, score, threshold or analgesic. It also does not '
      + 'cover how to run or read that analgesic step, which is the one that most often decides '
      + 'the question.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Herr K, Coyne PJ, Key T, et al. Pain assessment in the nonverbal patient: position statement with clinical practice recommendations. Pain Manag Nurs. 2006;7(2):44-52.',
      ],
    },
  },
  {
    id: 'the-oxygen-scale-has-to-match-the-patient',
    maturity: 'preview',
    title: 'The scoring scale has to match the target the patient was given',
    body:
      'Patients at risk of carbon dioxide retention are prescribed a lower saturation target than '
      + 'everyone else. Early-warning charts carry a second scoring scale for exactly those '
      + 'patients, because on the ordinary scale a saturation inside their prescribed range scores '
      + 'points for being abnormal.\n\n'
      + 'When the wrong scale is in use, the chart manufactures a deviation. The patient is where '
      + 'they were asked to be, the score says otherwise, and the intuitive correction is to '
      + 'increase the oxygen until the number looks normal — which is the harm the lower target '
      + 'existed to prevent. The guideline that sets that target says this sequence in terms.\n\n'
      + 'The second scale also differs in a way worth knowing: it is the part of the chart that '
      + 'penalises a saturation that is too high, and it applies to the patient whether or not '
      + 'they happen to be breathing oxygen at that moment.\n\n'
      + 'Two limits keep this honest. The lower target is supported, but the same guideline states '
      + 'plainly that it is not known whether that exact range is ideal. And correcting the scale '
      + 'removes a false alarm rather than adding a reassurance: the second scale has not been '
      + 'shown to detect deterioration the first one misses.\n\n'
      + 'The target-scale lab holds that chart, scored against the wrong range.',
    diagram: {
      kind: 'oxygen-delivery',
      caption: 'The ordinary scale scores a prescribed-range saturation as a deviation, and the fix looks like more oxygen.',
    },
    showMe: { scenarioId: 'oxygen-target-scale-a-score-that-should-be-lower' },
    reflects: 'O’Driscoll et al., BTS guideline for oxygen use in adults in healthcare and emergency settings, Thorax 2017 (PMID 28883921), which states both the lower target for patients at risk of hypercapnic respiratory failure and that it is not known whether that range is ideal.',
    simplifies:
      'Explains the mismatch and reproduces no target range, score or threshold, and gives no rule '
      + 'for deciding which patient belongs on which scale. That decision is a prescription, made '
      + 'for the individual patient.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'O’Driscoll BR, Howard LS, Earis J, Mak V. BTS guideline for oxygen use in adults in healthcare and emergency settings. Thorax. 2017;72(Suppl 1):ii1-ii90. PMID 28883921.',
      ],
    },
  },
  {
    id: 'a-contingency-not-said-aloud-is-lost',
    maturity: 'preview',
    title: 'A contingency that is not said aloud is lost at the next handover',
    body:
      'Most of what a handover transfers is state: who the patient is, what is wrong, what has '
      + 'been done. The part that protects the patient overnight is different — it is the '
      + 'contingency. If this happens, do that, and call this person.\n\n'
      + 'Contingencies are the first thing to go. Audio-recorded work on handover found that '
      + 'anticipatory guidance appeared in roughly half a statement per patient, that most '
      + 'sign-outs drew no questions from the receiver at all, and that about a fifth of '
      + 'second-hand handovers had already lost or altered something from the first. The published '
      + 'example is exact: a plan to call the team on a defined trigger became, one handover later, '
      + 'that there was nothing to do tonight.\n\n'
      + 'That is the shape of the failure. The plan does not get contradicted; it gets compressed '
      + 'into reassurance, and the next person inherits the reassurance.\n\n'
      + 'Which is why a contingency is stated as a condition and an action rather than as a '
      + 'reassurance, why it is written where the next person will find it rather than only '
      + 'spoken, and why a read-back exists: a receiver who repeats the trigger has demonstrated '
      + 'that it survived the transfer.\n\n'
      + 'The lost-contingency lab holds that compression, one handover downstream.',
    diagram: {
      kind: 'capnogram-phases',
      caption: 'A trigger-and-action plan compresses into reassurance, and the next receiver inherits the reassurance.',
    },
    showMe: { scenarioId: 'lost-contingency-a-plan-that-was-not-said' },
    reflects: 'Horwitz et al., What are covering doctors told about their patients? Analysis of sign-out among internal medicine house staff, Quality & Safety in Health Care 2009: 88 audiotaped sessions and 503 sign-outs, with the figures quoted here.',
    simplifies:
      'Describes one failure mode and prescribes no handover format, mnemonic or documentation '
      + 'standard. Its source is a single observational study of one group of doctors in one '
      + 'setting, which is a reason to recognise the pattern rather than to quantify it.',
    review: {
      ...UNSIGNED_REVIEW,
      sources: [
        'Horwitz LI, Moin T, Krumholz HM, Wang L, Bradley EH. What are covering doctors told about their patients? Analysis of sign-out among internal medicine house staff. Qual Saf Health Care. 2009;18(4):248-255.',
      ],
    },
  },
];
