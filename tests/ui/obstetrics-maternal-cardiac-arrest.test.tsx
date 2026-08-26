import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { monitorUnavailableParameters } from '@anesthesia/ui/Cockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { MATERNAL_CARDIAC_ARREST_COORDINATED_RESPONSE as SCENARIO } from '../../src/modules/obstetrics/scenarios/maternal-cardiac-arrest-coordinated-response';

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsMaternalArrestAssessment']>) => renderToStaticMarkup(createElement(ActionCockpit, {
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsMaternalArrestAssessment: assessment },
  lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onObstetricsMaternalArrestResponse: () => {},
} satisfies ActionCockpitProps));

describe('Obstetrics maternal cardiac-arrest experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/maternal-cardiac-arrest-coordinated-response"'); expect(index).toContain('Maternal cardiac arrest: coordinated care');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/maternal-cardiac-arrest-coordinated-response' })); expect(route).toContain('<h1>Maternal cardiac arrest: coordinated care</h1>');
    const prebrief = renderToStaticMarkup(createElement(Prebrief, { scenario: SCENARIO, region: UNITED_STATES, environment: 'obstetrics', onStart: () => {}, guidance: 'coached', onGuidance: () => {} }));
    expect(prebrief).toContain('without a central pulse or obtainable blood pressure');
    expect(prebrief).not.toContain('mean arterial pressure 40 mmHg');
  });

  it('requires exact narrative identity, masks generic arrest trays, and exposes one calm serial action', () => {
    const availability = crisisResponseAvailability(SCENARIO, ['cardiac-arrest-shockable', 'cardiac-arrest-non-shockable']);
    expect(availability.hasObstetricsMaternalArrestResponse).toBe(true); expect(availability.hasCardiacArrestResponse).toBe(false);
    const malformed = [
      { ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'maternal-cardiac-arrest-coordinated-response-lookalike' } },
      { ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, SCENARIO.timeline[0]!] },
      { ...SCENARIO, timeline: [...SCENARIO.timeline, { ...SCENARIO.timeline[0]!, id: 'bad-event', type: 'rhythm-change', target: 'pea' } as never] },
    ];
    for (const scenario of malformed) expect(crisisResponseAvailability(scenario).hasObstetricsMaternalArrestResponse).toBe(false);
    const states = [
      { supportAtTick: null, contextAtTick: null, modificationsAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: null, modificationsAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, modificationsAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, modificationsAtTick: 1, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, modificationsAtTick: 1, readinessAtTick: 1, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, modificationsAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: null },
      { supportAtTick: 1, contextAtTick: 1, modificationsAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 },
    ];
    expect(states.map((state) => (markup(state).match(/<button/g) ?? []).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    const initial = markup(states[0]!); expect(initial).toContain('Make the whole team ready at once.'); expect(initial).toContain('Activate prepared response + clock');
    const later = markup(states[4]!); expect(later).toContain('Minute 4 is a readiness checkpoint.'); expect(later).toContain('Review the minute-4 report'); expect((later.match(/role="status"/g) ?? [])).toHaveLength(1);
    for (const html of states.map(markup)) expect(html).not.toMatch(/Start CPR|Chest compressions|Defibrillate|Shock|Epinephrine|Amiodarone|Intubate|Ventilate|Oxygen|IV access|IO access|Fetal monitor|Perform delivery|Cesarean|Incision|ECMO|Survived|Died|Successful|\b\d+\s*(?:mg|g|J)\b/);
  });

  it('keeps unavailable mechanical monitor channels out of the arrest display', () => {
    const unavailable = monitorUnavailableParameters(['existing-channel'], true);
    expect([...unavailable]).toEqual([
      'existing-channel', 'meanArterialMmHg', 'spo2Percent', 'etco2MmHg',
    ]);
    expect(monitorUnavailableParameters(['existing-channel'], false)).toEqual(
      new Set(['existing-channel']),
    );
  });
});
