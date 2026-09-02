/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { LARGE_UNILATERAL_PLEURAL_EFFUSION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/large-unilateral-pleural-effusion-reassessment';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, largeUnilateralEffusionAuthored: true as const,
  tensionPhysiologyAuthored: false as const, hemodynamicCompromiseAuthored: false as const,
  examinationPerformedByLearner: false as const, imagingAcquiredByLearner: false as const,
  ultrasoundPerformedByLearner: false as const, pleuralFluidAcquiredByLearner: false as const,
  fluidInterpretedByLearner: false as const, thoracentesisPerformedByLearner: false as const,
  deviceOrSiteSelected: false as const, drainageVolumeSelected: false as const,
  treatmentDeliveredByLearner: false as const, diagnosisDetermined: false as const,
  dispositionDetermined: false as const, outcomePredicted: false as const,
};
const EMPTY = { trajectoryAtTick: null, intentAtTick: null, responseAtTick: null, fluidAtTick: null, evaluationAtTick: null, handoffAtTick: null, ...NEVER };
const LABELS = ['Review patient + pleural pattern', 'Record guided sampling + relief intent', 'Review symptom-limited checkpoint', 'Review fluid pattern + open causes', 'Coordinate definitive evaluation', 'Hand off unresolved effusion work'];
const STATES = [EMPTY,
  { ...EMPTY, trajectoryAtTick: 0 },
  { ...EMPTY, trajectoryAtTick: 0, intentAtTick: 1 },
  { ...EMPTY, trajectoryAtTick: 0, intentAtTick: 1, responseAtTick: 2 },
  { ...EMPTY, trajectoryAtTick: 0, intentAtTick: 1, responseAtTick: 2, fluidAtTick: 3 },
  { ...EMPTY, trajectoryAtTick: 0, intentAtTick: 1, responseAtTick: 2, fluidAtTick: 3, evaluationAtTick: 4 },
  { trajectoryAtTick: 0, intentAtTick: 1, responseAtTick: 2, fluidAtTick: 3, evaluationAtTick: 4, handoffAtTick: 5, ...NEVER }];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['largePleuralEffusionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, largePleuralEffusionAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 360, respiratoryRateBpm: 18, fio2: 0.35, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onLargePleuralEffusionResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['largePleuralEffusionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Respiratory large-effusion experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine' }));
    expect(index).toContain('href="/respiratory-medicine/scenario/large-unilateral-pleural-effusion-reassessment"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine/scenario/large-unilateral-pleural-effusion-reassessment' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed and never offers a procedure, a volume, or a diagnosis', () => {
    expect(crisisResponseAvailability(SCENARIO).hasLargePleuralEffusionResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'large-unilateral-pleural-effusion-reassessment'),
    }).hasLargePleuralEffusionResponse).toBe(false);
    expect(lessonButtons(markup(EMPTY)).length).toBe(6);
    expect(markup(STATES[0]!)).toContain('The fluid is real. The cause is still open.');
    expect(markup(STATES[6]!)).toContain('Response + unresolved cause work handed off');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/measure|examin|auscultat|aspirate|drain [0-9]|thoracente|needle|catheter|litre|ml of|cytolog|microbiolog|biops|order the|send the|dose|drug|prescri|diagnose|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Large-effusion tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { largePleuralEffusionGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { largePleuralEffusionGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('six weeks of decline against how she is right now');
    const next = markup(STATES[1]!, { largePleuralEffusionGuidance: 'guided' });
    expect(next).toContain('on what terms');
    expect(next).not.toContain('six weeks of decline against how she is right now');
  });

  it('keeps the 850 mL a case fact rather than a target', () => {
    const html = markup(STATES[2]!, { largePleuralEffusionGuidance: 'guided' });
    expect(html).toContain('not a maximum to carry to the next patient');
    expect(html).toContain('the stop was driven by her symptoms');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(STATES[6]!, { largePleuralEffusionGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { largePleuralEffusionGuidance: 'guided', largePleuralEffusionDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
