/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { CHRONIC_OPIOID_RELATED_HYPOVENTILATION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/chronic-opioid-related-hypoventilation-reassessment';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, chronicOpioidExposureAuthored: true as const,
  spontaneouslyBreathingAuthored: true as const,
  acuteOpioidOverdoseAuthored: false as const, postoperativeRecoveryAuthored: false as const,
  sleepRelatedHypoventilationPatternAuthored: true as const,
  opioidCausalityProven: false as const, examinationPerformedByLearner: false as const,
  bloodGasAcquiredByLearner: false as const, sleepStudyAcquiredByLearner: false as const,
  sleepStudyInterpretedByLearner: false as const,
  drugOrDoseSelected: false as const, taperSelected: false as const,
  opioidChangedByLearner: false as const, naloxoneSelectedByLearner: false as const,
  naloxoneDeliveredByLearner: false as const, oxygenDeliveredByLearner: false as const,
  supportDeviceSelectedByLearner: false as const,
  treatmentDeliveredByLearner: false as const, diagnosisDetermined: false as const,
  dispositionDetermined: false as const, outcomePredicted: false as const,
};
const EMPTY = {
  trajectoryAtTick: null, evidenceAtTick: null, alternativesAtTick: null,
  coordinatedPlanAtTick: null, handoffAtTick: null, ...NEVER,
};
const LABELS = ['Review exposure + sleep trajectory', 'Review awake + sleep evidence',
  'Review contributors + alternatives', 'Connect shared safety + pain plan',
  'Hand off evidence + open work'];
const STATES = [EMPTY,
  { ...EMPTY, trajectoryAtTick: 0 },
  { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1 },
  { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1, alternativesAtTick: 2 },
  { ...EMPTY, trajectoryAtTick: 0, evidenceAtTick: 1, alternativesAtTick: 2, coordinatedPlanAtTick: 3 },
  { trajectoryAtTick: 0, evidenceAtTick: 1, alternativesAtTick: 2, coordinatedPlanAtTick: 3, handoffAtTick: 4, ...NEVER }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['chronicOpioidHypoventilationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, chronicOpioidHypoventilationAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 360, respiratoryRateBpm: 18, fio2: 0.35, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onChronicOpioidHypoventilationResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['chronicOpioidHypoventilationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Respiratory opioid-hypoventilation experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine' }));
    expect(index).toContain('href="/respiratory-medicine/scenario/chronic-opioid-related-hypoventilation-reassessment"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine/scenario/chronic-opioid-related-hypoventilation-reassessment' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers a dose change, a taper, naloxone, or a device', () => {
    expect(crisisResponseAvailability(SCENARIO).hasChronicOpioidHypoventilationResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'chronic-opioid-related-hypoventilation-reassessment'),
    }).hasChronicOpioidHypoventilationResponse).toBe(false);
    expect(lessonButtons(markup(EMPTY)).length).toBe(5);
    expect(markup(STATES[0]!)).toContain('Daytime can look quiet. Sleep can tell the fuller story.');
    expect(markup(STATES[5]!)).toContain('One breathing pattern can need more than one thoughtful owner.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/measure|examin|auscultat|order the|acquire|interpret the|naloxone|oxygen|taper|dose|drug|prescribe|stop the|reduce|CPAP|BiPAP|diagnose|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Opioid-hypoventilation tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { chronicOpioidHypoventilationGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { chronicOpioidHypoventilationGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('eight years of stable therapy');
    const next = markup(STATES[1]!, { chronicOpioidHypoventilationGuidance: 'guided' });
    expect(next).toContain('what the daytime numbers cannot');
    expect(next).not.toContain('eight years of stable therapy');
  });

  it('refuses the obvious cause rather than confirming it', () => {
    const html = markup(STATES[2]!, { chronicOpioidHypoventilationGuidance: 'guided' });
    expect(html).toContain('Refuse the obvious cause');
    expect(html).toContain('a contributor, not a proven cause');
  });

  it('warns against changing eight years of analgesia in one visit', () => {
    const html = markup(STATES[3]!, { chronicOpioidHypoventilationGuidance: 'guided' });
    expect(html).toContain('Name every owner');
    expect(html).toContain('in a single visit');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[5]!, { chronicOpioidHypoventilationGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { chronicOpioidHypoventilationGuidance: 'guided', chronicOpioidHypoventilationDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
