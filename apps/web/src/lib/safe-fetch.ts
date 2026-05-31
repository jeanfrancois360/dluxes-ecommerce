/**
 * Safe JSON parsing for raw fetch() responses.
 * Prevents SyntaxError crashes when the server returns an empty body.
 */
export async function safeJson(response: Response): Promise<any> {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}
