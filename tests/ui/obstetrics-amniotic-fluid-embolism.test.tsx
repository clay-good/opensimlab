import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SUSPECTED_AMNIOTIC_FLUID_EMBOLISM_PATTERN as SCENARIO } from '../../src/modules/obstetrics/scenarios/suspected-amniotic-fluid-embolism-pattern';

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['obstetricsAfeAssessment']>) => renderToStaticMarkup(createElement(ActionCockpit, {
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, obstetricsAfeAssessment: assessment },
  lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 34, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onObstetricsAfeResponse: () => {},
} satisfies ActionCockpitProps));

describe('Obstetrics suspected amniotic fluid embolism experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics' }));
    expect(index).toContain('href="/obstetrics/scenario/suspected-amniotic-fluid-embolism-pattern"'); expect(index).toContain('Suspected amniotic fluid embolism pattern');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/obstetrics/scenario/suspected-amniotic-fluid-embolism-pattern' })); expect(route).toContain('<h1>Suspected amniotic fluid embolism pattern</h1>');
  });
  it('requires exact identity and exposes one calm serial action without treatment or arrest controls', () => {
    expect(crisisResponseAvailability(SCENARIO).hasObstetricsAfeResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'suspected-amniotic-fluid-embolism-pattern-lookalike' } }).hasObstetricsAfeResponse).toBe(false);
    const missingBoundary = { ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'suspected-amniotic-fluid-embolism-pattern-transition-boundary') }; expect(crisisResponseAvailability(missingBoundary).hasObstetricsAfeResponse).toBe(false);
    const states = [
      { supportAtTick: null, trajectoryAtTick: null, recognitionAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, trajectoryAtTick: null, recognitionAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, trajectoryAtTick: 1, recognitionAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, trajectoryAtTick: 1, recognitionAtTick: 1, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, trajectoryAtTick: 1, recognitionAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: null, handoffAtTick: null },
      { supportAtTick: 1, trajectoryAtTick: 1, recognitionAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: null },
      { supportAtTick: 1, trajectoryAtTick: 1, recognitionAtTick: 1, evidenceAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 },
    ];
    expect(states.map((state) => (markup(state).match(/<button/g) ?? []).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    const initial = markup(states[0]!); expect(initial).toContain('Connect the sudden whole-body change.'); expect(initial).toContain('Activate coordinated response');
    const later = markup(states[4]!); expect(later).toContain('Review the 12-minute report'); expect(later).toContain('Reassess breathing, circulation, and bleeding.'); expect((later.match(/role="status"/g) ?? [])).toHaveLength(1);
    for (const html of states.map(markup)) expect(html).not.toMatch(/Confirm AFE|Diagnose|Intubate|Ventilate|Oxygen|Epinephrine|Vasopressor|Blood product|Tranexamic|Uterotonic|CPR|Defibrillate|ECMO|Cesarean|Deliver|\b\d+\s*(?:mg|g)\b|\bIV\b/);
  });
});
