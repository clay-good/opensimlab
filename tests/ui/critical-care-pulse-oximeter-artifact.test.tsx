/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PULSE_OXIMETER_MOTION_ARTIFACT as SCENARIO } from '../../src/modules/critical-care/scenarios/pulse-oximeter-motion-artifact';

const base = (over: Record<string, unknown>) => ({
  discordanceAtTick: null, plethAtTick: null, probePerfusionAtTick: null,
  corroboratedAtTick: null, reassessedAtTick: null,
  displayedSpo2Percent: 82, displayedPulseRateBpm: 132,
  ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['pulseOximeterArtifactAssessment']>);

const EMPTY = base({});
const DISCORDANCE = base({ discordanceAtTick: 0 });
const PLETH = base({ discordanceAtTick: 0, plethAtTick: 1 });
const PROBE = base({ discordanceAtTick: 0, plethAtTick: 1, probePerfusionAtTick: 2 });
const CORROBORATED = base({ discordanceAtTick: 0, plethAtTick: 1, probePerfusionAtTick: 2, corroboratedAtTick: 3 });
const DONE = base({ discordanceAtTick: 0, plethAtTick: 1, probePerfusionAtTick: 2, corroboratedAtTick: 3, reassessedAtTick: 4, displayedSpo2Percent: 97, displayedPulseRateBpm: 86 });
const STATES = [EMPTY, DISCORDANCE, PLETH, PROBE, CORROBORATED, DONE];

const LABELS = ['Separate display from patient', 'Inspect pleth + pulse-rate match',
  'Review probe + motion + perfusion', 'Cross-check patient + arterial oxygenation',
  'Reassess display + signal coherence'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pulseOximeterArtifactAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, pulseOximeterArtifactAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 16, fio2: 0.28, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 4 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPulseOximeterArtifactResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['pulseOximeterArtifactAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Pulse-oximeter artifact experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care' }));
    expect(index).toContain('href="/critical-care/scenario/pulse-oximeter-motion-artifact"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/critical-care/scenario/pulse-oximeter-motion-artifact' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasPulseOximeterArtifactResponse).toBe(true);
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'pulse-oximeter-motion-artifact'),
    }).hasPulseOximeterArtifactResponse).toBe(false);
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
    for (const state of [EMPTY, DISCORDANCE, PLETH, PROBE, CORROBORATED]) {
      expect(openCount(markup(state))).toBe(1);
    }
    expect(openCount(markup(DONE))).toBe(0);
  });

  it('never offers oxygen delivery, a probe move, or a diagnosis', () => {
    expect(markup(EMPTY)).toContain('Trust the signal, not just the number.');
    expect(markup(PLETH)).toContain('Corroborate, then reassess.');
    for (const html of STATES.map((state) => markup(state))) {
      // "arterial oxygenation" is one of the authored labels and is the point of
      // the lesson, so the guard is on delivery verbs rather than the word itself.
      expect(lessonButtons(html).join(' '))
        .not.toMatch(/give oxygen|apply oxygen|litres|intubat|move the probe|diagnos|prognos/iu);
    }
  });
});

describe('Pulse-oximeter artifact tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { pulseOximeterArtifactGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { pulseOximeterArtifactGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('is not in a position to tell you what the blood is carrying');
    const pleth = markup(DISCORDANCE, { pulseOximeterArtifactGuidance: 'guided' });
    expect(pleth).toContain('this lowers confidence, and it does not diagnose artifact');
    expect(pleth).not.toContain('is not in a position to tell you what the blood is carrying');
  });

  it('states the limit of the probe review', () => {
    expect(markup(PLETH, { pulseOximeterArtifactGuidance: 'guided' }))
      .toContain('has not been excluded by any of it');
  });

  it('makes the independent measurement the point of the chain', () => {
    expect(markup(PROBE, { pulseOximeterArtifactGuidance: 'guided' }))
      .toContain('This is the step the whole chain exists for');
  });

  it('goes quiet once the clean site is recorded', () => {
    expect(markup(DONE, { pulseOximeterArtifactGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { pulseOximeterArtifactGuidance: 'guided', pulseOximeterArtifactDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
