import { PREPARATION_PATH_IDS, type PreparationPathId } from './preparation-paths';

const STORAGE_KEY = 'opensimlab.recommendation-dismissals';
export const RECOMMENDATION_DISMISSAL_MS = 7 * 24 * 60 * 60 * 1000;

function readDismissals(): Partial<Record<PreparationPathId, number>> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const record = value as Record<string, unknown>;
    return Object.fromEntries(PREPARATION_PATH_IDS.flatMap((id) => (
      typeof record[id] === 'number' && Number.isFinite(record[id])
        ? [[id, record[id] as number]]
        : []
    )));
  } catch {
    return {};
  }
}

export function recommendationDismissed(
  pathId: PreparationPathId,
  now = new Date().getTime(),
): boolean {
  return (readDismissals()[pathId] ?? 0) > now;
}

export function dismissRecommendation(pathId: PreparationPathId, now = new Date().getTime()): number {
  const until = now + RECOMMENDATION_DISMISSAL_MS;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readDismissals(), [pathId]: until }));
  } catch { /* Storage may be blocked or full; the current view still dismisses. */ }
  return until;
}
