/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { HEMORRHAGIC_SHOCK as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/hemorrhagic-shock';

type Assessment = NonNullable<ActionCockpitProps['resuscitation']['hemorrhagicShockAssessment']>;

const base = (over: Partial<Assessment>) => ({
  mechanismAndPerfusionReviewedAtTick: null, pelvicStabilizationAtTick: null,
  majorHemorrhageActivatedAtTick: null, redCellsAtTick: null,
  coagulationAndTemperatureAtTick: null, reassessedAtTick: null,
  definitiveControlEscalatedAtTick: null, ...over,
} as Assessment);

const EMPTY = base({});
const RECOGNIZED = base({ mechanismAndPerfusionReviewedAtTick: 1 });
// The two lanes, each run on its own: the tray has to hold both open.
const CONTROL_ONLY = base({ mechanismAndPerfusionReviewedAtTick: 1, pelvicStabilizationAtTick: 2, definitiveControlEscalatedAtTick: 3 });
const BLOOD_ONLY = base({ mechanismAndPerfusionReviewedAtTick: 1, majorHemorrhageActivatedAtTick: 2, redCellsAtTick: 3, coagulationAndTemperatureAtTick: 4 });
const BOTH = base({ mechanismAndPerfusionReviewedAtTick: 1, pelvicStabilizationAtTick: 2, definitiveControlEscalatedAtTick: 3, majorHemorrhageActivatedAtTick: 4, redCellsAtTick: 5, coagulationAndTemperatureAtTick: 6 });
const DONE = base({ ...BOTH, reassessedAtTick: 7 });
const STATES = [EMPTY, RECOGNIZED, CONTROL_ONLY, BLOOD_ONLY, BOTH, DONE];

const LABELS = ['Review mechanism + perfusion', 'Record pelvic stabilization',
  'Escalate definitive bleeding control', 'Activate major-hemorrhage response',
  'Give fixed 2-unit red-cell bridge', 'Review coagulation + temperature', 'Reassess perfusion'];

const props = (assessment: Assessment, extra: Partial<ActionCockpitProps> = {}): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, hemorrhagicShockAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onHemorrhagicShockAssessment: () => {}, ...extra,
});

const markup = (assessment: Assessment, extra: Partial<ActionCockpitProps> = {}) =>
  renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Emergency hemorrhagic shock experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/hemorrhagic-shock"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/hemorrhagic-shock' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline event type rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasHemorrhagicShockResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.type !== 'hemorrhagic-shock-pattern'),
    }).hasHemorrhagicShockResponse).toBe(false);
  });

  it('keeps all seven recorded steps on screen', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(7);
    }
  });

  it('holds both lanes open at once, because neither waits for the other', () => {
    const openLabels = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
      .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
      .filter((match) => !/ disabled=""/.test(match[0]))
      .map((match) => match[1]!);
    expect(openLabels(markup(EMPTY))).toHaveLength(1);
    // Recognition opens the head of each lane, not one step of one chain.
    expect(openLabels(markup(RECOGNIZED))).toHaveLength(2);
    expect(openLabels(markup(CONTROL_ONLY)).join(' ')).toContain('Activate major-hemorrhage response');
    expect(openLabels(markup(BLOOD_ONLY)).join(' ')).toContain('Record pelvic stabilization');
    expect(openLabels(markup(BOTH))).toEqual(['Reassess perfusion']);
    expect(openLabels(markup(DONE))).toHaveLength(0);
  });

  it('never offers a ratio, a procedure, or an outcome', () => {
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' '))
        .not.toMatch(/TXA|calcium|ratio|embol|packing|REBOA|laparotom|outcome|survi/iu);
    }
    expect(markup(EMPTY)).toContain('No TXA, calcium, component ratio, procedure');
  });
});

describe('Emergency hemorrhagic shock tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { hemorrhagicShockGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { hemorrhagicShockGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('waiting for a sign this injury does not produce');
    const stabilize = markup(RECOGNIZED, { hemorrhagicShockGuidance: 'guided' });
    expect(stabilize).toContain('a thing your hands can do in the meantime');
    expect(stabilize).not.toContain('waiting for a sign this injury does not produce');
  });

  it('goes back to the unfinished lane when the learner has only run the other', () => {
    expect(markup(BLOOD_ONLY, { hemorrhagicShockGuidance: 'guided' }))
      .toContain('a thing your hands can do in the meantime');
    expect(markup(CONTROL_ONLY, { hemorrhagicShockGuidance: 'guided' }))
      .toContain('one negotiated unit at a time');
  });

  it('insists the bridge cannot touch the source', () => {
    expect(markup(BOTH, { hemorrhagicShockGuidance: 'guided' }))
      .toContain('means nothing at all about the source');
  });

  it('goes quiet once the reassessment is recorded', () => {
    expect(markup(DONE, { hemorrhagicShockGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { hemorrhagicShockGuidance: 'guided', hemorrhagicShockDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
