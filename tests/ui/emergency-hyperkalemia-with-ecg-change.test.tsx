/** @vitest-environment jsdom */
/**
 * The tutor panel and worked-example inertness for the emergency hyperkalemia
 * tray. tests/ui/hyperkalemia-with-ecg-change.test.tsx already covers the
 * tray's pre-existing behaviour and is left alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { HYPERKALEMIA_WITH_ECG_CHANGE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/hyperkalemia-with-ecg-change';

const base = (over: Record<string, unknown>) => ({
  patternReviewedAtTick: null, calciumAtTick: null, postCalciumEcgAtTick: null,
  insulinGlucoseAtTick: null, betaAgonistAtTick: null, removalAtTick: null,
  reassessedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['hyperkalemiaAssessment']>);

const EMPTY = base({});
const PATTERN = base({ patternReviewedAtTick: 0 });
const CALCIUM = base({ patternReviewedAtTick: 0, calciumAtTick: 1 });
const ECG = base({ patternReviewedAtTick: 0, calciumAtTick: 1, postCalciumEcgAtTick: 2 });
const INSULIN = base({ patternReviewedAtTick: 0, calciumAtTick: 1, postCalciumEcgAtTick: 2, insulinGlucoseAtTick: 3 });
const BETA = base({ patternReviewedAtTick: 0, calciumAtTick: 1, postCalciumEcgAtTick: 2, insulinGlucoseAtTick: 3, betaAgonistAtTick: 4 });
const LANES = base({ patternReviewedAtTick: 0, calciumAtTick: 1, postCalciumEcgAtTick: 2, insulinGlucoseAtTick: 3, betaAgonistAtTick: 4, removalAtTick: 5 });
const DONE = base({ patternReviewedAtTick: 0, calciumAtTick: 1, postCalciumEcgAtTick: 2, insulinGlucoseAtTick: 3, betaAgonistAtTick: 4, removalAtTick: 5, reassessedAtTick: 6 });
const INSULIN_ONLY = base({ patternReviewedAtTick: 0, calciumAtTick: 1, insulinGlucoseAtTick: 2 });
const STATES = [EMPTY, PATTERN, CALCIUM, ECG, INSULIN, BETA, LANES, DONE, INSULIN_ONLY];

const LABELS = ['Review K + ECG + drivers', 'Record IV calcium-salt intent',
  'Review post-team ECG', 'Record insulin-glucose + surveillance',
  'Record adjunct beta-2 shift', 'Remove K + stop drivers + renal help',
  'Recheck ECG + K + glucose'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['hyperkalemiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, hyperkalemiaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onHyperkalemiaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['hyperkalemiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

const openCount = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
  .filter((match) => !/ disabled=""/.test(match[0])).length;

describe('Emergency hyperkalemia experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/hyperkalemia-with-ecg-change"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/hyperkalemia-with-ecg-change' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasHyperkalemiaResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'hyperkalemia-with-ecg-change'),
    }).hasHyperkalemiaResponse).toBe(false);
  });

  it('keeps all seven recorded steps on screen', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(7);
    }
  });

  it('opens one step at a time until calcium, then all four lanes together', () => {
    expect(openCount(markup(EMPTY))).toBe(1);
    expect(openCount(markup(PATTERN))).toBe(1);
    expect(openCount(markup(CALCIUM))).toBe(4);
    expect(openCount(markup(INSULIN_ONLY))).toBe(3);
    expect(openCount(markup(ECG))).toBe(3);
    expect(openCount(markup(INSULIN))).toBe(2);
    expect(openCount(markup(BETA))).toBe(1);
    expect(openCount(markup(LANES))).toBe(1);
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('holds the final panel shut until every lane is recorded', () => {
    const panelOpen = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
      .filter((match) => match[1]!.includes('Recheck ECG + K + glucose'))
      .some((match) => !/ disabled=""/.test(match[0]));
    for (const state of [EMPTY, PATTERN, CALCIUM, ECG, INSULIN, BETA, INSULIN_ONLY]) {
      expect(panelOpen(markup(state))).toBe(false);
    }
    expect(panelOpen(markup(LANES))).toBe(true);
  });

  it('says on screen that calcium does not lower the potassium', () => {
    expect(markup(EMPTY)).toContain('Calcium protects the myocardium; it does not lower potassium.');
    expect(markup(CALCIUM)).toContain('no ECG or K change claimed');
    expect(markup(ECG)).toContain('K still 7.1');
  });

  it('never offers a dose, a delivery, or an outcome', () => {
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' '))
        .not.toMatch(/\d\s?(?:mg|mL|units)\b|dialys|discharg|prognos|cured/iu);
    }
  });
});

describe('Emergency hyperkalemia tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { hyperkalemiaEcgGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { hyperkalemiaEcgGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('a potassium-sparing diuretic wearing an antibiotic label');
    const calcium = markup(PATTERN, { hyperkalemiaEcgGuidance: 'guided' });
    expect(calcium).toContain('Not one millimole leaves the body');
    expect(calcium).not.toContain('a potassium-sparing diuretic wearing an antibiotic label');
  });

  it('puts the load-bearing pairing where every path passes through', () => {
    const lanes = markup(CALCIUM, { hyperkalemiaEcgGuidance: 'guided' });
    expect(lanes).toContain('three different jobs and only one of them lowers the total');
    expect(lanes).toContain('the tracing improved and the chemistry did not move at all');
  });

  it('picks up the missing lane whichever one the learner left', () => {
    expect(markup(INSULIN_ONLY, { hyperkalemiaEcgGuidance: 'guided' }))
      .toContain('A tracing that has stopped shouting');
    expect(markup(ECG, { hyperkalemiaEcgGuidance: 'guided' }))
      .toContain('chronic kidney disease slows insulin clearance');
    expect(markup(INSULIN, { hyperkalemiaEcgGuidance: 'guided' }))
      .toContain('only as an adjunct');
    expect(markup(BETA, { hyperkalemiaEcgGuidance: 'guided' }))
      .toContain('Hold the lisinopril and hold the trimethoprim');
  });

  it('goes quiet once the reassessment is recorded', () => {
    expect(markup(DONE, { hyperkalemiaEcgGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { hyperkalemiaEcgGuidance: 'guided', hyperkalemiaEcgDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
