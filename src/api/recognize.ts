import { generateContent, GenerateContentResult } from './gemini';
import { MacroTotals, SflItem } from '../types';

export type RecognizedItem = {
  name: string;
  qty: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  flags: string[];
};
export type RecognitionResult = {
  items: RecognizedItem[];
  totals: MacroTotals;
  confidence: number;
  notes: string;
};

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          qty: { type: 'string' },
          kcal: { type: 'number' },
          proteinG: { type: 'number' },
          carbsG: { type: 'number' },
          fatG: { type: 'number' },
          flags: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'qty', 'kcal', 'proteinG', 'carbsG', 'fatG', 'flags'],
      },
    },
    totals: {
      type: 'object',
      properties: {
        kcal: { type: 'number' },
        proteinG: { type: 'number' },
        carbsG: { type: 'number' },
        fatG: { type: 'number' },
      },
      required: ['kcal', 'proteinG', 'carbsG', 'fatG'],
    },
    confidence: { type: 'number' },
    notes: { type: 'string' },
  },
  required: ['items', 'totals', 'confidence', 'notes'],
};

const SYSTEM_INSTRUCTION = `You identify food items in a photo and estimate calories and macros.
Resolution priority: (1) packaging/label data visible in the photo, (2) a matching Standard Food List entry provided below, (3) your own estimate.
Flag any of these autism-sensitivity triggers found in an item: gluten, casein, additives, high sugar, processed.
Respond only with JSON matching the provided schema.`;

function isRecognitionResult(value: unknown): value is RecognitionResult {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;

  // Check items
  if (!Array.isArray(obj.items)) return false;
  for (const item of obj.items) {
    if (typeof item !== 'object' || item === null) return false;
    const i = item as Record<string, unknown>;
    if (typeof i.name !== 'string') return false;
    if (typeof i.qty !== 'string') return false;
    if (typeof i.kcal !== 'number') return false;
    if (typeof i.proteinG !== 'number') return false;
    if (typeof i.carbsG !== 'number') return false;
    if (typeof i.fatG !== 'number') return false;
    if (!Array.isArray(i.flags)) return false;
  }

  // Check totals
  if (typeof obj.totals !== 'object' || obj.totals === null) return false;
  const totals = obj.totals as Record<string, unknown>;
  if (typeof totals.kcal !== 'number') return false;
  if (typeof totals.proteinG !== 'number') return false;
  if (typeof totals.carbsG !== 'number') return false;
  if (typeof totals.fatG !== 'number') return false;

  // Check confidence and notes
  if (typeof obj.confidence !== 'number') return false;
  if (typeof obj.notes !== 'string') return false;

  return true;
}

export async function recognizeMeal(
  photoBase64: string,
  sfl: SflItem[],
  deps?: { generate?: (params: Parameters<typeof generateContent>[0]) => Promise<GenerateContentResult> }
): Promise<RecognitionResult> {
  const generate = deps?.generate ?? generateContent;
  const sflContext = sfl.map((item) => `${item.name} (${item.serving}): ${item.kcal} kcal, P${item.proteinG} C${item.carbsG} F${item.fatG}`).join('\n');

  const result = await generate({
    contents: [
      {
        role: 'user',
        parts: [
          { text: `Standard Food List:\n${sflContext || '(empty)'}` },
          { inlineData: { mimeType: 'image/jpeg', data: photoBase64 } },
        ],
      },
    ],
    systemInstruction: SYSTEM_INSTRUCTION,
    responseSchema: RESPONSE_SCHEMA,
  });

  if (!result.text) throw new Error('Gemini returned no recognition text');
  try {
    const parsed = JSON.parse(result.text);
    if (!isRecognitionResult(parsed)) {
      throw new Error('Gemini returned malformed recognition JSON');
    }
    return parsed;
  } catch (err) {
    if (err instanceof Error && err.message === 'Gemini returned malformed recognition JSON') {
      throw err;
    }
    throw new Error('Gemini returned malformed recognition JSON');
  }
}
