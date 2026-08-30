/** A harm whose whole presentation is that nothing is abnormal. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const SILENT_INTERACTION_A_HARM_WITH_NOTHING_TO_FIND: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'silent-interaction-a-harm-with-nothing-to-find', version: '0.1.0', maturity: 'preview',
    title: 'A harm with nothing to find', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 8, difficulty: 'intermediate', objectives: [
      { id: 'recognize-oncology-silent-interaction-what-she-swallows', statement: 'Reconcile what she is actually taking, not what was prescribed.', measure: 'The clinic, general practice, and community pharmacy lists were compared against each other rather than any one being trusted, the item bought rather than prescribed was identified, and concluding that nothing is wrong so there is nothing to do was refused.' },
      { id: 'record-oncology-silent-interaction-the-direction-of-harm', statement: 'Record the interaction and the direction its harm runs.', measure: 'That these targeted tablets require an acid stomach to dissolve, that acid suppression therefore reduces absorption, and that the resulting harm is less treatment rather than toxicity so nothing will look abnormal, were all recorded.' },
      { id: 'activate-oncology-silent-interaction-a-route-that-ends-with-a-person', statement: 'Tell the treating team rather than the record.', measure: 'The treating oncology team was called with the lists and the dates of overlap, and writing it in the notes and moving on was refused because the record is where the problem already happened.' },
      { id: 'recognize-oncology-silent-interaction-neither-theory-nor-proof', statement: 'Refuse both dismissal and overstatement of the evidence.', measure: 'Calling the interaction theoretical was refused with the adjusted hazard ratios of 1.58 (95% CI 1.42 to 1.76) and 1.54 (95% CI 1.30 to 1.82) recorded, and the same review kept the finding short of telling her that her treatment had been made ineffective.' },
      { id: 'record-oncology-silent-interaction-bounded-qualified-intent', statement: 'Record bounded qualified-team treatment intent.', measure: 'Whether acid suppression continues, whether an alternative without this interaction replaces it, what happens to the targeted treatment, and what she is told, were recorded as belonging to the treating team and the original prescriber, and telling her to stop the tablets today was refused.' },
      { id: 'review-oncology-silent-interaction-boundaries-and-their-certainty', statement: 'Review the boundaries and what retrospective data can support.', measure: 'That the estimates come from prescribing and registry databases, that their authors write association rather than causation, that people prescribed acid suppressants may differ in ways adjustment does not recover, and that the understood mechanism points the same way, were all kept explicit.' },
      { id: 'handoff-oncology-silent-interaction-an-absence-that-travels', statement: 'Hand off a finding that has no abnormality in it.', measure: 'The handoff preserved all three lists and how they differ, the item bought rather than prescribed, the six weeks of overlap, and that the direction of harm means nothing will look wrong later either, with no diagnosis, treatment effect, or outcome certified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Lee CH, Shen MC, Tsai MJ, Chang JS, Huang YB, Yang YH, Hsieh KP. Proton pump inhibitors reduce the survival of advanced lung cancer patients with therapy of gefitinib or erlotinib. Sci Rep. 2022;12:7002. A retrospective cohort study using the Taiwan Cancer Registry, National Health Insurance and Death Registry databases from 1 January 2010 to 30 December 2018, covering 4,340 gefitinib and 1,635 erlotinib users. Concurrent proton pump inhibitor use was associated with worse overall survival: median 14.35 against 21.87 months with gefitinib, adjusted hazard ratio 1.58 (95% CI 1.42-1.76), and 16.97 against 23.92 months with erlotinib, adjusted hazard ratio 1.54 (95% CI 1.30-1.82). Time to next treatment was used as a surrogate for progression because progression data were unavailable. The authors state association rather than causation.',
        'Raoul JL, Hansten PD. Proton pump inhibitors and cancer treatments: emerging evidence against coadministration. Cancer Treat Rev. 2024;129:102794. Most tyrosine kinase inhibitors depend on gastric acidity for absorption, and retrospective studies indicate that concurrent proton pump inhibitor use reduces the survival benefit of drugs including erlotinib, gefitinib and pazopanib. The authors recommend informing patients and clinicians of these interactions and suggest antacids or H2 blockers as alternatives for those requiring acid suppression.',
      ] },
    limitations: ['silent-interaction-presentation-and-the-records-are-authored',
      'silent-interaction-controls-are-reconciliation-and-escalation-only',
      'silent-interaction-association-is-not-this-patient-s-lost-benefit'],
  },
  patient: {
    ageYears: 66, sex: 'female', heightCm: 161, weightKg: 63, asaClass: 2,
    diagnosis: 'Authored interaction between an oral targeted anticancer tablet and acid suppression, with no abnormal finding',
    procedure: 'medicines reconciliation, interaction recording, escalation to the treating team, evidence-boundary review, and handoff practice',
    comorbidities: ['Lung adenocarcinoma on an oral targeted tablet in the supplied record; reflux treated since six weeks ago'],
    medications: ['All prescribing, substitution, and continuation decisions remain the treating team’s and the original prescriber’s work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the oncology clinic fixture',
    baseline: { heartRateBpm: 74, meanArterialMmHg: 93, strokeVolumeMl: 66,
      hemoglobinGPerDl: 12.6, bloodVolumeMl: 4_300, coreTemperatureC: 36.6,
      arterialStiffness: 1.1, baroreflexGain: 1, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Comfortable at rest and speaking in full sentences in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 460, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'silent-interaction-presentation', type: 'narrative', target: 'silent-interaction', atTick: 0,
      severity: 'warning', message: 'A 66-year-old woman attends the oncology clinic for routine review, six weeks into an oral targeted tablet for lung adenocarcinoma. She feels well and has no new symptoms. Authored observations are heart rate 74/min, blood pressure 124/78 mmHg, respiratory rate 16/min, oxygen saturation 98% in air, and temperature 36.6 C. Every supplied blood result is within its reference range. The clinic list holds her targeted tablet alone. Her general practice list, supplied separately, holds four items including an acid tablet started six weeks ago for reflux. The community pharmacy list has been requested and has not yet arrived.' },
    { id: 'silent-interaction-evidence', type: 'narrative', target: 'silent-interaction-evidence', atTick: 0,
      severity: 'warning', message: 'Most of these targeted tablets need an acid stomach to dissolve, so suppressing the acid means less of the drug is absorbed. The harm therefore runs in the direction of less treatment rather than more toxicity, which is why there is nothing to see: no rash, no derangement, no complaint. In a retrospective cohort of 4,340 and 1,635 patients on two of these tablets, concurrent acid suppression was associated with shorter overall survival, with adjusted hazard ratios of 1.58 (95% CI 1.42 to 1.76) and 1.54 (95% CI 1.30 to 1.82), and the authors write association rather than causation. A review of the same question recommends informing patients and clinicians and notes that alternatives exist for people who need acid suppression. This is more than a theoretical interaction and less than a proven loss for her, and both of those sentences have to survive.' },
    { id: 'silent-interaction-boundary', type: 'narrative', target: 'silent-interaction-boundary', atTick: 0,
      severity: 'warning', message: 'Reconcile what she is actually taking against all the supplied lists rather than any one of them; record the interaction and the direction its harm runs; call the treating oncology team; record bounded qualified-team treatment intent; and review the boundaries and their certainty in both directions. Telling her to stop the acid tablets today, concluding that nothing is wrong so there is nothing to do, dismissing the interaction as theoretical, and writing it in the notes and moving on are all refused. No drug, dose, route, timing separation, substitution, investigation, or procedure is exposed, the learner acquires and interprets no test, and every record and result is supplied. After elapsed simulated time the community pharmacy list arrives and holds an item neither other list did, bought rather than prescribed, because a reconciliation done before it and one done after it are not the same reconciliation. The treating team answers only if it was called, takes ownership of whether acid suppression continues, whether an alternative replaces it, what happens to the targeted treatment and what she is told, and asks for the dates of the overlap. No diagnosis, individualized risk, treatment causality, eligibility, disposition, prognosis, or outcome is reported, and the rehearsal ends whatever her trajectory. After another elapsed interval, hand off the three lists and how they differ, the item bought rather than prescribed, the weeks of overlap, and the direction of harm. The controls do not take history; examine; acquire or interpret any test; diagnose; prescribe, substitute, stop, separate, or alter any drug, dose, route, or timing; determine eligibility, disposition, or prognosis; or predict response, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'silent-interaction-reconciliation', objectiveId: 'recognize-oncology-silent-interaction-what-she-swallows', question: 'Three lists, all true, all different. Which question finds the item that is on none of them?' },
    { id: 'silent-interaction-direction', objectiveId: 'record-oncology-silent-interaction-the-direction-of-harm', question: 'You examined her and everything was normal. Why was that never going to help?' },
    { id: 'silent-interaction-route', objectiveId: 'activate-oncology-silent-interaction-a-route-that-ends-with-a-person', question: 'You could have written this in the notes. What would that have changed?' },
    { id: 'silent-interaction-evidence', objectiveId: 'recognize-oncology-silent-interaction-neither-theory-nor-proof', question: 'Is this a real interaction or a theoretical one? What is wrong with both answers?' },
    { id: 'silent-interaction-intent', objectiveId: 'record-oncology-silent-interaction-bounded-qualified-intent', question: 'Where does your part of this stop, and what did you hand over?' },
    { id: 'silent-interaction-boundaries', objectiveId: 'review-oncology-silent-interaction-boundaries-and-their-certainty', question: 'The hazard ratio is 1.58 and the interval does not cross one. What can it still not tell you about her?' },
    { id: 'silent-interaction-handoff', objectiveId: 'handoff-oncology-silent-interaction-an-absence-that-travels', question: 'Nothing about her was abnormal. What did you actually hand over?' },
  ] },
};
