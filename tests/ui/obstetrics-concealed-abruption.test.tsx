import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { CONCEALED_PLACENTAL_ABRUPTION_HEMORRHAGE as SCENARIO } from '../../src/modules/obstetrics/scenarios/concealed-placental-abruption-hemorrhage';

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsConcealedAbruptionAssessment']>) => renderToStaticMarkup(createElement(ActionCockpit, {
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsConcealedAbruptionAssessment: assessment },
  lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 26, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onObstetricsConcealedAbruptionResponse: () => {},
} satisfies ActionCockpitProps));

describe('Obstetrics concealed-abruption experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/concealed-placental-abruption-hemorrhage"');
    expect(index).toContain('Concealed hemorrhage: trust the whole maternal-fetal pattern');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/concealed-placental-abruption-hemorrhage' }));
    expect(route).toContain('<h1>Concealed hemorrhage: trust the whole maternal-fetal pattern</h1>');
  });
  it('requires exact identity and exposes the bounded sequence without treatment controls', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsConcealedAbruptionResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'lookalike' } }).hasObstetricsConcealedAbruptionResponse).toBe(false);
    const initial = markup({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null });
    expect(initial).toContain('Look beyond what you can see.'); expect(initial).toContain('Connect mother + fetus');
    expect(initial).not.toMatch(/Give blood|Give fluid|Perform delivery|Select anesthesia/);
    const later = markup({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: null, handoffAtTick: null });
    expect(later).toContain('Record urgent intent + reassess'); expect(later).toContain('Readiness is progress. It is not resolution.');
  });
});
