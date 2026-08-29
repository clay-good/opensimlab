/** A normal pre-treatment test, severe first-cycle toxicity, and the next dose still in his bag. */

import type { Scenario } from '@anesthesia/scenarios/types';

export const NORMAL_TEST_TOXICITY_THE_DOSE_IN_HIS_BAG: Scenario = {
  schemaVersion: 1,
  metadata: {
    id: 'normal-test-toxicity-the-dose-in-his-bag', version: '0.1.0', maturity: 'preview',
    title: 'A normal test: the dose still in his bag', author: 'Open Sim Lab',
    license: 'CC BY-SA 4.0', estimatedMinutes: 9, difficulty: 'intermediate', objectives: [
      { id: 'activate-oncology-normal-test-toxicity-the-action-that-is-yours', statement: 'Withhold the drug now, without waiting for permission.', measure: 'The oral anticancer drug was stopped physically and explicitly, with the patient told not to take the next dose and why, before or independently of contacting the treating service, because withholding is reversible and the swallowed dose is not.' },
      { id: 'recognize-oncology-normal-test-toxicity-a-panel-is-not-a-clearance', statement: 'Recognize that a normal pre-treatment panel is not a clearance.', measure: 'Excluding the drug on the strength of a wild-type genotype was refused, and the record stated that 231 of 1018 wild-type patients — 23 percent — had severe toxicity in the cohort that established genotype-guided dosing, that carriers still reached 39 percent after dose reduction, and that severe toxicity occurs in up to 30 percent of treated patients.' },
      { id: 'record-oncology-normal-test-toxicity-severity-and-the-day', statement: 'Record the toxicity with its severity and the day of the cycle.', measure: 'Eight stools a day above baseline since yesterday, a mouth too sore to eat, and painful peeling palms and soles were recorded as severe rather than as unwell, against cycle 1 day 9, because a first-cycle presentation is not the same finding as a later one.' },
      { id: 'activate-oncology-normal-test-toxicity-the-service-that-prescribed-it', statement: 'Contact the service that owns the treatment, without making that a precondition.', measure: 'Acute oncology was contacted and asked for grading, further treatment, and any restart, and waiting for their call before stopping, advising a halved dose, and treating the symptoms with review tomorrow were each refused.' },
      { id: 'record-oncology-normal-test-toxicity-bounded-qualified-intent', statement: 'Record bounded qualified-team supportive intent without selecting treatment.', measure: 'Grading, supportive treatment, rehydration, mouth care, and any specific antidotal treatment were recorded as the qualified team’s decisions, and no drug, dose, route, fluid, or threshold was chosen or displayed.' },
      { id: 'review-oncology-normal-test-toxicity-boundaries-and-their-certainty', statement: 'Review the boundaries and their certainty.', measure: 'That screening covers a defined variant panel associated with severe toxicity at adjusted relative risks of roughly 2.9 to 4.4 in a meta-analysis of 7365 patients, that a wild-type result means those variants were absent rather than that the enzyme works, that no deficiency is diagnosed here, and that none of the figures is a probability for this patient, were all kept explicit.' },
      { id: 'handoff-oncology-normal-test-toxicity-a-drug-that-stays-stopped', statement: 'Hand off a drug that stays stopped.', measure: 'The handoff preserved that the drug is stopped and when, what the normal panel does and does not exclude, the toxicity with its severity and cycle day, whether a further dose was taken before it was stopped, and the bounded supportive intent, with no deficiency, grade, or outcome certified.' },
    ],
    clinicalReview: { reviewer: 'UNSIGNED', credential: 'UNSIGNED', institution: 'UNSIGNED',
      competingInterests: 'None declared', reviewedOn: '1970-01-01', reviewBy: '1970-01-01', contentVersion: '0.1.0', sources: [
        'Henricks LM, Lunenburg CATC, de Man FM, et al. DPYD genotype-guided dose individualisation of fluoropyrimidine therapy in patients with cancer: a prospective safety analysis. Lancet Oncol. 2018;19(11):1459-1467. Fluoropyrimidine treatment can result in severe toxicity in up to 30% of patients. Of 1103 evaluable patients, 85 (8%) were heterozygous DPYD variant carriers and 1018 (92%) were wild type; severe fluoropyrimidine-related toxicity occurred in 33 (39%) of 85 variant carriers receiving reduced doses and in 231 (23%) of 1018 wild-type patients (p=0.0013).',
        'Meulendijks D, Henricks LM, Sonke GS, et al. Clinical relevance of DPYD variants c.1679T>G, c.1236G>A/HapB3, and c.1601G>A as predictors of severe fluoropyrimidine-associated toxicity: a systematic review and meta-analysis of individual patient data. Lancet Oncol. 2015;16(16):1639-1650. Across 7365 patients from eight studies, adjusted relative risks for severe fluoropyrimidine-associated toxicity were 4.40 (95% CI 2.08-9.30) for c.1679T>G, 2.85 (1.75-4.62) for DPYD*2A and 3.02 (2.22-4.10) for c.2846A>T; c.1601G>A was not significantly associated (1.52, 0.86-2.70).',
      ] },
    limitations: ['normal-test-toxicity-presentation-and-service-response-are-authored',
      'normal-test-toxicity-controls-are-withholding-and-escalation-only',
      'normal-test-toxicity-genotype-figures-are-not-this-patients-risk'],
  },
  patient: {
    ageYears: 68, sex: 'male', heightCm: 172, weightKg: 74, asaClass: 3,
    diagnosis: 'Authored severe first-cycle oral fluoropyrimidine toxicity after a wild-type pre-treatment genotype panel',
    procedure: 'immediate withholding, evidence-boundary review, escalation to acute oncology, and handoff practice',
    comorbidities: ['Resected colon cancer on adjuvant oral fluoropyrimidine therapy, cycle 1 day 9'],
    medications: ['All prescribing, grading, dose modification, and treatment decisions remain qualified-team work'],
    allergies: ['No known drug allergies'], fasting: 'Not relevant to the acute assessment fixture',
    baseline: { heartRateBpm: 96, meanArterialMmHg: 83, strokeVolumeMl: 60,
      hemoglobinGPerDl: 11.6, bloodVolumeMl: 4_900, coreTemperatureC: 36.9,
      arterialStiffness: 1.2, baroreflexGain: 0.8, fixedStrokeVolume: false },
    airway: { difficulty: 0.1, difficultMaskVentilation: false,
      assessment: 'Alert and orientated, speaking short sentences because his mouth is sore, in the supplied fixture' },
    respiratory: { profile: 'healthy' },
  },
  equipment: { monitoring: ['nibp', 'pulse-oximetry', 'temperature'], airwayDevice: 'facemask',
    ventilator: { mode: 'manual', fio2: 0.21, tidalVolumeMl: 490, respiratoryRateBpm: 12,
      freshGasFlowLPerMin: 10, delivering: false } }, formulary: [],
  timeline: [
    { id: 'normal-test-toxicity-presentation', type: 'narrative', target: 'normal-test-toxicity', atTick: 0,
      severity: 'warning', message: 'A 68-year-old man attends acute assessment on day 9 of the first cycle of an adjuvant oral fluoropyrimidine after colon-cancer resection. Since yesterday he has had eight stools a day above his baseline, his mouth is too sore to eat, and his palms and soles are painful and peeling. Authored observations are heart rate 96/min, blood pressure 112/68 mmHg, respiratory rate 16/min, oxygen saturation 98% in air, temperature 36.9 C, and alert. The referral letter states at the top that his pre-treatment genotype panel was wild type. He has taken this morning’s dose, and the box is in his bag.' },
    { id: 'normal-test-toxicity-evidence', type: 'narrative', target: 'normal-test-toxicity-evidence', atTick: 0,
      severity: 'warning', message: 'Severe toxicity is reported in up to 30 percent of patients treated with these drugs. In the prospective cohort that established pre-treatment genotype-guided dosing, severe toxicity still occurred in 231 of 1018 wild-type patients, which is 23 percent, and in 39 percent of variant carriers even after their doses had been reduced. The variants screened for are genuine predictors — adjusted relative risks of roughly 2.9 to 4.4 across 7365 patients in a meta-analysis — which is exactly why a normal result on that panel means those variants were absent rather than that the enzyme works. The test stratifies risk. It does not clear anybody. Meanwhile the drug is not in a pharmacy: it is in his bag, and he has been correctly told to take it every day.' },
    { id: 'normal-test-toxicity-boundary', type: 'narrative', target: 'normal-test-toxicity-boundary', atTick: 0,
      severity: 'warning', message: 'Withhold the drug now, physically and explicitly, telling him not to take the next dose and why; record what the normal pre-treatment panel does and does not exclude; record the toxicity with its severity against the cycle and the day; contact acute oncology for grading, further treatment, and any restart; record bounded qualified-team supportive intent; and review the boundaries and their certainty. Excluding the drug because the test was normal, waiting for acute oncology to call back before stopping, advising a halved dose, and treating the symptoms with review tomorrow are all refused. No drug, dose, route, fluid, investigation, or procedure is exposed, and the learner performs no examination and orders no test. After elapsed simulated time the evening dose falls due: if it has been withheld he does not take it, and if it has not he takes it, because he has been correctly instructed to take it every day for nine days. That is recorded as a fact rather than as a predicted harm, and it is the only consequence in this module’s lessons that follows from doing nothing. Acute oncology answers only if it was contacted, confirms the drug stays stopped, and takes ownership of grading, further treatment, and any restart. No enzyme deficiency is diagnosed, and no individualized effect, treatment causality, grade, eligibility, disposition, prognosis, or outcome is reported. Qualified teams retain grading, dose modification, prescribing, and every treatment decision. After another elapsed interval, hand off the stopped drug, what the panel does not exclude, the toxicity, whether a further dose was taken, disposition, and outcome uncertainty. The controls do not take history; examine; acquire or interpret observations, laboratory, genetic, or another test; diagnose; grade; select or deliver a drug, dose, route, fluid, oxygen, or device; perform a procedure; determine eligibility, disposition, or prognosis; or predict response, survival, or outcome.' },
  ],
  debrief: { rubric: [
    { id: 'normal-test-toxicity-withholding', objectiveId: 'activate-oncology-normal-test-toxicity-the-action-that-is-yours', question: 'Which action here needed nobody’s permission, and what made it urgent?' },
    { id: 'normal-test-toxicity-exclusions', objectiveId: 'recognize-oncology-normal-test-toxicity-a-panel-is-not-a-clearance', question: 'What did the normal pre-treatment result actually license you to conclude?' },
    { id: 'normal-test-toxicity-severity', objectiveId: 'record-oncology-normal-test-toxicity-severity-and-the-day', question: 'Why does the day of the cycle belong in the record?' },
    { id: 'normal-test-toxicity-activation', objectiveId: 'activate-oncology-normal-test-toxicity-the-service-that-prescribed-it', question: 'What were you asking acute oncology for, and what were you not waiting for?' },
    { id: 'normal-test-toxicity-intent', objectiveId: 'record-oncology-normal-test-toxicity-bounded-qualified-intent', question: 'Where does your part of this stop?' },
    { id: 'normal-test-toxicity-boundaries', objectiveId: 'review-oncology-normal-test-toxicity-boundaries-and-their-certainty', question: 'What does a four-variant panel test for, and what does it not?' },
    { id: 'normal-test-toxicity-handoff', objectiveId: 'handoff-oncology-normal-test-toxicity-a-drug-that-stays-stopped', question: 'What had to travel so that the drug stayed stopped?' },
  ] },
};
