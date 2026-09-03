/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_AORTIC_SYNDROME as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/acute-aortic-syndrome';

const base = (over: Record<string, unknown>) => ({
  initialReviewedAtTick: null, evolutionReviewedAtTick: null, escalatedAtTick: null,
  antiImpulseAtTick: null, imagingAtTick: null, handedOffAtTick: null,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['acuteAorticSyndromeAssessment']>);

const EMPTY = base({});
const INITIAL = base({ initialReviewedAtTick: 0 });
const EVOLUTION = base({ initialReviewedAtTick: 0, evolutionReviewedAtTick: 1 });
const ESCALATED = base({ initialReviewedAtTick: 0, evolutionReviewedAtTick: 1, escalatedAtTick: 2 });
const IMPULSE = base({ initialReviewedAtTick: 0, evolutionReviewedAtTick: 1, escalatedAtTick: 2, antiImpulseAtTick: 3 });
const IMAGING = base({ initialReviewedAtTick: 0, evolutionReviewedAtTick: 1, escalatedAtTick: 2, antiImpulseAtTick: 3, imagingAtTick: 4 });
const DONE = base({ initialReviewedAtTick: 0, evolutionReviewedAtTick: 1, escalatedAtTick: 2, antiImpulseAtTick: 3, imagingAtTick: 4, handedOffAtTick: 5 });
const STATES = [EMPTY, INITIAL, EVOLUTION, ESCALATED, IMPULSE, IMAGING, DONE];

const LABELS = ['Review pain + ECG + symmetric baseline', 'Repeat both arms + pulses + brain',
  'Escalate aortic concern + pause defaults', 'Analgesia + rate-first anti-impulse',
  'Prioritize definitive aortic imaging', 'Repeat territories + hand off uncertainty'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['acuteAorticSyndromeAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, acuteAorticSyndromeAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 20, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onAcuteAorticSyndromeResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['acuteAorticSyndromeAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Acute aortic syndrome experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/acute-aortic-syndrome"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/acute-aortic-syndrome' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasAcuteAorticSyndromeResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'acute-aortic-syndrome'),
    }).hasAcuteAorticSyndromeResponse).toBe(false);
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
    for (const state of [EMPTY, INITIAL, EVOLUTION, ESCALATED, IMPULSE, IMAGING]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers a drug, a dose, or a diagnosis', () => {
    expect(markup(EMPTY)).toContain('The first exam is a timestamp.');
    expect(markup(EVOLUTION)).toContain('Quiet the impulse. Protect the organs.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' '))
        .not.toMatch(/aspirin|heparin|esmolol|labetalol|thromboly|\bmg\b|dissect|diagnos|prognos/iu);
    }
  });
});

describe('Acute aortic syndrome tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { acuteAorticSyndromeGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { acuteAorticSyndromeGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('the drug you would least like to have given');
    const evolution = markup(INITIAL, { acuteAorticSyndromeGuidance: 'guided' });
    expect(evolution).toContain('a fact about a moment and not a promise');
    expect(evolution).not.toContain('the drug you would least like to have given');
  });

  it('distinguishes pausing a pathway from ruling it out', () => {
    expect(markup(EVOLUTION, { acuteAorticSyndromeGuidance: 'guided' }))
      .toContain('Pausing is not the same as ruling out');
  });

  it('explains why rate comes before pressure', () => {
    expect(markup(ESCALATED, { acuteAorticSyndromeGuidance: 'guided' }))
      .toContain('increases the force of each ejection');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { acuteAorticSyndromeGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { acuteAorticSyndromeGuidance: 'guided', acuteAorticSyndromeDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
