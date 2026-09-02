/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { NSTEMI_RISK_REASSESSMENT as SCENARIO } from '../../src/modules/cardiology/scenarios/nstemi-risk-reassessment';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  ischemicRisk: 'high' as const,
  currentVeryHighRisk: false as const,
  exactScoreCalculated: false as const,
  procedurePerformed: false as const,
};
const base = (over: Record<string, unknown>) => ({
  trajectoryAtTick: null, verificationAtTick: null, veryHighRiskAtTick: null,
  strategyAtTick: null, handoffAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['nstemiRiskAssessment']>);

const EMPTY = base({});
const TRAJECTORY = base({ trajectoryAtTick: 0 });
const VERIFIED = base({ trajectoryAtTick: 0, verificationAtTick: 1 });
const SCREENED = base({ trajectoryAtTick: 0, verificationAtTick: 1, veryHighRiskAtTick: 2 });
const STRATEGY = base({ trajectoryAtTick: 0, verificationAtTick: 1, veryHighRiskAtTick: 2, strategyAtTick: 3 });
const DONE = base({ trajectoryAtTick: 0, verificationAtTick: 1, veryHighRiskAtTick: 2, strategyAtTick: 3, handoffAtTick: 4 });
const STATES = [EMPTY, TRAJECTORY, VERIFIED, SCREENED, STRATEGY, DONE];

const LABELS = ['Reconcile the serial trajectory', 'Verify NSTEMI + preserve alternatives',
  'Re-screen very-high-risk features', 'Record region-bounded invasive intent',
  'Record triggers + owner + reassessment'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['nstemiRiskAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, nstemiRiskAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 16, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onNstemiRiskResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['nstemiRiskAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('NSTEMI risk-reassessment experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/nstemi-risk-reassessment"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/nstemi-risk-reassessment' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNstemiRiskResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'nstemi-risk-reassessment'),
    }).hasNstemiRiskResponse).toBe(false);
  });

  it('keeps all five steps on screen', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
  });

  it('never offers a score, an hour, a drug, or a procedure', () => {
    expect(markup(EMPTY)).toContain('Risk is a moving picture.');
    expect(markup(SCREENED)).toContain('Timing follows risk, patient, region, and system.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|GRACE|TIMI|within \d+ hours|ticagrelor|heparin|angiogra|PCI|diagnos|prognos/iu);
    }
  });
});

describe('NSTEMI risk tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { nstemiRiskGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { nstemiRiskGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Three things moved');
    const verification = markup(TRAJECTORY, { nstemiRiskGuidance: 'guided' });
    expect(verification).toContain('keep the other reasons for a rising troponin in the room');
    expect(verification).not.toContain('Three things moved');
  });

  it('refuses inherited stability by name', () => {
    const html = markup(VERIFIED, { nstemiRiskGuidance: 'guided' });
    expect(html).toContain('Do not inherit her stability from an earlier note');
    expect(html).toContain('the only thing that catches a change');
  });

  it('treats bleeding risk as load-bearing and timing as regional', () => {
    const html = markup(SCREENED, { nstemiRiskGuidance: 'guided' });
    expect(html).toContain('the same catheter that treats the first raises the second');
    expect(html).toContain('teaches none of them as the answer');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { nstemiRiskGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { nstemiRiskGuidance: 'guided', nstemiRiskDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
