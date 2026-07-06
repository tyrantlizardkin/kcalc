import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Field } from '../components/Field';
import { ModalShell } from '../components/ModalShell';
import { getRepos } from '../db';
import { todayIso } from '../lib/dates';
import { colors, fonts } from '../theme';

type MealErrors = Partial<Record<'kcal' | 'protein' | 'carbs' | 'fat', string>>;

export function ManualMealModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [errors, setErrors] = useState<MealErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const parsed = parseMeal();
    if (!parsed) return;

    setSaving(true);
    setFormError(null);
    try {
      const repos = await getRepos();
      await repos.meals.insert({
        date: todayIso(),
        name: name.trim() || 'Meal',
        detail: detail.trim(),
        kcal: parsed.kcal,
        proteinG: parsed.proteinG,
        carbsG: parsed.carbsG,
        fatG: parsed.fatG,
        flags: [],
        source: 'manual',
        photoUri: null,
      });
      setName('');
      setDetail('');
      setKcal('');
      setProtein('');
      setCarbs('');
      setFat('');
      setErrors({});
      onSaved();
      onClose();
    } catch {
      setFormError('Could not save meal. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const parseMeal = () => {
    const nextErrors: MealErrors = {};
    const parsedKcal = parsePositiveInt(kcal);
    const parsedProtein = parseOptionalNonnegative(protein);
    const parsedCarbs = parseOptionalNonnegative(carbs);
    const parsedFat = parseOptionalNonnegative(fat);

    if (parsedKcal == null) nextErrors.kcal = 'Enter kcal greater than 0.';
    if (parsedProtein == null) nextErrors.protein = 'Use a number 0 or greater.';
    if (parsedCarbs == null) nextErrors.carbs = 'Use a number 0 or greater.';
    if (parsedFat == null) nextErrors.fat = 'Use a number 0 or greater.';

    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0 || parsedKcal == null || parsedProtein == null || parsedCarbs == null || parsedFat == null) {
      return null;
    }

    return { kcal: parsedKcal, proteinG: parsedProtein, carbsG: parsedCarbs, fatG: parsedFat };
  };

  return (
    <ModalShell visible={visible} title="LOG A MEAL" onClose={onClose} onSave={save} saveDisabled={saving} saveLabel={saving ? 'SAVING' : 'SAVE'}>
      {formError && <Text style={styles.formError}>{formError}</Text>}
      <Field label="NAME" value={name} onChange={setName} />
      <Field label="DETAIL" value={detail} onChange={setDetail} />
      <Field label="KCAL" value={kcal} onChange={setKcal} keyboardType="numeric" error={errors.kcal} />
      <Field label="PROTEIN (G)" value={protein} onChange={setProtein} keyboardType="numeric" error={errors.protein} />
      <Field label="CARBS (G)" value={carbs} onChange={setCarbs} keyboardType="numeric" error={errors.carbs} />
      <Field label="FAT (G)" value={fat} onChange={setFat} keyboardType="numeric" returnKeyType="done" error={errors.fat} />
    </ModalShell>
  );
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseOptionalNonnegative(value: string): number | null {
  if (value.trim().length === 0) return 0;
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

const styles = StyleSheet.create({
  formError: { color: colors.red, fontFamily: fonts.body, fontSize: 13, marginBottom: 12 },
});