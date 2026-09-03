/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PERICARDIAL_TAMPONADE as SCENARIO } from '../../src/modules/cardiology/scenarios/pericardial-tamponade';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const,
  treatmentDeliveredByLearner: false as const,
  imageAcquiredByLearner: false as const,
  procedurePerformedByLearner: false as const,
  catheterManipulatedByLearner: false as const,
};
const base = (over: Record<string, unknown>) => ({
  trajectoryAtTick: null, drainageResponseAtTick: null, etiologyAtTick: null,
  surveillanceAtTick: null, handoffAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pericardialTamponadeAssessment']>);

const EMPTY = base({});
const TRAJECTORY = base({ trajectoryAtTick: 0 });
const DRAINAGE = base({ trajectoryAtTick: 0, drainageResponseAtTick: 1 });
const ETIOLOGY = base({ trajectoryAtTick: 0, drainageResponseAtTick: 1, etiologyAtTick: 2 });
const SURVEILLANCE = base({ trajectoryAtTick: 0, drainageResponseAtTick: 1, surveillanceAtTick: 2 });
const BOTH = base({ trajectoryAtTick: 0, drainageResponseAtTick: 1, etiologyAtTick: 2, surveillanceAtTick: 3 });
const DONE = base({ trajectoryAtTick: 0, drainageResponseAtTick: 1, etiologyAtTick: 2, surveillanceAtTick: 3, handoffAtTick: 4 });
const STATES = [EMPTY, TRAJECTORY, DRAINAGE, ETIOLOGY, SURVEILLANCE, BOTH, DONE];

const LABELS = ['Reconcile serial circulation', 'Review reported drainage response',
  'Review etiology + contributors', 'Review recurrence surveillance', 'Hand off open risks'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pericardialTamponadeAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pericardialTamponadeAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 440, respiratoryRateBpm: 18, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPericardialTamponadeResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pericardialTamponadeAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pericardial tamponade experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/pericardial-tamponade"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/pericardial-tamponade' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPericardialTamponadeResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pericardial-tamponade-reassessment'),
    }).hasPericardialTamponadeResponse).toBe(false);
  });

  it('keeps all five steps on screen, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(5);
    }
  });

  it('opens both closing lanes at once, and neither before the drainage response', () => {
    const LANES = ['Review etiology \\+ contributors', 'Review recurrence surveillance'];
    for (const state of [EMPTY, TRAJECTORY]) {
      for (const lane of LANES) {
        expect(markup(state)).toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
      }
    }
    for (const lane of LANES) {
      expect(markup(DRAINAGE)).not.toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
    }
  });

  it('keeps the handoff closed until both lanes have landed', () => {
    for (const state of [DRAINAGE, ETIOLOGY, SURVEILLANCE]) {
      expect(markup(state)).toMatch(/<button[^>]* disabled=""[^>]*>Hand off open risks/);
    }
    expect(markup(BOTH)).not.toMatch(/<button[^>]* disabled=""[^>]*>Hand off open risks/);
  });

  it('never offers a procedure, a catheter action, or a diagnosis', () => {
    expect(markup(EMPTY)).toContain('Drainage changed the curve.');
    expect(markup(BOTH)).toContain('Explain. Watch. Hand off.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|drain\b|flush|remove|centesis|window|chemo|diagnos|prognos|cytolog/iu);
    }
  });
});

describe('Pericardial tamponade tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pericardialTamponadeGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pericardialTamponadeGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('The emergency was over before you arrived');
    const drainage = markup(TRAJECTORY, { pericardialTamponadeGuidance: 'guided' });
    expect(drainage).toContain('infers no procedure skill from an outcome');
    expect(drainage).not.toContain('The emergency was over before you arrived');
  });

  it('follows whichever closing lane the learner left open', () => {
    expect(markup(ETIOLOGY, { pericardialTamponadeGuidance: 'guided' }))
      .toContain('you do not touch, flush, reposition or remove the catheter');
    expect(markup(SURVEILLANCE, { pericardialTamponadeGuidance: 'guided' }))
      .toContain('Everyone has already decided this is her cancer');
  });

  it('asks for two owners at the handoff', () => {
    expect(markup(BOTH, { pericardialTamponadeGuidance: 'guided' }))
      .toContain('named Cardiology and oncology ownership');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { pericardialTamponadeGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pericardialTamponadeGuidance: 'guided', pericardialTamponadeDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
