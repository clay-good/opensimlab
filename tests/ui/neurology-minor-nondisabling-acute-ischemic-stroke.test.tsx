import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE as SCENARIO } from '../../src/modules/neurology/scenarios/minor-nondisabling-acute-ischemic-stroke';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyMinorStrokeAssessment']>, extra: {
  neurologyMinorStrokeGuidance?: ActionCockpitProps['neurologyMinorStrokeGuidance'];
  neurologyMinorStrokeDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyMinorStrokeAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyMinorStrokeResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, threatsAtTick: null, boundaryAtTick: null, intentAtTick: null, laterAtTick: null, handoffAtTick: null };
const LABELS = ['Review clock + deficit + function', 'Review imaging + immediate threats', 'Recognize the functional boundary', 'Record qualified strategy + surveillance', 'Review the later neurologic report', 'Hand off cause + recurrence risk'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Neurology minor-stroke experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology' }));
    expect(index).toContain('href="/neurology/scenario/minor-nondisabling-acute-ischemic-stroke"');
    expect(index).toContain('Minor nondisabling acute ischemic stroke');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology/scenario/minor-nondisabling-acute-ischemic-stroke' }));
    expect(route).toContain('<h1>Minor nondisabling acute ischemic stroke</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeurologyMinorStrokeResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeurologyMinorStrokeResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, threatsAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, threatsAtTick: 1, boundaryAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, threatsAtTick: 1, boundaryAtTick: 2, intentAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, threatsAtTick: 1, boundaryAtTick: 2, intentAtTick: 3, laterAtTick: 4 },
      { trajectoryAtTick: 0, threatsAtTick: 1, boundaryAtTick: 2, intentAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Function, not one score.');
    const later = markup(states[4]!);
    expect(later).toContain('Trajectory keeps the plan honest.');
    expect(later).toContain('Qualified strategy is recorded. Review the fixed later neurologic report.');
    expect(markup(states[5]!)).toContain('Stability does not close cause or recurrence risk.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|nihss|score|measure|aspirin|clopidogrel|antiplatelet|thrombolys|alteplase|tenecteplase|thrombectom|reperfus|device|dose|duration|route|drug|infusion|access|prescri|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Minor-stroke tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, threatsAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { neurologyMinorStrokeGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { neurologyMinorStrokeGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Say what she can still do');
    const next = markup(named, { neurologyMinorStrokeGuidance: 'guided' });
    expect(next).toContain('Call it nondisabling for her');
    expect(next).not.toContain('Say what she can still do');
  });

  it('refuses to let the score stand in for the workup', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { neurologyMinorStrokeGuidance: 'guided' });
    expect(html).toContain('A score cannot stand in for any of this');
    expect(html).toContain('snapshots taken once');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, threatsAtTick: 1, boundaryAtTick: 2, intentAtTick: 3, laterAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neurologyMinorStrokeGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Review clock + deficit + function';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { neurologyMinorStrokeGuidance: 'guided', neurologyMinorStrokeDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
