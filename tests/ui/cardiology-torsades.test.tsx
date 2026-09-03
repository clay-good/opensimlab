/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { TORSADES_DE_POINTES as SCENARIO } from '../../src/modules/cardiology/scenarios/torsades-de-pointes';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const,
  shockDeliveredByLearner: false as const,
  treatmentDeliveredByLearner: false as const,
};
const base = (over: Record<string, unknown>) => ({
  recognitionAtTick: null, shockIntentAtTick: null, postShockAtTick: null,
  contextAtTick: null, recurrenceIntentAtTick: null, handoffAtTick: null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['torsadesAssessment']>);

const EMPTY = base({});
const RECOGNISED = base({ recognitionAtTick: 0 });
const SHOCKED = base({ recognitionAtTick: 0, shockIntentAtTick: 1 });
const POSTSHOCK = base({ recognitionAtTick: 0, shockIntentAtTick: 1, postShockAtTick: 2 });
const CONTEXT = base({ recognitionAtTick: 0, shockIntentAtTick: 1, postShockAtTick: 2, contextAtTick: 3 });
const RECURRENCE = base({ recognitionAtTick: 0, shockIntentAtTick: 1, postShockAtTick: 2, recurrenceIntentAtTick: 3 });
const BOTH = base({ recognitionAtTick: 0, shockIntentAtTick: 1, postShockAtTick: 2, contextAtTick: 3, recurrenceIntentAtTick: 4 });
const DONE = base({ recognitionAtTick: 0, shockIntentAtTick: 1, postShockAtTick: 2, contextAtTick: 3, recurrenceIntentAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, RECOGNISED, SHOCKED, POSTSHOCK, CONTEXT, RECURRENCE, BOTH, DONE];

const LABELS = ['Reconcile pulse + polymorphic pattern', 'Record immediate unsynchronized shock',
  'Review post-team rhythm', 'Review QT + culprits + electrolytes',
  'Record magnesium + correction intent', 'Reassess recurrence risk + hand off'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['torsadesAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, torsadesAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 430, respiratoryRateBpm: 22, fio2: 0.21, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onTorsadesResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['torsadesAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Torsades experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology' }));
    expect(index).toContain('href="/cardiology/scenario/torsades-de-pointes"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/cardiology/scenario/torsades-de-pointes' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasTorsadesResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'torsades-de-pointes'),
    }).hasTorsadesResponse).toBe(false);
  });

  it('keeps all six steps on screen, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(6);
    for (const state of STATES) {
      expect(lessonButtons(markup(state))).toHaveLength(6);
    }
  });

  it('locks the magnesium and the QT away until the shock intent is recorded', () => {
    for (const state of [EMPTY, RECOGNISED, SHOCKED]) {
      const html = markup(state);
      for (const lane of ['Review QT \\+ culprits \\+ electrolytes', 'Record magnesium \\+ correction intent']) {
        expect(html).toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
      }
    }
    const open = markup(POSTSHOCK);
    for (const lane of ['Review QT \\+ culprits \\+ electrolytes', 'Record magnesium \\+ correction intent']) {
      expect(open).not.toMatch(new RegExp(`<button[^>]* disabled=""[^>]*>${lane}`));
    }
  });

  it('never offers an energy, a dose, a sedative, or a device', () => {
    expect(markup(EMPTY)).toContain('Polymorphic means shock now.');
    expect(markup(POSTSHOCK)).toContain('Correct. Protect. Reassess.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|joule|\d+ ?J\b|midazolam|\bg\b|mmol|implant|capture|diagnos|prognos/iu);
    }
  });
});

describe('Torsades tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { torsadesGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { torsadesGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('not the uniform beats of monomorphic VT');
    const shock = markup(RECOGNISED, { torsadesGuidance: 'guided' });
    expect(shock).toContain('the machine has nothing consistent to synchronize to');
    expect(shock).not.toContain('not the uniform beats of monomorphic VT');
  });

  it('says the team delivered the shock', () => {
    expect(markup(SHOCKED, { torsadesGuidance: 'guided' }))
      .toContain('the treating team delivered the shock, not you');
  });

  it('follows whichever closing lane the learner left open', () => {
    expect(markup(CONTEXT, { torsadesGuidance: 'guided' }))
      .toContain('not a general antiarrhythmic for a normal QT');
    expect(markup(RECURRENCE, { torsadesGuidance: 'guided' }))
      .toContain('none of them is the cause');
  });

  it('refuses to call one quiet interval a result', () => {
    expect(markup(BOTH, { torsadesGuidance: 'guided' }))
      .toContain('one quiet interval proves nothing about the next one');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { torsadesGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { torsadesGuidance: 'guided', torsadesDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
