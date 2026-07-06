import { recognizeMeal } from '../src/api/recognize';
import { SflItem } from '../src/types';

const sfl: SflItem[] = [
  { id: 1, name: 'Oatmeal (1 cup)', serving: '1 cup', kcal: 150, proteinG: 5, carbsG: 27, fatG: 3, flags: [] },
];

test('recognizeMeal returns items and totals from a mocked Gemini response', async () => {
  const fixture = {
    items: [{ name: 'Oatmeal', qty: '1 cup', kcal: 150, proteinG: 5, carbsG: 27, fatG: 3, flags: [] }],
    totals: { kcal: 150, proteinG: 5, carbsG: 27, fatG: 3 },
    confidence: 0.9,
    notes: 'Matched sfl entry.',
  };
  const generate = jest.fn().mockResolvedValue({ text: JSON.stringify(fixture), functionCalls: [] });

  const result = await recognizeMeal('base64photo', sfl, { generate });

  expect(result).toEqual(fixture);
  expect(generate).toHaveBeenCalledTimes(1);
  const call = generate.mock.calls[0][0];
  expect(call.contents[0].parts).toEqual(
    expect.arrayContaining([expect.objectContaining({ inlineData: expect.objectContaining({ mimeType: 'image/jpeg' }) })])
  );
  expect(call.responseSchema).toBeDefined();
});

test('recognizeMeal throws on malformed JSON text', async () => {
  const generate = jest.fn().mockResolvedValue({ text: 'not json', functionCalls: [] });
  await expect(recognizeMeal('base64photo', sfl, { generate })).rejects.toThrow();
});
