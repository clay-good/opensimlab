import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { MAGNESIUM_SULFATE_TOXICITY_RECOGNITION as SCENARIO } from '../../src/modules/obstetrics/scenarios/magnesium-sulfate-toxicity-recognition';

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsMagnesiumToxicityAssessment']>) => renderToStaticMarkup(createElement(ActionCockpit, {
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsMagnesiumToxicityAssessment: assessment },
  lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 10, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onObstetricsMagnesiumToxicityResponse: () => {},
} satisfies ActionCockpitProps));

describe('Obstetrics magnesium-toxicity experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/magnesium-sulfate-toxicity-recognition"'); expect(index).toContain('Magnesium toxicity: notice the quiet change');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/magnesium-sulfate-toxicity-recognition' }));
    expect(route).toContain('<h1>Magnesium toxicity: notice the quiet change</h1>');
  });

  it('requires exact identity and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsMagnesiumToxicityResponse).toBe(true);
    const malformed = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'magnesium-sulfate-toxicity-recognition-lookalike' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, { ...SCENARIO.timeline[0]!, id: 'bad-event', type: 'rhythm-change', target: 'pea' } as never] },
    ];
    for (const scenario of malformed) expect(crisisResponseAvailability(scenario).hasObstetricsMagnesiumToxicityResponse).toBe(false);
    const states = [
      { supportAtTick: null, contextAtTick: null, uncertaintyAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: null, uncertaintyAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, uncertaintyAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, uncertaintyAtTick: 1, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, uncertaintyAtTick: 1, readinessAtTick: 1, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, uncertaintyAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, uncertaintyAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 },
    ];
    expect(states.map((state) => (markup(state).match(/<button/g) ?? []).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    const initial = markup(states[0]!); expect(initial).toContain('Notice the quiet change. Bring the whole team close.'); expect(initial).toContain('Activate airway-capable response');
    const later = markup(states[4]!); expect(later).toContain('A better number is not yet a safe person.'); expect(later).toContain('Review the fixed 5-minute report'); expect((later.match(/role="status"/g) ?? [])).toHaveLength(1);
    for (const html of states.map(markup)) {
      const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => match[1]);
      expect(buttons.join(' ')).not.toMatch(/exam|reflex|stop infusion|oxygen|ventilat|calcium|gluconate|airway device|intubat|dose|mg|mL|route|rate/iu);
    }
  });
});
