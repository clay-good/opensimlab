/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { STEMI_RECOGNITION_AND_FIRST_ACTIONS as SCENARIO } from '../../src/modules/cardiology/scenarios/stemi-recognition-and-first-actions';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  pciCapableSetting: false as const,
  biomarkerDelayUsed: false as const,
  downstreamTherapySelected: false as const,
};
const base = (over: Record<string, unknown>) => ({
  patternAtTick: null, dangerAtTick: null, transferAtTick: null,
  bridgeAtTick: null, handoffAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['clinicStemiAssessment']>);

const EMPTY = base({});
const PATTERN = base({ patternAtTick: 0 });
const TRANSFER_ONLY = base({ patternAtTick: 0, transferAtTick: 1 });
const DANGER_ONLY = base({ patternAtTick: 0, dangerAtTick: 1 });
const BOTH = base({ patternAtTick: 0, transferAtTick: 1, dangerAtTick: 2 });
const BRIDGE = base({ patternAtTick: 0, transferAtTick: 1, dangerAtTick: 2, bridgeAtTick: 3 });
const DONE = base({ patternAtTick: 0, transferAtTick: 1, dangerAtTick: 2, bridgeAtTick: 3, handoffAtTick: 4 });
const STATES = [EMPTY, PATTERN, TRANSFER_ONLY, DANGER_ONLY, BOTH, BRIDGE, DONE];

const LABELS = ['Reconcile symptoms + fixed ECG', 'Activate EMS + regional STEMI system',
  'Screen danger in parallel', 'Record aspirin + monitored-transport intent',
  'Reassess + hand off the trajectory'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['clinicStemiAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, clinicStemiAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 16, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onClinicStemiResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['clinicStemiAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Clinic-STEMI experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/stemi-recognition-and-first-actions"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/stemi-recognition-and-first-actions' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasClinicStemiResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'stemi-recognition-and-first-actions'),
    }).hasClinicStemiResponse).toBe(false);
  });

  it('keeps all five steps on screen and offers the activation before the screen', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
    // The activation is listed above the danger screen in the tray, which is
    // the lesson's sequencing argument rather than the engine's requirement.
    const html = markup(PATTERN);
    expect(html.indexOf('Activate EMS + regional STEMI system'))
      .toBeLessThan(html.indexOf('Screen danger in parallel'));
  });

  it('never offers a drug, oxygen, a destination, or a downstream therapy', () => {
    expect(markup(EMPTY)).toContain('Recognize, then open the route.');
    expect(markup(BOTH)).toContain('Keep the bridge simple and observable.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|300 mg|ticagrelor|clopidogrel|heparin|fibrinolys|thromboly|nitrate|morphine|oxygen|diagnos|prognos/iu);
    }
  });
});

describe('Clinic-STEMI tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { clinicStemiGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { clinicStemiGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Start the clock');
    const parallel = markup(PATTERN, { clinicStemiGuidance: 'guided' });
    expect(parallel).toContain('while the phone is ringing');
    expect(parallel).not.toContain('Start the clock');
  });

  it('has a beat for a finished screen with nobody called', () => {
    const html = markup(DANGER_ONLY, { clinicStemiGuidance: 'guided' });
    expect(html).toContain('Nobody has been called');
    expect(html).toContain('moves her no closer to a catheter laboratory');
  });

  it('treats the open questions as pre-alert items', () => {
    const html = markup(TRANSFER_ONLY, { clinicStemiGuidance: 'guided' });
    expect(html).toContain('belong in the pre-alert rather than in your conclusions');
  });

  it('calls routine oxygen a habit rather than a treatment', () => {
    const html = markup(BOTH, { clinicStemiGuidance: 'guided' });
    expect(html).toContain('a habit rather than a treatment');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { clinicStemiGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { clinicStemiGuidance: 'guided', clinicStemiDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
