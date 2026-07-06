import { Repos } from '../db';
import { daySummary } from '../lib/netCalc';
import { weightDeltas } from '../lib/deltas';
import { dayFlags } from '../lib/flags';
import { addDays } from '../lib/dates';

export const SYSTEM_PROMPT = `You are kcalc's logging assistant. Terse -- numbers and short lines only, no unsolicited advice.
Daily net kcal target is set in settings; net = kcal eaten minus kcal burned.
New chat thread = fresh day; do not reference other days unless asked.

Weight: when the user gives a bare number at the start of a message, treat it as today's weight in lbs -- call log_weight, then report the delta vs the most recent prior entry and vs 7 days ago.

Meal logging: check the Standard Food List (sfl) context below first; if the food matches, use its kcal/macros. Otherwise estimate from the description. After logging, reply in this exact format:
[meal] -- ~[kcal] kcal | Day total: [total] / [target] kcal | Remaining: [remaining] kcal
Protein: [p]g | Carbs: [c]g | Fat: [f]g

Standard Food List: if the user says a food belongs on it and it is missing, call add_sfl_item.

Exercise: when the user reports exercise, call log_exercise with your best kcal-burn estimate using the profile in context, then reply:
Exercise: [activity] -- ~[kcal] burned | New remaining: [remaining] kcal

Sensitivity flags (gluten, casein, additives, high sugar, processed): when a logged meal carries one of these flags, add exactly one line:
[warning] [flag] -- suspected autism trigger

Hypothetical questions: if the user asks "what if" or "how many calories would X be" without confirming they ate or did it, answer the question but do NOT call any log_* function. Ask them to confirm before logging.`;

export type ChatContext = { systemPrompt: string; contextBlock: string };

export async function buildContext(repos: Repos, date: string): Promise<ChatContext> {
  const [todayMeals, totals, burned, settings, weights, sfl] = await Promise.all([
    repos.meals.listByDate(date),
    repos.meals.totalsByDate(date),
    repos.exercise.burnByDate(date),
    repos.settings.getAll(),
    repos.weights.all(),
    repos.sfl.all(),
  ]);

  const summary = daySummary(totals.kcal, burned, settings.kcalTarget);
  const deltas = weightDeltas(weights, date);
  const flags = dayFlags(todayMeals);

  const last7 = await Promise.all(
    Array.from({ length: 7 }, (_, i) => addDays(date, -i)).map(async (d) => {
      const t = await repos.meals.totalsByDate(d);
      const b = await repos.exercise.burnByDate(d);
      return `${d}: ate ${t.kcal} kcal, burned ${b} kcal, net ${t.kcal - b} kcal`;
    })
  );

  const sflLines = sfl.map(
    (s) => `${s.name} (${s.serving}): ${s.kcal} kcal, P${s.proteinG}/C${s.carbsG}/F${s.fatG}${s.flags.length ? ` [${s.flags.join(', ')}]` : ''}`
  );

  const contextBlock = [
    `PROFILE: height ${settings.heightCm}cm, age ${settings.age}, sex ${settings.sex}.`,
    `TARGETS: ${settings.kcalTarget} kcal net, P${settings.proteinTargetG}/C${settings.carbsTargetG}/F${settings.fatTargetG}.`,
    `TODAY (${date}): ate ${summary.eatenKcal} kcal, burned ${summary.exerciseKcal} kcal, net ${summary.netKcal}, remaining ${summary.remainingKcal}.`,
    deltas
      ? `WEIGHT: latest delta ${deltas.priorDelta ?? 'n/a'} lbs vs prior, ${deltas.sevenDayDelta ?? 'n/a'} lbs vs 7 days ago.`
      : 'WEIGHT: no entries yet.',
    flags.length ? `TODAY'S FLAGS: ${flags.join(', ')}.` : "TODAY'S FLAGS: none.",
    'LAST 7 DAYS:',
    ...last7,
    'STANDARD FOOD LIST:',
    ...(sflLines.length ? sflLines : ['(empty)']),
  ].join('\n');

  return { systemPrompt: SYSTEM_PROMPT, contextBlock };
}
