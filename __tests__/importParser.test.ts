import { parseWeightLog, parseSflMarkdown } from '../src/lib/importParser';

const WEIGHT_LOG_FIXTURE = `
| Date | Weight (lbs) | Δ Yesterday | Δ 7 Days Ago |
|---|---|---|---|
| 2026-07-01 | 338.0 | -0.3 | -1.2 |
| 2026-07-03 | 337.8 | -0.2 | -1.0 |
Some stray commentary line that isn't a table row.
| not-a-date | garbage |
`;

describe('parseWeightLog', () => {
  test('parses valid rows and skips header, separator, and malformed rows', () => {
    expect(parseWeightLog(WEIGHT_LOG_FIXTURE)).toEqual([
      { date: '2026-07-01', lbs: 338.0 },
      { date: '2026-07-03', lbs: 337.8 },
    ]);
  });

  test('empty input returns empty array', () => {
    expect(parseWeightLog('')).toEqual([]);
  });
});

const SFL_FIXTURE = `
| Food | Serving | Kcal | Protein (g) | Carbs (g) | Fat (g) | Flags |
|---|---|---|---|---|---|---|
| Chicken breast, grilled | 6 oz | 280 | 53 | 0 | 6 | |
| Bread, sourdough | 1 slice | 120 | 4 | 22 | 1 | gluten |
| broken row | oops |
`;

describe('parseSflMarkdown', () => {
  test('parses valid rows and skips header, separator, and malformed rows', () => {
    expect(parseSflMarkdown(SFL_FIXTURE)).toEqual([
      { name: 'Chicken breast, grilled', serving: '6 oz', kcal: 280, proteinG: 53, carbsG: 0, fatG: 6, flags: [] },
      { name: 'Bread, sourdough', serving: '1 slice', kcal: 120, proteinG: 4, carbsG: 22, fatG: 1, flags: ['gluten'] },
    ]);
  });

  test('empty input returns empty array', () => {
    expect(parseSflMarkdown('')).toEqual([]);
  });
});
