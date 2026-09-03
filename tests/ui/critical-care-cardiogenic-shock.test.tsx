/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { CARDIOGENIC_SHOCK as SCENARIO } from '../../src/modules/critical-care/scenarios/cardiogenic-shock';

const base = (over: Record<string, unknown>) => ({
  recognitionAtTick: null, phenotypeAtTick: null, bridgeAtTick: null,
  causeControlAtTick: null, reassessmentAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['cardiogenicShockAssessment']>);

const EMPTY = base({});
const RECOGNISED = base({ recognitionAtTick: 0 });
const PHENOTYPE = base({ recognitionAtTick: 0, phenotypeAtTick: 1 });
const BRIDGE = base({ recognitionAtTick: 0, phenotypeAtTick: 1, bridgeAtTick: 2 });
const CAUSE = base({ recognitionAtTick: 0, phenotypeAtTick: 1, bridgeAtTick: 2, causeControlAtTick: 3 });
const DONE = base({ recognitionAtTick: 0, phenotypeAtTick: 1, bridgeAtTick: 2, causeControlAtTick: 3, reassessmentAtTick: 4 });
const STATES = [EMPTY, RECOGNISED, PHENOTYPE, BRIDGE, CAUSE, DONE];

const LABELS = ['Recognize shock + activate teams', 'Review cause + phenotype + threats',
  'Record perfusion-linked bridge', 'Prioritize culprit revascularization',
  'Review 10-minute trajectory'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['cardiogenicShockAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, cardiogenicShockAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 28, fio2: 0.4, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onCardiogenicShockResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['cardiogenicShockAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Cardiogenic-shock experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/cardiogenic-shock"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/cardiogenic-shock' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasCardiogenicShockResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'cardiogenic-shock'),
    }).hasCardiogenicShockResponse).toBe(false);
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
    for (const state of [EMPTY, RECOGNISED, PHENOTYPE, BRIDGE, CAUSE]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers a fluid bolus, a dose, a target, or a device', () => {
    expect(markup(EMPTY)).toContain('Pressure is a clue. Perfusion is the verdict.');
    expect(markup(PHENOTYPE)).toContain('Bridge the pump. Fix the cause.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|bolus|\bmL\b|mcg|Impella|balloon|ECMO|dobutamine|diagnos|prognos/iu);
    }
  });
});

describe('Cardiogenic-shock tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { cardiogenicShockGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { cardiogenicShockGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('The MAP is the least interesting number there');
    const phenotype = markup(RECOGNISED, { cardiogenicShockGuidance: 'guided' });
    expect(phenotype).toContain('Every one of those negatives is doing work');
    expect(phenotype).not.toContain('The MAP is the least interesting number there');
  });

  it('names the instinct the septic-shock lesson taught and says it is wrong here', () => {
    expect(markup(PHENOTYPE, { cardiogenicShockGuidance: 'guided' }))
      .toContain('the same instinct that was right there is wrong here');
  });

  it('puts the artery ahead of the device', () => {
    expect(markup(BRIDGE, { cardiogenicShockGuidance: 'guided' }))
      .toContain('support layered onto an artery that is still shut');
  });

  it('goes quiet once the trajectory is reassessed', () => {
    expect(markup(DONE, { cardiogenicShockGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { cardiogenicShockGuidance: 'guided', cardiogenicShockDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
