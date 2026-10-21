/**
 * Routes whose prerendered markup is the same tree the client renders, so the
 * client hydrates it in place rather than mounting fresh.
 *
 * The other routes deliberately render something different from their
 * prerendered markup: the simulator shows the acknowledgement gate, and a few
 * informational routes render generated tables. Hydrating a deliberate
 * difference is a mismatch, so those mount fresh instead. Shared with
 * `tests/unit/hydration.test.tsx`, which hydrates each of these against its own
 * prerendered markup and fails on any mismatch.
 */
export const HYDRATABLE: ReadonlySet<string> = new Set([
  '', '/about', '/for-educators', '/curriculum', '/validation', '/governance', '/limitations',
  '/privacy', '/cardiology', '/respiratory-medicine', '/pediatrics', '/neurology', '/oncology',
  '/critical-care',
]);
