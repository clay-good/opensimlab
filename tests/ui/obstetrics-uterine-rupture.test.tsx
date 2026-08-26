import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SUSPECTED_UTERINE_RUPTURE_RECOGNITION as SCENARIO } from '../../src/modules/obstetrics/scenarios/suspected-uterine-rupture-recognition';

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsUterineRuptureAssessment']>) => renderToStaticMarkup(createElement(ActionCockpit, {
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsUterineRuptureAssessment: assessment },
  lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 10, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onObstetricsUterineRuptureResponse: () => {},
} satisfies ActionCockpitProps));

describe('Obstetrics suspected-uterine-rupture experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/suspected-uterine-rupture-recognition"'); expect(index).toContain('Suspected uterine rupture: see the whole pattern');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/suspected-uterine-rupture-recognition' }));
    expect(route).toContain('<h1>Suspected uterine rupture: see the whole pattern</h1>');
  });

  it('requires exact identity and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsUterineRuptureResponse).toBe(true);
    const malformed = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'suspected-uterine-rupture-recognition-lookalike' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, { ...SCENARIO.timeline[0]!, id: 'bad-event', type: 'rhythm-change', target: 'pea' } as never] },
    ];
    for (const scenario of malformed) expect(crisisResponseAvailability(scenario).hasObstetricsUterineRuptureResponse).toBe(false);
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
    const initial = markup(states[0]!); expect(initial).toContain('Act on the pattern. Keep the diagnosis honest.'); expect(initial).toContain('Activate suspected-rupture response');
    const later = markup(states[4]!); expect(later).toContain('The operation answers what the monitor cannot.'); expect(later).toContain('Review the fixed theatre report'); expect((later.match(/role="status"/g) ?? [])).toHaveLength(1);
    for (const html of states.map(markup)) {
      const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => match[1]);
      expect(buttons.join(' ')).not.toMatch(/CTG|exam|oxytocin|oxygen|fluid|blood|anesthesia|caesarean|laparotomy|hysterectomy|dose|mg|mL/iu);
    }
  });
});
