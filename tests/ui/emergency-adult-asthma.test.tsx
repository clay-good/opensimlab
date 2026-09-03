/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ADULT_ASTHMA as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/adult-asthma';

const base = (over: Record<string, unknown>) => ({
  severityReviewedAtTick: null, controlledOxygenAtTick: null, bronchodilatorBundleAtTick: null,
  corticosteroidIntentAtTick: null, reassessedAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['adultAsthmaAssessment']>);

const EMPTY = base({});
const SEVERITY = base({ severityReviewedAtTick: 0 });
const OXYGEN = base({ severityReviewedAtTick: 0, controlledOxygenAtTick: 1 });
const STEROID = base({ severityReviewedAtTick: 0, controlledOxygenAtTick: 1, corticosteroidIntentAtTick: 2 });
const TREATED = base({ severityReviewedAtTick: 0, controlledOxygenAtTick: 1, corticosteroidIntentAtTick: 2, bronchodilatorBundleAtTick: 3 });
const DONE = base({ severityReviewedAtTick: 0, controlledOxygenAtTick: 1, corticosteroidIntentAtTick: 2, bronchodilatorBundleAtTick: 3, reassessedAtTick: 4 });
const NEBS_ONLY = base({ severityReviewedAtTick: 0, bronchodilatorBundleAtTick: 1 });
const STATES = [EMPTY, SEVERITY, OXYGEN, STEROID, TREATED, DONE, NEBS_ONLY];

const LABELS = ['Review severity + immediate mimics', 'Target controlled oxygen',
  'Give fixed pMDI + spacer bundle', 'Record early corticosteroid intent',
  'Reassess symptoms + PEF'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['adultAsthmaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, adultAsthmaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 480, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onAdultAsthmaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['adultAsthmaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

const openCount = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .filter((match) => LABELS.some((known) => match[1]!.includes(known)))
  .filter((match) => !/ disabled=""/.test(match[0])).length;

describe('Emergency adult asthma experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/adult-asthma"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/adult-asthma' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasAdultAsthmaResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'narrative'),
    }).hasAdultAsthmaResponse).toBe(false);
  });

  it('keeps all five recorded steps on screen', () => {
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
  });

  it('opens the three treatments together, because they are not a ranked list', () => {
    expect(openCount(markup(EMPTY))).toBe(1);
    expect(openCount(markup(SEVERITY))).toBe(3);
    expect(openCount(markup(NEBS_ONLY))).toBe(2);
    expect(openCount(markup(OXYGEN))).toBe(2);
    expect(openCount(markup(STEROID))).toBe(1);
    expect(openCount(markup(TREATED))).toBe(1);
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('holds the reassessment shut until all three treatments are recorded', () => {
    const reassessOpen = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
      .filter((match) => match[1]!.includes('Reassess symptoms'))
      .some((match) => !/ disabled=""/.test(match[0]));
    for (const state of [EMPTY, SEVERITY, NEBS_ONLY, OXYGEN, STEROID]) {
      expect(reassessOpen(markup(state))).toBe(false);
    }
    expect(reassessOpen(markup(TREATED))).toBe(true);
  });

  it('keeps the oxygen ceiling on the control itself', () => {
    expect(lessonButtons(markup(EMPTY)).join(' ')).toContain('92–95%');
  });

  it('never offers a technique, an individualized dose, or an outcome', () => {
    expect(markup(EMPTY)).toContain('Read severity, not wheeze alone');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' '))
        .not.toMatch(/push |\d\s?(?:mg|mcg|mL)\b|technique|discharg|diagnos|prognos|resolv/iu);
    }
  });
});

describe('Emergency adult asthma tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { adultAsthmaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { adultAsthmaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Speech and peak flow are the two that grade it');
    const treating = markup(SEVERITY, { adultAsthmaGuidance: 'guided' });
    expect(treating).toContain('They are unordered on purpose');
    expect(treating).not.toContain('Speech and peak flow are the two that grade it');
  });

  it('puts the load-bearing claim where every path passes through', () => {
    const treating = markup(SEVERITY, { adultAsthmaGuidance: 'guided' });
    expect(treating).toContain('they act on three different clocks');
    expect(treating).toContain('the only deferral here you cannot recover later in the same visit');
  });

  it('picks up the missing lane whichever one the learner left', () => {
    expect(markup(NEBS_ONLY, { adultAsthmaGuidance: 'guided' }))
      .toContain('a target you can miss in both directions');
    expect(markup(OXYGEN, { adultAsthmaGuidance: 'guided' }))
      .toContain('only if the decision was made hours earlier');
    expect(markup(STEROID, { adultAsthmaGuidance: 'guided' }))
      .toContain('The spacer is not the budget option');
  });

  it('goes quiet once the reassessment is recorded', () => {
    expect(markup(DONE, { adultAsthmaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { adultAsthmaGuidance: 'guided', adultAsthmaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
