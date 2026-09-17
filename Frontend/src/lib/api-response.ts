export async function readApiResponse<T>(response: Response): Promise<T> {
  const body = await response.text();
  if (!body) throw new Error(`Server request failed (${response.status})`);

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(`Server returned an invalid response (${response.status})`);
  }
}
