export type DaySummary = {
  eatenKcal: number;
  exerciseKcal: number;
  netKcal: number;
  remainingKcal: number;
  targetKcal: number;
  progress: number;
};

export function daySummary(eatenKcal: number, exerciseKcal: number, targetKcal: number): DaySummary {
  const netKcal = eatenKcal - exerciseKcal;
  return {
    eatenKcal,
    exerciseKcal,
    netKcal,
    remainingKcal: targetKcal - netKcal,
    targetKcal,
    progress: targetKcal <= 0 ? 0 : Math.min(1, Math.max(0, netKcal / targetKcal)),
  };
}