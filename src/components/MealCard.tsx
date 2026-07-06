import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Meal } from '../types';
import { colors, fonts } from '../theme';

export function MealCard({ meal, accent }: { meal: Meal; accent: string }) {
  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <View style={styles.topline}>
          <Text style={styles.name} numberOfLines={1}>{meal.name}</Text>
          <Text style={styles.kcal}>{meal.kcal}</Text>
        </View>
        {meal.detail.length > 0 && <Text style={styles.detail} numberOfLines={2}>{meal.detail}</Text>}
        <Text style={styles.macros}>{Math.round(meal.proteinG)}p - {Math.round(meal.carbsG)}c - {Math.round(meal.fatG)}f</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: colors.bgDark, borderRadius: 8, overflow: 'hidden', minHeight: 74 },
  accent: { width: 5 },
  body: { flex: 1, padding: 12 },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { flex: 1, color: colors.fg, fontFamily: fonts.bodyBold, fontSize: 14 },
  kcal: { color: colors.green, fontFamily: fonts.condensedBlack, fontSize: 24, lineHeight: 26 },
  detail: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, marginTop: 3 },
  macros: { color: colors.comment, fontFamily: fonts.bodySemi, fontSize: 11, marginTop: 6 },
});