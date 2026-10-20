/**
 * The facilitator guide is a view of scenario fields, not a document
 * (learning/facilitation → facilitator guide).
 *
 * Every line below comes from a field the scenario already declares, in the
 * order the INACSL Healthcare Simulation Standards of Best Practice (2021) give
 * simulation design, prebriefing and debriefing. The only prose this module
 * owns is the fixed templates in `GUIDE_TEMPLATES`, and a test holds them free
 * of clinical claims. A section whose field is missing renders as absent, with
 * the reason, so a guide can never read as more complete than its scenario.
 */
import type { Scenario } from '@anesthesia/scenarios/types';
import { MATURITY_LABELS } from '@platform/governance/publication';
import { MAPPING_DISCLAIMER, getFramework } from '@anesthesia/curriculum/frameworks';
import { SCENARIO_MAPPINGS } from '@anesthesia/curriculum/mapping';
import {
  NCJMM_NOT_EXERCISED_REASON, NCSBN_NCJMM, ncjmmMappings,
} from '../../modules/medical-surgical-nursing/curriculum';
import type { FacilitatedScenario } from './scenario-catalog';
import { t, type MessageKey } from '@platform/i18n/messages';
import '@platform/i18n/messages-educator';

export interface GuideItem {
  readonly label?: string;
  readonly text: string;
}

export type GuideSection =
  | { readonly id: string; readonly heading: string; readonly status: 'present'; readonly items: readonly GuideItem[] }
  | { readonly id: string; readonly heading: string; readonly status: 'absent'; readonly reason: string };

/** The only prose the guide adds. No dose, value, diagnosis, or recommendation may appear here. */
export const GUIDE_TEMPLATES = {
  get fiction() { return t('guide.template.fiction'); },
  get confidentiality() { return t('guide.template.confidentiality'); },
  get monitoring() { return t('guide.template.monitoring'); },
  get reactions() { return t('guide.template.reactions'); },
  get description() { return t('guide.template.description'); },
  get analysisLead() { return t('guide.template.analysis-lead'); },
  get summary() { return t('guide.template.summary'); },
  get timelineLead() { return t('guide.template.timeline-lead'); },
  get unsigned() { return t('guide.template.unsigned'); },
  get report() { return t('guide.template.report'); },
};

const UNSIGNED = 'UNSIGNED';

const absent = (id: string, heading: string, reason: string): GuideSection =>
  ({ id, heading, status: 'absent', reason });

const present = (id: string, heading: string, items: readonly GuideItem[], reason: string): GuideSection =>
  items.length === 0 ? absent(id, heading, reason) : { id, heading, status: 'present', items };

function patientItems(scenario: Scenario): GuideItem[] {
  const { patient } = scenario;
  const list = (values: readonly string[] | undefined) => values?.length ? values.join('; ') : null;
  const items: (GuideItem | null)[] = [
    { label: t('guide.label.profile'), text: t('guide.profile', { age: patient.ageYears, sex: patient.sex, weight: patient.weightKg, height: patient.heightCm }) },
    { label: t('guide.label.working-problem'), text: patient.diagnosis },
    { label: t('guide.label.setting'), text: patient.procedure },
    list(patient.comorbidities) === null ? null : { label: t('guide.label.history'), text: list(patient.comorbidities)! },
    list(patient.medications) === null ? null : { label: t('guide.label.medications'), text: list(patient.medications)! },
    list(patient.allergies) === null ? null : { label: t('guide.label.allergies'), text: list(patient.allergies)! },
    patient.fasting === undefined ? null : { label: t('guide.label.fasting'), text: patient.fasting },
    patient.airway.assessment === undefined ? null : { label: t('guide.label.airway'), text: patient.airway.assessment },
  ];
  return items.filter((item): item is GuideItem => item !== null);
}

function timelineItems(scenario: Scenario): GuideItem[] {
  return scenario.timeline.map((event) => {
    const at = event.atTick !== undefined
      ? (event.atTick === 0 ? t('guide.at-start') : t('guide.tick', { tick: event.atTick }))
      : event.when !== undefined ? t('guide.when', { when: event.when }) : 'Unscheduled';
    const what = event.message ?? `${event.type}${event.target === undefined ? '' : `: ${event.target}`}`;
    return { label: at, text: what };
  });
}

/** Framework domains this scenario is mapped to, with the objectives that carry each. */
function frameworkItems({ moduleRoute, scenario }: FacilitatedScenario): GuideItem[] {
  if (moduleRoute === 'medical-surgical-nursing') return ncjmmItems(scenario);
  if (moduleRoute !== 'anesthesia') return [];
  const statement = new Map(scenario.metadata.objectives.map((objective) => [objective.id, objective.statement]));
  const items = SCENARIO_MAPPINGS
    .filter((mapping) => mapping.scenarioId === scenario.metadata.id)
    .flatMap((mapping) => {
      const framework = getFramework(mapping.frameworkId);
      const domain = framework?.domains.find((candidate) => candidate.id === mapping.domainId);
      if (framework === undefined || domain === undefined) return [];
      return [{
        label: `${framework.shortLabel}: ${domain.label}`,
        text: mapping.objectiveIds.map((id) => statement.get(id) ?? id).join('; '),
      }];
    });
  return items.length === 0 ? [] : [...items, { text: MAPPING_DISCLAIMER }];
}

