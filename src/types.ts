export type Weight = {
  id: number;
  date: string;
  lbs: number;
  flag: string | null;
  createdAt: number;
};

export type MealSource = 'photo' | 'chat' | 'manual' | 'sfl';

export type Meal = {
  id: number;
  date: string;
  name: string;
  detail: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  flags: string[];
  source: MealSource;
  photoUri: string | null;
  createdAt: number;
};
export type NewMeal = Omit<Meal, 'id' | 'createdAt'>;

export type ExerciseSource = 'healthconnect' | 'chat' | 'manual';

export type ExerciseEntry = {
  id: number;
  date: string;
  activity: string;
  kcalBurned: number;
  source: ExerciseSource;
  hcRecordId: string | null;
  createdAt: number;
};
export type NewExercise = Omit<ExerciseEntry, 'id' | 'createdAt'>;

export type SflItem = {
  id: number;
  name: string;
  serving: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  flags: string[];
};
export type NewSflItem = Omit<SflItem, 'id'>;

export type ChatMessage = {
  id: number;
  date: string;
  role: 'user' | 'model';
  content: string;
  createdAt: number;
};

export type MacroTotals = { kcal: number; proteinG: number; carbsG: number; fatG: number };

export type Settings = {
  kcalTarget: number;
  proteinTargetG: number;
  carbsTargetG: number;
  fatTargetG: number;
  heightCm: number;
  age: number;
  sex: 'male' | 'female';
  lastHcSyncMs: number;
};