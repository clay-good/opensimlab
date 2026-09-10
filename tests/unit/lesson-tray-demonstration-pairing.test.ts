/**
 * A migrated tray must answer to its own worked example.
 *
 * `ActionCockpit` renders `demonstrating` by comparing the running demonstration's
 * id with the tray's, and a tray gates its controls off that flag. When a tray was
 * moved out of the cockpit under a name that did not match its demonstration, the
 * comparison silently never matched: the example ran while the tray stayed live,
 * with no type error and no failing test. `demoId` names the demonstration when the
 * two differ, and this file asserts every tray reaches one.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActionCockpit, type ActionCockpitProps } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { ACUTE_TRANSTENTORIAL_HERNIATION_PATTERN as HERNIATION } from '../../src/modules/neurology/scenarios/acute-transtentorial-herniation-pattern';
import type { LessonTray } from '@anesthesia/ui/lesson-tray';
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import { CARDIOLOGY_TRAYS } from '../../src/modules/cardiology/trays';
import { CARDIOLOGY_DEMONSTRATIONS } from '../../src/modules/cardiology/demo/demonstrations';
import { CRITICAL_CARE_TRAYS } from '../../src/modules/critical-care/trays';
import { CRITICAL_CARE_DEMONSTRATIONS } from '../../src/modules/critical-care/demo/demonstrations';
import { EMERGENCY_MEDICINE_TRAYS } from '../../src/modules/emergency-medicine/trays';
import { EMERGENCY_MEDICINE_DEMONSTRATIONS } from '../../src/modules/emergency-medicine/demo/demonstrations';
import { ENDOCRINE_METABOLIC_TRAYS } from '../../src/modules/endocrine-metabolic/trays';
import { ENDOCRINE_METABOLIC_DEMONSTRATIONS } from '../../src/modules/endocrine-metabolic/demo/demonstrations';
import { INFECTIOUS_DISEASE_TRAYS } from '../../src/modules/infectious-disease/trays';
import { INFECTIOUS_DISEASE_DEMONSTRATIONS } from '../../src/modules/infectious-disease/demo/demonstrations';
import { MEDICAL_SURGICAL_NURSING_TRAYS } from '../../src/modules/medical-surgical-nursing/trays';
import { MEDICAL_SURGICAL_NURSING_DEMONSTRATIONS } from '../../src/modules/medical-surgical-nursing/demo/demonstrations';
import { NEUROLOGY_TRAYS } from '../../src/modules/neurology/trays';
import { NEUROLOGY_DEMONSTRATIONS } from '../../src/modules/neurology/demo/demonstrations';
import { OBSTETRICS_TRAYS } from '../../src/modules/obstetrics/trays';
import { OBSTETRICS_DEMONSTRATIONS } from '../../src/modules/obstetrics/demo/demonstrations';
import { ONCOLOGY_TRAYS } from '../../src/modules/oncology/trays';
import { ONCOLOGY_DEMONSTRATIONS } from '../../src/modules/oncology/demo/demonstrations';
import { PEDIATRICS_TRAYS } from '../../src/modules/pediatrics/trays';
import { PEDIATRICS_DEMONSTRATIONS } from '../../src/modules/pediatrics/demo/demonstrations';
import { RENAL_ELECTROLYTE_TRAYS } from '../../src/modules/renal-electrolyte/trays';
import { RENAL_ELECTROLYTE_DEMONSTRATIONS } from '../../src/modules/renal-electrolyte/demo/demonstrations';
import { RESPIRATORY_MEDICINE_TRAYS } from '../../src/modules/respiratory-medicine/trays';
import { RESPIRATORY_MEDICINE_DEMONSTRATIONS } from '../../src/modules/respiratory-medicine/demo/demonstrations';
import { SURGERY_TRAUMA_TRAYS } from '../../src/modules/surgery-trauma/trays';
import { SURGERY_TRAUMA_DEMONSTRATIONS } from '../../src/modules/surgery-trauma/demo/demonstrations';

const MODULES: readonly {
  readonly id: string;
  readonly trays: readonly LessonTray[];
  readonly demonstrations: readonly LessonDemonstration[];
}[] = [
  { id: 'cardiology', trays: CARDIOLOGY_TRAYS, demonstrations: CARDIOLOGY_DEMONSTRATIONS },
  { id: 'critical-care', trays: CRITICAL_CARE_TRAYS, demonstrations: CRITICAL_CARE_DEMONSTRATIONS },
  { id: 'emergency-medicine', trays: EMERGENCY_MEDICINE_TRAYS, demonstrations: EMERGENCY_MEDICINE_DEMONSTRATIONS },
  { id: 'endocrine-metabolic', trays: ENDOCRINE_METABOLIC_TRAYS, demonstrations: ENDOCRINE_METABOLIC_DEMONSTRATIONS },
  { id: 'infectious-disease', trays: INFECTIOUS_DISEASE_TRAYS, demonstrations: INFECTIOUS_DISEASE_DEMONSTRATIONS },
  { id: 'medical-surgical-nursing', trays: MEDICAL_SURGICAL_NURSING_TRAYS, demonstrations: MEDICAL_SURGICAL_NURSING_DEMONSTRATIONS },
  { id: 'neurology', trays: NEUROLOGY_TRAYS, demonstrations: NEUROLOGY_DEMONSTRATIONS },
  { id: 'obstetrics', trays: OBSTETRICS_TRAYS, demonstrations: OBSTETRICS_DEMONSTRATIONS },
  { id: 'oncology', trays: ONCOLOGY_TRAYS, demonstrations: ONCOLOGY_DEMONSTRATIONS },
  { id: 'pediatrics', trays: PEDIATRICS_TRAYS, demonstrations: PEDIATRICS_DEMONSTRATIONS },
  { id: 'renal-electrolyte', trays: RENAL_ELECTROLYTE_TRAYS, demonstrations: RENAL_ELECTROLYTE_DEMONSTRATIONS },
  { id: 'respiratory-medicine', trays: RESPIRATORY_MEDICINE_TRAYS, demonstrations: RESPIRATORY_MEDICINE_DEMONSTRATIONS },
  { id: 'surgery-trauma', trays: SURGERY_TRAUMA_TRAYS, demonstrations: SURGERY_TRAUMA_DEMONSTRATIONS },
];

/**
 * Two lessons whose tray is authored but whose worked example lives in another
 * module or does not exist. Listing them here is the declaration that the gap is
 * known; a tray that drifts out of pairing by accident is not on this list.
 */
