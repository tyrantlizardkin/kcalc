export type ParsedWeightEntry = { date: string; lbs: number };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function splitTableRow(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return [];
  const cells = trimmed.split('|').map((c) => c.trim());
  if (cells[0] === '') cells.shift();
  if (cells[cells.length - 1] === '') cells.pop();
  return cells;
}

export function parseWeightLog(markdown: string): ParsedWeightEntry[] {
  const entries: ParsedWeightEntry[] = [];
  for (const line of markdown.split('\n')) {
    const cells = splitTableRow(line);
    if (cells.length < 2) continue;
    const [dateCell, lbsCell] = cells;
    if (!DATE_RE.test(dateCell)) continue;
    const lbs = Number(lbsCell);
    if (!Number.isFinite(lbs) || lbs <= 0) continue;
    entries.push({ date: dateCell, lbs });
  }
  return entries;
}
