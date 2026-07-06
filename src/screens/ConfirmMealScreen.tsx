import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field } from '../components/Field';
import { ModalShell } from '../components/ModalShell';
import { recognizeMeal, RecognitionResult } from '../api/recognize';
import { getRepos } from '../db';
import { todayIso } from '../lib/dates';
import { colors, fonts } from '../theme';

type ConfirmErrors = Partial<Record<'kcal' | 'protein' | 'carbs' | 'fat', string>>;

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
  const [fieldErrors, setFieldErrors] = useState<ConfirmErrors>({});
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
    setFieldErrors({});
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
      setError(e instanceof Error && e.message.includes('rate limit') ? 'Gemini rate limit hit - try again shortly.' : 'Could not recognize photo. Try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runRecognition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    const parsed = parseFields();
    if (!parsed) return;

    setSaving(true);
    setError(null);
    try {
      const repos = await getRepos();
      await repos.meals.insert({
        date: todayIso(),
        name: name.trim() || 'Meal',
        detail: result?.notes ?? '',
        kcal: parsed.kcal,
        proteinG: parsed.proteinG,
        carbsG: parsed.carbsG,
        fatG: parsed.fatG,
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

  const parseFields = () => {
    const nextErrors: ConfirmErrors = {};
    const parsedKcal = parsePositiveInt(kcal);
    const parsedProtein = parseRequiredNonnegative(protein);
    const parsedCarbs = parseRequiredNonnegative(carbs);
    const parsedFat = parseRequiredNonnegative(fat);

    if (parsedKcal == null) nextErrors.kcal = 'Enter kcal greater than 0.';
    if (parsedProtein == null) nextErrors.protein = 'Use a number 0 or greater.';
    if (parsedCarbs == null) nextErrors.carbs = 'Use a number 0 or greater.';
    if (parsedFat == null) nextErrors.fat = 'Use a number 0 or greater.';

    setFieldErrors(nextErrors);
    setError(null);
    if (Object.keys(nextErrors).length > 0 || parsedKcal == null || parsedProtein == null || parsedCarbs == null || parsedFat == null) {
      return null;
    }

    return { kcal: parsedKcal, proteinG: parsedProtein, carbsG: parsedCarbs, fatG: parsedFat };
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
        <Field label="KCAL" value={kcal} onChange={setKcal} keyboardType="numeric" error={fieldErrors.kcal} />
        <Field label="PROTEIN (G)" value={protein} onChange={setProtein} keyboardType="numeric" error={fieldErrors.protein} />
        <Field label="CARBS (G)" value={carbs} onChange={setCarbs} keyboardType="numeric" error={fieldErrors.carbs} />
        <Field label="FAT (G)" value={fat} onChange={setFat} keyboardType="numeric" returnKeyType="done" error={fieldErrors.fat} />
      </ScrollView>
    </ModalShell>
  );
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseRequiredNonnegative(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.bgDark, padding: 24 },
  message: { color: colors.fg, fontFamily: fonts.body, fontSize: 14, textAlign: 'center' },
  retry: { color: colors.green, fontFamily: fonts.condensed, fontSize: 15, letterSpacing: 2, padding: 10 },
  formError: { color: colors.red, fontFamily: fonts.body, fontSize: 13, marginBottom: 12 },
});
