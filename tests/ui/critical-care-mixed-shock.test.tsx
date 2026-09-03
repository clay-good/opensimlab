/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { MIXED_SHOCK as SCENARIO } from '../../src/modules/critical-care/scenarios/mixed-shock';

const base = (over: Record<string, unknown>) => ({
  recognitionAtTick: null, hemodynamicsAtTick: null, supportAtTick: null,
  causesAtTick: null, reassessmentAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['mixedShockAssessment']>);

const EMPTY = base({});
const RECOGNISED = base({ recognitionAtTick: 0 });
const PANEL = base({ recognitionAtTick: 0, hemodynamicsAtTick: 1 });
const SUPPORT = base({ recognitionAtTick: 0, hemodynamicsAtTick: 1, supportAtTick: 2 });
const CAUSES = base({ recognitionAtTick: 0, hemodynamicsAtTick: 1, supportAtTick: 2, causesAtTick: 3 });
const DONE = base({ recognitionAtTick: 0, hemodynamicsAtTick: 1, supportAtTick: 2, causesAtTick: 3, reassessmentAtTick: 4 });
const STATES = [EMPTY, RECOGNISED, PANEL, SUPPORT, CAUSES, DONE];

const LABELS = ['Recognize discordance + call teams', 'Review hemodynamics in context',
  'Record tone + output support review', 'Keep both cause pathways active',
  'Review 10-minute trajectory'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['mixedShockAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, mixedShockAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 28, fio2: 0.4, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onMixedShockResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['mixedShockAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Mixed-shock experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/mixed-shock"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/mixed-shock' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasMixedShockResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'mixed-shock'),
    }).hasMixedShockResponse).toBe(false);
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
    for (const state of [EMPTY, RECOGNISED, PANEL, SUPPORT, CAUSES]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers a fluid bolus, a dose, a target, or a device', () => {
    expect(markup(EMPTY)).toContain('When clues disagree, believe the pattern.');
    expect(markup(PANEL)).toContain('Support both halves. Chase both causes.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|bolus|\bmL\b|mcg|vasopressin|dobutamine|antibiotic|diagnos|prognos/iu);
    }
  });
});

describe('Mixed-shock tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { mixedShockGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { mixedShockGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('it is not a measurement error');
    const panel = markup(RECOGNISED, { mixedShockGuidance: 'guided' });
    expect(panel).toContain('Both are true at once, which is what mixed means');
    expect(panel).not.toContain('it is not a measurement error');
  });

  it('excludes blind fluid loading with a wedge of 24', () => {
    expect(markup(PANEL, { mixedShockGuidance: 'guided' }))
      .toContain('there is no volume problem to solve');
  });

  it('names the failure the cause step exists to prevent', () => {
    expect(markup(SUPPORT, { mixedShockGuidance: 'guided' }))
      .toContain('let one of the two pathways quietly go unowned');
  });

  it('goes quiet once the trajectory is reassessed', () => {
    expect(markup(DONE, { mixedShockGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { mixedShockGuidance: 'guided', mixedShockDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
