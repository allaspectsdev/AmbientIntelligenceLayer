let _client: { messages: { create: (params: unknown) => Promise<unknown> } } | null = null;

export async function getAnthropicClient() {
  if (_client) return _client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    _client = new Anthropic({ apiKey }) as typeof _client;
    return _client;
  } catch {
    return null;
  }
}

export function isAnthropicAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
