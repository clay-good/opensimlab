/**
 * The attribution mechanism (engine/physiology → Physiology Is Reproducible And
 * Attributable, learning/knowledge-layer → The Why Panel).
 *
 * Every change to a state variable is attributable to a named contributing term.
 * The physiology step declares each influence as it applies it, so the Why panel
 * is generated from what the engine actually did rather than from prewritten text.
 */

import type { Attribution, AttributionTerm } from '@platform/kernel/protocol';
import type { StateField } from './state';

/** Accumulates the contributions applied to each variable during one step. */
export class AttributionRecorder {
  private readonly terms = new Map<string, AttributionTerm[]>();

  /**
   * Record one contribution.
   * `contribution` is signed and in the variable's own units.
   */
  add(
    variable: StateField,
    termId: string,
    label: string,
    contribution: number,
    options: { teachingModel?: boolean } = {},
  ): void {
    if (contribution === 0) return;
    const list = this.terms.get(variable) ?? [];
    list.push({
      termId, label, contribution, share: 0, teachingModel: options.teachingModel ?? false,
    });
    this.terms.set(variable, list);
  }

  /** Ranked contributions per variable, largest absolute contribution first. */
  build(): Attribution[] {
    const out: Attribution[] = [];
    for (const [variable, list] of this.terms) {
      const total = list.reduce((sum, term) => sum + Math.abs(term.contribution), 0);
      const ranked = [...list]
        .map((term) => ({ ...term, share: total === 0 ? 0 : Math.abs(term.contribution) / total }))
        .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
      out.push({ variable, terms: ranked });
    }
    return out;
  }

  clear(): void {
    this.terms.clear();
  }
}
