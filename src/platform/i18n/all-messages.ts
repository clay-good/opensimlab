/**
 * The whole English source catalog, for the checks and pages that need every
 * key: coverage on `/translation-status`, the pseudo-locales, and the tests.
 * Importing it also registers every group, so nothing it reaches can miss one.
 */
import type { SourceMessage } from './catalog';
import { CORE_MESSAGES } from './messages';
import { DOCUMENT_MESSAGES } from './messages-documents';
import { EDUCATOR_MESSAGES } from './messages-educator';
import { SESSION_MESSAGES } from './messages-session';

export const EN_MESSAGES = {
  ...CORE_MESSAGES, ...DOCUMENT_MESSAGES, ...EDUCATOR_MESSAGES, ...SESSION_MESSAGES,
} as const satisfies Readonly<Record<string, SourceMessage>>;

/** The groups, by module, so a test can hold that no key is defined twice. */
export const MESSAGE_GROUPS = {
  core: CORE_MESSAGES,
  'messages-documents': DOCUMENT_MESSAGES,
  'messages-educator': EDUCATOR_MESSAGES,
  'messages-session': SESSION_MESSAGES,
} as const;
