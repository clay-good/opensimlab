/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SEVERE_ACIDEMIA as SCENARIO } from '../../src/modules/critical-care/scenarios/severe-acidemia';

const base = (over: Record<string, unknown>) => ({
  recognitionAtTick: null, analysisAtTick: null, ventilationAtTick: null,
  causePlanAtTick: null, reassessmentAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['severeAcidemiaAssessment']>);

const EMPTY = base({});
const RECOGNIZED = base({ recognitionAtTick: 0 });
const ANALYZED = base({ recognitionAtTick: 0, analysisAtTick: 1 });
const VENTILATED = base({ recognitionAtTick: 0, analysisAtTick: 1, ventilationAtTick: 2 });
const PLANNED = base({ recognitionAtTick: 0, analysisAtTick: 1, ventilationAtTick: 2, causePlanAtTick: 3 });
const DONE = base({ recognitionAtTick: 0, analysisAtTick: 1, ventilationAtTick: 2, causePlanAtTick: 3, reassessmentAtTick: 4 });
const STATES = [EMPTY, RECOGNIZED, ANALYZED, VENTILATED, PLANNED, DONE];

const LABELS = ['Recognize severe mixed acidemia + activate help', 'Confirm gas + map the disorder',
  'Restore safe ventilatory compensation', 'Activate cause-directed + buffer/KRT planning',
  'Review gas + organ trajectory'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['severeAcidemiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, severeAcidemiaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'volume-control', tidalVolumeMl: 440, respiratoryRateBpm: 18, fio2: 0.4, peep: 8, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: true, airwayAttempts: 1, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'tracheal-tube',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onSevereAcidemiaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['severeAcidemiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Severe acidemia experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/severe-acidemia"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/severe-acidemia' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasSevereAcidemiaResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'severe-acidemia'),
    }).hasSevereAcidemiaResponse).toBe(false);
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
    for (const state of [EMPTY, RECOGNIZED, ANALYZED, VENTILATED, PLANNED]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers a buffer dose, a ventilator setting, or a kidney-support modality', () => {
    expect(markup(EMPTY)).toContain('Read the system, not pH alone.');
    expect(markup(ANALYZED)).toContain('Buy time. Treat the source.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|\bmmol\b|\bmEq\b|dialy|CVVH|tidal volume|respiratory rate|diagnos|prognos/iu);
    }
  });
});

describe('Severe acidemia tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { severeAcidemiaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { severeAcidemiaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('a different organ telling you the same thing');
    const analysis = markup(RECOGNIZED, { severeAcidemiaGuidance: 'guided' });
    expect(analysis).toContain('Do the compensation arithmetic');
    expect(analysis).not.toContain('a different organ telling you the same thing');
  });

  it('makes safety the constraint on the fastest available fix', () => {
    expect(markup(ANALYZED, { severeAcidemiaGuidance: 'guided' }))
      .toContain('stacking breaths in a patient who cannot exhale');
  });

  it('declines to pick a side on bicarbonate', () => {
    expect(markup(VENTILATED, { severeAcidemiaGuidance: 'guided' }))
      .toContain('the lesson does not pick a side, because the evidence does not');
  });

  it('goes quiet once the trajectory is reassessed', () => {
    expect(markup(DONE, { severeAcidemiaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { severeAcidemiaGuidance: 'guided', severeAcidemiaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
