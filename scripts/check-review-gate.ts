/** Release gates for preview and reviewed publication channels. */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { SCENARIOS } from '@anesthesia/scenarios';
import {
  buildAnesthesiaCompletionCatalog, buildModuleCompletionCatalog,
} from '@anesthesia/catalog/scenario-completion';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../src/modules/emergency-medicine/scenarios';
import { CRITICAL_CARE_SCENARIOS } from '../src/modules/critical-care/scenarios';
import { CARDIOLOGY_SCENARIOS } from '../src/modules/cardiology/scenarios';
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../src/modules/respiratory-medicine/scenarios';
import { PEDIATRICS_SCENARIOS } from '../src/modules/pediatrics/scenarios';
import { NEUROLOGY_SCENARIOS } from '../src/modules/neurology/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../src/modules/toxicology/scenarios';
import { OBSTETRICS_SCENARIOS } from '../src/modules/obstetrics/scenarios';
import { NEONATOLOGY_SCENARIOS } from '../src/modules/neonatology/scenarios';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../src/modules/endocrine-metabolic/scenarios';
import { buildScenarioQualityCatalogs } from '@platform/catalog/scenario-quality';
import { QUALITY_DEPENDENCY_RECEIPTS, QUALITY_RECORDS } from './quality-records';
import { assertQualityDependencies } from './quality-dependencies';
import {
  buildMaturityCatalog, maturityFor, type MaturitySubjectKind,
} from '@platform/catalog/maturity';
import {
  isReviewedOnlyStatus, previewPublication, scenarioPreviewEvidence,
} from '@platform/governance/publication';
import { EDITORIAL_BOARD, additionalMaturitySubjects, reviewableItems } from '@platform/governance/records';
import { gate, reportCoverage, uncoveredDomains } from '@platform/governance/review-gate';
import { buildValidationReport } from '@platform/docs/validation-report';

export type ReleaseChannel = 'preview' | 'reviewed';

const root = fileURLToPath(new URL('..', import.meta.url));
/** Passed in rather than read from a clock, so the gate is reproducible. */
const today = new Date(process.env.SOURCE_DATE ?? '2026-08-19T00:00:00Z');

export function releaseChannelFrom(args: readonly string[]): ReleaseChannel {
  const option = args.find((arg) => arg.startsWith('--channel='));
  if (!option) return 'preview';
  const value = option.slice('--channel='.length);
  if (value === 'preview' || value === 'reviewed') return value;
  throw new Error(`Unknown release channel "${value}". Expected preview or reviewed.`);
}

function subjectKind(kind: ReturnType<typeof reviewableItems>[number]['kind']): MaturitySubjectKind {
  if (kind === 'explainer') return 'explanation';
  if (kind === 'debrief-template') return 'debrief-rule';
  if (kind === 'region-profile') return 'practice-region';
  return kind;
}

