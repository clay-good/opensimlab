/**
 * Every worked example ends with every objective met, and the instructor sees
 * exactly what the learner saw.
 *
 * A worked example is the expert path the product itself demonstrates, so a
 * debrief that does not score it as met is a debrief that cannot score anyone.
 * Six renal lessons shipped with no evaluator at all: an expert run read as
 * nothing exercised, and each lesson's own test only counted the findings. This
 * drives every listed example through the real engine and checks both halves.
 *
 * Anesthesia's examples are hooks rather than a list; its parity cases are in
 * instructor-review.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { Scenario } from '@anesthesia/scenarios/types';
import type { LessonDemonstration } from '@anesthesia/demo/lesson-demonstration';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { replayWithEvents } from '@anesthesia/debrief/replay-engine';
import { analyseTranscript } from '@anesthesia/debrief/analyse-transcript';
import type { Transcript } from '@platform/transcript/transcript';
import { CARDIOLOGY_DEMONSTRATIONS } from '../../src/modules/cardiology/demo/demonstrations';
import { CRITICAL_CARE_DEMONSTRATIONS } from '../../src/modules/critical-care/demo/demonstrations';
import { EMERGENCY_MEDICINE_DEMONSTRATIONS } from '../../src/modules/emergency-medicine/demo/demonstrations';
import { MEDICAL_SURGICAL_NURSING_DEMONSTRATIONS } from '../../src/modules/medical-surgical-nursing/demo/demonstrations';
import { INFECTIOUS_DISEASE_DEMONSTRATIONS } from '../../src/modules/infectious-disease/demo/demonstrations';
import { OBSTETRICS_DEMONSTRATIONS } from '../../src/modules/obstetrics/demo/demonstrations';
import { NEONATOLOGY_DEMONSTRATIONS } from '../../src/modules/neonatology/demo/demonstrations';
import { RESPIRATORY_MEDICINE_DEMONSTRATIONS } from '../../src/modules/respiratory-medicine/demo/demonstrations';
import { NEUROLOGY_DEMONSTRATIONS } from '../../src/modules/neurology/demo/demonstrations';
import { ENDOCRINE_METABOLIC_DEMONSTRATIONS } from '../../src/modules/endocrine-metabolic/demo/demonstrations';
import { RENAL_ELECTROLYTE_DEMONSTRATIONS } from '../../src/modules/renal-electrolyte/demo/demonstrations';
import { ONCOLOGY_DEMONSTRATIONS } from '../../src/modules/oncology/demo/demonstrations';
import { SURGERY_TRAUMA_DEMONSTRATIONS } from '../../src/modules/surgery-trauma/demo/demonstrations';
import { PEDIATRICS_DEMONSTRATIONS } from '../../src/modules/pediatrics/demo/demonstrations';
import { TOXICOLOGY_DEMONSTRATIONS } from '../../src/modules/toxicology/demo/demonstrations';
import { CARDIOLOGY_SCENARIOS } from '../../src/modules/cardiology/scenarios';
import { CRITICAL_CARE_SCENARIOS } from '../../src/modules/critical-care/scenarios';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../../src/modules/emergency-medicine/scenarios';
import { MEDICAL_SURGICAL_NURSING_SCENARIOS } from '../../src/modules/medical-surgical-nursing/scenarios';
import { INFECTIOUS_DISEASE_SCENARIOS } from '../../src/modules/infectious-disease/scenarios';
import { OBSTETRICS_SCENARIOS } from '../../src/modules/obstetrics/scenarios';
import { NEONATOLOGY_SCENARIOS } from '../../src/modules/neonatology/scenarios';
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../../src/modules/respiratory-medicine/scenarios';
import { NEUROLOGY_SCENARIOS } from '../../src/modules/neurology/scenarios';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../../src/modules/endocrine-metabolic/scenarios';
import { RENAL_ELECTROLYTE_SCENARIOS } from '../../src/modules/renal-electrolyte/scenarios';
import { ONCOLOGY_SCENARIOS } from '../../src/modules/oncology/scenarios';
import { SURGERY_TRAUMA_SCENARIOS } from '../../src/modules/surgery-trauma/scenarios';
import { PEDIATRICS_SCENARIOS } from '../../src/modules/pediatrics/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../../src/modules/toxicology/scenarios';

const MODULES: readonly (readonly [string, readonly Scenario[], readonly LessonDemonstration[]])[] = [
  ['cardiology', CARDIOLOGY_SCENARIOS, CARDIOLOGY_DEMONSTRATIONS],
  ['critical-care', CRITICAL_CARE_SCENARIOS, CRITICAL_CARE_DEMONSTRATIONS],
  ['emergency-medicine', EMERGENCY_MEDICINE_SCENARIOS, EMERGENCY_MEDICINE_DEMONSTRATIONS],
  ['medical-surgical-nursing', MEDICAL_SURGICAL_NURSING_SCENARIOS, MEDICAL_SURGICAL_NURSING_DEMONSTRATIONS],
  ['infectious-disease', INFECTIOUS_DISEASE_SCENARIOS, INFECTIOUS_DISEASE_DEMONSTRATIONS],
  ['obstetrics', OBSTETRICS_SCENARIOS, OBSTETRICS_DEMONSTRATIONS],
  ['neonatology', NEONATOLOGY_SCENARIOS, NEONATOLOGY_DEMONSTRATIONS],
  ['respiratory-medicine', RESPIRATORY_MEDICINE_SCENARIOS, RESPIRATORY_MEDICINE_DEMONSTRATIONS],
  ['neurology', NEUROLOGY_SCENARIOS, NEUROLOGY_DEMONSTRATIONS],
  ['endocrine-metabolic', ENDOCRINE_METABOLIC_SCENARIOS, ENDOCRINE_METABOLIC_DEMONSTRATIONS],
  ['renal-electrolyte', RENAL_ELECTROLYTE_SCENARIOS, RENAL_ELECTROLYTE_DEMONSTRATIONS],
  ['oncology', ONCOLOGY_SCENARIOS, ONCOLOGY_DEMONSTRATIONS],
  ['surgery-trauma', SURGERY_TRAUMA_SCENARIOS, SURGERY_TRAUMA_DEMONSTRATIONS],
  ['pediatrics', PEDIATRICS_SCENARIOS, PEDIATRICS_DEMONSTRATIONS],
  ['toxicology', TOXICOLOGY_SCENARIOS, TOXICOLOGY_DEMONSTRATIONS],
];

const CASES = MODULES.flatMap(([moduleId, scenarios, demonstrations]) => scenarios.flatMap((scenario) => {
  const demonstration = demonstrations.find((candidate) => candidate.supports(scenario));
  return demonstration ? [[`${moduleId}/${scenario.metadata.id}`, moduleId, scenario, demonstration] as const] : [];
}));

const SEED = 20260819;
const LIMIT = 300_000;
/** A refused beat is offered again, as the cockpit's example does, without flooding the transcript. */
const RETRY_TICKS = 100;

