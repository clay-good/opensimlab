/**
 * The event log (cockpit/event-log).
 *
 * A chronological record of every learner action, scripted event, alarm
 * transition, and engine warning. It is simultaneously the in-session reference,
 * the debrief substrate, and the portable session transcript.
 */

import type { EngineEvent } from '@platform/kernel/protocol';
import { NOT_CLINICALLY_REVIEWED, NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { formatElapsed } from '@platform/clock/simulation-clock';

export type Severity = EngineEvent['severity'];

export const SEVERITIES: readonly Severity[] = ['info', 'advisory', 'warning', 'critical', 'artifact'];

/**
 * Icon glyph per severity, so severity is distinguishable by icon and text label
 * and never by colour alone.
 */
export const SEVERITY_GLYPH: Record<Severity, string> = {
  info: '·',
  advisory: '›',
  warning: '!',
  critical: '!!',
  artifact: '~',
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  info: 'Info',
  advisory: 'Advisory',
  warning: 'Warning',
  critical: 'Critical',
  artifact: 'Artifact',
};

export class EventLog {
  private readonly entries: EngineEvent[] = [];

  append(event: EngineEvent): void {
    this.entries.push(event);
  }

  appendAll(events: readonly EngineEvent[]): void {
    for (const event of events) this.append(event);
  }

  all(): readonly EngineEvent[] {
    return this.entries;
  }

  filter(options: { severities?: ReadonlySet<Severity>; categories?: ReadonlySet<string> }): EngineEvent[] {
    return this.entries.filter((entry) =>
      (!options.severities || options.severities.has(entry.severity))
      && (!options.categories || options.categories.has(entry.category)));
  }

  categories(): string[] {
    return [...new Set(this.entries.map((entry) => entry.category))].sort();
  }

  clear(): void {
    this.entries.length = 0;
  }

  /** Export as plain text, with the not-for-clinical-use statement embedded. */
  toText(header: { scenarioId: string; engineVersion: string; modelSetRevision: string }): string {
    const lines = [
      'Open Sim Lab session log',
      NOT_FOR_CLINICAL_USE,
      NOT_CLINICALLY_REVIEWED,
      `Scenario: ${header.scenarioId}`,
      `Engine: ${header.engineVersion}   Model set: ${header.modelSetRevision}`,
      '',
    ];
    for (const entry of this.entries) {
      lines.push(`${formatElapsed(entry.tick)}  ${SEVERITY_LABEL[entry.severity].padEnd(9)} ${entry.category.padEnd(14)} ${entry.message}`);
    }
    return lines.join('\n');
  }

  /** Export as JSON, with the statement and the versions embedded. */
  toJson(header: { scenarioId: string; engineVersion: string; modelSetRevision: string }): string {
    return JSON.stringify({
      format: 'opensimlab.event-log',
      notForClinicalUse: NOT_FOR_CLINICAL_USE,
      notClinicallyReviewed: NOT_CLINICALLY_REVIEWED,
      ...header,
      entries: this.entries,
    }, null, 2);
  }
}
