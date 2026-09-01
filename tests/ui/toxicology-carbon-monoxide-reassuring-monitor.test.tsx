import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { CARBON_MONOXIDE_REASSURING_MONITOR as SCENARIO } from '../../src/modules/toxicology/scenarios/carbon-monoxide-reassuring-monitor';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['toxicologyCarbonMonoxideAssessment']>, extra: {
  toxicologyCarbonMonoxideGuidance?: ActionCockpitProps['toxicologyCarbonMonoxideGuidance'];
  toxicologyCarbonMonoxideDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, toxicologyCarbonMonoxideAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onToxicologyCarbonMonoxideResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, severityAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
const LABELS = ['Connect exposure + patient', 'See past the pulse ox', 'Make the scene + patient safe', 'Read severity in context', 'Consult + reassess', 'Hand off what can emerge'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Toxicology carbon-monoxide experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology' }));
    expect(index).toContain('href="/toxicology/scenario/carbon-monoxide-reassuring-monitor"');
    expect(index).toContain('Carbon monoxide with a reassuring monitor');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/carbon-monoxide-reassuring-monitor' }));
    expect(route).toContain('<h1>Carbon monoxide with a reassuring monitor</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasToxicologyCarbonMonoxideResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasToxicologyCarbonMonoxideResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, severityAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, severityAtTick: 3, reassessmentAtTick: 4 },
      { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, severityAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('A calm monitor can still hide a poisoned patient.');
    const later = markup(states[4]!);
    expect(later).toContain('A lower number is progress, not permission to forget.');
    expect(later).toContain('not a severity score');
    expect(markup(states[5]!)).toContain('Delayed neurologic and cardiac risk remain open.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|gas|calculat|ventilat|oxygen|device|dose|route|drug|infusion|access|fluid|chamber|hyperbaric|transport|procedure|diagnos|disposition|discharge|prognos/iu);
    }
  });
});

describe('Carbon-monoxide tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, recognitionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { toxicologyCarbonMonoxideGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { toxicologyCarbonMonoxideGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Say the exposure, the clock, and the syncope');
    const next = markup(named, { toxicologyCarbonMonoxideGuidance: 'guided' });
    expect(next).toContain('Move on the scene and the other person');
    expect(next).not.toContain('Say the exposure, the clock, and the syncope');
  });

  it('refuses to let the reassuring reading argue', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { toxicologyCarbonMonoxideGuidance: 'guided' });
    expect(html).toContain('cannot rule out carbon-monoxide poisoning');
    expect(html).toContain('stay open');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, recognitionAtTick: 1, supportAtTick: 2, severityAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { toxicologyCarbonMonoxideGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Connect exposure + patient';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { toxicologyCarbonMonoxideGuidance: 'guided', toxicologyCarbonMonoxideDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
