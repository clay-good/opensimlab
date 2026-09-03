/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { UPPER_GI_HEMORRHAGE as SCENARIO } from '../../src/modules/critical-care/scenarios/upper-gi-hemorrhage';

const base = (over: Record<string, unknown>) => ({
  recognitionAtTick: null, patternAtTick: null, resuscitationAtTick: null,
  hemostasisAtTick: null, reassessmentAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['upperGiHemorrhageAssessment']>);

const EMPTY = base({});
const RECOGNIZED = base({ recognitionAtTick: 0 });
const PATTERN = base({ recognitionAtTick: 0, patternAtTick: 1 });
const RESUSCITATED = base({ recognitionAtTick: 0, patternAtTick: 1, resuscitationAtTick: 2 });
const HEMOSTASIS = base({ recognitionAtTick: 0, patternAtTick: 1, resuscitationAtTick: 2, hemostasisAtTick: 3 });
const DONE = base({ recognitionAtTick: 0, patternAtTick: 1, resuscitationAtTick: 2, hemostasisAtTick: 3, reassessmentAtTick: 4 });
const STATES = [EMPTY, RECOGNIZED, PATTERN, RESUSCITATED, HEMOSTASIS, DONE];

const LABELS = ['Recognize recurrence + activate help', 'Review bleed + perfusion context',
  'Record individualized resuscitation', 'Activate repeat endoscopy pathway',
  'Review bridge + bleeding trajectory'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['upperGiHemorrhageAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, upperGiHemorrhageAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 24, fio2: 0.3, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 6 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onUpperGiHemorrhageResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['upperGiHemorrhageAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Recurrent upper GI hemorrhage experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/upper-gi-hemorrhage"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/upper-gi-hemorrhage' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasUpperGiHemorrhageResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'upper-gi-hemorrhage'),
    }).hasUpperGiHemorrhageResponse).toBe(false);
  });

  it('keeps all five steps on screen, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
  });

  it('opens exactly one step at a time, because the chain is the lesson', () => {
    const openCount = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
      .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
      .filter((match) => !/ disabled=""/.test(match[0])).length;
    for (const state of [EMPTY, RECOGNIZED, PATTERN, RESUSCITATED, HEMOSTASIS]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers a unit count, a procedure, or a transfusion trigger', () => {
    expect(markup(EMPTY)).toContain('The trend spoke before the pressure fell.');
    expect(markup(PATTERN)).toContain('Resuscitate the patient. Reopen hemostasis.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/transfus|\bunits?\b|embolize|\bg\/dL\b|diagnos|prognos/iu);
    }
  });
});

describe('Recurrent upper GI hemorrhage tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { upperGiHemorrhageGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { upperGiHemorrhageGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the last to arrive and the easiest to argue with');
    const pattern = markup(RECOGNIZED, { upperGiHemorrhageGuidance: 'guided' });
    expect(pattern).toContain('a variceal bleed is a different pathway entirely');
    expect(pattern).not.toContain('the last to arrive and the easiest to argue with');
  });

  it('makes the transfusion threshold a default rather than a rule', () => {
    expect(markup(PATTERN, { upperGiHemorrhageGuidance: 'guided' }))
      .toContain('a default to reason from, not a rule to hide behind');
  });

  it('runs the endoscopy alongside and names the doors past it', () => {
    expect(markup(RESUSCITATED, { upperGiHemorrhageGuidance: 'guided' }))
      .toContain('the bleeding is why she is unstable');
  });

  it('goes quiet once the trajectory is reassessed', () => {
    expect(markup(DONE, { upperGiHemorrhageGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { upperGiHemorrhageGuidance: 'guided', upperGiHemorrhageDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
