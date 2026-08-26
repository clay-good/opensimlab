import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrerenderedBody } from '@routes/Prerendered';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ActionCockpit, crisisResponseAvailability, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { METHEMOGLOBINEMIA_SATURATION_GAP as SCENARIO } from '../../src/modules/toxicology/scenarios/methemoglobinemia-saturation-gap';
import { CARBON_MONOXIDE_REASSURING_MONITOR } from '../../src/modules/toxicology/scenarios/carbon-monoxide-reassuring-monitor';
import { ACETAMINOPHEN_CLOCK_AND_NOMOGRAM } from '../../src/modules/toxicology/scenarios/acetaminophen-clock-and-nomogram';

describe('Toxicology module user-facing foundation', () => {
  const cockpitMarkup = (
    scenario = SCENARIO,
    assessment: Partial<ActionCockpitProps['resuscitation']> = {
      toxicologyMethemoglobinemiaAssessment: {
        trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null,
        hazardsAtTick: null, reassessmentAtTick: null, handoffAtTick: null,
      },
    },
  ) => renderToStaticMarkup(createElement(ActionCockpit, {
    scenario, region: UNITED_STATES, infusions: [],
    hypnoticLine: { connected: true, inspected: false },
    resuscitation: {
      epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
      lastEpinephrineTick: null, crystalloidTotalMl: 0,
      dantroleneTotalMg: 0, dantroleneEffectFraction: 0,
      lastDantroleneTick: null, activeCooling: false,
      ...assessment,
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
    onToxicologyCarbonMonoxideResponse: () => {},
    onToxicologyAcetaminophenResponse: () => {},
  } satisfies ActionCockpitProps));

  it('renders a calm module index with shared navigation and the exact first lab', () => {
    const markup = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology' }));
    expect(markup).toContain('<h1>Toxicology simulator</h1>');
    expect(markup).toContain('href="/toxicology" aria-current="page"');
    expect(markup).toContain('href="/toxicology/scenario/methemoglobinemia-saturation-gap"');
    expect(markup).toContain('Methemoglobinemia with a saturation gap');
    expect(markup).toContain('href="/toxicology/scenario/carbon-monoxide-reassuring-monitor"');
    expect(markup).toContain('Carbon monoxide with a reassuring monitor');
    expect(markup).toContain('href="/toxicology/scenario/acetaminophen-clock-and-nomogram"');
    expect(markup).toContain('Acetaminophen: the clock changes the meaning');
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

  it('prerenders and opens the carbon-monoxide lab on its calm hidden-hypoxia tray', () => {
    const page = renderToStaticMarkup(createElement(PrerenderedBody, {
      path: '/toxicology/scenario/carbon-monoxide-reassuring-monitor',
    }));
    expect(page).toContain('<h1>Carbon monoxide with a reassuring monitor</h1>');
    expect(page).toContain('conventional pulse oximetry');
    expect(crisisResponseAvailability(CARBON_MONOXIDE_REASSURING_MONITOR, []))
      .toMatchObject({ hasToxicologyCarbonMonoxideResponse: true });
    const markup = cockpitMarkup(CARBON_MONOXIDE_REASSURING_MONITOR, {
      toxicologyCarbonMonoxideAssessment: {
        trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null,
        severityAtTick: null, reassessmentAtTick: null, handoffAtTick: null,
      },
    });
    expect(markup).toContain('Hidden carbon monoxide');
    expect(markup).toContain('A calm monitor can still hide a poisoned patient.');
    expect(markup).toContain('Connect exposure + patient');
    expect(markup).not.toContain('<input');
    expect(markup).not.toContain('<select');
  });

  it('prerenders and opens the acetaminophen lab on its calm clock-first tray', () => {
    const page = renderToStaticMarkup(createElement(PrerenderedBody, {
      path: '/toxicology/scenario/acetaminophen-clock-and-nomogram',
    }));
    expect(page).toContain('<h1>Acetaminophen: the clock changes the meaning</h1>');
    expect(page).toContain('nomogram-applicability boundary');
    expect(crisisResponseAvailability(ACETAMINOPHEN_CLOCK_AND_NOMOGRAM, []))
      .toMatchObject({ hasToxicologyAcetaminophenResponse: true });
    expect(crisisResponseAvailability({ ...ACETAMINOPHEN_CLOCK_AND_NOMOGRAM,
      metadata: { ...ACETAMINOPHEN_CLOCK_AND_NOMOGRAM.metadata, id: 'acetaminophen-clone' } }, []))
      .toMatchObject({ hasToxicologyAcetaminophenResponse: false });
    const markup = cockpitMarkup(ACETAMINOPHEN_CLOCK_AND_NOMOGRAM, {
      toxicologyAcetaminophenAssessment: {
        trajectoryAtTick: null, recognitionAtTick: null, supportAtTick: null,
        evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null,
      },
    });
    expect(markup).toContain('Acetaminophen clock');
    expect(markup).toContain('The clock gives the number its meaning.');
    expect(markup).toContain('Connect product + clock');
    expect(markup).not.toMatch(/mg\/kg|automatic stop/i);
    expect(markup).not.toContain('<input');
    expect(markup).not.toContain('<select');
  });
});
