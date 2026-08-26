import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ECLAMPSIA_FIRST_SEIZURE_RESPONSE as SCENARIO } from '../../src/modules/obstetrics/scenarios/eclampsia-first-seizure-response';

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsEclampsiaAssessment']>) => renderToStaticMarkup(createElement(ActionCockpit, {
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsEclampsiaAssessment: assessment },
  lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 520, respiratoryRateBpm: 22, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onObstetricsEclampsiaResponse: () => {},
} satisfies ActionCockpitProps));

describe('Obstetrics eclampsia experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/eclampsia-first-seizure-response"');
    expect(index).toContain('Eclampsia: steady the room');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/eclampsia-first-seizure-response' }));
    expect(route).toContain('<h1>Eclampsia: steady the room</h1>');
  });
  it('requires exact identity and exposes one calm action without drug, airway, or delivery controls', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsEclampsiaResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'lookalike' } }).hasObstetricsEclampsiaResponse).toBe(false);
    const missingBoundary = { ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'eclampsia-first-seizure-response-transition-boundary') };
    expect(crisisResponseAvailability(missingBoundary).hasObstetricsEclampsiaResponse).toBe(false);
    const initial = markup({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null });
    expect(initial).toContain('Read the seizure in its pregnancy context.'); expect(initial).toContain('Review seizure + pregnancy context');
    expect(initial).not.toMatch(/Magnesium|benzodiazepine|Lorazepam|Labetalol|Hydralazine|Nifedipine|\b\d+\s*(?:mg|g)\b|\bIV\b|Oxygen|Suction|Intubate|Cesarean|Deliver/);
    const recognized = markup({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null });
    expect(recognized).toContain('Activate qualified maternal response'); expect(recognized).not.toContain('Review recovery + open causes');
    const later = markup({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: null, handoffAtTick: null });
    expect(later).toContain('Review the 20-minute report'); expect(later).toContain('After the seizure, reassess the whole picture.');
    expect((later.match(/role="status"/g) ?? [])).toHaveLength(1);
  });
});
