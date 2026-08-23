/**
 * The timeline event types, shared by the schema and the TypeScript types.
 *
 * Every one of these is handled by the engine, and the switch that handles them
 * is exhaustive over this union — so adding a name here without teaching the
 * engine what it means is a compile error rather than an event that validates
 * cleanly and silently does nothing.
 *
 * `objective-window` used to be listed and was never implemented, specified, or
 * used by any scenario. It was removed rather than given invented semantics.
 */
export const EVENT_TYPES = [
  'surgical-stimulus', 'blood-loss', 'crystalloid', 'obstruction', 'laryngospasm', 'anaphylaxis',
  'malignant-hyperthermia',
  'narrative', 'rhythm-change', 'artifact', 'equipment-failure',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