export function main(): void {
  const release = process.argv.includes('--release');
  const channel = releaseChannelFrom(process.argv.slice(2));
  const completion = buildAnesthesiaCompletionCatalog(SCENARIOS, ENGINE_VERSION);
  const emergencyCompletion = buildModuleCompletionCatalog(
    EMERGENCY_MEDICINE_SCENARIOS, ENGINE_VERSION, 'emergency-medicine',
    'emergency-department', 'state_transition',
  );
  const criticalCareCompletion = buildModuleCompletionCatalog(
    CRITICAL_CARE_SCENARIOS, ENGINE_VERSION, 'critical-care',
    'icu', 'state_transition',
  );
  const cardiologyCompletion = buildModuleCompletionCatalog(
    CARDIOLOGY_SCENARIOS, ENGINE_VERSION, 'cardiology', 'clinic', 'state_transition',
  );
  const respiratoryMedicineCompletion = buildModuleCompletionCatalog(
    RESPIRATORY_MEDICINE_SCENARIOS, ENGINE_VERSION, 'respiratory-medicine',
    'icu', 'state_transition',
  );
  const pediatricsCompletion = buildModuleCompletionCatalog(
    PEDIATRICS_SCENARIOS, ENGINE_VERSION, 'pediatrics',
    'emergency-department', 'state_transition',
  );
  const neurologyCompletion = buildModuleCompletionCatalog(
    NEUROLOGY_SCENARIOS, ENGINE_VERSION, 'neurology', 'ward', 'state_transition',
  );
  const toxicologyCompletion = buildModuleCompletionCatalog(
    TOXICOLOGY_SCENARIOS, ENGINE_VERSION, 'toxicology', 'emergency-department', 'state_transition',
  );
  const obstetricsCompletion = buildModuleCompletionCatalog(
    OBSTETRICS_SCENARIOS, ENGINE_VERSION, 'obstetrics', 'delivery-room', 'state_transition',
  );
  const neonatologyCompletion = buildModuleCompletionCatalog(
    NEONATOLOGY_SCENARIOS, ENGINE_VERSION, 'neonatology', 'delivery-room', 'state_transition',
  );
  const endocrineMetabolicCompletion = buildModuleCompletionCatalog(
    ENDOCRINE_METABOLIC_SCENARIOS, ENGINE_VERSION, 'endocrine-metabolic', 'ward', 'state_transition',
  );
  const qualityCatalogs = buildScenarioQualityCatalogs([
    completion,
    emergencyCompletion,
    criticalCareCompletion,
    cardiologyCompletion,
    respiratoryMedicineCompletion,
    pediatricsCompletion,
    neurologyCompletion,
    toxicologyCompletion,
    obstetricsCompletion,
    neonatologyCompletion,
    endocrineMetabolicCompletion,
  ], QUALITY_RECORDS);
  assertQualityDependencies(QUALITY_RECORDS, QUALITY_DEPENDENCY_RECEIPTS, root);
  const quality = qualityCatalogs.get('anesthesia')!;
  const emergencyQuality = qualityCatalogs.get('emergency-medicine')!;
  const criticalCareQuality = qualityCatalogs.get('critical-care')!;
  const cardiologyQuality = qualityCatalogs.get('cardiology')!;
  const respiratoryMedicineQuality = qualityCatalogs.get('respiratory-medicine')!;
  const pediatricsQuality = qualityCatalogs.get('pediatrics')!;
  const neurologyQuality = qualityCatalogs.get('neurology')!;
  const toxicologyQuality = qualityCatalogs.get('toxicology')!;
  const obstetricsQuality = qualityCatalogs.get('obstetrics')!;
  const neonatologyQuality = qualityCatalogs.get('neonatology')!;
  const endocrineMetabolicQuality = qualityCatalogs.get('endocrine-metabolic')!;
  const maturity = buildMaturityCatalog(completion, quality, additionalMaturitySubjects());
  const emergencyMaturity = buildMaturityCatalog(emergencyCompletion, emergencyQuality);
  const criticalCareMaturity = buildMaturityCatalog(criticalCareCompletion, criticalCareQuality);
  const cardiologyMaturity = buildMaturityCatalog(cardiologyCompletion, cardiologyQuality);
  const respiratoryMedicineMaturity = buildMaturityCatalog(
    respiratoryMedicineCompletion, respiratoryMedicineQuality,
  );
  const pediatricsMaturity = buildMaturityCatalog(pediatricsCompletion, pediatricsQuality);
  const neurologyMaturity = buildMaturityCatalog(neurologyCompletion, neurologyQuality);
  const toxicologyMaturity = buildMaturityCatalog(toxicologyCompletion, toxicologyQuality);
  const obstetricsMaturity = buildMaturityCatalog(obstetricsCompletion, obstetricsQuality);
  const neonatologyMaturity = buildMaturityCatalog(neonatologyCompletion, neonatologyQuality);
  const endocrineMetabolicMaturity = buildMaturityCatalog(endocrineMetabolicCompletion, endocrineMetabolicQuality);
  const moduleCatalogs = [
    { completion, quality, maturity },
    { completion: emergencyCompletion, quality: emergencyQuality, maturity: emergencyMaturity },
    { completion: criticalCareCompletion, quality: criticalCareQuality, maturity: criticalCareMaturity },
    { completion: cardiologyCompletion, quality: cardiologyQuality, maturity: cardiologyMaturity },
    { completion: respiratoryMedicineCompletion, quality: respiratoryMedicineQuality,
      maturity: respiratoryMedicineMaturity },
    { completion: pediatricsCompletion, quality: pediatricsQuality, maturity: pediatricsMaturity },
    { completion: neurologyCompletion, quality: neurologyQuality, maturity: neurologyMaturity },
    { completion: toxicologyCompletion, quality: toxicologyQuality, maturity: toxicologyMaturity },
    { completion: obstetricsCompletion, quality: obstetricsQuality, maturity: obstetricsMaturity },
    { completion: neonatologyCompletion, quality: neonatologyQuality, maturity: neonatologyMaturity },
    { completion: endocrineMetabolicCompletion, quality: endocrineMetabolicQuality, maturity: endocrineMetabolicMaturity },
  ];
  const validation = buildValidationReport();
  const evidenceOptions = {
    validationReportPresent: true,
    faceValidityProcedureDocumented: existsSync(join(root, 'docs', 'face-validity-rubric.md')),
  };
  const blocking: string[] = [];

  for (const moduleCatalog of moduleCatalogs) {
    for (const scenario of moduleCatalog.completion.scenarios) {
      const qualityRecord = moduleCatalog.quality.scenarios.find(
        (entry) => entry.scenarioId === scenario.scenarioId
          && entry.contentVersion === scenario.contentVersion,
      )!;
      const record = maturityFor(
        moduleCatalog.maturity, 'scenario', scenario.scenarioId, scenario.contentVersion,
      )!;
      const verdict = previewPublication(
        record,
        scenarioPreviewEvidence(scenario, qualityRecord, evidenceOptions),
      );
      if (verdict.status === 'blocked') {
        blocking.push(`scenario "${scenario.scenarioId}" ${verdict.reasons.join('; ')}`);
      }
    }
  }

  const items = reviewableItems();
  const reviewCoverage = reportCoverage(items, today);
  for (const item of items) {
    const record = moduleCatalogs.map((catalog) => maturityFor(
      catalog.maturity, subjectKind(item.kind), item.id, item.contentVersion,
    )).find((candidate) => candidate !== undefined);
    if (!record) {
      blocking.push(`${item.kind} "${item.id}" has no exact-version maturity record`);
      continue;
    }
    if (item.kind !== 'scenario') {
      // Non-scenario completion/source/test contracts are not implemented yet.
      // Passing no gates makes that absence explicit and fail-closed; draft and
      // withdrawn status block before those missing gates are considered.
      const verdict = previewPublication(record, { passed: [] });
      if (verdict.status === 'blocked') {
        blocking.push(`${item.kind} "${item.id}" ${verdict.reasons.join('; ')}`);
      }
    }
    if (channel === 'reviewed' && !isReviewedOnlyStatus(record.status)) {
      blocking.push(`${item.kind} "${item.id}" is ${record.status}, not clinically reviewed`);
    }
    if (channel === 'reviewed') {
      const verdict = gate(item, today);
      if (verdict.status !== 'current') {
        blocking.push(
          `${item.kind} "${item.id}" review is ${verdict.status}: `
          + verdict.reason,
        );
      }
    }
  }

  if (channel === 'reviewed') {
    for (const domain of uncoveredDomains(items, EDITORIAL_BOARD)) {
      blocking.push(`domain "${domain}" has no qualified reviewer on the board`);
    }
    if (validation.faceValidity.reviewers < validation.faceValidity.required) {
      blocking.push(
        `face-validity review is incomplete: ${validation.faceValidity.reviewers} of `
        + `${validation.faceValidity.required} reviewers`,
      );
    }
  }
  const failedBenchmarks = validation.benchmarks.filter((benchmark) => !benchmark.passes);
  if (failedBenchmarks.length > 0) {
    blocking.push(`${failedBenchmarks.length} physiological benchmark(s) outside tolerance`);
  }

  process.stdout.write(
    `publication gate: ${channel} channel; ${moduleCatalogs.reduce(
      (sum, catalog) => sum + catalog.maturity.recordCount, 0,
    )} clinical maturity records; `
    + `${reviewCoverage.current} of ${reviewCoverage.total} clinical items under current review\n`,
  );
  for (const reason of blocking) process.stdout.write(`  - ${reason}\n`);

  if (!release) {
    if (blocking.length > 0) {
      process.stdout.write(
        `publication gate: ${blocking.length} ${channel}-channel blocker(s). `
        + 'This is a development build, so it continues.\n',
      );
    }
    return;
  }
  if (blocking.length > 0) {
    process.stderr.write(`\n${channel} release REFUSED. Resolve the blockers listed above.\n`);
    process.exit(1);
  }
  process.stdout.write(`publication gate: every ${channel} gate is green; release may publish.\n`);
}

const isEntryPoint = process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntryPoint) main();
