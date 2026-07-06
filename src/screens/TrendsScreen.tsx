import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { WeightChart } from '../components/WeightChart';
import { getRepos } from '../db';
import { weightDeltas, WeightDeltas } from '../lib/deltas';
import { colors, fonts } from '../theme';
import { Weight } from '../types';

type TrendsData = {
  weights: Weight[];
  deltas: WeightDeltas | null;
};

export function TrendsScreen({ reloadKey }: { reloadKey: number }) {
  const [data, setData] = useState<TrendsData | null>(null);
  const { width } = useWindowDimensions();

  const load = useCallback(async () => {
    const repos = await getRepos();
    const weights = await repos.weights.all();
    const latest = weights[weights.length - 1] ?? null;
    setData({
      weights,
      deltas: latest ? weightDeltas(weights, latest.date) : null,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  if (!data) return <View style={styles.root} />;

  const chartWidth = width - 36;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>WEIGHT TRENDS</Text>
        {data.weights.length === 0 ? (
          <Text style={styles.empty}>No weight entries yet.</Text>
        ) : (
          <WeightChart weights={data.weights} width={chartWidth} height={180} />
        )}
        {data.deltas && (
          <View style={styles.deltaRow}>
            <DeltaCard label="VS PRIOR" value={data.deltas.priorDelta} date={data.deltas.priorDate} />
            <DeltaCard label="VS 7 DAYS" value={data.deltas.sevenDayDelta} date={data.deltas.sevenDayDate} />
          </View>
        )}
        {data.deltas?.outlierInvolved && <Text style={styles.outlierNote}>⚠ outlier entry involved in one of these deltas</Text>}
      </ScrollView>
    </View>
  );
}

function DeltaCard({ label, value, date }: { label: string; value: number | null; date: string | null }) {
  return (
    <View style={styles.deltaCard}>
      <Text style={styles.deltaLabel}>{label}</Text>
      <Text style={styles.deltaValue}>{value == null ? '—' : `${value > 0 ? '+' : ''}${value} lbs`}</Text>
      <Text style={styles.deltaDate}>{date ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 18, paddingBottom: 40 },
  section: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 2, color: colors.muted, marginBottom: 12, paddingHorizontal: 4 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.comment, paddingHorizontal: 4 },
  deltaRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  deltaCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 12 },
  deltaLabel: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 1.5, color: colors.muted, marginBottom: 4 },
  deltaValue: { fontFamily: fonts.condensedBlack, fontSize: 20, color: colors.fg },
  deltaDate: { fontFamily: fonts.body, fontSize: 11, color: colors.comment, marginTop: 2 },
  outlierNote: { fontFamily: fonts.body, fontSize: 12, color: colors.orange, marginTop: 10 },
});
