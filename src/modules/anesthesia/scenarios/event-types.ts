/** The timeline event types, shared by the schema and the TypeScript types. */
export const EVENT_TYPES = [
  'surgical-stimulus', 'blood-loss', 'crystalloid', 'narrative', 'equipment-failure',
  'rhythm-change', 'artifact', 'obstruction', 'objective-window',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
