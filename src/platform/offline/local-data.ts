/**
 * The local data panel's inventory (platform/offline-pwa → Local Storage Is
 * Small, Inspectable, And Erasable).
 *
 * Every key the application writes is declared here, so the panel can list each
 * stored item by name, purpose and size, with a control to delete each one and
 * one to delete everything.
 */

export interface LocalDataItem {
  readonly key: string;
  readonly name: string;
  readonly kind: 'preference' | 'acknowledgement' | 'transcript' | 'recommendation';
  readonly purpose: string;
}

export const LOCAL_DATA_ITEMS: readonly LocalDataItem[] = [
  {
    key: 'opensimlab.acknowledged-not-for-clinical-use',
    name: 'Not-for-clinical-use acknowledgement',
    kind: 'acknowledgement',
    purpose: 'Records that you have seen the statement, so it is asked once rather than every visit.',
  },
  {
    key: 'opensimlab.practice-region',
    name: 'Practice region',
    kind: 'preference',
    purpose: 'Which region profile governs techniques, formulary, protocol variant and terminology.',
  },
  {
    key: 'opensimlab.colorblind-safe',
    name: 'Colourblind-safe trace palette',
    kind: 'preference',
    purpose: 'Whether the five trace hues are replaced with the confusion-line-safe set.',
  },
  {
    key: 'opensimlab.sound-on',
    name: 'Sound',
    kind: 'preference',
    purpose: 'Whether the variable-pitch pulse tone and the alarm tones play. Off unless you turn it on.',
  },
  {
    key: 'opensimlab.action-height',
    name: 'Height of the action region',
    kind: 'preference',
    purpose: 'The height you dragged the drug and equipment tray to, so it is the same next time.',
  },
  {
    key: 'opensimlab.analysis-width',
    name: 'Width of the analysis region',
    kind: 'preference',
    purpose: 'The width you dragged the analysis panel to, so it is the same next time.',
  },
  {
    key: 'opensimlab.recommendation-dismissals',
    name: 'Hidden practice suggestions',
    kind: 'recommendation',
    purpose: 'Goal-path suggestions you hid, with only the local 7-day expiry for each public path id.',
  },
  {
    key: 'opensimlab.transcripts',
    name: 'Saved session transcripts',
    kind: 'transcript',
    purpose: 'Sessions you chose to keep, so you can compare a later attempt against an earlier one.',
  },
];

export interface StoredItemReport {
  readonly item: LocalDataItem;
  readonly present: boolean;
  readonly bytes: number;
}

/** What is actually stored right now, for the data panel. */
export function inventory(storage: Storage): StoredItemReport[] {
  return LOCAL_DATA_ITEMS.map((item) => {
    let value: string | null = null;
    try { value = storage.getItem(item.key); } catch { value = null; }
    return {
      item,
      present: value !== null,
      bytes: value === null ? 0 : new TextEncoder().encode(value).length,
    };
  });
}

/** Delete one item. */
export function eraseOne(storage: Storage, key: string): void {
  try { storage.removeItem(key); } catch { /* storage may be blocked */ }
}

/**
 * Delete everything this application stored, and report what was removed.
 * It touches only keys under this application's prefix, never anything else in
 * the origin's storage.
 */
export function eraseAll(storage: Storage): string[] {
  const removed: string[] = [];
  for (const item of LOCAL_DATA_ITEMS) {
    try {
      if (storage.getItem(item.key) !== null) {
        storage.removeItem(item.key);
        removed.push(item.name);
      }
    } catch { /* storage may be blocked */ }
  }
  return removed;
}

/**
 * A quota failure is reported clearly and the transcript is offered as an export
 * instead. A session is never silently discarded.
 */
export interface SaveOutcome {
  readonly saved: boolean;
  readonly message: string;
  readonly offerExport: boolean;
}

export function saveTranscript(storage: Storage, key: string, value: string): SaveOutcome {
  try {
    storage.setItem(key, value);
    return { saved: true, message: 'Saved on this device.', offerExport: false };
  } catch {
    return {
      saved: false,
      offerExport: true,
      message:
        'This browser refused to store the transcript, most likely because its storage for this '
        + 'site is full. The session has NOT been discarded: export it to a file instead, or clear '
        + 'some stored data and try again.',
    };
  }
}
