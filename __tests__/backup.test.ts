import { stableStringify } from '../src/lib/backup';

test('stableStringify produces identical output regardless of key insertion order', () => {
  const a = { b: 2, a: 1, nested: { y: 1, x: 2 } };
  const b = { a: 1, nested: { x: 2, y: 1 }, b: 2 };
  expect(stableStringify(a)).toBe(stableStringify(b));
});

test('stableStringify preserves array order', () => {
  expect(stableStringify({ items: [3, 1, 2] })).toBe('{"items":[3,1,2]}');
});
