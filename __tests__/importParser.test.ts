import { parseWeightLog } from '../src/lib/importParser';

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
