/**
 * Gives the prerender and social-image steps the same `__RELEASE_ID__` Vite
 * injects into the client, so a hydrated page's citation matches its HTML.
 * Used as `tsx --import`, before any module reads `APP_VERSION`.
 */
import { releaseId } from './release-id.ts';

(globalThis as { __RELEASE_ID__?: string }).__RELEASE_ID__ = releaseId();
