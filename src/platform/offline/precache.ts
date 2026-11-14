/**
 * What the first visit does NOT download.
 *
 * The service worker precaches every built asset, and the reason is a promise:
 * a learner who opens the front page and then loses the network can still start
 * any scenario. Scanning the shell alone once missed the lazily imported route
 * chunks, and the result was a site that served its own landing page offline
 * while failing to start a simulation.
 *
 * That promise is about lesson content. A few assets are not lesson content and
 * cannot be wanted on a first visit, and the first-visit budget is the scarcest
 * thing the build has: 2 MiB, enforced in `scripts/check-budgets.ts`, with the
 * catalogue at 256 lessons. So those assets ship, stay runtime-cacheable, and
 * are simply not in the manifest the first visit downloads.
 *
 * The list is here, and not inline in the prerender step, because
 * `tests/unit/offline.test.ts` asserts it exactly. An exception that nothing
 * pins is an exception that grows, and the next one has to be argued for in a
 * diff rather than added to a filter.
 */

export interface PrecacheExclusion {
  /** The built chunk's name before its content hash. */
  readonly chunk: string;
  /** Why a first visit cannot want it, and what a learner loses offline without it. */
  readonly reason: string;
}

export const FIRST_VISIT_PRECACHE_EXCLUSIONS: readonly PrecacheExclusion[] = [
  {
    chunk: 'return-index.generated',
    reason: 'The catalogue view behind the spaced-return suggestion. It is read only from local '
      + 'practice history, which a first visit has none of, and the suggestion panel already '
      + 'renders nothing when the chunk will not load. A learner who has practised has loaded a '
      + 'module index online at least once, which is when the runtime cache takes it.',
  },
  {
    chunk: 'FacilitatorGuideRoute',
    reason: 'The facilitator guide and the reference transcripts it reads. The guides are '
      + 'noindex, so their prerendered HTML is not in the precache either: a first visit cannot '
      + 'open one offline whether this chunk is there or not, and precaching it only buys the '
      + 'shell fallback for an educator surface that is already not offline-complete.',
  },
];

/** Is this built asset path one the first visit skips? */
export function excludedFromFirstVisit(assetPath: string): boolean {
  const file = assetPath.slice(assetPath.lastIndexOf('/') + 1);
  return FIRST_VISIT_PRECACHE_EXCLUSIONS.some((exclusion) => file.startsWith(`${exclusion.chunk}-`));
}