/** Each NCJMM step this lesson exercises, with the objectives that carry it, and the one it does not. */
function ncjmmItems(scenario: Scenario): GuideItem[] {
  const mappings = ncjmmMappings([scenario]);
  const statement = new Map(scenario.metadata.objectives.map((objective) => [objective.id, objective.statement]));
  return [
    ...NCSBN_NCJMM.domains.map((step) => {
      const carrying = mappings.filter((mapping) => (mapping.steps as readonly string[]).includes(step.id));
      const reason = NCJMM_NOT_EXERCISED_REASON[step.id as keyof typeof NCJMM_NOT_EXERCISED_REASON];
      return {
        label: `${NCSBN_NCJMM.shortLabel}: ${step.label}`,
        text: carrying.length > 0
          ? carrying.map((mapping) => statement.get(mapping.objectiveId) ?? mapping.objectiveId).join('; ')
          : `Not exercised. ${reason ?? ''}`.trim(),
      };
    }),
    { text: NCSBN_NCJMM.note },
    { text: MAPPING_DISCLAIMER },
  ];
}

function debriefItems(scenario: Scenario): GuideItem[] {
  const statement = new Map(scenario.metadata.objectives.map((objective) => [objective.id, objective.statement]));
  const analysis = scenario.debrief.rubric.map((item) => ({
    label: statement.get(item.objectiveId) ?? item.objectiveId,
    text: item.question,
  }));
  if (analysis.length === 0) return [];
  return [
    { text: GUIDE_TEMPLATES.reactions },
    { text: GUIDE_TEMPLATES.description },
    { text: GUIDE_TEMPLATES.analysisLead },
    ...analysis,
    { text: GUIDE_TEMPLATES.summary },
  ];
}

/** Every section, in the order the design fixes, present or absent with its reason. */
export function facilitatorGuide(entry: FacilitatedScenario): readonly GuideSection[] {
  const { moduleName, scenario } = entry;
  const { metadata } = scenario;
  const signed = metadata.clinicalReview.reviewer !== UNSIGNED;
  return [
    present('at-a-glance', t('guide.section.at-a-glance'), [
      { label: t('guide.label.module'), text: moduleName },
      { label: t('guide.label.duration'), text: t('guide.duration', { minutes: metadata.estimatedMinutes }) },
      { label: t('guide.label.difficulty'), text: metadata.difficulty },
      { label: t('guide.label.published-as'), text: MATURITY_LABELS[metadata.maturity] },
    ], t('guide.absent.metadata')),
    present('objectives', t('guide.section.objectives'),
      metadata.objectives.map((objective) => ({ label: objective.statement, text: objective.measure })),
      t('guide.absent.objectives')),
    present('frameworks', t('guide.section.frameworks'), frameworkItems(entry),
      t('guide.absent.frameworks')),
    present('patient', t('guide.section.patient'), patientItems(scenario), t('guide.absent.patient')),
    present('prebrief', t('guide.section.prebrief'), [
      { text: GUIDE_TEMPLATES.fiction },
      { text: GUIDE_TEMPLATES.confidentiality },
      { label: GUIDE_TEMPLATES.monitoring, text: scenario.equipment.monitoring.join(', ') || t('guide.none-declared') },
    ], t('guide.absent.prebrief')),
    present('timeline', t('guide.section.timeline'), scenario.timeline.length === 0 ? []
      : [{ text: GUIDE_TEMPLATES.timelineLead }, ...timelineItems(scenario)],
    t('guide.absent.timeline')),
    absent('expected-actions', t('guide.section.expected-actions'),
      t('guide.absent.expected-actions')),
    absent('error-and-recovery', t('guide.section.error-and-recovery'),
      t('guide.absent.error-and-recovery')),
    present('debrief', t('guide.section.debrief'), debriefItems(scenario),
      t('guide.absent.debrief')),
    present('pause-points', t('guide.section.pause-points'), (scenario.pausePoints ?? []).map((point) => ({
      label: point.atTick !== undefined ? (point.atTick === 0 ? t('guide.at-start') : t('guide.tick', { tick: point.atTick })) : t('guide.when', { when: point.when ?? '' }),
      text: t('guide.pause-item', { question: point.question, region: t(`region.${point.region}` as MessageKey) }),
    })), t('guide.absent.pause-points')),
    present('limitations', t('guide.section.limitations'),
      (metadata.limitations ?? []).map((text) => ({ text })),
      t('guide.absent.limitations')),
    present('sources', t('guide.section.sources'),
      metadata.clinicalReview.sources.map((text) => ({ text })),
      t('guide.absent.sources')),
    present('provenance', t('guide.section.provenance'), [
      { label: t('guide.label.scenario'), text: t('guide.scenario-version', { id: metadata.id, version: metadata.version }) },
      { label: t('guide.label.licence'), text: metadata.license },
      { label: t('guide.label.author'), text: metadata.author },
      { label: t('guide.label.review'), text: signed
        ? t('guide.reviewed', { reviewer: metadata.clinicalReview.reviewer, credential: metadata.clinicalReview.credential, date: metadata.clinicalReview.reviewedOn })
        : GUIDE_TEMPLATES.unsigned },
      { label: t('guide.label.problems'), text: GUIDE_TEMPLATES.report },
    ], t('guide.absent.provenance')),
  ];
}

/** The sections a scenario's guide shows as absent, for the catalog gate report. */
export function absentGuideSections(entry: FacilitatedScenario): readonly string[] {
  return facilitatorGuide(entry).filter((section) => section.status === 'absent')
    .map((section) => section.id);
}
