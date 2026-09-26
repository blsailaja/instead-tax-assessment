const HEADER = "X-Lovable-AIG-Run-ID";

export function createRunIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId) headers.set(HEADER, runId);
    const response = await fetch(input, { ...init, headers });
    runId ??= response.headers.get(HEADER)?.trim() || undefined;
    return response;
  };
}
