/**
 * The prebriefing screen (learning/pedagogy → Every scenario has a prebrief,
 * per the INACSL Healthcare Simulation Standards of Best Practice).
 *
 * It orients the learner to the environment, the controls, the patient, the
 * objectives, and the fiction contract — that this is a simulation and errors here
 * are safe — before the clock runs.
 */

import { Badge, Button, Panel } from '@platform/ui';
import { isUnreviewed, UNREVIEWED_NOTICE } from '@platform/governance/review-gate';
import { FlagControl } from '@platform/governance/FlagControl';
import { reviewModeFrom } from '@platform/governance/review-notes';
import { APP_VERSION } from '@platform/governance/status';
import type { Scenario } from '@anesthesia/engine';
import { HONEST_STATUS } from '@platform/governance/status';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import type { RegionProfile } from '@anesthesia/region/profiles';

export const FICTION_CONTRACT =
  'This is a simulation. The patient is not real, nothing you do here reaches anyone, and an '
  + 'error here costs nothing except what you learn from it. In exchange, treat the patient as '
  + 'though they were real: the learning only works if you make the decisions you would actually '
  + 'make. Nothing you do leaves this device.';

export interface PrebriefProps {
  readonly scenario: Scenario;
  readonly region: RegionProfile;
  readonly onStart: () => void;
  /** Set by an assignment link, so a learner knows which assignment they are in. */
  readonly assignmentLabel?: string;
  readonly guidance: 'guided' | 'coached' | 'unassisted';
  readonly onGuidance: (level: 'guided' | 'coached' | 'unassisted') => void;
}

export function Prebrief({ scenario, region, onStart, guidance, onGuidance, assignmentLabel }: PrebriefProps) {
  const patient = scenario.patient;
  return (
    <main className="reading" id="main">
      {assignmentLabel && (
        <p className="field__label">Assignment: {assignmentLabel}</p>
      )}
      <h1>{scenario.metadata.title}</h1>
      <p>{patient.ageYears}-year-old {patient.sex === 'male' ? 'man' : 'woman'}, {patient.weightKg} kg,
        ASA {patient.asaClass}, for {patient.procedure}.</p>

      <Panel title="The fiction contract">
        <p>{FICTION_CONTRACT}</p>
      </Panel>

      <section>
        <h2>What you are here to do</h2>
        <ol>
          {scenario.metadata.objectives.map((objective) => (
            <li key={objective.id}>
              <strong>{objective.statement}</strong>
              <br />
              <span className="field__hint">The debrief will look at: {objective.measure}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2>The patient</h2>
        <ul>
          <li>{patient.diagnosis}, for {patient.procedure}.</li>
          <li>Airway: {patient.airway.assessment ?? 'not recorded'}.</li>
          <li>Baseline {patient.baseline.heartRateBpm} bpm, mean arterial pressure{' '}
            {patient.baseline.meanArterialMmHg} mmHg, haemoglobin {patient.baseline.hemoglobinGPerDl} g/dL.</li>
          <li>Fasting: {patient.fasting ?? 'not recorded'}.</li>
          <li>Allergies: {(patient.allergies ?? []).join(', ') || 'none documented'}.</li>
        </ul>
      </section>

      <section>
        <h2>The environment</h2>
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
      </section>

      {scenario.metadata.limitations && scenario.metadata.limitations.length > 0 && (
        <section>
          <h2>What this scenario does not model</h2>
          <ul>
            {scenario.metadata.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
          </ul>
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

      <Button variant="primary" onClick={onStart}>Start the scenario</Button>
    </main>
  );
}
