import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { HHS_OSMOLALITY_TRAJECTORY as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hhs-osmolality-trajectory';

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['endocrineHhsAssessment']>) => renderToStaticMarkup(createElement(ActionCockpit, {
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, endocrineHhsAssessment: assessment },
  lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 22, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onEndocrineHhsResponse: () => {},
} satisfies ActionCockpitProps));

describe('Endocrine HHS experience', () => {
  it('renders the exact indexable briefing with nonperioperative patient details', () => {
    const html = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/endocrine-metabolic/scenario/hhs-osmolality-trajectory' }));
    expect(html).toContain('<h1>HHS: follow the whole trajectory</h1>');
    expect(html).toContain('HHS correction and reassessment rehearsal');
    expect(html).not.toContain('ASA 4');
    expect(crisisResponseAvailability(SCENARIO).hasEndocrineHhsResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasEndocrineHhsResponse).toBe(false);
  });
  it('keeps each panel visible with one cognitive action and no treatment controls', () => {
    const fields = ['supportAtTick', 'contextAtTick', 'recognitionAtTick', 'readinessAtTick', 'reassessmentAtTick', 'handoffAtTick'] as const;
    const initial = { supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
    const states = Array.from({ length: 7 }, (_, step) => ({ ...initial, ...Object.fromEntries(fields.slice(0, step).map((field, index) => [field, index + 1])) }));
    expect(states.map((state) => (markup(state).match(/<button/g) ?? []).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(initial)).toContain('glucose 900 mg/dL, sodium 146 mmol/L, total osmolality 362 mOsm/kg');
    expect(markup(states[5]!)).toContain('glucose 540 mg/dL, sodium 149 mmol/L, total osmolality 343 mOsm/kg');
    expect(markup(states[5]!)).toContain('cognition still below baseline');
    for (const state of states) {
      const html = markup(state);
      expect((html.match(/role="status"/g) ?? [])).toHaveLength(1);
      const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => match[1]);
      expect(buttons.join(' ')).not.toMatch(/history|examin|measure|calculate|insulin|fluid|electrolyte|drug|dose|infusion|nutrition|prescrib|administer|diagnos|discharge/iu);
    }
  });
});
