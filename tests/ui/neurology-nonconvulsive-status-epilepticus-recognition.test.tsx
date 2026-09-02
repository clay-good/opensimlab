import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { NONCONVULSIVE_STATUS_EPILEPTICUS_RECOGNITION as SCENARIO } from '../../src/modules/neurology/scenarios/nonconvulsive-status-epilepticus-recognition';
const markup = (assessment: NonNullable<ActionCockpitProps['resuscitation']['neurologyNcseAssessment']>, extra: {
  neurologyNcseGuidance?: ActionCockpitProps['neurologyNcseGuidance'];
  neurologyNcseDemonstrating?: boolean;
} = {}) => renderToStaticMarkup(createElement(ActionCockpit, { scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false }, resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, neurologyNcseAssessment: assessment }, lastExposure: null, syringeRemaining: {}, ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 }, intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {}, onNeurologyNcseResponse: () => {}, ...extra } satisfies ActionCockpitProps));

const EMPTY = { trajectoryAtTick: null, suspicionAtTick: null, ownershipAtTick: null, alternativesAtTick: null, laterAtTick: null, handoffAtTick: null };
const LABELS = ['Review fluctuation + subtle signs', 'Recognize urgent EEG boundary', 'Activate qualified EEG ownership', 'Review safety + alternatives', 'Review qualified EEG report', 'Hand off status + open risk'];
const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Neurology nonconvulsive-status experience', () => {
  it('is discoverable at its exact calm route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology' }));
    expect(index).toContain('href="/neurology/scenario/nonconvulsive-status-epilepticus-recognition"');
    expect(index).toContain('Nonconvulsive status epilepticus recognition');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/neurology/scenario/nonconvulsive-status-epilepticus-recognition' }));
    expect(route).toContain('<h1>Nonconvulsive status epilepticus recognition</h1>');
  });

  it('fails closed and exposes one calm cognitive action at a time', () => {
    expect(crisisResponseAvailability(SCENARIO).hasNeurologyNcseResponse).toBe(true);
    expect(crisisResponseAvailability({ ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1) }).hasNeurologyNcseResponse).toBe(false);
    const states = [EMPTY,
      { ...EMPTY, trajectoryAtTick: 0 },
      { ...EMPTY, trajectoryAtTick: 0, suspicionAtTick: 1 },
      { ...EMPTY, trajectoryAtTick: 0, suspicionAtTick: 1, ownershipAtTick: 2 },
      { ...EMPTY, trajectoryAtTick: 0, suspicionAtTick: 1, ownershipAtTick: 2, alternativesAtTick: 3 },
      { ...EMPTY, trajectoryAtTick: 0, suspicionAtTick: 1, ownershipAtTick: 2, alternativesAtTick: 3, laterAtTick: 4 },
      { trajectoryAtTick: 0, suspicionAtTick: 1, ownershipAtTick: 2, alternativesAtTick: 3, laterAtTick: 4, handoffAtTick: 5 }];
    expect(states.map((state) => lessonButtons(markup(state)).length)).toEqual([1, 1, 1, 1, 1, 1, 0]);
    expect(markup(states[0]!)).toContain('Quiet can still mean seizure.');
    const later = markup(states[4]!);
    expect(later).toContain('EEG answers a clinical question.');
    expect(later).toContain('Qualified ownership is active. Review the fixed later EEG and clinical report.');
    expect(markup(states[5]!)).toContain('meets the electrographic-status definition');
    for (const html of states.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/history|examin|auscultat|sample|acquire|calculat|score|time the|lorazepam|midazolam|levetiracetam|benzodiaz|propofol|electrode|intubat|anesthe|sedat|dose|route|drug|infusion|oxygen|prescri|procedure|diagnos|exclude|disposition|discharge|prognos/iu);
    }
  });
});

describe('Nonconvulsive-status tutor and worked example', () => {
  const named = { ...EMPTY, trajectoryAtTick: 0, suspicionAtTick: 1 };

  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { neurologyNcseGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { neurologyNcseGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Describe the fluctuation in seconds');
    const next = markup(named, { neurologyNcseGuidance: 'guided' });
    expect(next).toContain('Get neurology, the EEG service');
    expect(next).not.toContain('Describe the fluctuation in seconds');
  });

  it('refuses both halves of the shortcut', () => {
    const html = markup({ ...EMPTY, trajectoryAtTick: 0 }, { neurologyNcseGuidance: 'guided' });
    expect(html).toContain('cannot make this diagnosis from the bedside');
    expect(html).toContain('cannot wait to suspect it');
  });

  it('goes quiet once the handoff is recorded', () => {
    const ended = { trajectoryAtTick: 0, suspicionAtTick: 1, ownershipAtTick: 2, alternativesAtTick: 3, laterAtTick: 4, handoffAtTick: 5 };
    expect(markup(ended, { neurologyNcseGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = 'Review fluctuation + subtle signs';
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { neurologyNcseGuidance: 'guided', neurologyNcseDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
