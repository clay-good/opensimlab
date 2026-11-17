/**
 * PEARLS analysis prompts generated from this run's own attribution
 * (learning/facilitation → facilitator guide, PEARLS phases).
 *
 * The facilitator guide already asks each lesson's authored debrief question
 * under its objective. Those are the same for every learner, because they are
 * about the lesson. These are the other half: one prompt per objective, built
 * from what the MODEL attributed the change to at the moment that objective was
 * measured, so the question a debrief asks is about the run that just happened.
 *
 * THE RULES THESE FOLLOW, which are the reason they are generated rather than
 * written:
 *
 * - A prompt names one behaviour and one consequence, and asks a question. It
 *   never says well, better, worse, or how much of anything was achieved.
 * - It states what the model attributed, not what caused anything. The engine
 *   ranks its own terms; a prompt that said "because you gave propofol" would
 *   be asserting causation the attribution does not claim.
 * - A term from one of this project's teaching models says so in the prompt.
 *   The learner is being asked to reason about a number, and whether that
 *   number comes from a published model or from one written here changes how
 *   far the reasoning can go.
 * - An objective with no attribution at its moment gets the open question
 *   instead of an invented one. Silence is a fact about the run.
 */

import type { Attribution } from '@platform/kernel/protocol';
import { t } from '@platform/i18n/messages';
// These prompts' words live in the session group, and a surface that uses a
// key imports the group that defines it.
import '@platform/i18n/messages-session';
import { formatElapsed } from '@platform/clock/simulation-clock';

export interface PromptFinding {
  readonly objectiveId: string;
  readonly statement: string;
  readonly outcome: string;
  readonly atTick?: number;
}

export interface PearlsPrompt {
  readonly objectiveId: string;
  readonly statement: string;
  /** The question to ask. One behaviour, one consequence, no verdict. */
  readonly prompt: string;
  /** True when the leading term comes from a teaching model rather than a published one. */
  readonly teachingModel: boolean;
}

/** The term the model ranked first for the variable that moved most, if any. */
function leadingTerm(attributions: readonly Attribution[]) {
  for (const attribution of attributions) {
    const [term] = attribution.terms;
    if (term !== undefined) return { variable: attribution.variable, term };
  }
  return undefined;
}

/**
 * One prompt per objective, in the scenario's own order.
 *
 * `attributionAt` is the debrief's own lookup, which answers for the moment
 * asked about or with nothing. Nothing here reaches the session.
 */
export function pearlsAnalysisPrompts(
  findings: readonly PromptFinding[],
  attributionAt: (tick: number) => readonly Attribution[],
): PearlsPrompt[] {
  return findings.map((finding) => {
    const moment = finding.atTick;
    const leading = moment === undefined ? undefined : leadingTerm(attributionAt(moment));
    if (moment === undefined || leading === undefined) {
      return {
        objectiveId: finding.objectiveId,
        statement: finding.statement,
        prompt: t('pearls.prompt-open', { objective: finding.statement }),
        teachingModel: false,
      };
    }
    const share = Math.round(leading.term.share * 100);
    return {
      objectiveId: finding.objectiveId,
      statement: finding.statement,
      prompt: t(leading.term.teachingModel ? 'pearls.prompt-teaching' : 'pearls.prompt', {
        time: formatElapsed(moment),
        variable: leading.variable,
        term: leading.term.label,
        share,
      }),
      teachingModel: leading.term.teachingModel,
    };
  });
}
