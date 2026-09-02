/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_PULMONARY_EDEMA_RESPIRATORY_SUPPORT_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/acute-pulmonary-edema-respiratory-support-reassessment';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  pulmonaryEdemaAuthored: true as const, supportAlreadyActiveAuthored: true as const,
  oxygenDeliveredByLearner: false as const, nivStartedByLearner: false as const,
  supportSettingSelected: false as const, medicationDeliveredByLearner: false as const,
  testAcquiredByLearner: false as const, airwayProcedurePerformedByLearner: false as const,
  treatmentDeliveredByLearner: false as const, dispositionDetermined: false as const,
  outcomePredicted: false as const,
};
const EMPTY = { trajectoryAtTick: null, failureAtTick: null, wholePatientAtTick: null, escalationAtTick: null, handoffAtTick: null, ...NEVER };
const LABELS = ['Reconcile initial care + trajectory', 'Review progressive respiratory failure', 'Review perfusion + congestion + causes', 'Activate airway-capable escalation', 'Hand off active respiratory failure'];
const STATES = [EMPTY,
  { ...EMPTY, trajectoryAtTick: 0 },
  { ...EMPTY, trajectoryAtTick: 0, failureAtTick: 1 },
  { ...EMPTY, trajectoryAtTick: 0, failureAtTick: 1, wholePatientAtTick: 2 },
  { ...EMPTY, trajectoryAtTick: 0, failureAtTick: 1, wholePatientAtTick: 2, escalationAtTick: 3 },
  { trajectoryAtTick: 0, failureAtTick: 1, wholePatientAtTick: 2, escalationAtTick: 3, handoffAtTick: 4, ...NEVER }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['apeSupportAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, apeSupportAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 360, respiratoryRateBpm: 18, fio2: 0.35, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onApeSupportResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['apeSupportAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Respiratory pulmonary-edema support experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine' }));
    expect(index).toContain('href="/respiratory-medicine/scenario/acute-pulmonary-edema-respiratory-support-reassessment"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine/scenario/acute-pulmonary-edema-respiratory-support-reassessment' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers a setting, a drug, or an airway', () => {
    expect(crisisResponseAvailability(SCENARIO).hasApeSupportResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'acute-pulmonary-edema-respiratory-support-reassessment'),
    }).hasApeSupportResponse).toBe(false);
    expect(lessonButtons(markup(EMPTY)).length).toBe(5);
    expect(markup(STATES[0]!)).toContain('A quieter breath can be the warning.');
    expect(markup(STATES[5]!)).toContain('Bring the rescue team close before the margin closes.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/measure|examin|auscultat|sample|acquire|order the|send the|gas|furosemide|nitrate|diuretic|titrat|peep|fio2|cpap|bipap|interface|intubat|start the|turn the|dose|drug|prescri|procedure|diagnose|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Pulmonary-edema support tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { apeSupportGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { apeSupportGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Separate what the team did from where she has ended up');
    const next = markup(STATES[1]!, { apeSupportGuidance: 'guided' });
    expect(next).toContain('the mentation, the effort and the gas together');
    expect(next).not.toContain('Separate what the team did from where she has ended up');
  });

  it('reads the falling respiratory rate as fatigue', () => {
    const html = markup(STATES[1]!, { apeSupportGuidance: 'guided' });
    expect(html).toContain('The rate fell because she is tiring, not because she is better.');
    expect(html).toContain('the specific situation the support does not fix');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[5]!, { apeSupportGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { apeSupportGuidance: 'guided', apeSupportDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
