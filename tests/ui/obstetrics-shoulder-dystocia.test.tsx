import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SHOULDER_DYSTOCIA_COGNITIVE_SEQUENCE as SCENARIO } from '../../src/modules/obstetrics/scenarios/shoulder-dystocia-cognitive-sequence';

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsShoulderDystociaAssessment']>) => renderToStaticMarkup(createElement(ActionCockpit, {
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsShoulderDystociaAssessment: assessment },
  lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 10, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onObstetricsShoulderDystociaResponse: () => {},
} satisfies ActionCockpitProps));

describe('Obstetrics shoulder-dystocia experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/shoulder-dystocia-cognitive-sequence"'); expect(index).toContain('Shoulder dystocia: calm, coordinated sequence');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/shoulder-dystocia-cognitive-sequence' }));
    expect(route).toContain('<h1>Shoulder dystocia: calm, coordinated sequence</h1>');
  });

  it('requires exact narrative identity and exposes one calm serial action', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsShoulderDystociaResponse).toBe(true);
    const malformed = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'shoulder-dystocia-cognitive-sequence-lookalike' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, { ...SCENARIO.timeline[0]!, id: 'bad-event', type: 'rhythm-change', target: 'pea' } as never] },
    ];
    for (const scenario of malformed) expect(crisisResponseAvailability(scenario).hasObstetricsShoulderDystociaResponse).toBe(false);
    const states = [
      { supportAtTick: null, contextAtTick: null, safetyAtTick: null, escalationAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: null, safetyAtTick: null, escalationAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, safetyAtTick: null, escalationAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, safetyAtTick: 1, escalationAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, safetyAtTick: 1, escalationAtTick: 1, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, safetyAtTick: 1, escalationAtTick: 1, reassessmentAtTick: 2, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, safetyAtTick: 1, escalationAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 },
    ];
    expect(states.map((state) => (markup(state).match(/<button/g) ?? []).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    const initial = markup(states[0]!); expect(initial).toContain('Slow the room down. Start the clock.'); expect(initial).toContain('Activate response + head clock');
    const later = markup(states[4]!); expect(later).toContain('The birth ends. The care does not.'); expect(later).toContain('Review the fixed birth report'); expect((later.match(/role="status"/g) ?? [])).toHaveLength(1);
    for (const html of states.map(markup)) {
      const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => match[1]);
      expect(buttons.join(' ')).not.toMatch(/McRoberts|suprapubic|fundal|traction|posterior arm|episiotomy|deliver newborn|resuscitate|oxytocin|dose|mg|mL/iu);
    }
  });
});
