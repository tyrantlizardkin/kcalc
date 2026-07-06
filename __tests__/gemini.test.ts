import { generateContent } from '../src/api/gemini';

function fakeFetch(body: unknown, ok = true, status: number = ok ? 200 : 429): typeof fetch {
  return (async () =>
    ({
      ok,
      status,
      json: async () => body,
    }) as Response) as unknown as typeof fetch;
}

test('parses text-only response', async () => {
  const fetchImpl = fakeFetch({
    candidates: [{ content: { parts: [{ text: 'hello' }] } }],
  });
  const result = await generateContent({ contents: [{ role: 'user', parts: [{ text: 'hi' }] }] }, fetchImpl);
  expect(result).toEqual({ text: 'hello', functionCalls: [] });
});

test('parses functionCall parts', async () => {
  const fetchImpl = fakeFetch({
    candidates: [
      {
        content: {
          parts: [{ functionCall: { name: 'log_meal', args: { kcal: 500 } } }],
        },
      },
    ],
  });
  const result = await generateContent({ contents: [{ role: 'user', parts: [{ text: 'hi' }] }] }, fetchImpl);
  expect(result).toEqual({ text: null, functionCalls: [{ name: 'log_meal', args: { kcal: 500 } }] });
});

test('throws a RateLimitError on 429', async () => {
  const fetchImpl = fakeFetch({ error: { message: 'quota' } }, false);
  await expect(
    generateContent({ contents: [{ role: 'user', parts: [{ text: 'hi' }] }] }, fetchImpl)
  ).rejects.toThrow('rate limit');
});

test('throws error on non-ok response with status 400', async () => {
  const fetchImpl = fakeFetch({ error: { message: 'bad request' } }, false, 400);
  await expect(
    generateContent({ contents: [{ role: 'user', parts: [{ text: 'hi' }] }] }, fetchImpl)
  ).rejects.toThrow('Gemini request failed (400)');
});

test('returns null text and empty functionCalls for empty candidates', async () => {
  const fetchImpl = fakeFetch({ candidates: [] });
  const result = await generateContent({ contents: [{ role: 'user', parts: [{ text: 'hi' }] }] }, fetchImpl);
  expect(result).toEqual({ text: null, functionCalls: [] });
});

test('supports a multi-turn function-calling round trip (model functionCall + user functionResponse parts)', async () => {
  let capturedBody: unknown = null;
  const fetchImpl = (async (_url: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return {
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'Logged 500 kcal.' }] } }] }),
    } as Response;
  }) as unknown as typeof fetch;

  const result = await generateContent(
    {
      contents: [
        { role: 'user', parts: [{ text: 'i weigh 180' }] },
        { role: 'model', parts: [{ functionCall: { name: 'log_meal', args: { kcal: 500 } } }] },
        { role: 'user', parts: [{ functionResponse: { name: 'log_meal', response: { ok: true } } }] },
      ],
    },
    fetchImpl
  );

  expect(result).toEqual({ text: 'Logged 500 kcal.', functionCalls: [] });
  const sentParts = (capturedBody as { contents: { role: string; parts: unknown[] }[] }).contents;
  expect(sentParts[1].parts).toEqual([{ functionCall: { name: 'log_meal', args: { kcal: 500 } } }]);
  expect(sentParts[2].parts).toEqual([{ functionResponse: { name: 'log_meal', response: { ok: true } } }]);
});
