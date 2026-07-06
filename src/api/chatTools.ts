import { Repos } from '../db';
import { FunctionDeclaration } from './gemini';
import { daySummary } from '../lib/netCalc';
import { weightDeltas } from '../lib/deltas';

export type ToolHandler = (args: Record<string, unknown>, repos: Repos, date: string) => Promise<Record<string, unknown>>;

export const CHAT_FUNCTIONS: FunctionDeclaration[] = [
  {
    name: 'log_meal',
    description: 'Log a meal for the given date (defaults to the current chat day) with kcal and macros.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        detail: { type: 'string' },
        kcal: { type: 'number' },
        proteinG: { type: 'number' },
        carbsG: { type: 'number' },
        fatG: { type: 'number' },
        flags: { type: 'array', items: { type: 'string' } },
        date: { type: 'string', description: 'YYYY-MM-DD, defaults to current chat day' },
      },
      required: ['name', 'kcal', 'proteinG', 'carbsG', 'fatG'],
    },
  },
  {
    name: 'log_weight',
    description: 'Log or update the weight in lbs for a date, defaults to today.',
    parameters: {
      type: 'object',
      properties: {
        lbs: { type: 'number' },
        date: { type: 'string' },
        flag: { type: 'string', enum: ['outlier'] },
      },
      required: ['lbs'],
    },
  },
  {
    name: 'log_exercise',
    description: 'Log an exercise burn for a date, defaults to today.',
    parameters: {
      type: 'object',
      properties: {
        activity: { type: 'string' },
        kcalBurned: { type: 'number' },
        date: { type: 'string' },
      },
      required: ['activity', 'kcalBurned'],
    },
  },
  {
    name: 'add_sfl_item',
    description: 'Add or update a Standard Food List item.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        serving: { type: 'string' },
        kcal: { type: 'number' },
        proteinG: { type: 'number' },
        carbsG: { type: 'number' },
        fatG: { type: 'number' },
        flags: { type: 'array', items: { type: 'string' } },
      },
      required: ['name', 'kcal'],
    },
  },
  {
    name: 'update_entry',
    description: 'Update an existing meal, exercise, or weight entry.',
    parameters: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['meal', 'exercise', 'weight'] },
        id: { type: 'number', description: 'Required for kind meal or exercise' },
        date: { type: 'string', description: 'Required for kind weight' },
        patch: { type: 'object' },
      },
      required: ['kind', 'patch'],
    },
  },
  {
    name: 'query_log',
    description: "Get a day's meals, exercise, and weight entry.",
    parameters: { type: 'object', properties: { date: { type: 'string' } } },
  },
  {
    name: 'get_today_summary',
    description: 'Get the net kcal summary and weight deltas for the current chat day.',
    parameters: { type: 'object', properties: {} },
  },
];

export const TOOL_HANDLERS: Record<string, ToolHandler> = {
  async log_meal(args, repos, date) {
    const id = await repos.meals.insert({
      date: (args.date as string | undefined) ?? date,
      name: args.name as string,
      detail: (args.detail as string | undefined) ?? '',
      kcal: args.kcal as number,
      proteinG: args.proteinG as number,
      carbsG: args.carbsG as number,
      fatG: args.fatG as number,
      flags: (args.flags as string[] | undefined) ?? [],
      source: 'chat',
      photoUri: null,
    });
    return { id };
  },
  async log_weight(args, repos, date) {
    const targetDate = (args.date as string | undefined) ?? date;
    await repos.weights.upsert(targetDate, args.lbs as number, (args.flag as string | undefined) ?? null);
    return { date: targetDate, lbs: args.lbs };
  },
  async log_exercise(args, repos, date) {
    const id = await repos.exercise.insert({
      date: (args.date as string | undefined) ?? date,
      activity: args.activity as string,
      kcalBurned: args.kcalBurned as number,
      source: 'chat',
      hcRecordId: null,
    });
    return { id };
  },
  async add_sfl_item(args, repos) {
    await repos.sfl.upsert({
      name: args.name as string,
      serving: (args.serving as string | undefined) ?? '',
      kcal: args.kcal as number,
      proteinG: (args.proteinG as number | undefined) ?? 0,
      carbsG: (args.carbsG as number | undefined) ?? 0,
      fatG: (args.fatG as number | undefined) ?? 0,
      flags: (args.flags as string[] | undefined) ?? [],
    });
    return { name: args.name };
  },
  async update_entry(args, repos, date) {
    const kind = args.kind as string;
    const patch = (args.patch as Record<string, unknown>) ?? {};
    if (kind === 'meal' || kind === 'exercise') {
      if (typeof args.id !== 'number') {
        throw new Error('update_entry requires a numeric id for kind meal/exercise');
      }
      if (kind === 'meal') {
        await repos.meals.update(args.id, patch);
      } else {
        await repos.exercise.update(args.id, patch);
      }
      return { ok: true };
    }
    if (kind === 'weight') {
      const targetDate = (args.date as string | undefined) ?? date;
      const existing = await repos.weights.byDate(targetDate);
      const lbs = (patch.lbs as number | undefined) ?? existing?.lbs;
      if (lbs === undefined) {
        throw new Error('update_entry: no existing weight entry and no lbs provided in patch');
      }
      const flag = (patch.flag as string | undefined) ?? existing?.flag ?? null;
      await repos.weights.upsert(targetDate, lbs, flag);
      return { ok: true };
    }
    throw new Error(`Unknown update_entry kind: ${kind}`);
  },
  async query_log(args, repos, date) {
    const targetDate = (args.date as string | undefined) ?? date;
    const [meals, exercise, weight] = await Promise.all([
      repos.meals.listByDate(targetDate),
      repos.exercise.listByDate(targetDate),
      repos.weights.byDate(targetDate),
    ]);
    return { date: targetDate, meals, exercise, weight };
  },
  async get_today_summary(_args, repos, date) {
    const [totals, burned, settings, weights] = await Promise.all([
      repos.meals.totalsByDate(date),
      repos.exercise.burnByDate(date),
      repos.settings.getAll(),
      repos.weights.all(),
    ]);
    const latest = weights.length > 0 ? weights[weights.length - 1] : null;
    return {
      summary: daySummary(totals.kcal, burned, settings.kcalTarget),
      deltas: latest ? weightDeltas(weights, latest.date) : null,
    };
  },
};
