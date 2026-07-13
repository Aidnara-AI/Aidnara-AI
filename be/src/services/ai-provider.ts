export type GeminiOptions = {
  apiKey: string;
  model?: string;
  fetchImpl?: typeof fetch;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

export async function callGeminiJson(prompt: string, options: GeminiOptions) {
  const model = options.model || 'gemini-1.5-flash';
  const fetcher = options.fetchImpl || fetch;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${options.apiKey}`;

  const response = await fetcher(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!response.ok) throw new Error(`AI provider failed with status ${response.status}`);

  const payload = (await response.json()) as GeminiResponse;
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';

  return parseJsonText(text);
}

export function parseJsonText(text: string) {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  if (!withoutFence) throw new Error('AI provider returned empty response');

  return JSON.parse(withoutFence) as unknown;
}
