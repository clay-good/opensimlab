/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { REGULAR_NARROW_COMPLEX_TACHYCARDIA as SCENARIO } from '../../src/modules/cardiology/scenarios/regular-narrow-complex-tachycardia';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  hemodynamicallyStable: true as const,
  mechanismProven: false as const,
  treatmentDelivered: false as const,
};
const base = (over: Record<string, unknown>) => ({
  stabilityAtTick: null, contextAtTick: null, vagalAtTick: null,
  vagalResponseAtTick: null, adenosineAtTick: null, reassessmentAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['stableNarrowTachycardiaAssessment']>);

const EMPTY = base({});
const STABILITY = base({ stabilityAtTick: 0 });
const CONTEXT = base({ stabilityAtTick: 0, contextAtTick: 1 });
const VAGAL = base({ stabilityAtTick: 0, contextAtTick: 1, vagalAtTick: 2 });
const VAGAL_SEEN = base({ stabilityAtTick: 0, contextAtTick: 1, vagalAtTick: 2, vagalResponseAtTick: 3 });
const ADENOSINE = base({ stabilityAtTick: 0, contextAtTick: 1, vagalAtTick: 2, vagalResponseAtTick: 3, adenosineAtTick: 4 });
const DONE = base({ stabilityAtTick: 0, contextAtTick: 1, vagalAtTick: 2, vagalResponseAtTick: 3, adenosineAtTick: 4, reassessmentAtTick: 5 });
const STATES = [EMPTY, STABILITY, CONTEXT, VAGAL, VAGAL_SEEN, ADENOSINE, DONE];

const LABELS = ['Reconcile rhythm + stability', 'Review context + monitored readiness',
  'Record coached modified-Valsalva intent', 'Review observed vagal response',
  'Record monitored adenosine intent', 'Reassess rhythm + recurrence plan'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['stableNarrowTachycardiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, stableNarrowTachycardiaAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onStableNarrowTachycardiaResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['stableNarrowTachycardiaAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Stable narrow-complex tachycardia experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/regular-narrow-complex-tachycardia"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/regular-narrow-complex-tachycardia' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasStableNarrowTachycardiaResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'regular-narrow-complex-tachycardia'),
    }).hasStableNarrowTachycardiaResponse).toBe(false);
  });

  it('keeps all six steps on screen, one more than there are objectives', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(6);
    }
  });

  it('never offers a dose, a maneuver, a cardioversion, or a mechanism', () => {
    expect(markup(EMPTY)).toContain('Fast rhythm. Steady patient.');
    expect(markup(VAGAL)).toContain('Try gently. Watch closely. Plan beyond today.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|6 mg|12 mg|AVNRT|AVRT|cardiovert|ablat|perform the|diagnos|prognos/iu);
    }
  });
});

describe('Stable narrow-tachycardia tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { stableNarrowTachycardiaGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { stableNarrowTachycardiaGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Establish the second half before you act on the first');
    const context = markup(STABILITY, { stableNarrowTachycardiaGuidance: 'guided' });
    expect(context).toContain('get the room ready before you touch her');
    expect(context).not.toContain('Establish the second half before you act on the first');
  });

  it('has a beat for the unchecked maneuver', () => {
    const html = markup(VAGAL, { stableNarrowTachycardiaGuidance: 'guided' });
    expect(html).toContain('Do not assume either answer');
    expect(html).toContain('an attempted maneuver and an observed response are different things');
  });

  it('explains why readiness is not a formality', () => {
    const html = markup(VAGAL_SEEN, { stableNarrowTachycardiaGuidance: 'guided' });
    expect(html).toContain('transient asystolic pause that is expected and alarming');
  });

  it('converts the rhythm without explaining it', () => {
    const html = markup(ADENOSINE, { stableNarrowTachycardiaGuidance: 'guided' });
    expect(html).toContain('not a rhythm that has been explained');
  });

  it('goes quiet once the reassessment is recorded', () => {
    expect(markup(DONE, { stableNarrowTachycardiaGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { stableNarrowTachycardiaGuidance: 'guided', stableNarrowTachycardiaDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
