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
import { SALICYLATE_FALLING_NUMBER } from '../../src/modules/toxicology/scenarios/salicylate-falling-number';
import { TRICYCLIC_SODIUM_CHANNEL_CARDIOTOXICITY } from '../../src/modules/toxicology/scenarios/tricyclic-sodium-channel-cardiotoxicity';
import { BETA_BLOCKER_CARDIOGENIC_SHOCK } from '../../src/modules/toxicology/scenarios/beta-blocker-cardiogenic-shock';
import { CALCIUM_CHANNEL_BLOCKER_SHOCK } from '../../src/modules/toxicology/scenarios/calcium-channel-blocker-shock';
import { DIGOXIN_RHYTHM_POTASSIUM } from '../../src/modules/toxicology/scenarios/digoxin-rhythm-potassium';
import { CHOLINERGIC_PESTICIDE_RESPIRATORY_FAILURE } from '../../src/modules/toxicology/scenarios/cholinergic-pesticide-respiratory-failure';
import { ANTICHOLINERGIC_HYPERTHERMIA_DELIRIUM } from '../../src/modules/toxicology/scenarios/anticholinergic-hyperthermia-delirium';

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
    onToxicologySalicylateResponse: () => {},
    onToxicologyTricyclicResponse: () => {},
    onToxicologyBetaBlockerResponse: () => {},
    onToxicologyCalciumChannelBlockerResponse: () => {},
    onToxicologyDigoxinResponse: () => {},
    onToxicologyCholinergicResponse: () => {},
    onToxicologyAnticholinergicResponse: () => {},
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
    expect(markup).toContain('href="/toxicology/scenario/salicylate-falling-number"');
    expect(markup).toContain('Salicylate: the falling number can be worse');
    expect(markup).toContain('href="/toxicology/scenario/tricyclic-sodium-channel-cardiotoxicity"');
    expect(markup).toContain('Tricyclic toxicity: read the whole electrical pattern');
    expect(markup).toContain('href="/toxicology/scenario/beta-blocker-cardiogenic-shock"');
    expect(markup).toContain('Beta-blocker toxicity: perfusion is more than pulse rate');
    expect(markup).toContain('href="/toxicology/scenario/calcium-channel-blocker-shock"');
    expect(markup).toContain('Calcium-channel blocker toxicity: read the glucose with the shock');
    expect(markup).toContain('href="/toxicology/scenario/digoxin-rhythm-potassium"');
    expect(markup).toContain('Digoxin toxicity: read the rhythm and potassium together');
    expect(markup).toContain('href="/toxicology/scenario/cholinergic-pesticide-respiratory-failure"');
    expect(markup).toContain('Cholinergic poisoning: protect the team, then clear the air');
    expect(markup).toContain('href="/toxicology/scenario/anticholinergic-hyperthermia-delirium"');
    expect(markup).toContain('Anticholinergic poisoning: cool the patient, not the clues');
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

  it('prerenders and opens the salicylate lab on its calm whole-trajectory tray', () => {
    const page = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/salicylate-falling-number' }));
    expect(page).toContain('<h1>Salicylate: the falling number can be worse</h1>');
    expect(page).toContain('mixed acid-base pattern');
    expect(crisisResponseAvailability(SALICYLATE_FALLING_NUMBER, []))
      .toMatchObject({ hasToxicologySalicylateResponse: true });
    expect(crisisResponseAvailability({ ...SALICYLATE_FALLING_NUMBER,
      metadata: { ...SALICYLATE_FALLING_NUMBER.metadata, id: 'salicylate-clone' } }, []))
      .toMatchObject({ hasToxicologySalicylateResponse: false });
    const markup = cockpitMarkup(SALICYLATE_FALLING_NUMBER, {
      toxicologySalicylateAssessment: { trajectoryAtTick: null, recognitionAtTick: null,
        supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
    });
    expect(markup).toContain('Salicylate trajectory');
    expect(markup).toContain('Read the patient and the number together.');
    expect(markup).toContain('Connect exposure + breathing');
    expect(markup).not.toMatch(/mEq|mL\/kg|dialysis threshold|ventilator setting/i);
    expect(markup).not.toContain('<input');
    expect(markup).not.toContain('<select');
  });

  it('prerenders and opens the tricyclic lab on its calm whole-pattern tray', () => {
    const page = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/tricyclic-sodium-channel-cardiotoxicity' }));
    expect(page).toContain('<h1>Tricyclic toxicity: read the whole electrical pattern</h1>');
    expect(page).toContain('QRS-only closure');
    expect(crisisResponseAvailability(TRICYCLIC_SODIUM_CHANNEL_CARDIOTOXICITY, []))
      .toMatchObject({ hasToxicologyTricyclicResponse: true });
    expect(crisisResponseAvailability({ ...TRICYCLIC_SODIUM_CHANNEL_CARDIOTOXICITY,
      metadata: { ...TRICYCLIC_SODIUM_CHANNEL_CARDIOTOXICITY.metadata, id: 'tricyclic-clone' } }, []))
      .toMatchObject({ hasToxicologyTricyclicResponse: false });
    const markup = cockpitMarkup(TRICYCLIC_SODIUM_CHANNEL_CARDIOTOXICITY, {
      toxicologyTricyclicAssessment: { trajectoryAtTick: null, recognitionAtTick: null,
        supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
    });
    expect(markup).toContain('Electrical toxicity');
    expect(markup).toContain('The tracing belongs to a whole patient.');
    expect(markup).toContain('Connect patient + tracing');
    expect(markup).not.toMatch(/mEq|mg\/kg|pH target|ventilator setting|ECLS/i);
    expect(markup).not.toContain('<input');
    expect(markup).not.toContain('<select');
  });

  it('prerenders and opens the beta-blocker lab on its calm perfusion-first tray', () => {
    const page = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/beta-blocker-cardiogenic-shock' }));
    expect(page).toContain('<h1>Beta-blocker toxicity: perfusion is more than pulse rate</h1>');
    expect(page).toContain('pulse-only closure');
    expect(crisisResponseAvailability(BETA_BLOCKER_CARDIOGENIC_SHOCK, []))
      .toMatchObject({ hasToxicologyBetaBlockerResponse: true });
    expect(crisisResponseAvailability({ ...BETA_BLOCKER_CARDIOGENIC_SHOCK,
      metadata: { ...BETA_BLOCKER_CARDIOGENIC_SHOCK.metadata, id: 'beta-blocker-clone' } }, []))
      .toMatchObject({ hasToxicologyBetaBlockerResponse: false });
    const markup = cockpitMarkup(BETA_BLOCKER_CARDIOGENIC_SHOCK, {
      toxicologyBetaBlockerAssessment: { trajectoryAtTick: null, recognitionAtTick: null,
        supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
    });
    expect(markup).toContain('Beta-blocker shock');
    expect(markup).toContain('A slow pulse can hide a failing pump.');
    expect(markup).toContain('Connect pulse + perfusion');
    expect(markup).not.toMatch(/units\/kg|mg\/kg|mL\/kg|pacing rate|dialysis threshold|ECLS/i);
    expect(markup).not.toContain('<input');
    expect(markup).not.toContain('<select');
  });

  it('prerenders and opens the calcium-channel-blocker lab on its calm pattern-first tray', () => {
    const page = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/calcium-channel-blocker-shock' }));
    expect(page).toContain('<h1>Calcium-channel blocker toxicity: read the glucose with the shock</h1>');
    expect(page).toContain('glucose- or pulse-only closure');
    expect(crisisResponseAvailability(CALCIUM_CHANNEL_BLOCKER_SHOCK, []))
      .toMatchObject({ hasToxicologyCalciumChannelBlockerResponse: true });
    expect(crisisResponseAvailability({ ...CALCIUM_CHANNEL_BLOCKER_SHOCK,
      metadata: { ...CALCIUM_CHANNEL_BLOCKER_SHOCK.metadata, id: 'calcium-channel-blocker-clone' } }, []))
      .toMatchObject({ hasToxicologyCalciumChannelBlockerResponse: false });
    const markup = cockpitMarkup(CALCIUM_CHANNEL_BLOCKER_SHOCK, {
      toxicologyCalciumChannelBlockerAssessment: { trajectoryAtTick: null, recognitionAtTick: null,
        supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
    });
    expect(markup).toContain('CCB shock');
    expect(markup).toContain('The high glucose belongs beside the slow rhythm.');
    expect(markup).toContain('Connect rhythm + glucose');
    expect(markup).not.toMatch(/units\/kg|mg\/kg|mL\/kg|pacing rate|decontamination window|ECLS/i);
    expect(markup).not.toContain('<input');
    expect(markup).not.toContain('<select');
  });

  it('prerenders and opens the digoxin lab on its calm rhythm-potassium tray', () => {
    const page = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/digoxin-rhythm-potassium' }));
    expect(page).toContain('<h1>Digoxin toxicity: read the rhythm and potassium together</h1>');
    expect(page).toContain('level-, rhythm-, or potassium-only closure');
    expect(crisisResponseAvailability(DIGOXIN_RHYTHM_POTASSIUM, []))
      .toMatchObject({ hasToxicologyDigoxinResponse: true });
    expect(crisisResponseAvailability({ ...DIGOXIN_RHYTHM_POTASSIUM,
      metadata: { ...DIGOXIN_RHYTHM_POTASSIUM.metadata, id: 'digoxin-clone' } }, []))
      .toMatchObject({ hasToxicologyDigoxinResponse: false });
    const markup = cockpitMarkup(DIGOXIN_RHYTHM_POTASSIUM, {
      toxicologyDigoxinAssessment: { trajectoryAtTick: null, recognitionAtTick: null,
        supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
    });
    expect(markup).toContain('Digoxin pattern');
    expect(markup).toContain('The rhythm and potassium tell one story.');
    expect(markup).toContain('Connect rhythm + potassium');
    expect(markup).not.toMatch(/vial count|mg\/kg|mL\/kg|pacing rate|dialysis threshold/i);
    expect(markup).not.toContain('<input');
    expect(markup).not.toContain('<select');
  });

  it('prerenders and opens the cholinergic lab on its calm team-safety tray', () => {
    const page = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/cholinergic-pesticide-respiratory-failure' }));
    expect(page).toContain('<h1>Cholinergic poisoning: protect the team, then clear the air</h1>');
    expect(page).toContain('mnemonic- or cholinesterase-only closure');
    expect(crisisResponseAvailability(CHOLINERGIC_PESTICIDE_RESPIRATORY_FAILURE, []))
      .toMatchObject({ hasToxicologyCholinergicResponse: true });
    expect(crisisResponseAvailability({ ...CHOLINERGIC_PESTICIDE_RESPIRATORY_FAILURE,
      metadata: { ...CHOLINERGIC_PESTICIDE_RESPIRATORY_FAILURE.metadata, id: 'cholinergic-clone' } }, []))
      .toMatchObject({ hasToxicologyCholinergicResponse: false });
    const markup = cockpitMarkup(CHOLINERGIC_PESTICIDE_RESPIRATORY_FAILURE, {
      toxicologyCholinergicAssessment: { trajectoryAtTick: null, recognitionAtTick: null,
        safetyAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
    });
    expect(markup).toContain('Cholinergic crisis');
    expect(markup).toContain('Protect the rescuers before the first touch.');
    expect(markup).toContain('Connect exposure + breathing');
    expect(markup).not.toMatch(/mg\/kg|mL\/kg|wash for|intubation device|ventilator setting/i);
    expect(markup).not.toContain('<input');
    expect(markup).not.toContain('<select');
  });

  it('prerenders and opens the anticholinergic lab on its calm cooling-first tray', () => {
    const page = renderToStaticMarkup(createElement(PrerenderedBody, { path: '/toxicology/scenario/anticholinergic-hyperthermia-delirium' }));
    expect(page).toContain('<h1>Anticholinergic poisoning: cool the patient, not the clues</h1>');
    expect(page).toContain('mnemonic-, temperature-, pupil-, or dryness-only closure');
    expect(crisisResponseAvailability(ANTICHOLINERGIC_HYPERTHERMIA_DELIRIUM, []))
      .toMatchObject({ hasToxicologyAnticholinergicResponse: true });
    expect(crisisResponseAvailability({ ...ANTICHOLINERGIC_HYPERTHERMIA_DELIRIUM,
      metadata: { ...ANTICHOLINERGIC_HYPERTHERMIA_DELIRIUM.metadata, id: 'anticholinergic-clone' } }, []))
      .toMatchObject({ hasToxicologyAnticholinergicResponse: false });
    const markup = cockpitMarkup(ANTICHOLINERGIC_HYPERTHERMIA_DELIRIUM, {
      toxicologyAnticholinergicAssessment: { trajectoryAtTick: null, recognitionAtTick: null,
        supportAtTick: null, evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null },
    });
    expect(markup).toContain('Anticholinergic heat');
    expect(markup).toContain('Cool the patient. Keep the differential warm.');
    expect(markup).toContain('Connect heat + delirium');
    expect(markup).not.toMatch(/mg\/kg|cooling rate|ice bath|restraint type|catheter size|physostigmine dose/i);
    expect(markup).not.toContain('<input');
    expect(markup).not.toContain('<select');
  });
});
