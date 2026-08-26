import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { MATERNAL_SEPSIS_POSTPARTUM_DETERIORATION as SCENARIO } from '../../src/modules/obstetrics/scenarios/maternal-sepsis-postpartum-deterioration';

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsMaternalSepsisAssessment']>) => renderToStaticMarkup(createElement(ActionCockpit, {
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsMaternalSepsisAssessment: assessment },
  lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 28, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onObstetricsMaternalSepsisResponse: () => {},
} satisfies ActionCockpitProps));

describe('Obstetrics maternal-sepsis experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/maternal-sepsis-postpartum-deterioration"');
    expect(index).toContain('Maternal sepsis: see organ dysfunction and move together');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/maternal-sepsis-postpartum-deterioration' }));
    expect(route).toContain('<h1>Maternal sepsis: see organ dysfunction and move together</h1>');
  });
  it('requires exact identity and exposes the bounded sequence without treatment controls', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsMaternalSepsisResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'lookalike' } }).hasObstetricsMaternalSepsisResponse).toBe(false);
    const initial = markup({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null });
    expect(initial).toContain('Notice the whole person. Move together.'); expect(initial).toContain('Connect infection + organs');
    expect(initial).not.toMatch(/Give antibiotic|Give fluid|Start norepinephrine/);
    const later = markup({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: null, handoffAtTick: null });
    expect(later).toContain('Record care intent + reassess'); expect(later).toContain('A better number is a checkpoint, not recovery.');
  });
});
