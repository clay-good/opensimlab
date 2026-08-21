/**
 * Which limitations a scenario's briefing names, and in what words.
 *
 * Two sources, unioned. A scenario lists the ids it wants named, and a
 * limitation can nominate scenarios through its own `briefIn` — the register
 * knows where a limitation bites, and requiring both ends to be edited in step
 * is how one of them ends up wrong.
 *
 * It was wrong. Three limitations nominated a scenario through `briefIn` and not
 * one of those scenarios listed them, so the requirement that a briefing names
 * the limitations near its teaching points was satisfied nowhere. Meanwhile the
 * briefing printed whatever string the scenario held, which for three of the
 * four scenarios meant showing a learner the bullet
 * "no-shunt-or-dead-space-dynamics".
 */

import { LIMITATIONS, type Limitation } from './limitations';

/**
 * The limitations to name in a scenario's briefing, deduplicated and in
 * register order so the same scenario always reads the same way.
 *
 * An id that matches no limitation is DROPPED rather than shown. A briefing is
 * the wrong place to surface a content bug at a learner; the build catches it
 * instead, in `tests/unit/limitations.test.ts`.
 */
export function limitationsToBrief(scenario: {
  metadata: { id: string; limitations?: readonly string[] };
}): Limitation[] {
  const wanted = new Set(scenario.metadata.limitations ?? []);
  return LIMITATIONS.filter(
    (limitation) => wanted.has(limitation.id) || limitation.briefIn.includes(scenario.metadata.id),
  );
}

/** Ids a scenario declares that no limitation in the register carries. */
export function unknownLimitationIds(scenario: {
  metadata: { limitations?: readonly string[] };
}): string[] {
  const known = new Set(LIMITATIONS.map((limitation) => limitation.id));
  return (scenario.metadata.limitations ?? []).filter((id) => !known.has(id));
}
