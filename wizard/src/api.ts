const sessionToken = new URLSearchParams(window.location.hash.slice(1)).get('token');

export async function request<T>(path: string, body?: unknown): Promise<T> {
  if (!sessionToken)
    throw new Error(
      'This session link is missing its token. Reopen the URL printed by usual-design wizard.',
    );
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        'X-Usual-Token': sessionToken,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
    });
  } catch {
    throw new Error(
      'The local server could not be reached. Check that the wizard command is still running, then reconnect.',
    );
  }
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof result?.error === 'string'
        ? result.error
        : `The operation failed (${response.status}).`;
    throw new Error(message);
  }
  return result as T;
}
