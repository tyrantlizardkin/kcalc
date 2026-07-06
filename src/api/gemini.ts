import Constants from 'expo-constants';

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
export type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };
export type FunctionDeclaration = { name: string; description: string; parameters: Record<string, unknown> };
export type FunctionCall = { name: string; args: Record<string, unknown> };
export type GenerateContentParams = {
  contents: GeminiContent[];
  systemInstruction?: string;
  responseSchema?: Record<string, unknown>;
  tools?: FunctionDeclaration[];
};
export type GenerateContentResult = { text: string | null; functionCalls: FunctionCall[] };

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function apiKey(): string {
  const key = Constants.expoConfig?.extra?.geminiApiKey as string | undefined;
  if (!key) throw new Error('GEMINI_API_KEY is not configured (see app.config.ts / EAS secrets)');
  return key;
}

export async function generateContent(
  params: GenerateContentParams,
  fetchImpl: typeof fetch = globalThis.fetch
): Promise<GenerateContentResult> {
  const body: Record<string, unknown> = { contents: params.contents };
  if (params.systemInstruction) {
    body.systemInstruction = { parts: [{ text: params.systemInstruction }] };
  }
  if (params.responseSchema) {
    body.generationConfig = { responseMimeType: 'application/json', responseSchema: params.responseSchema };
  }
  if (params.tools) {
    body.tools = [{ functionDeclarations: params.tools }];
  }

  const response = await fetchImpl(`${ENDPOINT}?key=${apiKey()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('Gemini rate limit hit — try again shortly.');
    throw new Error(`Gemini request failed (${response.status})`);
  }

  const json = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string; functionCall?: FunctionCall }[] } }[];
  };
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const text = parts.find((p) => typeof p.text === 'string')?.text ?? null;
  const functionCalls = parts.filter((p) => p.functionCall).map((p) => p.functionCall as FunctionCall);
  return { text, functionCalls };
}
