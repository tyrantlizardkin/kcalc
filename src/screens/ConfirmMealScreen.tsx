import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field } from '../components/Field';
import { ModalShell } from '../components/ModalShell';
import { recognizeMeal, RecognitionResult } from '../api/recognize';
import { getRepos } from '../db';
import { todayIso } from '../lib/dates';
import { colors, fonts } from '../theme';

export function ConfirmMealScreen({
  photoBase64,
  photoUri,
  onSaved,
  onCancel,
}: {
  photoBase64: string;
  photoUri: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const runRecognition = async () => {
    setLoading(true);
    setError(null);
    try {
      const repos = await getRepos();
      const sfl = await repos.sfl.all();
      const recognition = await recognizeMeal(photoBase64, sfl);
      setResult(recognition);
      setName(recognition.items.map((i) => i.name).join(', '));
      setKcal(String(recognition.totals.kcal));
      setProtein(String(recognition.totals.proteinG));
      setCarbs(String(recognition.totals.carbsG));
      setFat(String(recognition.totals.fatG));
    } catch (e) {
      setError(e instanceof Error && e.message.includes('rate limit') ? 'Gemini rate limit hit — try again shortly.' : 'Could not recognize photo. Try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runRecognition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const repos = await getRepos();
      await repos.meals.insert({
        date: todayIso(),
        name: name.trim() || 'Meal',
        detail: result?.notes ?? '',
        kcal: Number(kcal) || 0,
        proteinG: Number(protein) || 0,
        carbsG: Number(carbs) || 0,
        fatG: Number(fat) || 0,
        flags: Array.from(new Set(result?.items.flatMap((i) => i.flags) ?? [])),
        source: 'photo',
        photoUri,
      });
      onSaved();
    } catch {
      setError('Could not save meal. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} />
        <Text style={styles.message}>Recognizing photo...</Text>
      </View>
    );
  }

  if (error && !result) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{error}</Text>
        <Text style={styles.retry} onPress={runRecognition}>
          RETRY
        </Text>
        <Text style={styles.retry} onPress={onCancel}>
          CANCEL
        </Text>
      </View>
    );
  }

  return (
    <ModalShell visible title="CONFIRM MEAL" onClose={onCancel} onSave={save} saveDisabled={saving} saveLabel={saving ? 'SAVING' : 'SAVE'}>
      <ScrollView>
        {error && <Text style={styles.formError}>{error}</Text>}
        <Field label="NAME" value={name} onChange={setName} />
        <Field label="KCAL" value={kcal} onChange={setKcal} keyboardType="numeric" />
        <Field label="PROTEIN (G)" value={protein} onChange={setProtein} keyboardType="numeric" />
        <Field label="CARBS (G)" value={carbs} onChange={setCarbs} keyboardType="numeric" />
        <Field label="FAT (G)" value={fat} onChange={setFat} keyboardType="numeric" returnKeyType="done" />
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.bgDark, padding: 24 },
  message: { color: colors.fg, fontFamily: fonts.body, fontSize: 14, textAlign: 'center' },
  retry: { color: colors.green, fontFamily: fonts.condensed, fontSize: 15, letterSpacing: 2, padding: 10 },
  formError: { color: colors.red, fontFamily: fonts.body, fontSize: 13, marginBottom: 12 },
});
