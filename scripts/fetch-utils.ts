// Thin retry/timeout wrapper around fetch — keeps the bakers honest
// against transient upstream issues without masking real failures.

const DEFAULT_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

export interface FetchOpts {
  /** Per-attempt timeout in ms. */
  timeout?: number;
  /** Retry attempts after the first try. */
  retries?: number;
  /** Optional extra headers. */
  headers?: Record<string, string>;
  /** Allow specific non-2xx codes (e.g. 304). */
  acceptStatus?: number[];
}

export async function fetchText(url: string, opts: FetchOpts = {}): Promise<string> {
  const { timeout = 20_000, retries = 2, headers = {}, acceptStatus = [] } = opts;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(new Error(`timeout after ${timeout}ms`)), timeout);
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent": DEFAULT_UA,
          accept: "text/html,application/xhtml+xml,application/json,*/*",
          "accept-language": "en-US,en;q=0.9",
          ...headers,
        },
        redirect: "follow",
        signal: ctrl.signal,
      });
      if (!res.ok && !acceptStatus.includes(res.status)) {
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
      }
      return await res.text();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const backoff = 500 * 2 ** attempt; // 500, 1000, 2000…
        await new Promise((r) => setTimeout(r, backoff));
      }
    } finally {
      clearTimeout(t);
    }
  }
  throw new Error(
    `fetchText failed after ${retries + 1} attempts: ${String(lastErr instanceof Error ? lastErr.message : lastErr)}`,
  );
}
