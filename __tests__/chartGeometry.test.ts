import { buildWeightChartData, toSvgPath } from '../src/lib/chartGeometry';
import { Weight } from '../src/types';

function w(date: string, lbs: number, flag: string | null = null): Weight {
  return { id: 0, date, lbs, flag, createdAt: 0 };
}

describe('buildWeightChartData', () => {
  test('empty input returns empty series', () => {
    const data = buildWeightChartData([], 300, 100, 20);
    expect(data).toEqual({ linePoints: [], maPoints: [], minLbs: 0, maxLbs: 0 });
  });

  test('single point centers on x and uses expanded range for y', () => {
    const data = buildWeightChartData([w('2026-07-01', 200)], 300, 100, 20);
    expect(data.minLbs).toBe(200);
    expect(data.maxLbs).toBe(201);
    expect(data.linePoints).toEqual([{ x: 150, y: 80 }]);
    expect(data.maPoints).toEqual([{ x: 150, y: 80 }]);
  });

  test('two points scale line and MA series with inverted y-axis', () => {
    const weights = [w('2026-06-25', 210), w('2026-07-01', 200)];
    const data = buildWeightChartData(weights, 300, 100, 20);
    expect(data.minLbs).toBe(200);
    expect(data.maxLbs).toBe(210);
    expect(data.linePoints).toEqual([
      { x: 20, y: 20 },
      { x: 280, y: 80 },
    ]);
    expect(data.maPoints).toEqual([
      { x: 20, y: 20 },
      { x: 280, y: 50 },
    ]);
  });
});

describe('toSvgPath', () => {
  test('empty points returns empty string', () => {
    expect(toSvgPath([])).toBe('');
  });

  test('single point returns a moveto only', () => {
    expect(toSvgPath([{ x: 150, y: 80 }])).toBe('M 150 80');
  });

  test('multiple points returns moveto plus linetos', () => {
    const path = toSvgPath([
      { x: 20, y: 20 },
      { x: 280, y: 80 },
    ]);
    expect(path).toBe('M 20 20 L 280 80');
  });
});
