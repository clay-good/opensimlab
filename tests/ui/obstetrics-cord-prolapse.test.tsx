import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { UMBILICAL_CORD_PROLAPSE_URGENT_BIRTH_COORDINATION as SCENARIO } from '../../src/modules/obstetrics/scenarios/umbilical-cord-prolapse-urgent-birth-coordination';

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsCordProlapseAssessment']>) => renderToStaticMarkup(createElement(ActionCockpit, {
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsCordProlapseAssessment: assessment },
  lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 10, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onObstetricsCordProlapseResponse: () => {},
} satisfies ActionCockpitProps));

describe('Obstetrics cord-prolapse experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/umbilical-cord-prolapse-urgent-birth-coordination"'); expect(index).toContain('Cord prolapse: protect, prepare, communicate');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/umbilical-cord-prolapse-urgent-birth-coordination' }));
    expect(route).toContain('<h1>Cord prolapse: protect, prepare, communicate</h1>');
  });

  it('requires exact identity and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsCordProlapseResponse).toBe(true);
    const malformed = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'umbilical-cord-prolapse-urgent-birth-coordination-lookalike' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, { ...SCENARIO.timeline[0]!, id: 'bad-event', type: 'rhythm-change', target: 'pea' } as never] },
    ];
    for (const scenario of malformed) expect(crisisResponseAvailability(scenario).hasObstetricsCordProlapseResponse).toBe(false);
    const states = [
      { supportAtTick: null, contextAtTick: null, bridgeAtTick: null, birthPlanAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: null, bridgeAtTick: null, birthPlanAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, bridgeAtTick: null, birthPlanAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, bridgeAtTick: 1, birthPlanAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, bridgeAtTick: 1, birthPlanAtTick: 1, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, bridgeAtTick: 1, birthPlanAtTick: 1, reassessmentAtTick: 2, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, bridgeAtTick: 1, birthPlanAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 },
    ];
    expect(states.map((state) => (markup(state).match(/<button/g) ?? []).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    const initial = markup(states[0]!); expect(initial).toContain('Protect oxygen flow. Prepare the whole path.'); expect(initial).toContain('Activate response + diagnosis clock');
    const later = markup(states[4]!); expect(later).toContain('The bridge buys attention, not certainty.'); expect(later).toContain('Review the fixed transfer report'); expect((later.match(/role="status"/g) ?? [])).toHaveLength(1);
    for (const html of states.map(markup)) {
      const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => match[1]);
      expect(buttons.join(' ')).not.toMatch(/vaginal exam|touch cord|replace cord|elevate|fill bladder|knee.chest|left lateral|terbutaline|caesarean|anesthesia|deliver|newborn care|dose|mg|mL/iu);
    }
  });
});
