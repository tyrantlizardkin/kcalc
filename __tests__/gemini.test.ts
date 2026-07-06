import { generateContent } from '../src/api/gemini';

function fakeFetch(body: unknown, ok = true): typeof fetch {
  return (async () =>
    ({
      ok,
      status: ok ? 200 : 429,
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
