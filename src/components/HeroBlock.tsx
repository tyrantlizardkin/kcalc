import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DaySummary } from '../lib/netCalc';
import { colors, fonts } from '../theme';

export function HeroBlock({ summary, kcalTarget }: { summary: DaySummary; kcalTarget: number }) {
  const pct = Math.round(summary.progress * 100);
  return (
    <View style={styles.wrap}>
      <View style={styles.ring}>
        <View style={[styles.ringFill, { opacity: 0.24 + summary.progress * 0.5 }]} />
        <Text style={styles.kcal}>{summary.eatenKcal}</Text>
        <Text style={styles.kcalLabel}>KCAL EATEN</Text>
      </View>
      <Text style={styles.subline}>
        net {summary.netKcal} / {kcalTarget} - {summary.remainingKcal} left
      </Text>
      <View style={styles.track}>
        <View style={[styles.bar, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 18 },
  ring: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 2,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ringFill: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.green },
  kcal: { fontFamily: fonts.condensedBlack, fontSize: 78, color: colors.fg, lineHeight: 82 },
  kcalLabel: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 2, color: colors.muted },
  subline: { marginTop: 12, color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  track: { marginTop: 10, height: 6, width: '86%', borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.green },
});