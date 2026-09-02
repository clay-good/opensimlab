import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_BACTERIAL_MENINGITIS_FIRST_HOUR as SCENARIO } from '../../src/modules/neurology/scenarios/acute-bacterial-meningitis-first-hour';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyMeningitisAssessment']>, extra: {
  neurologyMeningitisGuidance?: ActionCockpitProps['neurologyMeningitisGuidance'];
  neurologyMeningitisDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyMeningitisAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyMeningitisResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, ownershipAtTick: null, diagnosticsAtTick: null, treatmentAtTick: null, laterAtTick: null, handoffAtTick: null };
const LABELS = ['Review the acute trajectory', 'Activate time-critical owners', 'Review LP + imaging boundary', 'Activate early qualified care', 'Review the 45-minute report', 'Hand off meningitis risk'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Neurology bacterial-meningitis experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology' }));
    expect(index).toContain('href="/neurology/scenario/acute-bacterial-meningitis-first-hour"');
    expect(index).toContain('Acute bacterial meningitis first hour');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology/scenario/acute-bacterial-meningitis-first-hour' }));
    expect(route).toContain('<h1>Acute bacterial meningitis first hour</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeurologyMeningitisResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeurologyMeningitisResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, ownershipAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, ownershipAtTick: 1, diagnosticsAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, ownershipAtTick: 1, diagnosticsAtTick: 2, treatmentAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, ownershipAtTick: 1, diagnosticsAtTick: 2, treatmentAtTick: 3, laterAtTick: 4 },
      { trajectoryAtTick: 0, ownershipAtTick: 1, diagnosticsAtTick: 2, treatmentAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Protect the hour.');
    const later = markup(states[4]!);
    expect(later).toContain('Strong pattern, open questions.');
    expect(later).toContain('Qualified diagnostics and care are active. Review the fixed 45-minute CSF and clinical report.');
    expect(markup(states[5]!)).toContain('The CSF strongly supports bacterial meningitis.');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|measure|lumbar puncture|ceftriax|vancomyc|dexameth|antibiotic|culture|gram stain|ct head|intubat|anesthe|sedat|dose|route|drug|infusion|oxygen|prescri|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Bacterial-meningitis tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, ownershipAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { neurologyMeningitisGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { neurologyMeningitisGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Say how fast this arrived');
    const next = markup(named, { neurologyMeningitisGuidance: 'guided' });
    expect(next).toContain('Check the list that would justify a scan');
    expect(next).not.toContain('Say how fast this arrived');
  });

  it('calls the service before the puzzle', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { neurologyMeningitisGuidance: 'guided' });
    expect(html).toContain('the slowest possible version of this hour');
    expect(html).toContain('stop being retrofittable');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, ownershipAtTick: 1, diagnosticsAtTick: 2, treatmentAtTick: 3, laterAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neurologyMeningitisGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Review the acute trajectory';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { neurologyMeningitisGuidance: 'guided', neurologyMeningitisDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
