/** @vitest-environment jsdom */
/**
 * The tutor panel for the emergency obstructive-shock lesson.
 *
 * The tray is the shared PneumothoraxResponseTray, used by the anaesthesia
 * pneumothorax-under-positive-pressure lesson too, so the panel is scoped by
 * the caller rather than by the tray: the prompt is resolved in ActionCockpit
 * behind supportsObstructivePleuralShock and passed down already computed.
 * tests/ui/obstructive-shock-tension-pneumothorax.test.tsx covers the tray's
 * pre-existing behaviour and is left alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { OBSTRUCTIVE_SHOCK_TENSION_PNEUMOTHORAX as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/obstructive-shock-tension-pneumothorax';
import { PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE } from '@anesthesia/scenarios/pneumothorax-under-positive-pressure';

const props = (over: Partial<ActionCockpitProps> = {}, resuscitation: Record<string, unknown> = {}, fio2 = 0.21, helpRequestedAtTick: number | null = null): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false, tensionPneumothoraxFraction: 0.9, pneumothoraxAssessedAtTick: null, pneumothoraxDecompressedAtTick: null, ...resuscitation } as never,
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 26, fio2, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 2 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onPneumothoraxResponse: () => {}, onPneumothoraxHelp: () => {}, ...over,
});

const markup = (over: Partial<ActionCockpitProps> = {}, resuscitation: Record<string, unknown> = {}, fio2 = 0.21, help: number | null = null) =>
  renderToStaticMarkup(createElement(ActionCockpit, props(over, resuscitation, fio2, help)));

describe('Emergency obstructive pleural shock experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/obstructive-shock-tension-pneumothorax"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/obstructive-shock-tension-pneumothorax' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('keeps the shared crisis controls on screen', () => {
    expect(markup()).toContain('Check bilateral ventilation');
  });
});

describe('Emergency obstructive pleural shock tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup()).not.toContain('A moment to think');
    expect(markup({ obstructivePleuralShockGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup({ obstructivePleuralShockGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('this one asks how long you took');
    const afterAssessment = markup({ obstructivePleuralShockGuidance: 'guided' }, { pneumothoraxAssessedAtTick: 1 });
    expect(afterAssessment).toContain('happening at the same time rather than next');
    expect(afterAssessment).not.toContain('this one asks how long you took');
  });

  it('moves to the oxygen and then the decompression as each is recorded', () => {
    const afterHelp = markup({ obstructivePleuralShockGuidance: 'guided' }, { pneumothoraxAssessedAtTick: 1 }, 0.21, 2);
    expect(afterHelp).toContain('oxygen does not re-expand a lung');
    const afterOxygen = markup({ obstructivePleuralShockGuidance: 'guided' }, { pneumothoraxAssessedAtTick: 1 }, 1, 2);
    expect(afterOxygen).toContain('the treatment reliably precedes the confirmation');
  });

  it('goes quiet once the chest is decompressed', () => {
    const done = markup({ obstructivePleuralShockGuidance: 'guided' },
      { pneumothoraxAssessedAtTick: 1, pneumothoraxDecompressedAtTick: 4 }, 1, 2);
    expect(done).not.toContain('A moment to think');
  });

  it('stays silent on the anaesthesia lesson that shares this tray', () => {
    const other = renderToStaticMarkup(createElement(ActionCockpit,
      props({ scenario: PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE, obstructivePleuralShockGuidance: 'guided' })));
    expect(other).not.toContain('A moment to think');
  });

  it('leaves the controls visible but announces the example while it runs', () => {
    const watching = markup({ obstructivePleuralShockGuidance: 'guided', obstructivePleuralShockDemonstrating: true });
    expect(watching).toContain('Check bilateral ventilation');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });
});
