/**
 * The scenario JSON Schema and its validator
 * (engine/scenario-engine → Declarative Scenario Format).
 *
 * The schema is bundled so an editor can validate offline, and the validator is
 * written here rather than pulled in as a dependency, because the project holds a
 * dependency ceiling and this is a few hundred lines.
 *
 * Errors name the JSON pointer, the expected type, and the schema rule violated,
 * in plain language, so an educator authoring a file by hand can fix it without
 * reading the source.
 */

import { EVENT_TYPES } from './event-types';
import { MATURITY_STATUSES } from '@platform/catalog/maturity';

export type JsonType = 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean';

export interface SchemaNode {
  readonly type: JsonType;
  readonly description: string;
  readonly properties?: Readonly<Record<string, SchemaNode>>;
  readonly required?: readonly string[];
  readonly items?: SchemaNode;
  readonly enum?: readonly (string | number)[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly minItems?: number;
  readonly pattern?: string;
  /** Allow properties beyond those declared. Defaults to false, so a typo is caught. */
  readonly additionalProperties?: boolean;
}

export interface ValidationError {
  /** JSON pointer to the offending node, for example `/patient/ageYears`. */
  readonly pointer: string;
  /** The schema rule that was violated. */
  readonly rule: string;
  /** Plain-language explanation an educator can act on. */
  readonly message: string;
}

const NUMBER_FIELD = (description: string, minimum?: number, maximum?: number): SchemaNode => ({
  type: 'number', description,
  ...(minimum !== undefined ? { minimum } : {}),
  ...(maximum !== undefined ? { maximum } : {}),
});

const STRING_FIELD = (description: string, minLength = 1): SchemaNode => ({
  type: 'string', description, minLength,
});

/** Every event type the timeline understands. An unknown type is rejected. */
export { EVENT_TYPES } from './event-types';

export const SCENARIO_SCHEMA: SchemaNode = {
  type: 'object',
  description: 'An Open Sim Lab clinical scenario.',
  required: ['schemaVersion', 'metadata', 'patient', 'equipment', 'formulary', 'timeline', 'debrief'],
  properties: {
    schemaVersion: { type: 'integer', description: 'The scenario schema version this file targets.', minimum: 1, maximum: 1 },
    metadata: {
      type: 'object',
      description: 'What this scenario is, who wrote it, and what it teaches.',
      required: ['id', 'version', 'maturity', 'title', 'author', 'license', 'estimatedMinutes', 'difficulty', 'objectives', 'clinicalReview'],
      properties: {
        id: { type: 'string', description: 'Stable identifier, lowercase with hyphens.', pattern: '^[a-z0-9-]+$' },
        version: { type: 'string', description: 'Semantic version of the scenario content.', pattern: '^\\d+\\.\\d+\\.\\d+$' },
        maturity: { type: 'string', description: 'Exact-version public maturity.', enum: MATURITY_STATUSES },
        title: STRING_FIELD('Learner-facing title.', 3),
        author: STRING_FIELD('Who wrote the scenario.', 2),
        license: STRING_FIELD('The open content license this scenario is released under.', 2),
        estimatedMinutes: NUMBER_FIELD('Expected duration in simulated minutes at 1x.', 1, 20),
        difficulty: { type: 'string', description: 'Learner-facing difficulty.', enum: ['introductory', 'intermediate', 'advanced'] },
        objectives: {
          type: 'array', description: 'Learning objectives, stated in learner-facing language.', minItems: 1,
          items: {
            type: 'object', description: 'One objective.',
            required: ['id', 'statement', 'measure'],
            properties: {
              id: { type: 'string', description: 'Stable objective identifier.', pattern: '^[a-z0-9-]+$' },
              statement: STRING_FIELD('What the learner should be able to do.', 10),
              measure: STRING_FIELD('How the debrief decides whether it was met.', 10),
            },
          },
        },
        clinicalReview: {
          type: 'object',
          description: 'The exact-version clinical review record. Unsigned preview content remains explicitly labeled.',
          required: ['reviewer', 'credential', 'reviewedOn', 'contentVersion', 'sources', 'reviewBy'],
          properties: {
            reviewer: STRING_FIELD('Full name of the reviewing clinician.', 2),
            credential: STRING_FIELD('For example MD, MBBS, CRNA.', 2),
            institution: STRING_FIELD('Where they practise.', 2),
            competingInterests: STRING_FIELD('Declared competing interests, or "None declared".', 2),
            reviewedOn: { type: 'string', description: 'ISO date of the review.', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            reviewBy: { type: 'string', description: 'ISO date the review expires.', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            contentVersion: STRING_FIELD('The scenario version that was reviewed.', 5),
            sources: { type: 'array', description: 'Sources consulted.', minItems: 1, items: STRING_FIELD('One source.', 5) },
          },
        },
        limitations: {
          type: 'array', description: 'Known limitations that bite near this scenario\'s teaching points.',
          items: STRING_FIELD('One limitation, named in the briefing.', 10),
        },
      },
    },
    patient: {
      type: 'object',
      description: 'The virtual patient. Nothing here describes a real person.',
      required: ['ageYears', 'sex', 'heightCm', 'weightKg', 'asaClass', 'diagnosis', 'procedure', 'baseline', 'airway', 'respiratory'],
      properties: {
        ageYears: NUMBER_FIELD('Age in years.', 0, 110),
        sex: { type: 'string', description: 'Biological sex, which the pharmacokinetic models take as a covariate.', enum: ['male', 'female'] },
        heightCm: NUMBER_FIELD('Height in centimetres.', 40, 220),
        weightKg: NUMBER_FIELD('Total body weight in kilograms.', 2, 300),
        asaClass: { type: 'integer', description: 'ASA physical status.', minimum: 1, maximum: 5 },
        diagnosis: STRING_FIELD('Primary diagnosis.', 3),
        procedure: STRING_FIELD('Planned procedure.', 3),
        comorbidities: { type: 'array', description: 'Comorbidities that alter the response, not just the text.', items: STRING_FIELD('One comorbidity.', 2) },
        medications: { type: 'array', description: 'Current medications.', items: STRING_FIELD('One medication.', 2) },
        allergies: { type: 'array', description: 'Documented allergies, which the engine enforces.', items: STRING_FIELD('One allergy.', 2) },
        fasting: STRING_FIELD('Fasting status.', 2),
        baseline: {
          type: 'object', description: 'The patient\'s own baseline, not a default.',
          required: ['heartRateBpm', 'meanArterialMmHg', 'strokeVolumeMl', 'hemoglobinGPerDl', 'bloodVolumeMl', 'coreTemperatureC'],
          properties: {
            heartRateBpm: NUMBER_FIELD('Baseline heart rate.', 25, 180),
            meanArterialMmHg: NUMBER_FIELD('Baseline mean arterial pressure.', 40, 160),
            strokeVolumeMl: NUMBER_FIELD('Baseline stroke volume.', 20, 150),
            hemoglobinGPerDl: NUMBER_FIELD('Baseline haemoglobin.', 4, 20),
            bloodVolumeMl: NUMBER_FIELD('Circulating blood volume.', 800, 8000),
            coreTemperatureC: NUMBER_FIELD('Core temperature.', 32, 40),
            arterialStiffness: NUMBER_FIELD('1.0 is a compliant artery; higher is stiffer.', 0.6, 2.5),
            baroreflexGain: NUMBER_FIELD('1.0 is a healthy reflex.', 0, 1.5),
            fixedStrokeVolume: { type: 'boolean', description: 'True where stroke volume cannot rise, as in severe aortic stenosis.' },
            coagulationFactorFraction: NUMBER_FIELD('Normalized starting clotting-factor concentration; 1 is normal.', 0.2, 1.5),
            fibrinogenGPerL: NUMBER_FIELD('Starting fibrinogen concentration.', 0.2, 8),
          },
        },
        airway: {
          type: 'object', description: 'Airway assessment, which drives the laryngoscopy model.',
          required: ['difficulty'],
          properties: {
            difficulty: NUMBER_FIELD('0 is unremarkable, 1 is the most difficult anatomy modelled.', 0, 1),
            difficultMaskVentilation: { type: 'boolean', description: 'Whether bag-mask ventilation is also difficult.' },
            assessment: STRING_FIELD('The bedside assessment shown to the learner.', 3),
          },
        },
        respiratory: {
          type: 'object', description: 'Respiratory reserve, which sets the safe apnoea time.',
          required: ['profile'],
          properties: {
            profile: { type: 'string', description: 'Which gas-exchange profile this patient matches.', enum: ['healthy', 'moderately-ill', 'obese', 'healthy-child', 'term-pregnancy'] },
          },
        },
      },
    },
    equipment: {
      type: 'object', description: 'Starting equipment and monitoring state.',
      required: ['monitoring', 'ventilator'],
      properties: {
        monitoring: {
          type: 'array', description: 'Monitors attached at the start.', minItems: 1,
          items: { type: 'string', description: 'One monitored parameter.', enum: ['ecg', 'nibp', 'arterial-line', 'capnography', 'pulse-oximetry', 'temperature', 'depth-index', 'train-of-four'] },
        },
        airwayDevice: {
          type: 'string', description: 'Airway device already in place at scenario start.',
          enum: ['facemask', 'tracheal-tube'],
        },
        startingTrainOfFourRatio: NUMBER_FIELD(
          'Optional starting quantitative ratio for a four-twitch residual-blockade vignette.',
          0.4,
          1,
        ),
        ventilator: {
          type: 'object', description: 'Initial ventilator settings.',
          required: ['mode', 'fio2'],
          properties: {
            mode: { type: 'string', description: 'Ventilation mode.', enum: ['volume-control', 'pressure-control', 'manual'] },
            fio2: NUMBER_FIELD('Inspired oxygen fraction. The hypoxic guard forbids below 0.21.', 0.21, 1),
            tidalVolumeMl: NUMBER_FIELD('Set tidal volume.', 0, 1200),
            respiratoryRateBpm: NUMBER_FIELD('Set respiratory rate.', 0, 40),
            freshGasFlowLPerMin: NUMBER_FIELD('Fresh gas flow.', 0.5, 15),
            sevofluranePercent: NUMBER_FIELD('Initial delivered sevoflurane concentration.', 0, 8),
            delivering: { type: 'boolean', description: 'Whether breaths are being delivered at the start.' },
          },
        },
      },
    },
    formulary: {
      type: 'array', description: 'The drugs available in this scenario. Device-only lessons may intentionally stock none.',
      items: {
        type: 'object', description: 'One available drug.',
        required: ['drugId', 'concentration', 'concentrationUnit', 'presets'],
        properties: {
          drugId: { type: 'string', description: 'International Nonproprietary Name, lowercase.', pattern: '^[a-z-]+$' },
          modelId: STRING_FIELD('Pharmacology model to use. Omitted means the default for the patient.', 3),
          deliveryModes: {
            type: 'array', description: 'Cockpit delivery modes offered for this drug.', minItems: 1,
            items: { type: 'string', description: 'One supported cockpit delivery mode.', enum: ['bolus', 'infusion'] },
          },
          concentration: NUMBER_FIELD('Syringe concentration.', 0.001, 1000),
          concentrationUnit: STRING_FIELD('Units of the concentration, stated in mass per volume.', 2),
          syringeVolumeMl: NUMBER_FIELD('Volume drawn up. An exhausted syringe cannot be pushed.', 1, 100),
          typicalDose: NUMBER_FIELD('Typical dose, used to decide what counts as implausible.', 0.0001, 10000),
          presets: {
            type: 'array', description: 'Preset doses, so a common dose is two interactions away.', minItems: 1,
            items: {
              type: 'object', description: 'One preset.',
              required: ['label', 'amount', 'unit'],
              properties: {
                label: STRING_FIELD('What the button says.', 1),
                amount: NUMBER_FIELD('Dose amount.', 0.0001, 10000),
                unit: STRING_FIELD('Dose unit, for example mg or mg/kg.', 1),
              },
            },
          },
        },
      },
    },
    timeline: {
      type: 'array', description: 'Scripted events, at a fixed tick or on a state predicate.',
      items: {
        type: 'object', description: 'One timeline event.',
        required: ['id', 'type'],
        properties: {
          id: { type: 'string', description: 'Stable event identifier.', pattern: '^[a-z0-9-]+$' },
          type: { type: 'string', description: 'What kind of event this is.', enum: [...EVENT_TYPES] },
          atTick: { type: 'integer', description: 'Simulated tick to fire at. Mutually exclusive with `when`.', minimum: 0 },
          when: STRING_FIELD('A state predicate, for example "spo2Percent < 90".', 3),
          repeatable: { type: 'boolean', description: 'Whether the event may fire more than once.' },
          value: NUMBER_FIELD('The magnitude, interpreted per event type.'),
          durationTicks: { type: 'integer', description: 'How long the event applies for.', minimum: 0 },
          target: STRING_FIELD(
            'What the event acts on: the rhythm id, the artifact id, or which equipment failed.', 3,
          ),
          message: STRING_FIELD('Learner-facing text for a narrative event or the log entry.', 3),
          severity: { type: 'string', description: 'Log severity.', enum: ['info', 'advisory', 'warning', 'critical', 'artifact'] },
        },
      },
    },
    replayPoints: {
      type: 'array', description: 'Authored points whose state may be reconstructed for targeted repetition.', minItems: 1,
      items: {
        type: 'object', description: 'One replay-safe decision point.',
        required: ['id', 'label', 'objectiveId', 'atTick', 'reason'],
        properties: {
          id: { type: 'string', description: 'Stable replay-point identifier.', pattern: '^[a-z0-9-]+$' },
          label: STRING_FIELD('Short learner-facing name for the decision.', 5),
          objectiveId: { type: 'string', description: 'The objective this repetition targets.', pattern: '^[a-z0-9-]+$' },
          atTick: { type: 'integer', description: 'The exact deterministic tick to reconstruct.', minimum: 1 },
          reason: STRING_FIELD('Why rehearsing this decision is useful.', 10),
        },
      },
    },
    debrief: {
      type: 'object', description: 'The debrief rubric.',
      required: ['rubric'],
      properties: {
        rubric: {
          type: 'array', description: 'What the debrief looks for.', minItems: 1,
          items: {
            type: 'object', description: 'One rubric item.',
            required: ['id', 'objectiveId', 'question'],
            properties: {
              id: { type: 'string', description: 'Stable rubric identifier.', pattern: '^[a-z0-9-]+$' },
              objectiveId: { type: 'string', description: 'The objective this item evaluates.', pattern: '^[a-z0-9-]+$' },
              question: STRING_FIELD('The reflective question put to the learner.', 10),
              concept: STRING_FIELD('The concept explainer this item links to.', 3),
            },
          },
        },
      },
    },
  },
};

function typeOf(value: unknown): string {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

/**
 * Validate `value` against `schema`. Loading fails before any simulation starts,
 * and every error names the pointer, the rule, and what to do about it.
 */
export function validateAgainstSchema(
  value: unknown,
  schema: SchemaNode = SCENARIO_SCHEMA,
  pointer = '',
): ValidationError[] {
  const errors: ValidationError[] = [];
  const actual = typeOf(value);

  const expected = schema.type === 'integer' ? 'number' : schema.type;
  if (actual !== expected) {
    errors.push({
      pointer: pointer || '/', rule: 'type',
      message: `Expected ${schema.type} at ${pointer || '/'} but found ${actual}. ${schema.description}`,
    });
    return errors;
  }
  if (schema.type === 'integer' && !Number.isInteger(value)) {
    errors.push({
      pointer, rule: 'type',
      message: `Expected a whole number at ${pointer} but found ${String(value)}.`,
    });
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({
        pointer, rule: 'minimum',
        message: `${pointer} is ${value}, below the minimum of ${schema.minimum}. ${schema.description}`,
      });
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({
        pointer, rule: 'maximum',
        message: `${pointer} is ${value}, above the maximum of ${schema.maximum}. ${schema.description}`,
      });
    }
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        pointer, rule: 'minLength',
        message: `${pointer} must be at least ${schema.minLength} characters. ${schema.description}`,
      });
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
      errors.push({
        pointer, rule: 'pattern',
        message: `${pointer} is "${value}", which does not match the required form ${schema.pattern}. ${schema.description}`,
      });
    }
  }

