import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { METHEMOGLOBINEMIA_SATURATION_GAP as SCENARIO } from '../../src/modules/toxicology/scenarios/methemoglobinemia-saturation-gap';

describe('Toxicology module user-facing foundation', () => {
  const cockpitMarkup = () => renderToStaticMarkup(createElement(ActionCockpit, {
    scenario: SCENARIO, region: UNITED_STATES, infusions: [],
    hypnoticLine: { connected: true, inspected: false },
    resuscitation: {
      epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
      lastEpinephrineTick: null, crystalloidTotalMl: 0,
      dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
      lastDantroleneTick: null, activeCooling: false,
      toxicologyMethemoglobinemiaAssessment: {
        trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null,
        hazardsAtTick: null, reassessmentAtTick: null, handoffAtTick: null,
      },
    },
    lastExposure: null, syringeRemaining: {},
    ventilator: { mode: 'manual', tidalVolumeMl: 420, respiratoryRateBpm: 26,
      fio2: 1, peep: 0, delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
    intubated: false, airwayAttempts: 0, lastGrade: null,
    jawThrustCpapSecondsRemaining: 0, airwayDevice: 'facemask',
    supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
    muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {},
    onHypnoticLine: () => {}, onFluid: () => {}, onVentilator: () => {},
    onLaryngoscopy: () => {}, onAirwayManeuver: () => {}, onEpinephrine: () => {},
    onDantrolene: () => {}, onCallForHelp: () => {}, onAirwayDevice: () => {},
    onActiveCooling: () => {}, onDrugCard: () => {},
    onToxicologyMethemoglobinemiaResponse: () => {},
  } satisfies ActionCockpitProps));

  it('renders a calm module index with shared navigation and the exact first lab', () => {
    const markup = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology' }));
    expect(markup).toContain('<h1>Toxicology simulator</h1>');
    expect(markup).toContain('href="/toxicology" aria-current="page"');
    expect(markup).toContain('href="/toxicology/scenario/methemoglobinemia-saturation-gap"');
    expect(markup).toContain('Methemoglobinemia with a saturation gap');
  });

  it('briefs the bounded poisoning rehearsal without dose or diagnostic claims', () => {
    const markup = renderToStaticMarkup(createElement(Prebrief, {
      scenario: SCENARIO, region: UNITED_STATES, environment: 'toxicology',
      onStart: () => {}, guidance: 'guided', onGuidance: () => {},
    }));
    expect(markup).toContain('42-year-old woman');
    expect(markup).toContain('follow the toxicology trajectory at your own pace');
    expect(markup).toContain('not diagnosis, dosing, device use, or procedures');
    expect(markup).not.toMatch(/\b1(?:\.0)?\s*mg\/kg\b/i);
  });

  it('prerenders sources and activates the tray only for the frozen identity and targets', () => {
    const markup = renderToStaticMarkup(createElement(PrerenderedBody, {
      path: '/toxicology/scenario/methemoglobinemia-saturation-gap',
    }));
    expect(markup).toContain('<h1>Methemoglobinemia with a saturation gap</h1>');
    expect(markup).toContain('Review and sources');
    expect(markup).toContain('Not clinically reviewed');
    expect(markup).toContain('methylene-blue hazard boundary');
    expect(crisisResponseAvailability(SCENARIO, []))
      .toMatchObject({ hasToxicologyMethemoglobinemiaResponse: true });
    expect(crisisResponseAvailability({ ...SCENARIO,
      metadata: { ...SCENARIO.metadata, id: 'methemoglobinemia-clone' } }, []))
      .toMatchObject({ hasToxicologyMethemoglobinemiaResponse: false });
  });

  it('opens directly on the calm bounded response tray with no dose controls', () => {
    const markup = cockpitMarkup();
    expect(markup).toContain('Dyshemoglobin pattern');
    expect(markup).toContain('The numbers disagree. The patient matters.');
    expect(markup).toContain('Connect the discordant clues');
    expect(markup).not.toMatch(/\bmg\/kg\b|exchange transfusion|hyperbaric/i);
    expect(markup).not.toContain('<input');
    expect(markup).not.toContain('<select');
  });
});
