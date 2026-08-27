import { REPORT_ACTION, type ScenarioReportRequest } from './contracts';

const CONFIG_PATH = '/api/reports/config';
const REPORT_PATH = '/api/reports';
const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
export const REPORT_REQUEST_TIMEOUT_MS = 8_000;

export interface ReportServiceConfig {
  readonly sitekey: string;
  readonly maintainer: string;
  readonly privacyUrl: string;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}

declare global {
  interface Window { turnstile?: TurnstileApi }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function unsafePublicLabel(value: string): boolean {
  return [...value].some((character) => {
    const point = character.codePointAt(0)!;
    return point <= 0x1f || (point >= 0x7f && point <= 0x9f) || point === 0x061c
      || point === 0x200e || point === 0x200f || (point >= 0x202a && point <= 0x202e)
      || (point >= 0x2066 && point <= 0x2069);
  });
}

export async function reportConfig(): Promise<ReportServiceConfig> {
  const response = await fetch(CONFIG_PATH, {
    method: 'GET', credentials: 'omit', headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(REPORT_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error('reporting unavailable');
  const value = await response.json() as {
    sitekey?: unknown; action?: unknown; maintainer?: unknown; privacy_url?: unknown;
  };
  let privacyUrl: URL;
  try { privacyUrl = new URL(String(value.privacy_url)); }
  catch { throw new Error('reporting unavailable'); }
  if (typeof value.sitekey !== 'string' || value.sitekey.length === 0
    || value.action !== REPORT_ACTION || typeof value.maintainer !== 'string'
    || value.maintainer.trim() !== value.maintainer || value.maintainer.length < 1
    || value.maintainer.length > 80 || unsafePublicLabel(value.maintainer)
    || privacyUrl.origin !== window.location.origin
    || privacyUrl.protocol !== 'https:' || privacyUrl.username || privacyUrl.password) {
    throw new Error('reporting unavailable');
  }
  return { sitekey: value.sitekey, maintainer: value.maintainer, privacyUrl: privacyUrl.href };
}

export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      script.remove();
      reject(new Error('Turnstile did not load in time'));
    }, REPORT_REQUEST_TIMEOUT_MS);
    script.src = TURNSTILE_SCRIPT;
    script.defer = true;
    script.addEventListener('load', () => {
      window.clearTimeout(timeout);
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error('Turnstile did not initialize'));
    }, { once: true });
    script.addEventListener('error', () => {
      window.clearTimeout(timeout);
      reject(new Error('Turnstile did not load'));
    }, { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });
  return scriptPromise;
}

export function renderTurnstile(
  api: TurnstileApi,
  container: HTMLElement,
  sitekey: string,
  callbacks: { ready: (token: string) => void; expired: () => void; error: () => void },
): string {
  return api.render(container, {
    sitekey,
    action: REPORT_ACTION,
    appearance: 'interaction-only',
    // Flexible has a 300 px minimum; compact also fits a 320 px dialog after padding.
    size: 'compact',
    theme: 'auto',
    'response-field': false,
    'feedback-enabled': false,
    callback: callbacks.ready,
    'expired-callback': callbacks.expired,
    'timeout-callback': callbacks.expired,
    'unsupported-callback': callbacks.error,
    'error-callback': callbacks.error,
  });
}

export async function submitScenarioReport(payload: ScenarioReportRequest): Promise<void> {
  const response = await fetch(REPORT_PATH, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(REPORT_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error('report not accepted');
}

export type { TurnstileApi };
