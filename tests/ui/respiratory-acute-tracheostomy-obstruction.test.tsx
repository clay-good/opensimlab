/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_TRACHEOSTOMY_OBSTRUCTION as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/acute-tracheostomy-obstruction';

/** The constants this lesson never moves, spread into every state below. */
const NEVER = {
  initialPulsePresent: true as const, spontaneousBreathingAuthored: true as const,
  tracheostomyPresentAuthored: true as const, laryngectomyAuthored: false as const,
  patentUpperAirwayAuthored: true as const, matureStomaAuthored: true as const,
  removableInnerCannulaAuthored: true as const,
  patientExaminedByLearner: false as const, monitorInterpretedByLearner: false as const,
  deviceInspectedByLearner: false as const, catheterPassedByLearner: false as const,
  suctionPerformedByLearner: false as const, innerCannulaHandledByLearner: false as const,
  tracheostomyTubeHandledByLearner: false as const, cuffChangedByLearner: false as const,
  oxygenSelectedByLearner: false as const, oxygenDeliveredByLearner: false as const,
  ventilationDeliveredByLearner: false as const,
  intubationPerformedByLearner: false as const,
  procedurePerformedByLearner: false as const,
  treatmentDeliveredByLearner: false as const, durablePatencyProven: false as const,
  dispositionDetermined: false as const, outcomePredicted: false as const,
};
const base = (over: Record<string, unknown>) => ({
  recognitionAtTick: null, supportAtTick: null, devicePathwayAtTick: null,
  innerCannulaAtTick: null, restorationAtTick: null, handoffAtTick: null,
  lastUnsupportedChoice: null,
  innerCannulaObstructionAuthored: over.devicePathwayAtTick != null,
  dualRouteOxygenIntentRecorded: over.supportAtTick != null,
  expertDevicePathwayRecorded: over.innerCannulaAtTick != null,
  ...NEVER, ...over,
} as NonNullable<ActionCockpitProps['resuscitation']['acuteTracheostomyObstructionAssessment']>);

const EMPTY = base({});
const RECOGNIZED = base({ recognitionAtTick: 0 });
const AFTER_IMAGING = base({ recognitionAtTick: 0, lastUnsupportedChoice: 'imaging' });
const AFTER_UNVERIFIED = base({ recognitionAtTick: 0, lastUnsupportedChoice: 'unverified-ventilation' });
const PATHWAY = base({ recognitionAtTick: 0, supportAtTick: 1, devicePathwayAtTick: 2 });
const AFTER_FORCE = base({ recognitionAtTick: 0, supportAtTick: 1, devicePathwayAtTick: 2, lastUnsupportedChoice: 'force-catheter' });
const AFTER_WHOLE_TUBE = base({ recognitionAtTick: 0, supportAtTick: 1, devicePathwayAtTick: 2, lastUnsupportedChoice: 'whole-tube' });
const CORRECTED = base({ recognitionAtTick: 0, supportAtTick: 1, devicePathwayAtTick: 2, innerCannulaAtTick: 3 });
const DONE = base({ recognitionAtTick: 0, supportAtTick: 1, devicePathwayAtTick: 2, innerCannulaAtTick: 3, restorationAtTick: 4, handoffAtTick: 5 });
const STATES = [EMPTY, RECOGNIZED, AFTER_IMAGING, AFTER_UNVERIFIED, PATHWAY, AFTER_FORCE, AFTER_WHOLE_TUBE, CORRECTED, DONE];

const LABELS = ['Review person + airway map', 'Call airway help + support both routes',
  'Wait for imaging', 'Ventilate through the tube now', 'Review declared device pathway',
  'Connect qualified inner-cannula action', 'Force the catheter through',
  'Replace the whole tube first', 'Review 2-minute response', 'Hand off active airway risk'];

const props = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['acuteTracheostomyObstructionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, acuteTracheostomyObstructionAssessment: assessment },
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 34, fio2: 0.4, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 0.5 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onAcuteTracheostomyObstructionResponse: () => {}, ...extra,
});

const markup = (
  assessment: NonNullable<ActionCockpitProps['resuscitation']['acuteTracheostomyObstructionAssessment']>,
  extra: Partial<ActionCockpitProps> = {},
) => renderToStaticMarkup(createElement(ActionCockpit, props(assessment, extra)));

const lessonButtons = (html: string) => [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)]
  .map((match) => match[1]!).filter((label) => LABELS.some((known) => label.includes(known)));

