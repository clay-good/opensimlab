/**
 * SHA-256 over a serialized state trace.
 *
 * Used to prove that a replay reproduced a session bit for bit, on a different
 * device and a different browser (engine/pkpd-core → Replay is bit-identical
 * across devices). Implemented against the Web Crypto API, which both the browser
 * and Node provide, so the same code runs in the application and in the tests.
 */

/**
 * Serialize one state sample deterministically: keys sorted, numbers written at
 * full precision. Two runs that differ in the last bit of any number must produce
 * different text, or the hash proves nothing.
 */
export function serializeSample(sample: Readonly<Record<string, unknown>>): string {
  const keys = Object.keys(sample).sort();
  const parts = keys.map((key) => {
    const value = sample[key];
    if (typeof value === 'number') {
      // Not toFixed: that would round away exactly the differences being tested for.
      return `${key}=${Number.isFinite(value) ? value.toExponential(17) : String(value)}`;
    }
    return `${key}=${JSON.stringify(value)}`;
  });
  return parts.join(';');
}

/** Serialize a whole trace, one sample per line. */
export function serializeTrace(trace: readonly Readonly<Record<string, unknown>>[]): string {
  return trace.map(serializeSample).join('\n');
}

export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Hash a state trace. This is the value recorded in the transcript. */
export function hashStateTrace(trace: readonly Readonly<Record<string, unknown>>[]): Promise<string> {
  return sha256Hex(serializeTrace(trace));
}
