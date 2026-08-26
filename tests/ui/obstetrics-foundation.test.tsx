import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { POSTPARTUM_HEMORRHAGE_UTERINE_ATONY as SCENARIO } from '../../src/modules/obstetrics/scenarios/postpartum-hemorrhage-uterine-atony';

const cockpitMarkup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsAtonyAssessment']>) => renderToStaticMarkup(createElement(ActionCockpit, {
  scenario: SCENARIO, region: UNITED_STATES, infusions: [],
  hypnoticLine: { connected: true, inspected: false },
  resuscitation: {
    epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
    lastEpinephrineTick: null, crystalloidTotalMl: 0,
    dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
    lastDantroleneTick: null, activeCooling: false, obstetricsAtonyAssessment: assessment,
  },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 24,
    fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 },
  intubated: false, airwayAttempts: 0, lastGrade: null,
  jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
  muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {},
  onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {},
  onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {},
  onActiveCooling: () => {}, onDrugCard: () => {}, onObstetricsAtonyResponse: () => {},
} satisfies ActionCockpitProps));

describe('Obstetrics module user-facing foundation', () => {
  it('renders a calm index, exact scenario route, and delivery-room prebrief', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('<h1>Obstetrics simulator</h1>');
    expect(index).toContain('href="/obstetrics" aria-current="page"');
    expect(index).toContain('href="/obstetrics/scenario/postpartum-hemorrhage-uterine-atony"');
    expect(index).toContain('Postpartum hemorrhage: act early and keep every cause open');
    const scenario = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/postpartum-hemorrhage-uterine-atony' }));
    expect(scenario).toContain('<h1>Postpartum hemorrhage: act early and keep every cause open</h1>');
    const prebrief = renderToStaticMarkup(createElement(Prebrief, { scenario: SCENARIO,
      region: UNITED_STATES, environment: 'obstetrics', guidance: 'coached',
      onGuidance: () => {}, onStart: () => {} }));
    expect(prebrief).toContain('The supplied birth record, maternal findings, family context, and monitor stay visible');
    expect(prebrief).not.toContain('ASA 4');
  });

  it('requires exact route identity and exposes only the calm bounded sequence', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsAtonyResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'lookalike' } }).hasObstetricsAtonyResponse).toBe(false);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasObstetricsAtonyResponse).toBe(false);
    const initial = cockpitMarkup({ trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null });
    expect(initial).toContain('See the bleeding early. Bring calm around it.');
    expect(initial).toContain('Connect birth + whole person');
    expect(initial).not.toContain('Give oxytocin');
    expect(initial).not.toContain('Give blood');
    const later = cockpitMarkup({ trajectoryAtTick: 1, recognitionAtTick: 1, supportAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: null, handoffAtTick: null });
    expect(later).toContain('Record bundle + reassess');
    expect(later).toContain('Slower bleeding is a checkpoint, not closure.');
  });
});
