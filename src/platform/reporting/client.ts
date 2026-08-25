import { REPORT_ACTION, type ScenarioReportRequest } from './contracts';

const CONFIG_PATH = '/api/reports/config';
const REPORT_PATH = '/api/reports';
const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}

declare global {
  interface Window { turnstile?: TurnstileApi }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

export async function reportConfig(): Promise<{ sitekey: string }> {
  const response = await fetch(CONFIG_PATH, {
    method: 'GET', credentials: 'omit', headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('reporting unavailable');
  const value = await response.json() as { sitekey?: unknown; action?: unknown };
  if (typeof value.sitekey !== 'string' || value.sitekey.length === 0
    || value.action !== REPORT_ACTION) {
    throw new Error('reporting unavailable');
  }
  return { sitekey: value.sitekey };
}

export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT;
    script.defer = true;
    script.addEventListener('load', () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error('Turnstile did not initialize'));
    }, { once: true });
    script.addEventListener('error', () => reject(new Error('Turnstile did not load')), { once: true });
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
    size: 'flexible',
    theme: 'auto',
    callback: callbacks.ready,
    'expired-callback': callbacks.expired,
    'error-callback': callbacks.error,
  });
}

export async function submitScenarioReport(payload: ScenarioReportRequest): Promise<void> {
  const response = await fetch(REPORT_PATH, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('report not accepted');
}

export type { TurnstileApi };
