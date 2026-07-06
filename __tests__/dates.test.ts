import { todayIso, addDays, dateToLocalIso } from '../src/lib/dates';

test('todayIso returns local YYYY-MM-DD', () => {
  expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test('addDays crosses month and year boundaries', () => {
  expect(addDays('2026-07-05', -7)).toBe('2026-06-28');
  expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
});
test('dateToLocalIso formats a Date using local calendar fields', () => {
  expect(dateToLocalIso(new Date(2026, 6, 5, 23, 30))).toBe('2026-07-05');
});