describe('Respiratory tracheostomy-patency experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine' }));
    expect(index).toContain('href="/respiratory-medicine/scenario/acute-tracheostomy-obstruction"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/respiratory-medicine/scenario/acute-tracheostomy-obstruction' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('fails closed on the timeline target rather than the scenario id', () => {
    expect(crisisResponseAvailability(SCENARIO).hasAcuteTracheostomyObstructionResponse).toBe(true);
    // The targets carry a -reassessment suffix the scenario id does not.
    expect(crisisResponseAvailability({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'acute-tracheostomy-obstruction-reassessment'),
    }).hasAcuteTracheostomyObstructionResponse).toBe(false);
  });

  it('offers each set of choices only at the moment it belongs to', () => {
    const opening = markup(EMPTY);
    expect(opening).not.toContain('Wait for imaging');
    expect(opening).not.toContain('Force the catheter through');
    const recognized = markup(RECOGNIZED);
    expect(recognized).toContain('Call airway help + support both routes');
    expect(recognized).toContain('Wait for imaging');
    expect(recognized).toContain('Ventilate through the tube now');
    const traced = markup(PATHWAY);
    expect(traced).toContain('Connect qualified inner-cannula action');
    expect(traced).toContain('Force the catheter through');
    expect(traced).toContain('Replace the whole tube first');
  });

  it('says what happened after each of the four harms', () => {
    expect(markup(AFTER_IMAGING)).toContain('cannot wait for imaging');
    expect(markup(AFTER_UNVERIFIED)).toContain('Do not ventilate through an unverified path');
    expect(markup(AFTER_FORCE)).toContain('Never force past resistance');
    expect(markup(AFTER_WHOLE_TUBE)).toContain('Use the simpler declared inner-cannula branch first');
  });

  it('never offers suction, a cuff, an exchange, or an intubation', () => {
    expect(markup(EMPTY)).toContain('The person comes before the tube.');
    expect(markup(DONE)).toContain('Restore airflow. Then prove it.');
    for (const html of STATES.map((state) => markup(state))) {
      expect(lessonButtons(html).join(' ')).not.toMatch(/examin|acquire|interpret|suction|deflate|cuff|exchange|reinsert|bronchoscop|intubat|FiO|L\/min|oxygen target|drug|dose|diagnose|disposition|discharge|prognos/iu);
    }
  });
});

describe('Tracheostomy-patency tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(EMPTY)).not.toContain('A moment to think');
    expect(markup(EMPTY, { acuteTracheostomyObstructionGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(EMPTY, { acuteTracheostomyObstructionGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('Read the bedhead sign first');
    const supporting = markup(RECOGNIZED, { acuteTracheostomyObstructionGuidance: 'guided' });
    expect(supporting).toContain('oxygenate both routes at once');
    expect(supporting).not.toContain('Read the bedhead sign first');
  });

  it('answers the specific harm at the first decision point', () => {
    const imaging = markup(AFTER_IMAGING, { acuteTracheostomyObstructionGuidance: 'guided' });
    expect(imaging).toContain('A picture cannot help him in the next two minutes');
    expect(imaging).not.toContain('inflate tissue rather than lung');
    const unverified = markup(AFTER_UNVERIFIED, { acuteTracheostomyObstructionGuidance: 'guided' });
    expect(unverified).toContain('inflate tissue rather than lung');
    expect(unverified).not.toContain('A picture cannot help him in the next two minutes');
  });

  it('answers the specific harm at the second decision point', () => {
    const force = markup(AFTER_FORCE, { acuteTracheostomyObstructionGuidance: 'guided' });
    expect(force).toContain('Resistance is information');
    expect(force).not.toContain('Not the whole tube');
    const whole = markup(AFTER_WHOLE_TUBE, { acuteTracheostomyObstructionGuidance: 'guided' });
    expect(whole).toContain('Not the whole tube');
    expect(whole).toContain('a real and sometimes necessary step');
    expect(whole).not.toContain('Resistance is information');
  });

  it('goes quiet once the handoff is recorded', () => {
    expect(markup(DONE, { acuteTracheostomyObstructionGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const label = LABELS[0]!;
    expect(markup(EMPTY)).toContain(label);
    const watching = markup(EMPTY, { acuteTracheostomyObstructionGuidance: 'guided', acuteTracheostomyObstructionDemonstrating: true });
    expect(watching).toContain(label);
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
