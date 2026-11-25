const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export async function post(path, body, signal) {
  const multipart = body instanceof FormData;
  const response = await fetch(`${base}${path}`, {
    method: 'POST', signal,
    headers: multipart ? {} : { 'Content-Type': 'application/json' },
    body: multipart ? body : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Server returned ${response.status}. Check the Flask terminal and API keys.`);
  return response;
}
