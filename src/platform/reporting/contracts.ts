import type { ContentMaturity } from '@platform/catalog/maturity';

export const REPORT_NOTE_LIMIT = 160;
export const REPORT_ACTION = 'scenario-report';

export const REPORT_CATEGORIES = [
  ['clinical-content', 'Clinical content'],
  ['patient-behavior', 'Patient behavior'],
  ['tutor-debrief', 'Tutor or debrief'],
  ['controls', 'Controls'],
  ['accessibility', 'Accessibility'],
  ['outdated-source', 'Outdated source'],
  ['other', 'Other'],
] as const;

export type ReportCategory = typeof REPORT_CATEGORIES[number][0];
export type ReportSurface = 'prebrief' | 'live' | 'debrief' | 'source' | 'limitation';

export interface ScenarioReportContext {
  readonly scenarioId: string;
  readonly contentVersion: string;
  readonly appVersion: string;
  readonly engineVersion: string;
  readonly moduleId: string;
  readonly maturity: ContentMaturity;
  readonly practiceRegion: string;
  readonly fidelityClass: 'closed_loop_physiology' | 'state_transition' | 'branching_encounter';
  readonly surface: ReportSurface;
  readonly simulatedTick: number;
  readonly canonicalUrl: string;
}

export interface ScenarioReportRequest {
  readonly module_id: string;
  readonly scenario_id: string;
  readonly content_version: string;
  readonly app_version: string;
  readonly engine_version: string;
  readonly practice_region: string;
  readonly surface: ReportSurface;
  readonly simulated_tick: number;
  readonly canonical_url: string;
  readonly category: ReportCategory;
  readonly note: string;
  readonly turnstile_token: string;
}

export function buildScenarioReportRequest(
  context: ScenarioReportContext,
  category: ReportCategory,
  note: string,
  turnstileToken: string,
): ScenarioReportRequest {
  return {
    module_id: context.moduleId,
    scenario_id: context.scenarioId,
    content_version: context.contentVersion,
    app_version: context.appVersion,
    engine_version: context.engineVersion,
    practice_region: context.practiceRegion,
    surface: context.surface,
    simulated_tick: Math.max(0, Math.trunc(context.simulatedTick)),
    canonical_url: context.canonicalUrl,
    category,
    note: note.trim().slice(0, REPORT_NOTE_LIMIT),
    turnstile_token: turnstileToken,
  };
}
