/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { MASSIVE_PULMONARY_EMBOLISM as SCENARIO } from '../../src/modules/critical-care/scenarios/massive-pulmonary-embolism';

const base = (over: Record<string, unknown>) => ({
  recognitionAtTick: null, patternAtTick: null, supportAtTick: null,
  ecmoAtTick: null, reassessmentAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['massivePulmonaryEmbolismAssessment']>);

const EMPTY = base({});
const RECOGNISED = base({ recognitionAtTick: 0 });
const PATTERN = base({ recognitionAtTick: 0, patternAtTick: 1 });
const SUPPORT = base({ recognitionAtTick: 0, patternAtTick: 1, supportAtTick: 2 });
const BRIDGE = base({ recognitionAtTick: 0, patternAtTick: 1, supportAtTick: 2, ecmoAtTick: 3 });
const DONE = base({ recognitionAtTick: 0, patternAtTick: 1, supportAtTick: 2, ecmoAtTick: 3, reassessmentAtTick: 4 });
const STATES = [EMPTY, RECOGNISED, PATTERN, SUPPORT, BRIDGE, DONE];

const LABELS = ['Recognize E2R + activate rescue', 'Review PE + RV rescue context',
  'Record RV-sensitive support', 'Activate resource-ready VA-ECMO',
  'Review bridge + clot strategy'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['massivePulmonaryEmbolismAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, massivePulmonaryEmbolismAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'volume-control', tidalVolumeMl: 420, respiratoryRateBpm: 24, fio2: 1, peep: 8, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: true, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onMassivePulmonaryEmbolismResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['massivePulmonaryEmbolismAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Massive pulmonary-embolism experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/massive-pulmonary-embolism"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/massive-pulmonary-embolism' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasMassivePulmonaryEmbolismResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'massive-pulmonary-embolism'),
    }).hasMassivePulmonaryEmbolismResponse).toBe(false);
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
    for (const state of [EMPTY, RECOGNISED, PATTERN, SUPPORT, BRIDGE]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers to cannulate, dose, lyse, or give fluid', () => {
    expect(markup(EMPTY)).toContain('This is the failure state. Mobilize the system.');
    expect(markup(PATTERN)).toContain('Bridge the circulation. Keep the clot decision open.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|cannulat|alteplase|lys|heparin|bolus|\bmL\b|\bmg\b|embolectom|diagnos|prognos/iu);
    }
  });
});

describe('Massive pulmonary-embolism tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { massivePulmonaryEmbolismGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { massivePulmonaryEmbolismGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('a patient already on the treatment');
    const pattern = markup(RECOGNISED, { massivePulmonaryEmbolismGuidance: 'guided' });
    expect(pattern).toContain('order another study to be sure');
    expect(pattern).not.toContain('a patient already on the treatment');
  });

  it('sharpens the fluid argument for an obstructed ventricle', () => {
    expect(markup(PATTERN, { massivePulmonaryEmbolismGuidance: 'guided' }))
      .toContain('obstructed at its outflow');
  });

  it('is exact about what a bridge is not', () => {
    expect(markup(SUPPORT, { massivePulmonaryEmbolismGuidance: 'guided' }))
      .toContain('It does not touch the clot');
  });

  it('goes quiet once the trajectory is reassessed', () => {
    expect(markup(DONE, { massivePulmonaryEmbolismGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { massivePulmonaryEmbolismGuidance: 'guided', massivePulmonaryEmbolismDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
