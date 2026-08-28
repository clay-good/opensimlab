export const REPORT_PATH: string;
export const CONFIG_PATH: string;
export const MAX_BODY_BYTES: number;
export const MAX_NOTE_LENGTH: number;
export const REPORT_RETENTION_DAYS: number;
export const COUNTER_RETENTION_DAYS: number;
export function validateReportPayload(value: unknown, allowedOrigin?: string):
  | { ok: false; status: number }
  | { ok: true; value: Record<string, unknown> };
export function verifyTurnstile(
  report: { turnstileToken: string },
  remoteIp: string,
  env: Record<string, unknown>,
  fetcher?: typeof fetch,
): Promise<boolean>;
export function reporterNetwork(remoteIp: string): string;

export function reserveVerificationAttempt(
  db: unknown,
  day: string,
  reporter: string,
): Promise<boolean>;
export function cleanupReports(db: unknown, now?: Date): Promise<void>;
export function handleRequest(request: Request, env: Record<string, unknown>): Promise<Response>;
