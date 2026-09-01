import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { DKA_RESOLUTION_TRANSITION as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/dka-resolution-transition';
import { LIMITATIONS } from '@platform/docs/limitations';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['endocrineDkaResolutionAssessment']>, extra: {
  endocrineDkaResolutionGuidance?: ActionCockpitProps['endocrineDkaResolutionGuidance'];
  endocrineDkaResolutionDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, endocrineDkaResolutionAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onEndocrineDkaResolutionResponse: () => {}, ...extra } satisfies ActionCockpitProps));
describe('Endocrine DKA resolution experience', () => {
  it('keeps the supplied biochemical panel visible without opening the log', () => {
    const initial = { supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
    expect(markup(initial)).toContain('glucose 184 mg/dL, ketones 1.2 mmol/L');
    expect(markup({ ...initial, reassessmentAtTick: 2 })).toContain('glucose 162 mg/dL, ketones 0.4 mmol/L');
  });
  it('renders the exact module, scenario, and nonperioperative prebrief', () => { const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/endocrine-metabolic' })); expect(index).toContain('href="/endocrine-metabolic/scenario/dka-resolution-transition"'); expect(index).toContain('Endocrine and metabolic medicine simulator'); const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/endocrine-metabolic/scenario/dka-resolution-transition' })); expect(route).toContain('<h1>DKA resolution: glucose is not the finish line</h1>'); const prebrief = renderToStaticMarkup(createElement(Prebrief, { limitations: LIMITATIONS, scenario: SCENARIO, region: UNITED_STATES, environment: 'endocrine-metabolic', guidance: 'coached', onGuidance: () => {}, onStart: () => {} })); expect(prebrief).toContain('The supplied biochemical trajectory, patient priorities, and monitor stay visible'); expect(prebrief).not.toContain('ASA 4'); });
  it('fails closed and exposes one calm cognitive action at a time', () => { expect(crisisResponseAvailability(SCENARIO).hasEndocrineDkaResolutionResponse).toBe(true); expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasEndocrineDkaResolutionResponse).toBe(false); const states = [{ supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: null, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: null }, { supportAtTick: 1, contextAtTick: 1, recognitionAtTick: 1, readinessAtTick: 1, reassessmentAtTick: 2, handoffAtTick: 3 }]; expect(states.map((state) => (markup(state).match(/<button/g) ?? []).length)).toEqual([1,1,1,1,1,1,0]); expect(markup(states[0]!)).toContain('Glucose is not the finish line.'); const later = markup(states[4]!); expect(later).toContain('Resolution needs a bridge, not a gap.'); expect(later).toContain('Review the fixed 4-hour report'); expect((later.match(/role="status"/g) ?? [])).toHaveLength(1); for (const html of states.map((state) => markup(state))) { const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((match) => match[1]); expect(buttons.join(' ')).not.toMatch(/history|examin|measure|test|insulin|dextrose|fluid|electrolyte|potassium|bicarbonate|drug|dose|infusion|nutrition|prescrib|administer|stop|diagnos|discharge/iu); } });
});

describe('Endocrine DKA resolution tutor and worked example', () => {
  const start = { supportAtTick: null, contextAtTick: null, recognitionAtTick: null, readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null };
  const recognized = { ...start, supportAtTick: 0, contextAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(start)).not.toContain('A moment to think');
    expect(markup(start, { endocrineDkaResolutionGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner\u2019s own recorded steps when guidance is on', () => {
    const opening = markup(start, { endocrineDkaResolutionGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Confirm who owns insulin');
    const next = markup(recognized, { endocrineDkaResolutionGuidance: 'guided' });
    expect(next).toContain('Read the ketone and the bicarbonate');
    expect(next).not.toContain('Confirm who owns insulin');
  });

  it('withholds the verdict the recognition step exists to record', () => {
    const before = markup(recognized, { endocrineDkaResolutionGuidance: 'guided' });
    expect(before).not.toContain('DKA has resolved');
    expect(before).not.toContain('still has DKA');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { supportAtTick: 0, contextAtTick: 1, recognitionAtTick: 2, readinessAtTick: 3, reassessmentAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { endocrineDkaResolutionGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('replaces the tutor with a way back to the controls while the example runs', () => {
    const watching = markup(start, { endocrineDkaResolutionGuidance: 'guided', endocrineDkaResolutionDemonstrating: true });
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Confirm prepared support';
    expect(markup(start)).toContain(label);
    const watching = markup(start, { endocrineDkaResolutionDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
  });
});

describe('Offering the DKA worked example', () => {
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