const TRAYS_WITHOUT_A_DEMONSTRATION: Readonly<Record<string, readonly string[]>> = {
  'critical-care': ['CriticalCareStatusEpilepticus'],
  'emergency-medicine': ['UnstableNarrowTachycardia'],
};

describe('Requirement: a lesson tray is driven by its own worked example', () => {
  for (const { id, trays, demonstrations } of MODULES) {
    it(`pairs every ${id} tray with the demonstration that drives it`, () => {
      const demoIds = new Set(demonstrations.map((entry) => entry.id));
      const exempt = new Set(TRAYS_WITHOUT_A_DEMONSTRATION[id] ?? []);
      const unpaired = trays
        .filter((tray) => !exempt.has(tray.id))
        .filter((tray) => !demoIds.has(tray.demoId ?? tray.id))
        .map((tray) => `${tray.id} -> ${tray.demoId ?? tray.id}`);
      expect(unpaired, `${id} trays whose demonstration id matches nothing`).toEqual([]);
    });

    it(`dispatches the same action type from the ${id} tray and its demonstration`, () => {
      const byId = new Map(demonstrations.map((entry) => [entry.id, entry]));
      const disagreements = trays
        .map((tray) => ({ tray, demo: byId.get(tray.demoId ?? tray.id) }))
        .filter((pair) => pair.demo && pair.demo.actionType !== pair.tray.actionType)
        .map((pair) => `${pair.tray.id}: tray ${pair.tray.actionType} vs demo ${pair.demo?.actionType}`);
      expect(disagreements, `${id} pairings that drive different action types`).toEqual([]);
    });

    it(`keeps every ${id} exemption pointing at a tray that exists`, () => {
      const trayIds = new Set(trays.map((tray) => tray.id));
      const stale = (TRAYS_WITHOUT_A_DEMONSTRATION[id] ?? []).filter((entry) => !trayIds.has(entry));
      expect(stale, `${id} exemptions naming no tray`).toEqual([]);
    });
  }

  it('names a demonstration only where the tray id differs from it', () => {
    const redundant = MODULES.flatMap(({ id, trays }) => trays
      .filter((tray) => tray.demoId === tray.id)
      .map((tray) => `${id}/${tray.id}`));
    expect(redundant, 'trays declaring a demoId equal to their own id').toEqual([]);
  });
});

/**
 * The pairing above is only worth having if the cockpit reads it. `Cockpit` hands
 * `ActionCockpit` the running demonstration's id, so the tray must recognise itself
 * from that id and not from its own.
 */
describe('Requirement: the cockpit gates a tray on the demonstration id it is given', () => {
  const assessment = { trajectoryAtTick: null, recognitionAtTick: null, ownershipAtTick: null,
    boundaryAtTick: null, laterAtTick: null, handoffAtTick: null };
  const markup = (demonstratingLessonId: string | undefined) =>
    renderToStaticMarkup(createElement(ActionCockpit, {
      scenario: HERNIATION, region: UNITED_STATES, lessonTrays: NEUROLOGY_TRAYS,
      infusions: [], hypnoticLine: { connected: true, inspected: false },
      resuscitation: { epinephrineEffectFraction: 0, epinephrineTotalMicrograms: 0,
        lastEpinephrineTick: null, crystalloidTotalMl: 0, dantroleneTotalMg: 0,
        dantroleneEffectFraction: 0, lastDantroleneTick: null, activeCooling: false,
        neurologyHerniationAssessment: assessment },
      lastExposure: null, syringeRemaining: {},
      ventilator: { mode: 'manual', tidalVolumeMl: 450, respiratoryRateBpm: 10, fio2: 1, peep: 0,
        delivering: true, sevofluranePercent: 0, freshGasFlowLPerMin: 10 },
      intubated: false, airwayAttempts: 0, lastGrade: null, jawThrustCpapSecondsRemaining: 0,
      airwayDevice: 'facemask', supraglotticInsertionSecondsRemaining: 0, helpRequestedAtTick: null,
      muscleRigidityFraction: 0, onBolus: () => {}, onInfusion: () => {}, onHypnoticLine: () => {},
      onFluid: () => {}, onVentilator: () => {}, onLaryngoscopy: () => {}, onAirwayManeuver: () => {},
      onEpinephrine: () => {}, onDantrolene: () => {}, onCallForHelp: () => {},
      onAirwayDevice: () => {}, onActiveCooling: () => {}, onDrugCard: () => {},
      onLessonAction: () => {}, demonstratingLessonId,
    } satisfies ActionCockpitProps));

  const WATCHING = 'Watching the worked example';

  it('goes inert for the demonstration id the module registry actually publishes', () => {
    const demo = NEUROLOGY_DEMONSTRATIONS.find((entry) => entry.supports(HERNIATION));
    expect(demo?.id).toBe('Herniation');
    expect(markup(demo?.id)).toContain(WATCHING);
  });

  it('stays live when no worked example is running', () => {
    expect(markup(undefined)).not.toContain(WATCHING);
  });
});
