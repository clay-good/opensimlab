/**
 * The prebriefing screen (learning/pedagogy → Every scenario has a prebrief,
 * per the INACSL Healthcare Simulation Standards of Best Practice).
 *
 * It orients the learner to the environment, the controls, the patient, the
 * objectives, and the fiction contract — that this is a simulation and errors here
 * are safe — before the clock runs.
 */

import { Badge, Button, Panel, SiteBar } from '@platform/ui';
import { limitationsToBrief } from '@platform/docs/scenario-limitations';
import type { Limitation } from '@platform/docs/limitations/types';
import { isUnreviewed, UNREVIEWED_NOTICE } from '@platform/governance/review-gate';
import { FlagControl } from '@platform/governance/FlagControl';
import { reviewModeFrom } from '@platform/governance/review-notes';
import { APP_VERSION } from '@platform/governance/status';
import { MaturityMarker } from '@platform/governance/MaturityMarker';
import type { Scenario } from '@anesthesia/engine';
import { HONEST_STATUS } from '@platform/governance/status';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import type { RegionProfile } from '@anesthesia/region/profiles';
import { patientPersonNoun } from '@anesthesia/scenarios/patient-label';
import { supportsSevereHypoglycemia } from '../../endocrine-metabolic/severe-hypoglycemia';
import { supportsAdrenalCrisis } from '../../endocrine-metabolic/adrenal-crisis';
import { supportsThyroidDemonstration } from '../../endocrine-metabolic/demo/thyroid-demonstration';
import { supportsMyxedemaDemonstration } from '../../endocrine-metabolic/demo/myxedema-demonstration';
import { supportsHypercalcemiaDemonstration } from '../../endocrine-metabolic/demo/hypercalcemia-demonstration';
import { supportsHypocalcemiaDemonstration } from '../../endocrine-metabolic/demo/hypocalcemia-demonstration';
import { supportsHyponatremiaCorrectionDemonstration } from '../../endocrine-metabolic/demo/hyponatremia-correction-demonstration';
import { supportsAvpDeficiencyDemonstration } from '../../endocrine-metabolic/demo/avp-deficiency-demonstration';
import { supportsRefeedingDemonstration } from '../../endocrine-metabolic/demo/refeeding-demonstration';
import { supportsPerioperativeDiabetesDemonstration } from '../../endocrine-metabolic/demo/perioperative-diabetes-demonstration';
import { supportsRenalHyperkalemiaDemonstration } from '../../renal-electrolyte/demo/renal-hyperkalemia-demonstration';
import { supportsRenalHypokalemiaDemonstration } from '../../renal-electrolyte/demo/renal-hypokalemia-demonstration';
import { supportsRenalHyponatremiaDemonstration } from '../../renal-electrolyte/demo/renal-hyponatremia-demonstration';
import { supportsRenalHypernatremiaDemonstration } from '../../renal-electrolyte/demo/renal-hypernatremia-demonstration';
import { supportsRenalHypocalcemiaDemonstration } from '../../renal-electrolyte/demo/renal-hypocalcemia-demonstration';
import { supportsRenalHypermagnesemiaDemonstration } from '../../renal-electrolyte/demo/renal-hypermagnesemia-demonstration';

export const FICTION_CONTRACT =
  'This is a simulation. The patient is not real, nothing you do here reaches anyone, and an '
  + 'error here costs nothing except what you learn from it. In exchange, treat the patient as '
  + 'though they were real: the learning only works if you make the decisions you would actually '
  + 'make. Your practice and tutor stay on this device. Only a problem report you preview and '
  + 'deliberately send leaves it.';

