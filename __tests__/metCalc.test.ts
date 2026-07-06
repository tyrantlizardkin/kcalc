import { estimateKcalBurned } from '../src/lib/metCalc';

test('known activity uses its MET table value', () => {
  expect(estimateKcalBurned('walking', 30, 154)).toBe(128);
});

test('unrecognized activity falls back to the default MET value', () => {
  expect(estimateKcalBurned('juggling', 45, 180)).toBe(257);
});

test('explicit met overrides the table lookup', () => {
  expect(estimateKcalBurned('rowing', 20, 200, 7)).toBe(222);
});

test('activity name matching is case-insensitive and trims whitespace', () => {
  expect(estimateKcalBurned('  Walking  ', 30, 154)).toBe(128);
});
