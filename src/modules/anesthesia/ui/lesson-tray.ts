/**
 * A lesson's action tray, described as data.
 *
 * `ActionCockpit.tsx` used to import all 48 lesson trays and write out a gated
 * block for each, and a tray carries its lesson's controls, labels and tutor
 * prose. Measured by stubbing them: those 48 were 98.9 KB gz of the shared
 * cockpit chunk that every module downloads, whichever lesson the learner opened.
 *
 * A module now hands the cockpit its own trays, the way it hands over its worked
 * examples. The five props every lesson tray takes are the same five, so the
 * cockpit renders them without naming any lesson: `guidance` is `session.guidance`
 * at all 202 call sites it replaced, and the action handler was the identical
 * `session.act({ type, payload: { action } })` at 198 of 201.
 */
import type { ComponentType } from 'react';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { Scenario } from '@anesthesia/scenarios/types';

export interface LessonTrayProps {
  readonly assessment: unknown;
  readonly guidance?: GuidanceLevel;
  readonly scenarioVersion: string;
  readonly demonstrating?: boolean;
  readonly onOpenSource?: (() => void) | undefined;
  readonly onAction: (action: string) => void;
}

export interface LessonTray {
  /** The lesson id, shared with `LessonDemonstration` so one demo drives one tray. */
  readonly id: string;
  /**
   * The demonstration whose worked example drives this tray, when its id differs
   * from the tray's. A tray gates its own controls off `demonstrating`, so a tray
   * named differently from its demonstration would stay live while the example ran.
   */
  readonly demoId?: string;
  /** The action type this tray's controls dispatch. */
  readonly actionType: string;
  /** True for the scenarios this tray belongs to. */
  readonly supports: (scenario: Scenario) => boolean;
  /** This lesson's slice of the resuscitation snapshot; undefined before the first frame. */
  readonly assessment: (resuscitation: EquipmentSnapshot['resuscitation'] | undefined) => unknown;
  /** True when this tray reads its lesson's tutor and wants the source control. */
  readonly opensSource?: boolean;
  /**
   * Each tray declares a narrower `assessment` than this shared shape, which is
   * why a registry entry casts to `LessonTray['Component']`. The cast is the one
   * place the per-lesson type is given up, and the tray's own props still check
   * against its own snapshot type at its definition.
   */
  readonly Component: ComponentType<LessonTrayProps>;
}