  if (schema.enum && !schema.enum.includes(value as string | number)) {
    errors.push({
      pointer, rule: 'enum',
      message: `${pointer} is "${String(value)}", which is not one of: ${schema.enum.join(', ')}.`,
    });
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push({
        pointer, rule: 'minItems',
        message: `${pointer} needs at least ${schema.minItems} item(s) but has ${value.length}. ${schema.description}`,
      });
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateAgainstSchema(item, schema.items as SchemaNode, `${pointer}/${index}`));
      });
    }
  }

  if (schema.type === 'object' && typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in record)) {
        const child = schema.properties?.[key];
        errors.push({
          pointer: `${pointer}/${key}`, rule: 'required',
          message: `${pointer || '/'} is missing the required field "${key}".`
            + (child ? ` It should be a ${child.type}: ${child.description}` : ''),
        });
      }
    }
    for (const [key, item] of Object.entries(record)) {
      const child = schema.properties?.[key];
      if (!child) {
        if (schema.additionalProperties === true) continue;
        errors.push({
          pointer: `${pointer}/${key}`, rule: 'additionalProperties',
          message: `${pointer || '/'} has an unknown field "${key}". `
            + `Known fields are: ${Object.keys(schema.properties ?? {}).join(', ')}.`,
        });
        continue;
      }
      errors.push(...validateAgainstSchema(item, child, `${pointer}/${key}`));
    }
  }

  return errors;
}