function drive(scenario: Scenario, demonstration: LessonDemonstration) {
  const engine = new AnesthesiaEngine({ scenario, seed: SEED, practiceRegion: 'US' });
  const actions: LearnerAction[] = [];
  const history: HistorySample[] = [];
  const events: EngineEvent[] = [];
  let lastBeat = '';
  let lastSent = -RETRY_TICKS;
  for (let tick = 0; tick <= LIMIT; tick += 1) {
    const step = demonstration.step(engine.equipment().resuscitation);
    if (step.finished) return { actions, history, events, ticks: tick };
    const action: LearnerAction | null = step.dispatch ? { tick, ...step.dispatch }
      : step.action ? { tick, type: demonstration.actionType, payload: { action: step.action } } : null;
    if (action && (step.id !== lastBeat || tick - lastSent >= RETRY_TICKS)) {
      actions.push(action); engine.apply(action); lastBeat = step.id; lastSent = tick;
    }
    const frame = engine.step();
    history.push({ tick: frame.tick, state: frame.state, concentrations: frame.concentrations } as HistorySample);
    events.push(...frame.events);
  }
  throw new Error(`the worked example did not finish within ${LIMIT} ticks`);
}

describe('Requirement: every worked example is scored as met, by the learner and the instructor alike', () => {
  it('covers every lesson that lists a worked example', () => {
    expect(CASES.length).toBeGreaterThanOrEqual(212);
  });

  it.each(CASES)('%s', async (_name, moduleId, scenario, demonstration) => {
    const run = drive(scenario, demonstration);
    const learner = objectiveFindings(scenario, run.history, 0, 0, run.actions, run.events)
      .map((finding) => `${finding.objectiveId}:${finding.outcome}`);
    expect(learner.filter((entry) => !entry.endsWith(':met'))).toEqual([]);
    const transcript = {
      format: 'opensimlab.transcript', moduleId, scenarioId: scenario.metadata.id, seed: SEED,
      practiceRegion: 'US', ticks: run.ticks, actions: run.actions,
      versions: { engine: 'test', content: scenario.metadata.version, modelSet: 'test', scenario: scenario.metadata.version },
    } as unknown as Transcript;
    const instructor = (await analyseTranscript(transcript, 'example.json',
      async (actions, options) => replayWithEvents(actions, options)))
      .findings.map((finding) => `${finding.objectiveId}:${finding.outcome}`);
    expect(instructor).toEqual(learner);
  }, 120_000);
});
