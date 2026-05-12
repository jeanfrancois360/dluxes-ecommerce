/**
 * Retry helper for transient shipping API failures.
 *
 * Retries on:
 *   - Network errors (ECONNRESET, ETIMEDOUT, ECONNREFUSED, etc.)
 *   - HTTP 5xx responses (server-side errors)
 *
 * Never retries on:
 *   - HTTP 4xx responses (bad input — retrying won't help)
 *   - Deliberate timeouts imposed by the caller
 *
 * Default: 2 total attempts (1 retry), 300 ms → 600 ms exponential backoff.
 * Total added latency on full retry budget: ≤ 900 ms per provider.
 */

export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default: 2 */
  maxAttempts?: number;
  /** Base delay in ms between attempts (doubles each retry). Default: 300 */
  baseDelayMs?: number;
  /** Label shown in thrown errors for easier debugging. */
  label?: string;
}

/** Returns true for errors that are worth retrying. */
function isTransient(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;

  // Axios / fetch-style HTTP errors: 5xx is transient, 4xx is not
  const status = (err as any).response?.status ?? (err as any).statusCode ?? (err as any).status;
  if (typeof status === 'number') {
    return status >= 500;
  }

  // Node.js network error codes
  const code = (err as any).code as string | undefined;
  if (code) {
    return ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(code);
  }

  // Generic "network" / "timeout" message patterns (catch-all)
  const message = ((err as any).message ?? '').toLowerCase() as string;
  return (
    message.includes('network') ||
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    message.includes('socket hang up')
  );
}

/** Sleep for `ms` milliseconds. */
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Execute `fn` with exponential-backoff retry on transient errors.
 *
 * @example
 * const rates = await withRetry(() => api.getRates(payload), { label: 'EasyPost' });
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 300;
  const label = options.label ?? 'API';

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const willRetry = attempt < maxAttempts && isTransient(err);

      if (!willRetry) {
        // Non-transient error OR final attempt — propagate immediately
        throw err;
      }

      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      const errMsg = (err as any)?.message ?? String(err);

      // Re-throw with context so caller logs are meaningful
      // (we log here as a debug trace; caller's catch block logs the final failure)
      console.warn(
        `[Retry] ${label} attempt ${attempt}/${maxAttempts} failed (transient): ${errMsg}. ` +
          `Retrying in ${delayMs} ms...`
      );

      await sleep(delayMs);
    }
  }

  // Unreachable, but TypeScript needs this
  throw lastError;
}
