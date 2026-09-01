import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { LIMITATIONS } from '@platform/docs/limitations';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { HHS_OSMOLALITY_TRAJECTORY as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hhs-osmolality-trajectory';

const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['endocrineHhsAssessment']>, extra: {
  endocrineHhsGuidance?: ActionCockpitProps['endocrineHhsGuidance'];
  endocrineHhsDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, {
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, endocrineHhsAssessment: assessment },
  lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 22, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onEndocrineHhsResponse: () => {},
  ...extra,
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

describe('Endocrine HHS tutor and worked example', () => {
  const start = { supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
  const reconciled = { ...start, supportAtTick: 0, contextAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(start)).not.toContain('A moment to think');
    expect(markup(start, { endocrineHhsGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner\u2019s own recorded steps when guidance is on', () => {
    const opening = markup(start, { endocrineHhsGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Confirm who owns fluid');
    const next = markup(reconciled, { endocrineHhsGuidance: 'guided' });
    expect(next).toContain('Read the osmolality, the dehydration and the cognition as one finding');
    expect(next).not.toContain('Confirm who owns fluid');
  });

  it('never grades her progress in either direction', () => {
    const reviewed = { ...reconciled, recognitionAtTick: 2, readinessAtTick: 3, reassessmentAtTick: 4 };
    const closing = markup(reviewed, { endocrineHhsGuidance: 'guided' });
    expect(closing).toContain('what is still moving');
    expect(closing).not.toContain('she is improving');
    expect(closing).not.toContain('resolved');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { supportAtTick: 0, contextAtTick: 1, recognitionAtTick: 2, readinessAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { endocrineHhsGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Confirm prepared support';
    expect(markup(start)).toContain(label);
    const watching = markup(start, { endocrineHhsGuidance: 'guided', endocrineHhsDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});

describe('Offering the HHS worked example', () => {
  // An example nothing offers is an example nobody can watch. This asserts the
  // briefing names it as a worked example rather than the scripted demonstration.
  it('offers it from the briefing, under the worked-example label', () => {
    const briefing = renderToStaticMarkup(createElement(Prebrief, {
      limitations: LIMITATIONS, scenario: SCENARIO, region: UNITED_STATES,
      environment: 'endocrine-metabolic', guidance: 'coached',
      onGuidance: () => {}, onStart: () => {}, onWatch: () => {},
    }));
    expect(briefing).toContain('Watch a worked example');
    expect(briefing).not.toContain('Watch a 90-second demonstration');
  });
});