/** Extra rules the shape alone cannot express. */
export function validateScenarioSemantics(scenario: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const record = scenario as Record<string, unknown>;
  const metadata = record.metadata as Record<string, unknown> | undefined;
  const patient = record.patient as Record<string, unknown> | undefined;
  const respiratory = patient?.respiratory as Record<string, unknown> | undefined;
  const timeline = record.timeline as Record<string, unknown>[] | undefined;
  const replayPoints = record.replayPoints as Record<string, unknown>[] | undefined;
  const debrief = record.debrief as { rubric?: Record<string, unknown>[] } | undefined;

  const objectiveIds = new Set(
    ((metadata?.objectives as { id: string }[] | undefined) ?? []).map((o) => o.id),
  );
  if (respiratory?.profile === 'healthy-child'
    && (patient?.ageYears !== 6 || patient?.weightKg !== 20)) {
    errors.push({
      pointer: '/patient/respiratory/profile', rule: 'supported-profile',
      message: 'The healthy-child respiratory profile is currently validated only for the bundled '
        + '6-year-old, 20 kg teaching patient. Use that exact age and weight or author another '
        + 'explicitly sourced respiratory profile.',
    });
  }
  (debrief?.rubric ?? []).forEach((item, index) => {
    if (!objectiveIds.has(item.objectiveId as string)) {
      errors.push({
        pointer: `/debrief/rubric/${index}/objectiveId`, rule: 'reference',
        message: `Rubric item references objective "${String(item.objectiveId)}", which this scenario `
          + `does not declare. Declared objectives are: ${[...objectiveIds].join(', ')}.`,
      });
    }
  });
  (replayPoints ?? []).forEach((point, index) => {
    if (!objectiveIds.has(point.objectiveId as string)) {
      errors.push({
        pointer: `/replayPoints/${index}/objectiveId`, rule: 'reference',
        message: `Replay point references objective "${String(point.objectiveId)}", which this scenario `
          + `does not declare. Declared objectives are: ${[...objectiveIds].join(', ')}.`,
      });
    }
  });

  (timeline ?? []).forEach((event, index) => {
    const hasTick = event.atTick !== undefined;
    const hasPredicate = event.when !== undefined;
    if (hasTick === hasPredicate) {
      errors.push({
        pointer: `/timeline/${index}`, rule: 'oneOf',
        message: `Timeline event "${String(event.id)}" must declare exactly one of "atTick" or "when". `
          + (hasTick ? 'It declares both.' : 'It declares neither.'),
      });
    }
    if (event.type === 'laryngospasm'
      && (typeof event.value !== 'number' || !Number.isFinite(event.value)
        || event.value < 0 || event.value > 1)) {
      errors.push({
        pointer: `/timeline/${index}/value`, rule: 'range',
        message: `Timeline event "${String(event.id)}" must declare laryngospasm severity from 0 to 1.`,
      });
    }
    if (event.type === 'upper-airway-obstruction'
      && (typeof event.value !== 'number' || !Number.isFinite(event.value)
        || event.value < 0 || event.value > 1)) {
      errors.push({
        pointer: `/timeline/${index}/value`, rule: 'range',
        message: `Timeline event "${String(event.id)}" must declare upper-airway obstruction severity from 0 to 1.`,
      });
    }
    if (event.type === 'opioid-ventilatory-impairment'
      && (typeof event.value !== 'number' || !Number.isFinite(event.value)
        || event.value < 0 || event.value > 1)) {
      errors.push({
        pointer: `/timeline/${index}/value`, rule: 'range',
        message: `Timeline event "${String(event.id)}" must declare opioid ventilatory impairment severity from 0 to 1.`,
      });
    }
    if (event.type === 'perioperative-hypothermia'
      && (typeof event.value !== 'number' || !Number.isFinite(event.value)
        || event.value < 34 || event.value >= 36)) {
      errors.push({
        pointer: `/timeline/${index}/value`, rule: 'range',
        message: `Timeline event "${String(event.id)}" must declare a finite hypothermic target from 34°C up to but not including 36°C.`,
      });
    }
    if (event.type === 'perioperative-hyperglycemia'
      && (typeof event.value !== 'number' || !Number.isFinite(event.value)
        || event.value <= 180 || event.value > 400)) {
      errors.push({
        pointer: `/timeline/${index}/value`, rule: 'range',
        message: `Timeline event "${String(event.id)}" must declare a finite hyperglycemic point-of-care result above 180 and at most 400 mg/dL.`,
      });
    }
    if (event.type === 'anaphylaxis'
      && (typeof event.value !== 'number' || !Number.isFinite(event.value)
        || event.value < 0 || event.value > 1)) {
      errors.push({
        pointer: `/timeline/${index}/value`, rule: 'range',
        message: `Timeline event "${String(event.id)}" must declare anaphylaxis severity from 0 to 1.`,
      });
    }
    if (event.type === 'anaphylaxis' && event.target !== 'cefazolin') {
      errors.push({
        pointer: `/timeline/${index}/target`, rule: 'enum',
        message: `Timeline event "${String(event.id)}" must identify the modeled exposure "cefazolin".`,
      });
    }
    if (event.type === 'local-anesthetic-toxicity'
      && (typeof event.value !== 'number' || !Number.isFinite(event.value)
        || event.value < 0 || event.value > 1)) {
      errors.push({
        pointer: `/timeline/${index}/value`, rule: 'range',
        message: `Timeline event "${String(event.id)}" must declare local-anesthetic toxicity severity from 0 to 1.`,
      });
    }
    if (event.type === 'local-anesthetic-toxicity' && event.target !== 'bupivacaine') {
      errors.push({
        pointer: `/timeline/${index}/target`, rule: 'enum',
        message: `Timeline event "${String(event.id)}" must identify the modeled exposure "bupivacaine".`,
      });
    }
  });

  // The review record must cover the version actually shipping.
  const version = metadata?.version;
  const review = metadata?.clinicalReview as Record<string, unknown> | undefined;
  if (review && review.contentVersion !== version) {
    errors.push({
      pointer: '/metadata/clinicalReview/contentVersion', rule: 'currency',
      message: `The clinical review covers version ${String(review.contentVersion)} but the scenario is `
        + `version ${String(version)}. A content change invalidates its review record; it needs re-review.`,
    });
  }

  return errors;
}

export function validateScenario(scenario: unknown): ValidationError[] {
  const structural = validateAgainstSchema(scenario);
  // Semantic checks assume the shape is right, so only run them if it is.
  return structural.length > 0 ? structural : validateScenarioSemantics(scenario);
}
