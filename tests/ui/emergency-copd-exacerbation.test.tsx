/** @vitest-environment jsdom */
/**
 * The tutor panel and worked-example inertness for the emergency COPD tray.
 * tests/ui/copd-exacerbation.test.tsx already covers the tray's pre-existing
 * behaviour and is left alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { COPD_EXACERBATION as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/copd-exacerbation';

const base = (over: Record<string, unknown>) => ({
  severityReviewedAtTick: null, controlledOxygenAtTick: null, bronchodilatorBundleAtTick: null,
  corticosteroidIntentAtTick: null, antibioticIntentAtTick: null, reassessedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['copdExacerbationAssessment']>);

const EMPTY = base({});
const SEVERITY = base({ severityReviewedAtTick: 0 });
const OXYGEN = base({ severityReviewedAtTick: 0, controlledOxygenAtTick: 1 });
const NEBS = base({ severityReviewedAtTick: 0, controlledOxygenAtTick: 1, bronchodilatorBundleAtTick: 2 });
const STEROID = base({ severityReviewedAtTick: 0, controlledOxygenAtTick: 1, bronchodilatorBundleAtTick: 2, corticosteroidIntentAtTick: 3 });
const TREATED = base({ severityReviewedAtTick: 0, controlledOxygenAtTick: 1, bronchodilatorBundleAtTick: 2, corticosteroidIntentAtTick: 3, antibioticIntentAtTick: 4 });
const DONE = base({ severityReviewedAtTick: 0, controlledOxygenAtTick: 1, bronchodilatorBundleAtTick: 2, corticosteroidIntentAtTick: 3, antibioticIntentAtTick: 4, reassessedAtTick: 5 });
const NEBS_ONLY = base({ severityReviewedAtTick: 0, bronchodilatorBundleAtTick: 1 });
const STATES = [EMPTY, SEVERITY, OXYGEN, NEBS, STEROID, TREATED, DONE, NEBS_ONLY];

const LABELS = ['Review severity + blood gas + mimics', 'Target controlled oxygen',
  'Give air-driven SABA + SAMA intent', 'Record 5-day corticosteroid intent',
  'Record antibiotic indication', 'Reassess blood gas + ventilatory need'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['copdExacerbationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, copdExacerbationAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onCopdExacerbationResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['copdExacerbationAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

const openCount = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
  .filter((match) => !/ disabled=""/.test(match[0])).length;

describe('Emergency COPD exacerbation experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/copd-exacerbation"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/copd-exacerbation' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasCopdExacerbationResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'narrative'),
    }).hasCopdExacerbationResponse).toBe(false);
  });

  it('keeps all six recorded steps on screen', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(6);
    }
  });

  it('opens all four treatments together, because they are not a ranked list', () => {
    expect(openCount(markup(EMPTY))).toBe(1);
    expect(openCount(markup(SEVERITY))).toBe(4);
    expect(openCount(markup(NEBS_ONLY))).toBe(3);
    expect(openCount(markup(OXYGEN))).toBe(3);
    expect(openCount(markup(NEBS))).toBe(2);
    expect(openCount(markup(STEROID))).toBe(1);
    expect(openCount(markup(TREATED))).toBe(1);
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('holds the reassessment shut until all four treatments are recorded', () => {
    const reassessOpen = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
      .filter((match) => match[1]!.includes('Reassess blood gas'))
      .some((match) => !/ disabled=""/.test(match[0]));
    for (const state of [EMPTY, SEVERITY, NEBS_ONLY, OXYGEN, NEBS, STEROID]) {
      expect(reassessOpen(markup(state))).toBe(false);
    }
    expect(reassessOpen(markup(TREATED))).toBe(true);
  });

  it('keeps the oxygen ceiling and the air-driven route on the controls themselves', () => {
    const labels = lessonButtons(markup(EMPTY)).join(' ');
    expect(labels).toContain('88–92%');
    expect(labels).toContain('air-driven');
    expect(labels).toContain('purulence');
  });

  it('never offers a technique, an agent, or an outcome', () => {
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' '))
        .not.toMatch(/amoxicillin|doxycycline|azithro|technique|\bNIV setup|discharg|prognos/iu);
    }
  });
});

describe('Emergency COPD exacerbation tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { copdExacerbationGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { copdExacerbationGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('this is chronic and not an hour old');
    const treating = markup(SEVERITY, { copdExacerbationGuidance: 'guided' });
    expect(treating).toContain('They are unordered on purpose');
    expect(treating).not.toContain('this is chronic and not an hour old');
  });

  it('puts the load-bearing claim where every path passes through', () => {
    const treating = markup(SEVERITY, { copdExacerbationGuidance: 'guided' });
    expect(treating).toContain('nobody wrote a target for');
    expect(treating).toContain('The gas carrying the drug is itself a dose');
  });

  it('picks up the missing lane whichever one the learner left', () => {
    expect(markup(NEBS_ONLY, { copdExacerbationGuidance: 'guided' }))
      .toContain('a saturation that looks better and a pH that is falling');
    expect(markup(OXYGEN, { copdExacerbationGuidance: 'guided' }))
      .toContain('nasal cannula underneath');
    expect(markup(NEBS, { copdExacerbationGuidance: 'guided' }))
      .toContain('Five, not ten and not tapering');
    expect(markup(STEROID, { copdExacerbationGuidance: 'guided' }))
      .toContain('Not every exacerbation earns one');
  });

  it('goes quiet once the reassessment is recorded', () => {
    expect(markup(DONE, { copdExacerbationGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { copdExacerbationGuidance: 'guided', copdExacerbationDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
