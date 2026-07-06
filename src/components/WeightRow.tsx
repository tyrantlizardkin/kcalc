import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WeightDeltas } from '../lib/deltas';
import { colors, fonts } from '../theme';
import { Weight } from '../types';

export function WeightRow({ latest, deltas, onAdd }: { latest: Weight | null; deltas: WeightDeltas | null; onAdd: () => void }) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.label}>WEIGHT</Text>
        <Text style={styles.value}>{latest ? `${latest.lbs.toFixed(1)} lb` : '--'}</Text>
        <Text style={styles.delta}>{formatDelta(deltas?.priorDelta)} prior - {formatDelta(deltas?.sevenDayDelta)} 7d</Text>
      </View>
      <Pressable style={styles.add} onPress={onAdd}>
        <Text style={styles.addText}>+</Text>
      </Pressable>
    </View>
  );
}

function formatDelta(delta: number | null | undefined): string {
  if (delta == null) return '--';
  return delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgDark,
    borderRadius: 8,
    padding: 14,
    marginBottom: 18,
  },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 2, color: colors.muted },
  value: { fontFamily: fonts.condensedBlack, fontSize: 30, color: colors.fg, marginTop: 2 },
  delta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 3 },
  add: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(80,250,123,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(80,250,123,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: colors.green, fontSize: 24, lineHeight: 28, fontFamily: fonts.condensedBold },
});