/** @vitest-environment jsdom */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderedBody } from '@routes/Prerendered';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { PEA_ARREST as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/pea-arrest';
import { PERSISTENT_VF_ARREST } from '../../src/modules/emergency-medicine/scenarios/persistent-vf-arrest';

type Resuscitation = ActionCockpitProps['resuscitation'];

const base = (over: Partial<Resuscitation>): Resuscitation => ({
  epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0, lastEpinephrineTick: null,
  crystalloidTotalMl: 0, dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
  lastDantroleneTick: null, activeCooling: false,
  cardiacArrestActive: true, chestCompressionsActive: false, chestCompressionSeconds: 0,
  arrestEpinephrineTotalMg: 0, defibrillationShockCount: 0, lastDefibrillationEnergyJ: null,
  roscAtTick: null, ...over,
});

const BEFORE = base({ cardiacArrestActive: false });
const ARREST = base({});
const COMPRESSING = base({ chestCompressionsActive: true, chestCompressionSeconds: 4 });
const PAUSED = base({ chestCompressionsActive: false, chestCompressionSeconds: 4 });
const DOSED = base({
  chestCompressionsActive: true, chestCompressionSeconds: 8, arrestEpinephrineTotalMg: 1,
});
const SHOCKED = base({ defibrillationShockCount: 1, lastDefibrillationEnergyJ: 200 });

const props = (resuscitation: Resuscitation, extra: Partial<ActionCockpitProps> = {}): ActionCockpitProps => ({
  scenario: SCENARIO, region: UNITED_STATES, infusions: [], hypnoticLine: { connected: true, inspected: false },
  resuscitation,
  lastExposure: null, syringeRemaining: {},
  ventilator: { mode: 'manual', tidalVolumeMl: 500, respiratoryRateBpm: 10, fio2: 1, peep: 0, delivering: false, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
  intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
  supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null, muscleRigidityFraction: 0,
  onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
  onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {}, onDantrolene: () => {},
  onCallForHelp: () => {}, onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
  onChestCompressions: () => {}, onArrestEpinephrine: () => {}, onDefibrillation: () => {}, ...extra,
});

const markup = (resuscitation: Resuscitation, extra: Partial<ActionCockpitProps> = {}) =>
  renderToStaticMarkup(createElement(ActionCockpit, props(resuscitation, extra)));

describe('Emergency PEA arrest experience', () => {
  it('is discoverable at its exact route', () => {
    const index = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine' }));
    expect(index).toContain('href="/emergency-medicine/scenario/pea-arrest"');
    const route = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/emergency-medicine/scenario/pea-arrest' }));
    expect(route).toContain(`<h1>${SCENARIO.metadata.title}</h1>`);
  });

  it('offers compressions and the bounded dose, and no shock control at all', () => {
    const html = markup(ARREST);
    expect(html).toContain('Start compressions');
    expect(html).toContain('Prepare 1 mg IV');
    expect(html).not.toContain('Biphasic defibrillation');
    expect(html).toContain('Defibrillation is not offered for PEA');
  });

  it('still offers the shock in the sibling VF lesson, which shares this tray', () => {
    const html = renderToStaticMarkup(createElement(ActionCockpit,
      props(ARREST, { scenario: PERSISTENT_VF_ARREST })));
    expect(html).toContain('Biphasic defibrillation');
  });

  it('closes the bounded dose once it has been given', () => {
    expect(markup(ARREST)).toMatch(/Prepare 1 mg IV/);
    expect(markup(DOSED)).toMatch(/<button[^>]* disabled=""[^>]*>Prepare 1 mg IV<\/button>/);
  });
});

describe('Emergency PEA arrest tutor and worked example', () => {
  it('says nothing at all on the unassisted setting', () => {
    expect(markup(ARREST)).not.toContain('A moment to think');
    expect(markup(ARREST, { peaArrestGuidance: 'unassisted' })).not.toContain('A moment to think');
  });

  it('says nothing before the arrest is active', () => {
    expect(markup(BEFORE, { peaArrestGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('reads the learner’s own recorded steps when guidance is on', () => {
    const opening = markup(ARREST, { peaArrestGuidance: 'guided' });
    expect(opening).toContain('A moment to think');
    expect(opening).toContain('The monitor is not the patient');
    const dose = markup(COMPRESSING, { peaArrestGuidance: 'guided' });
    expect(dose).toContain('there is no shock to wait for');
    expect(dose).not.toContain('The monitor is not the patient');
  });

  it('asks for compressions to be restarted before it asks for the dose', () => {
    const paused = markup(PAUSED, { peaArrestGuidance: 'guided' });
    expect(paused).toContain('Compressions are paused');
    expect(paused).not.toContain('there is no shock to wait for');
  });

  it('corrects a delivered shock in place of whatever it was going to say', () => {
    const shocked = markup(SHOCKED, { peaArrestGuidance: 'guided' });
    expect(shocked).toContain('does not take a shock');
    expect(shocked).not.toContain('The monitor is not the patient');
  });

  it('goes quiet once compressions are running with the dose given', () => {
    expect(markup(DOSED, { peaArrestGuidance: 'guided' })).not.toContain('A moment to think');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    expect(markup(ARREST)).toContain('Start compressions');
    const watching = markup(ARREST, { peaArrestGuidance: 'guided', peaArrestDemonstrating: true });
    expect(watching).toContain('Start compressions');
    expect(watching).toContain('aria-disabled="true"');
    expect(watching).toContain('Watching the worked example');
    expect(watching).not.toContain('A moment to think');
  });

  it('leaves the sibling VF tray untouched by this lesson’s tutor', () => {
    const html = renderToStaticMarkup(createElement(ActionCockpit,
      props(ARREST, { scenario: PERSISTENT_VF_ARREST, peaArrestGuidance: 'guided' })));
    expect(html).not.toContain('A moment to think');
  });
});