export interface PrebriefProps {
  readonly scenario: Scenario;
  readonly region: RegionProfile;
  /**
   * The module's own limitations. Passed in rather than imported so this shared component does
   * not drag all fifteen modules' entries into every module's chunk.
   */
  readonly limitations: readonly Limitation[];
  readonly environment?: 'anesthesia' | 'emergency-medicine' | 'critical-care' | 'cardiology' | 'respiratory-medicine' | 'pediatrics' | 'neurology' | 'toxicology' | 'obstetrics' | 'neonatology' | 'endocrine-metabolic' | 'renal-electrolyte' | 'infectious-disease' | 'medical-surgical-nursing' | 'oncology';
  readonly onStart: () => void;
  /**
   * Offered only where the demonstration was authored. A "watch this" control on
   * a scenario the script does not describe would narrate the wrong session.
   */
  readonly onWatch?: (() => void) | undefined;
  /** Set by an assignment link, so a learner knows which assignment they are in. */
  readonly assignmentLabel?: string;
  readonly guidance: 'guided' | 'coached' | 'unassisted';
  readonly onGuidance: (level: 'guided' | 'coached' | 'unassisted') => void;
  readonly onReportLimitation?: () => void;
}

export function Prebrief({
  scenario, region, limitations, environment = 'anesthesia', onStart, onWatch, guidance, onGuidance,
  assignmentLabel, onReportLimitation,
}: PrebriefProps) {
  const patient = scenario.patient;
  const hypoglycemia = supportsSevereHypoglycemia(scenario);
  return (
    <>
      <SiteBar />
      <main className="reading prebrief" id="main">
      {assignmentLabel && (
        <p className="field__label">Assignment: {assignmentLabel}</p>
      )}
      <h1>{scenario.metadata.title}</h1>
      <p>{patient.ageYears === 0 ? 'Newborn' : `${patient.ageYears}-year-old ${patientPersonNoun(patient)}`}, {patient.weightKg} kg
        {environment === 'cardiology' || environment === 'respiratory-medicine' || environment === 'pediatrics' || environment === 'neurology' || environment === 'toxicology' || environment === 'obstetrics' || environment === 'neonatology' || environment === 'endocrine-metabolic' || environment === 'renal-electrolyte' || environment === 'infectious-disease'
          ? `, for ${patient.procedure}.`
          : `, ASA ${patient.asaClass}, for ${patient.procedure}.`}</p>

      <Panel title="The fiction contract">
        <p>{FICTION_CONTRACT}</p>
      </Panel>

      <section>
        <h2>What you are here to do</h2>
        <ol>
          {scenario.metadata.objectives.map((objective) => (
            <li key={objective.id} className="prebrief__objective">
              <strong>{objective.statement}</strong>
              {/* These measures are full sentences, sometimes several. They were rendered in the
                  form-hint style, which is 11px with tight leading and correct for a one-line hint
                  under a field — it made the densest prose on the page the hardest to read. */}
              <span className="prebrief__measure">The debrief will look at: {objective.measure}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2>The patient</h2>
        {environment === 'respiratory-medicine' || environment === 'pediatrics' || environment === 'neurology' || environment === 'toxicology' || environment === 'obstetrics' || environment === 'neonatology' || environment === 'endocrine-metabolic' || environment === 'renal-electrolyte' || environment === 'infectious-disease' ? (
          <ul>
            <li>{patient.diagnosis}.</li>
            {scenario.metadata.id === 'maternal-cardiac-arrest-coordinated-response' ? (
              <li>Current authored arrest report: organized electrical activity at 48 bpm without a
                central pulse or obtainable blood pressure.</li>
            ) : (
              <li>Current authored reassessment: {patient.baseline.heartRateBpm} bpm and mean arterial pressure{' '}
                {patient.baseline.meanArterialMmHg} mmHg.</li>
            )}
            <li>Breathing and alertness: {patient.airway.assessment ?? 'not recorded'}.</li>
            <li>Allergies: {(patient.allergies ?? []).join(', ') || 'none documented'}.</li>
          </ul>
        ) : environment === 'cardiology' ? (
          <ul>
            <li>{patient.diagnosis}.</li>
            <li>{(patient.comorbidities ?? []).join('; ') || 'No comorbidities recorded'}.</li>
            <li>Fixed baseline {patient.baseline.heartRateBpm} bpm and mean arterial pressure{' '}
              {patient.baseline.meanArterialMmHg} mmHg.</li>
            <li>Allergies: {(patient.allergies ?? []).join(', ') || 'none documented'}.</li>
          </ul>
        ) : (
          <ul>
            <li>{patient.diagnosis}, for {patient.procedure}.</li>
            <li>Airway: {patient.airway.assessment ?? 'not recorded'}.</li>
            <li>Baseline {patient.baseline.heartRateBpm} bpm, mean arterial pressure{' '}
              {patient.baseline.meanArterialMmHg} mmHg, haemoglobin {patient.baseline.hemoglobinGPerDl} g/dL.</li>
            <li>Fasting: {patient.fasting ?? 'not recorded'}.</li>
            <li>Allergies: {(patient.allergies ?? []).join(', ') || 'none documented'}.</li>
          </ul>
        )}
      </section>

      <section>
        <h2>The environment</h2>
        {environment === 'critical-care' ? (
          <p>
            The ICU monitor and organ-support state stay visible while the focused reassessment opens
            below. Pause freely; every setting change should be followed by a measured response.
          </p>
        ) : environment === 'emergency-medicine' ? (
          <p>
            The monitor and patient state stay visible while the focused assessment opens below.
            The clock only runs when you press play, and you can pause at any moment to think.
          </p>
        ) : environment === 'cardiology' ? (
          <p>
            The fixed clinical record and patient context stay visible while the
            focused evaluation opens below. Pause freely and work through the sequence deliberately.
          </p>
        ) : environment === 'respiratory-medicine' ? (
          <>
            <p>
              The current respiratory record and monitor stay visible while the focused reassessment
              opens below. Pause freely and work through each change in breathing and alertness deliberately.
            </p>
            <p>
              This lab practices serial reassessment, planning, coordination, and handoff. Prior care and
              current reports are authored; no treatment, prescription, procedure, discharge, or outcome is delivered.
            </p>
          </>
        ) : environment === 'pediatrics' ? (
          <>
            <p>
              The child, caregiver context, and monitor stay visible while the focused reassessment
              opens below. Pause freely and follow the whole-child trajectory at your own pace.
            </p>
            <p>
              Qualified findings and support are authored. This lab practices recognition,
              escalation, reassessment, and handoff, not diagnosis, dosing, device use, or procedures.
            </p>
          </>
        ) : environment === 'neurology' ? (
          <>
            <p>
              The supplied neurological record, patient priorities, and monitor stay visible while the
              focused reassessment opens below. Pause freely and follow function and trajectory at your own pace.
            </p>
            <p>
              Qualified findings and fixed reports are authored. This lab practices functional recognition,
              escalation, reassessment, and handoff, not examination, scoring, diagnosis, prescribing, treatment, or disposition.
            </p>
          </>
        ) : environment === 'toxicology' ? (
          <>
            <p>
              The supplied exposure record, whole-patient findings, and monitor stay visible while the
              focused assessment opens below. Pause freely and follow the toxicology trajectory at your own pace.
            </p>
            <p>
              Qualified findings, tests, and response reports are authored. This lab practices pattern recognition,
              support, escalation, reassessment, and handoff, not diagnosis, dosing, device use, or procedures.
            </p>
          </>
        ) : environment === 'obstetrics' ? (
          <>
            <p>
              The supplied birth record, maternal findings, family context, and monitor stay visible
              while the focused response opens below. Pause freely and follow the trajectory at your own pace.
            </p>
            <p>
              Qualified findings and response reports are authored. This lab practices early recognition,
              coordinated ownership, reassessment, and handoff, not examination, dosing, procedures, or delivery.
            </p>
          </>
        ) : scenario.metadata.id === 'hypermagnesemia-antagonism-and-removal' ? (
          <>
            <p>Support inadequate breathing, counter toxicity temporarily, and deliver qualified magnesium
              removal independently. Calcium does not remove magnesium. Stopping further exposure does not
              establish clearance. No dose, airway technique, dialysis setting, or routine diuresis is prescribed.</p>
            <p>Magnesium-only and neuromuscular-only checks leave the full assessment historical.
              The twelve-decision example pauses for reading and runs authored observation periods at 60×.
              Fresh recurrence assessment precedes an explicit repeat-calcium decision, never automatic redosing.
              Handoff preserves breathing support and residual weakness, not discharge readiness.</p>
          </>
        ) : scenario.metadata.id === 'hypocalcemia-ionized-calcium-and-ckd' ? (
          <>
            <p>Use measured ionized calcium and symptoms, not reassurance from an adjusted total estimate.
              Qualified rescue is available now; continuing calcium care is available immediately afterward,
              without waiting for symptom relief, review, or another laboratory click. No dose or infusion rate is selected.</p>
            <p>Ionized-only and symptom-only checks leave the full assessment historical.
              The ten-decision example pauses for reading and runs authored observation periods at 60×.
              Handoff preserves continuing calcium, CKD mineral care, and follow-up beyond the rehearsal;
              improved findings do not establish durable control or discharge readiness.</p>
          </>
        ) : scenario.metadata.id === 'hypernatremia-water-access-and-losses' ? (
          <>
            <p>Restore depleted circulation, then distinguish water replacement, continuing-loss care,
              and safe assisted access. Initial rescue does not wait for review or another laboratory click.
              Water and loss care follow the circulation response without a new testing gate.
              This lesson selects no dose, route, or correction rate.</p>
            <p>Sodium-only and fluid-balance-only checks leave the full assessment historical.
              Better circulation does not prove sodium correction, and loss care does not instantly stop diarrhea.
              The ten-decision example pauses for reading and runs authored observation periods at 60×.
              Handoff preserves continuing replacement, safe access, and surveillance, not discharge readiness.</p>
          </>
        ) : scenario.metadata.id === 'hyponatremia-symptoms-and-reassessment' ? (
          <>
            <p>Respond to confusion, headache, and nausea alongside the supplied sodium of 118.
              Initial qualified rescue does not wait for review or another laboratory click.
              This lesson follows a selected Society for Endocrinology persistent-symptom pathway,
              not a universal regional rule or a dose prescription.</p>
            <p>Sodium-only and neurologic-only checks leave the full paired assessment historical.
              A sodium rise does not prove symptom recovery. The nine-decision example pauses for reading
              and runs authored observation periods at 60×. Handoff preserves ongoing treatment review,
              monitoring, and cause evaluation without automatic treatment cessation or discharge.</p>
          </>
        ) : scenario.metadata.id === 'hypokalemia-magnesium-and-ongoing-losses' ? (
          <>
            <p>Address potassium and magnesium depletion independently while delivering care for ongoing
              losses. Neither replacement waits for the other, administrative review, or a new laboratory
              click. This lesson selects no dose, route, concentration, or infusion rate.</p>
            <p>Potassium-only and ECG-only checks leave the full magnesium assessment historical.
              Ongoing-loss care does not instantly stop diarrhea. The nine-decision example pauses for reading
              and runs authored observation periods at 60×. Its partial, combined, and recurrence contrasts
              are not clinical waiting periods or proof of durable recovery.</p>
          </>
        ) : scenario.metadata.id === 'hyperkalemia-cardioprotection-and-rebound' ? (
          <>
            <p>Separate calcium cardioprotection, temporary potassium shifting, and actual removal.
              Qualified urgent treatment does not wait for review or another laboratory click.
              A removal plan is not delivered treatment; no fixed dose or automatic dialysis is prescribed.</p>
            <p>ECG-only and glucose-only checks keep older potassium findings historical.
              A better ECG does not prove potassium control. The ten-decision example pauses for reading
              and runs authored observation periods at 60×. The 30- and 60-minute response contrasts
              are not clinical waiting periods; continuing surveillance remains necessary.</p>
          </>
        ) : scenario.metadata.id === 'perioperative-diabetes-insulin-continuity' ? (
          <>
            <p>Protect insulin continuity after a pump interruption during prolonged fasting. Qualified,
              verified alternative delivery does not wait for a new laboratory result or administrative
              acknowledgment. This lesson prescribes no fixed insulin route, dose, or glucose infusion.</p>
            <p>Blood-glucose-only checks and full glucose, ketone, and bedside assessments stay distinct.
              A newer glucose does not refresh older ketones or automatically clear the operation.
              The 30- and 60-minute contrasts are authored, not clinical waits. The eight-decision
              example pauses for reading and uses 60× observation periods; continuing-care handoff
              preserves insulin, fasting, monitoring, and postoperative responsibilities.</p>
          </>
        ) : scenario.metadata.id === 'refeeding-electrolyte-shift' ? (
          <>
            <p>Address severe electrolyte deterioration after nutrition restarted. Qualified electrolyte
              care, thiamine, nutrition review, and surveillance can proceed independently. Phosphate-only
              care is a partial step, not a complete plan or an automatic error.</p>
            <p>Review all calorie sources and individualized advancement. Guidance differs on feeding
              strategies; this lesson selects neither a universal rate nor stopping all nutrition.
              New laboratory findings require explicit reassessment. The 30- and 60-minute contrasts
              are authored, not clinical waiting periods. Pause freely; the worked example runs its
              observation periods at 60× and keeps reading time separate from patient time.</p>
          </>
        ) : scenario.metadata.id === 'hypernatremic-dehydration-avp-deficiency' ? (
          <>
            <p>Restore compromised circulation in this patient with known AVP deficiency. Low initial
              urine output does not exclude it. Once circulation is restored, qualified water replacement
              and prescribed desmopressin can proceed independently without another laboratory click.</p>
            <p>Fresh requested sodium and urine findings distinguish improved circulation from controlled
              water balance. Original sodium and observed peaks remain in the record. The 15-minute
              circulation and two-hour combined-care checkpoints are authored contrasts, not mandatory
              clinical waits or treatment predictions. Pause freely; 60× advances one simulated minute
              each second. Hand off continuing medication and water access, not discharge clearance.</p>
          </>
        ) : scenario.metadata.id === 'hyponatremia-aquaresis-and-overcorrection' ? (
          <>
            <p>The seizure has stopped, but the correction window continues. Sodium already rose from
              106 to the supplied 111 mmol/L in one hour. Review the selected high-risk plan, arrange
              serial sodium and urine checks, and respond to newly observed water diuresis.</p>
            <p>Original baseline and observed peak stay in the record, including after qualified
              relowering when excessive correction is observed. Only requested results reveal sodium
              and urine output. Authored observation and response checkpoints are not treatment
              predictions or safe waiting intervals. Pause freely; 60× advances one simulated minute
              each second. Continuing care is not discharge clearance.</p>
          </>
        ) : scenario.metadata.id === 'hypocalcemic-tetany-rescue-and-recurrence' ? (
          <>
            <p>Start qualified calcium rescue with ECG monitoring for supplied symptomatic hypocalcemia.
              Risk assessment and the cause panel must not delay rescue. Review postoperative airway,
              seizure, and neck concerns, then arrange magnesium and continuing cause-directed care.</p>
            <p>The 15-minute relief, 45-minute incomplete-care recurrence, and one-hour complete-care
              checkpoints are authored teaching states, not treatment predictions or safe waiting intervals.
              Reassess frequently and hand off unresolved risk. Calcium is a requested historical result;
              the supplied QTc is not calculated by the waveform. Pause freely; 60× advances one simulated
              minute each second.</p>
          </>
        ) : scenario.metadata.id === 'hypercalcemic-crisis-volume-and-bridge' ? (
          <>
            <p>Restore circulation with qualified, monitored hydration while arranging short-term
              calcitonin and renal-informed antiresorptive care for this known malignancy-associated
              emergency. A better pulse or pressure does not establish calcium control.</p>
            <p>The fifteen-minute circulation and four-hour calcium changes are authored teaching
              checkpoints, not predictions or safe waiting intervals. Continue clinical monitoring,
              request fresh assessments, and hand off unresolved disease. Pause freely; 60× advances
              one simulated minute each second.</p>
          </>
        ) : scenario.metadata.id === 'myxedema-coma-ventilation-and-steroid-sequence' ? (
          <>
            <p>Support breathing while qualified endocrine and precipitant care begin. Oxygen saturation
              can improve without clearing carbon dioxide. Empiric steroids precede levothyroxine;
              laboratory confirmation and a diagnostic score do not delay urgent treatment.</p>
            <p>The five-minute respiratory and one-hour complete-care changes are authored support
              checkpoints, not predicted recovery. Request fresh reassessments, then hand off ongoing
              risk. Pause freely; 60× advances one simulated minute each second.</p>
          </>
        ) : scenario.metadata.id === 'thyroid-storm-hemodynamic-risk' ? (
          <>
            <p>Start qualified treatment while investigating, assess circulation before choosing
              rate control, and return for fresh bedside reassessments. Pause freely; 60× speed
              advances one simulated minute each second.</p>
            <p>The selected pathway starts iodine at least one hour after antithyroid treatment.
              Other urgent care proceeds now. Patient changes are authored, not treatment kinetics;
              early partial improvement is not resolution or discharge readiness.</p>
          </>
        ) : supportsAdrenalCrisis(scenario) ? (
          <>
            <p>Choose urgent qualified rescue, review the interrupted replacement record, and
              reassess the patient as time passes. Pause freely; use 60× speed for observation periods.</p>
            <p>Choices and elapsed time change authored patient states. No test result unlocks
              steroid treatment. This is not a dosing, fluid-rate, cortisol-kinetics, or discharge model.</p>
          </>
        ) : hypoglycemia ? (
          <>
            <p>Check the fictional glucose, uncover the medication record, choose qualified rescue,
              and reassess as time passes. Pause freely; 60× speed advances a simulated minute each second.</p>
            <p>Choices and elapsed time change authored patient states. This is not a glucose kinetics
              model, dosing calculator, IV technique lesson, or discharge decision.</p>
          </>
        ) : environment === 'endocrine-metabolic' ? (
          <>
            <p>
              The supplied biochemical trajectory, patient priorities, and monitor stay visible while
              the focused reassessment opens below. Pause freely and follow change at your own pace.
            </p>
            <p>
              Qualified findings and care reports are authored. This lab practices metabolic recognition,
              treatment-boundary review, transition readiness, and handoff, not testing, dosing, infusion operation, or disposition.
            </p>
          </>
        ) : environment === 'neonatology' ? (
          <>
            <p>
              The supplied birth record, newborn findings, parent-dyad context, and monitor stay visible
              while the focused transition review opens below. Pause freely and follow the shared clock at your own pace.
            </p>
            <p>
              Qualified findings and care reports are authored. This lab practices transition recognition,
              protective-care review, reassessment, and handoff, not examination, scoring, feeding, resuscitation, or disposition.
            </p>
          </>
        ) : (
          <>
            <p>
              The monitor is on the right, the concentration plot and the log on the left, and your
              drugs, the ventilator and the airway are along the bottom. The clock only runs when you
              press play, and you can pause at any moment to look at anything.
            </p>
            <p>
              Practice region: <strong>{region.name}</strong>.{' '}
              {region.targetControlledInfusion.routine
                ? 'Target-controlled infusion is a first-class control here.'
                : 'Manual weight-based infusion is the default here.'}
            </p>
            <MaturityMarker
              compact
              status={region.maturity}
              subjectKind="practice-region"
              subjectId={region.id}
              contentVersion={region.version}
            />
          </>
        )}
      </section>

      {/* Sentences from the register, not the ids the scenario stores. This
          used to print `scenario.metadata.limitations` verbatim, which for
          three of the four scenarios meant showing a learner the bullet
          "no-shunt-or-dead-space-dynamics". */}
      {limitationsToBrief(scenario, limitations).length > 0 && (
        <section>
          <h2>What this scenario does not model</h2>
          <ul>
            {limitationsToBrief(scenario, limitations).map((limitation) => (
              <li key={limitation.id}>{limitation.headline}</li>
            ))}
          </ul>
          <p className="field__hint">
            <a href="/limitations">The limitations register explains where each of these would
            mislead you, and what the correct understanding is.</a>
          </p>
          {onReportLimitation && (
            <Button compact variant="ghost" onClick={onReportLimitation}>
              Help us improve these limitations
            </Button>
          )}
        </section>
      )}

      <section>
        <h2>How much help do you want?</h2>
        <p className="field__hint">
          Guidance changes how much you are prompted. It does not change the patient at all: the
          same actions produce the same physiology at every level.
        </p>
        <div className="phase-nav">
          {(['guided', 'coached', 'unassisted'] as const).map((level) => (
            <Button
              key={level}
              variant={guidance === level ? 'primary' : 'secondary'}
              onClick={() => onGuidance(level)}
              aria-pressed={guidance === level}
            >
              {level === 'guided' ? 'Guided — prompt me' : level === 'coached' ? 'Coached — prompt me rarely' : 'Unassisted — say nothing'}
            </Button>
          ))}
        </div>
      </section>

      <Badge kind="out-of-range">{HONEST_STATUS.headline}</Badge>
      <p className="reading__aside">{HONEST_STATUS.detail}</p>
      <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>

      <MaturityMarker
        status={scenario.metadata.maturity}
        subjectKind="scenario"
        subjectId={scenario.metadata.id}
        contentVersion={scenario.metadata.version}
        moduleId={environment}
      />

      {/* The scenario's own review record, before the learner starts, not after. */}
      {isUnreviewed(scenario.metadata.clinicalReview) && (
        <p className="reading__aside" data-unreviewed="true">
          <strong>This scenario has not been clinically reviewed.</strong> {UNREVIEWED_NOTICE}
        </p>
      )}

      {reviewModeFrom(typeof location === 'undefined' ? '' : location.search) && (
        <FlagControl
          itemKey={`scenario:${scenario.metadata.id}`}
          itemLabel={scenario.metadata.title}
          contentVersion={scenario.metadata.version}
          appVersion={APP_VERSION}
          now={() => new Date().toISOString()}
        />
      )}

      {/* Two ways in, and the passive one is offered second: someone who came
          here to practise should not have to decline a video first. */}
      <div className="prebrief__start">
        <Button variant="primary" onClick={onStart}>Start the scenario</Button>
        {onWatch && (
          <Button onClick={onWatch}>{hypoglycemia || supportsAdrenalCrisis(scenario) || supportsThyroidDemonstration(scenario) || supportsMyxedemaDemonstration(scenario) || supportsHypercalcemiaDemonstration(scenario) || supportsHypocalcemiaDemonstration(scenario) || supportsHyponatremiaCorrectionDemonstration(scenario) || supportsAvpDeficiencyDemonstration(scenario) || supportsRefeedingDemonstration(scenario) || supportsPerioperativeDiabetesDemonstration(scenario) || supportsRenalHyperkalemiaDemonstration(scenario) || supportsRenalHypokalemiaDemonstration(scenario) || supportsRenalHyponatremiaDemonstration(scenario) || supportsRenalHypernatremiaDemonstration(scenario) || supportsRenalHypocalcemiaDemonstration(scenario) || supportsRenalHypermagnesemiaDemonstration(scenario) ? 'Watch a worked example' : 'Watch a 90-second demonstration'}</Button>
        )}
      </div>
      {onWatch && (
        <p className="field__hint">
          {hypoglycemia || supportsAdrenalCrisis(scenario) || supportsThyroidDemonstration(scenario) || supportsMyxedemaDemonstration(scenario) || supportsHypercalcemiaDemonstration(scenario) || supportsHypocalcemiaDemonstration(scenario) || supportsHyponatremiaCorrectionDemonstration(scenario) || supportsAvpDeficiencyDemonstration(scenario) || supportsRefeedingDemonstration(scenario) || supportsPerioperativeDiabetesDemonstration(scenario) || supportsRenalHyperkalemiaDemonstration(scenario) || supportsRenalHypokalemiaDemonstration(scenario) || supportsRenalHyponatremiaDemonstration(scenario) || supportsRenalHypernatremiaDemonstration(scenario) || supportsRenalHypocalcemiaDemonstration(scenario) || supportsRenalHypermagnesemiaDemonstration(scenario) ? 'The worked example pauses before each decision so you can read. Choose “Continue example” when ready; observation periods run at 60× speed. Reading time does not advance the patient. ' : 'The demonstration runs this scenario at five times speed and explains what to look at. '}
          You can take the controls at any point and carry on from where it got to.
        </p>
      )}
      </main>
    </>
  );
}
