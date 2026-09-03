/** @vitest-environment jsdom */
/**
 * The tutor panel and worked-example inertness for the emergency heat-stroke
 * tray. tests/ui/exertional-heat-stroke.test.tsx already covers the tray's
 * pre-existing behaviour and is left alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { EXERTIONAL_HEAT_STROKE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/exertional-heat-stroke';

const base = (over: Record<string, unknown>) => ({
  patternReviewedAtTick: null, supportAtTick: null, coolingAtTick: null,
  targetAtTick: null, surveillanceAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['heatStrokeAssessment']>);

const EMPTY = base({});
const PATTERN = base({ patternReviewedAtTick: 0 });
const SUPPORT = base({ patternReviewedAtTick: 0, supportAtTick: 1 });
const COOLING = base({ patternReviewedAtTick: 0, supportAtTick: 1, coolingAtTick: 2 });
const TARGET = base({ patternReviewedAtTick: 0, supportAtTick: 1, coolingAtTick: 2, targetAtTick: 3 });
const DONE = base({ patternReviewedAtTick: 0, supportAtTick: 1, coolingAtTick: 2, targetAtTick: 3, surveillanceAtTick: 4 });
const STATES = [EMPTY, PATTERN, SUPPORT, COOLING, TARGET, DONE];

const LABELS = ['Review brain + rectal core + mimics', 'Support ABCs + strip + prepare',
  'Immerse + monitor core + coordinate', 'Review cooling target',
  'Watch kidney + liver + clotting + muscle'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['heatStrokeAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, heatStrokeAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onHeatStrokeResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['heatStrokeAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

const openCount = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
  .filter((match) => !/ disabled=""/.test(match[0])).length;

describe('Emergency exertional heat stroke experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/exertional-heat-stroke"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/exertional-heat-stroke' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasHeatStrokeResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'exertional-heat-stroke'),
    }).hasHeatStrokeResponse).toBe(false);
  });

  it('keeps all five recorded steps on screen and opens one at a time', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
    for (const state of [EMPTY, PATTERN, SUPPORT, COOLING, TARGET]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('says on screen that immersion is the fastest path and that recovery is not the end', () => {
    expect(markup(EMPTY)).toContain('Whole-body cold-water immersion is the fastest cooling path.');
    expect(markup(EMPTY)).toContain('Temperature recovery does not exclude delayed injury.');
    expect(markup(EMPTY)).toContain('Antipyretics and dantrolene do not treat heat stroke');
  });

  it('never offers a drug, a normal-temperature target, or an outcome', () => {
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' '))
        .not.toMatch(/antipyretic|dantrolene|paracetamol|37\s?°C|discharg|prognos/iu);
    }
  });
});

describe('Emergency exertional heat stroke tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { exertionalHeatStrokeGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { exertionalHeatStrokeGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Rectal is the number that counts');
    const support = markup(PATTERN, { exertionalHeatStrokeGuidance: 'guided' });
    expect(support).toContain('This is the step where the lesson lives');
    expect(support).not.toContain('Rectal is the number that counts');
  });

  it('says immersion is the method and transport comes second', () => {
    expect(markup(SUPPORT, { exertionalHeatStrokeGuidance: 'guided' }))
      .toContain('an ambulance is a much worse place to cool someone than a tub is');
  });

  it('treats stopping the cooling as a decision', () => {
    expect(markup(COOLING, { exertionalHeatStrokeGuidance: 'guided' }))
      .toContain('Stopping is a decision, not an omission');
  });

  it('gives the reason antipyretics do nothing here', () => {
    expect(markup(TARGET, { exertionalHeatStrokeGuidance: 'guided' }))
      .toContain('the hypothalamic set point was never raised');
  });

  it('goes quiet once surveillance is recorded', () => {
    expect(markup(DONE, { exertionalHeatStrokeGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { exertionalHeatStrokeGuidance: 'guided', exertionalHeatStrokeDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
