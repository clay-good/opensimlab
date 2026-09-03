/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_ISCHEMIC_STROKE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/acute-ischemic-stroke';

const base = (over: Record<string, unknown>) => ({
  presentationReviewedAtTick: null, systemActivatedAtTick: null, imagingReviewedAtTick: null,
  tenecteplaseAtTick: null, thrombectomyActivatedAtTick: null, reassessedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['acuteIschemicStrokeAssessment']>);

const EMPTY = base({});
const PRESENTATION = base({ presentationReviewedAtTick: 0 });
const ACTIVATED = base({ presentationReviewedAtTick: 0, systemActivatedAtTick: 1 });
const IMAGING = base({ presentationReviewedAtTick: 0, systemActivatedAtTick: 1, imagingReviewedAtTick: 2 });
const THROMBOLYSIS = base({ presentationReviewedAtTick: 0, systemActivatedAtTick: 1, imagingReviewedAtTick: 2, tenecteplaseAtTick: 3 });
const TRANSFER = base({ presentationReviewedAtTick: 0, systemActivatedAtTick: 1, imagingReviewedAtTick: 2, tenecteplaseAtTick: 3, thrombectomyActivatedAtTick: 4 });
const DONE = base({ presentationReviewedAtTick: 0, systemActivatedAtTick: 1, imagingReviewedAtTick: 2, tenecteplaseAtTick: 3, thrombectomyActivatedAtTick: 4, reassessedAtTick: 5 });
const STATES = [EMPTY, PRESENTATION, ACTIVATED, IMAGING, THROMBOLYSIS, TRANSFER, DONE];

const LABELS = ['Review deficit + clock', 'Activate stroke system', 'Review CT + CTA + eligibility',
  'Record tenecteplase 20 mg IV intent', 'Activate thrombectomy transfer',
  'Reassess + hand off with clocks'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['acuteIschemicStrokeAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, acuteIschemicStrokeAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onAcuteIschemicStrokeResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['acuteIschemicStrokeAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Emergency acute ischemic stroke experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/acute-ischemic-stroke"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/acute-ischemic-stroke' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasAcuteIschemicStrokeResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'acute-ischemic-stroke'),
    }).hasAcuteIschemicStrokeResponse).toBe(false);
  });

  it('keeps all six recorded steps on screen', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(6);
    }
  });

  it('opens exactly one step at a time, because the chain is the lesson', () => {
    const openCount = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
      .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
      .filter((match) => !/ disabled=""/.test(match[0])).length;
    for (const state of [EMPTY, PRESENTATION, ACTIVATED, IMAGING, THROMBOLYSIS, TRANSFER]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers a delivery, a score, or an outcome', () => {
    expect(markup(EMPTY)).toContain('Time is tissue. Facts before treatment.');
    expect(markup(IMAGING)).toContain('Two reperfusion tracks. One clock.');
    for (const html of STATES.map((state) => markup(state))) {
      // "tenecteplase 20 mg IV intent" is an authored control label and is the
      // lesson's own content, so the guard is on delivery and outcome language.
      expect(lessonButtons(html).join(' '))
        .not.toMatch(/push |bolus|NIHSS|reperfus|recanaliz|diagnos|prognos/iu);
    }
  });
});

describe('Emergency acute ischemic stroke tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { acuteIschemicStrokeGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { acuteIschemicStrokeGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the mimic you must not miss');
    const activate = markup(PRESENTATION, { acuteIschemicStrokeGuidance: 'guided' });
    expect(activate).toContain('as one trip rather than two');
    expect(activate).not.toContain('the mimic you must not miss');
  });

  it('treats the noncontrast CT as a permission rather than a diagnosis', () => {
    expect(markup(ACTIVATED, { acuteIschemicStrokeGuidance: 'guided' }))
      .toContain('a permission rather than a diagnosis');
  });

  it('names the step people wait to take', () => {
    expect(markup(THROMBOLYSIS, { acuteIschemicStrokeGuidance: 'guided' }))
      .toContain('often too big for a drug to clear');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { acuteIschemicStrokeGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { acuteIschemicStrokeGuidance: 'guided', acuteIschemicStrokeDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
