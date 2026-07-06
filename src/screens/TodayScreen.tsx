import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeroBlock } from '../components/HeroBlock';
import { MacroCard } from '../components/MacroCard';
import { MealCard } from '../components/MealCard';
import { WeightRow } from '../components/WeightRow';
import { getRepos } from '../db';
import { weightDeltas, WeightDeltas } from '../lib/deltas';
import { todayIso } from '../lib/dates';
import { daySummary, DaySummary } from '../lib/netCalc';
import { colors, fonts } from '../theme';
import { MacroTotals, Meal, Settings, Weight } from '../types';

const ACCENTS = [colors.orange, colors.cyan, colors.purple, colors.pink, colors.green];

type TodayData = {
  date: string;
  meals: Meal[];
  totals: MacroTotals;
  summary: DaySummary;
  settings: Settings;
  latest: Weight | null;
  deltas: WeightDeltas | null;
};

export function TodayScreen({
  onLogMeal,
  onAddWeight,
  onOpenSettings,
  reloadKey,
}: {
  onLogMeal: () => void;
  onAddWeight: () => void;
  onOpenSettings: () => void;
  reloadKey: number;
}) {
  const [data, setData] = useState<TodayData | null>(null);

  const load = useCallback(async () => {
    const repos = await getRepos();
    const date = todayIso();
    const [meals, totals, burned, settings, weights, latest] = await Promise.all([
      repos.meals.listByDate(date),
      repos.meals.totalsByDate(date),
      repos.exercise.burnByDate(date),
      repos.settings.getAll(),
      repos.weights.all(),
      repos.weights.latest(),
    ]);
    setData({
      date,
      meals,
      totals,
      settings,
      latest,
      deltas: latest ? weightDeltas(weights, latest.date) : null,
      summary: daySummary(totals.kcal, burned, settings.kcalTarget),
    });
  }, []);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  if (!data) return <View style={styles.root} />;

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.logo}>
            <Text style={{ color: colors.green }}>K</Text>CALC
          </Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>

        <View style={styles.todayRow}>
          <Pressable accessibilityLabel="Open settings" accessibilityRole="button" style={styles.gear} onPress={onOpenSettings}>
            <Text style={styles.gearIcon}>*</Text>
          </Pressable>
          <Text style={styles.todayLabel}>TODAY</Text>
        </View>

        <HeroBlock summary={data.summary} kcalTarget={data.settings.kcalTarget} />

        <View style={styles.macroRow}>
          <MacroCard label="Protein" value={data.totals.proteinG} target={data.settings.proteinTargetG} color={colors.pink} />
          <MacroCard label="Carbs" value={data.totals.carbsG} target={data.settings.carbsTargetG} color={colors.cyan} />
          <MacroCard label="Fat" value={data.totals.fatG} target={data.settings.fatTargetG} color={colors.orange} />
        </View>

        <WeightRow latest={data.latest} deltas={data.deltas} onAdd={onAddWeight} />

        <Text style={styles.section}>TODAY'S LOG</Text>
        <View style={styles.meals}>
          {data.meals.map((meal, i) => (
            <MealCard key={meal.id} meal={meal} accent={ACCENTS[i % ACCENTS.length]} />
          ))}
          {data.meals.length === 0 && <Text style={styles.empty}>Nothing logged yet.</Text>}
        </View>

        <Pressable accessibilityLabel="Log a meal" accessibilityRole="button" style={styles.logButton} onPress={onLogMeal}>
          <Text style={styles.logButtonText}>LOG A MEAL</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 18, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 },
  logo: { fontFamily: fonts.condensedBlack, fontSize: 24, color: colors.fg },
  date: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  gear: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(200,197,190,0.07)', alignItems: 'center', justifyContent: 'center' },
  gearIcon: { color: colors.muted, fontSize: 14 },
  todayLabel: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 3, color: colors.muted },
  macroRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  section: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 2, color: colors.muted, marginBottom: 12, paddingHorizontal: 4 },
  meals: { gap: 8 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.comment, paddingHorizontal: 4 },
  logButton: { marginTop: 12, backgroundColor: 'rgba(80,250,123,0.09)', borderWidth: 1, borderColor: 'rgba(80,250,123,0.22)', borderRadius: 8, padding: 15, alignItems: 'center' },
  logButtonText: { fontFamily: fonts.condensedBlack, fontSize: 17, color: colors.green, letterSpacing: 2 },
});