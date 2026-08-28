import type { ContentMaturity } from '@platform/catalog/maturity';

export const REPORT_NOTE_LIMIT = 160;
export const REPORT_ACTION = 'scenario-report';
export const REPORT_CONTEXT_ACTION_LIMIT = 20;
export const REPORT_CONTEXT_SNAPSHOT_LIMIT = 32;
export const REPORT_CONTEXT_JSON_LIMIT = 16_384;

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
export type ReportContextScalar = string | number | boolean | null;

export interface ScenarioReportActionContext {
  readonly tick: number;
  readonly type: string;
  readonly outcome: 'accepted' | 'refused';
  readonly payload: Readonly<Record<string, ReportContextScalar>>;
}

export interface ScenarioReportRecentContext {
  readonly seed: number;
  readonly actions: readonly ScenarioReportActionContext[];
  readonly snapshot: {
    readonly patient: Readonly<Record<string, number>>;
    readonly equipment: Readonly<Record<string, ReportContextScalar>>;
  };
}

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
  /** Invoked only after the learner explicitly opts in. */
  readonly collectRecentContext?: () => ScenarioReportRecentContext;
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
  readonly recent_context: ScenarioReportRecentContext | null;
  readonly turnstile_token: string;
}

export function noteMayContainRealPatientInformation(note: string): boolean {
  return /\b(?:(?:my|our)\s+patient|(?:this|a)\s+real\s+patient|real-life\s+patient)\b/i.test(note)
    || /\b(?:m(?:rn)|medical\s+record|patient\s+id)\s*[:#-]?\s*[a-z0-9-]{4,}\b/i.test(note)
    || /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(note)
    || /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/.test(note)
    // A separator-free number and a date of birth are the two cheapest ways real identifiers arrive.
    || /\b\d{7,}\b/.test(note)
    || /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(note);
}

export function buildScenarioReportRequest(
  context: ScenarioReportContext,
  category: ReportCategory,
  note: string,
  turnstileToken: string,
  recentContext: ScenarioReportRecentContext | null = null,
): ScenarioReportRequest {
  const boundedContext = recentContext
    && JSON.stringify(recentContext).length <= REPORT_CONTEXT_JSON_LIMIT ? recentContext : null;
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
    recent_context: boundedContext,
    turnstile_token: turnstileToken,
  };
}
