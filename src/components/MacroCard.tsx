import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

export function MacroCard({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = target <= 0 ? 0 : Math.min(100, Math.round((value / target) * 100));
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{Math.round(value)}g</Text>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.bar, { backgroundColor: color, width: `${pct}%` }]} />
      </View>
      <Text style={styles.target}>/{target}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.bgDark, borderRadius: 8, padding: 12, minHeight: 112 },
  value: { fontFamily: fonts.condensedBlack, fontSize: 28, color: colors.fg, lineHeight: 32 },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted, marginTop: 2 },
  track: { marginTop: 12, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' },
  bar: { height: 5, borderRadius: 3 },
  target: { fontFamily: fonts.body, fontSize: 11, color: colors.comment, marginTop: 7 },
});