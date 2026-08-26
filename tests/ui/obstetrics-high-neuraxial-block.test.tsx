import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { HIGH_NEURAXIAL_BLOCK_OBSTETRIC_COORDINATION as SCENARIO } from '../../src/modules/obstetrics/scenarios/high-neuraxial-block-obstetric-coordination';

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsHighNeuraxialAssessment']>) => renderToStaticMarkup(createElement(ActionCockpit, {
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsHighNeuraxialAssessment: assessment },
  lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 8, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onObstetricsHighNeuraxialResponse: () => {},
} satisfies ActionCockpitProps));

describe('Obstetrics high-neuraxial-block experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/high-neuraxial-block-obstetric-coordination"'); expect(index).toContain('High neuraxial block: stay close, act together');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/high-neuraxial-block-obstetric-coordination' }));
    expect(route).toContain('<h1>High neuraxial block: stay close, act together</h1>');
  });

  it('requires exact identity and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsHighNeuraxialResponse).toBe(true);
    const malformed = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'high-neuraxial-block-obstetric-coordination-lookalike' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, { ...SCENARIO.timeline[0]!, id: 'bad-event', type: 'rhythm-change', target: 'pea' } as never] },
    ];
    for (const scenario of malformed) expect(crisisResponseAvailability(scenario).hasObstetricsHighNeuraxialResponse).toBe(false);
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
    const initial = markup(states[0]!); expect(initial).toContain('Stay close. Watch the block, breathing, and circulation together.'); expect(initial).toContain('Activate airway-capable response');
    const later = markup(states[4]!); expect(later).toContain('Support can improve before the block is safe.'); expect(later).toContain('Review the fixed 4-minute report'); expect((later.match(/role="status"/g) ?? [])).toHaveLength(1);
    for (const html of states.map(markup)) {
      const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => match[1]);
      expect(buttons.join(' ')).not.toMatch(/exam|sensory|oxygen|ventilat|uterine displacement|fluid|ephedrine|phenylephrine|atropine|airway device|intubat|cesarean|birth|deliver|dose|mg|mL/iu);
    }
  });
});
