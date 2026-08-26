import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { POSTPARTUM_SEVERE_PREECLAMPSIA_WARNING_SIGNS as SCENARIO } from '../../src/modules/obstetrics/scenarios/postpartum-severe-preeclampsia-warning-signs';

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsPostpartumPreeclampsiaAssessment']>) => renderToStaticMarkup(createElement(ActionCockpit, {
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsPostpartumPreeclampsiaAssessment: assessment },
  lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 20, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onObstetricsPostpartumPreeclampsiaResponse: () => {},
} satisfies ActionCockpitProps));

describe('Obstetrics postpartum severe-preeclampsia experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/postpartum-severe-preeclampsia-warning-signs"');
    expect(index).toContain('Postpartum severe preeclampsia: listen, connect, escalate');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/postpartum-severe-preeclampsia-warning-signs' }));
    expect(route).toContain('<h1>Postpartum severe preeclampsia: listen, connect, escalate</h1>');
  });
  it('requires exact identity and makes urgent activation precede parallel review without treatment controls', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsPostpartumPreeclampsiaResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'lookalike' } }).hasObstetricsPostpartumPreeclampsiaResponse).toBe(false);
    const initial = markup({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null });
    expect(initial).toContain('Listen past the pressure.'); expect(initial).toContain('Connect pressure + whole person');
    expect(initial).not.toMatch(/Labetalol|Hydralazine|Nifedipine|Magnesium|20 mg|4 g|IV|Give oxygen|Perform delivery|Cesarean/);
    const recognized = markup({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null });
    expect(recognized).toContain('Activate urgent response now'); expect(recognized).not.toContain('Review organs + open causes');
    const later = markup({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: null, handoffAtTick: null });
    expect(later).toContain('Review the later report'); expect(later).toContain('A better pressure is one checkpoint.');
  });
});
