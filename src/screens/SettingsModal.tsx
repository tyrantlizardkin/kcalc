import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Field } from '../components/Field';
import { ModalShell } from '../components/ModalShell';
import { getRepos } from '../db';
import { colors, fonts } from '../theme';

type SettingsErrors = Partial<Record<'kcalTarget' | 'protein' | 'carbs' | 'fat', string>>;

export function SettingsModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const [kcalTarget, setKcalTarget] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let active = true;

    setLoading(true);
    setFormError(null);
    setErrors({});
    getRepos()
      .then(async (repos) => repos.settings.getAll())
      .then((s) => {
        if (!active) return;
        setKcalTarget(String(s.kcalTarget));
        setProtein(String(s.proteinTargetG));
        setCarbs(String(s.carbsTargetG));
        setFat(String(s.fatTargetG));
      })
      .catch(() => {
        if (active) setFormError('Could not load settings. Close and try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [visible]);

  const save = async () => {
    const parsed = parseSettings();
    if (!parsed) return;

    setSaving(true);
    setFormError(null);
    try {
      const repos = await getRepos();
      await repos.settings.set(parsed);
      onSaved();
      onClose();
    } catch {
      setFormError('Could not save settings. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const parseSettings = () => {
    const nextErrors: SettingsErrors = {};
    const parsedKcal = parsePositiveInt(kcalTarget);
    const parsedProtein = parseNonnegative(protein);
    const parsedCarbs = parseNonnegative(carbs);
    const parsedFat = parseNonnegative(fat);

    if (parsedKcal == null) nextErrors.kcalTarget = 'Enter a target greater than 0.';
    if (parsedProtein == null) nextErrors.protein = 'Use a number 0 or greater.';
    if (parsedCarbs == null) nextErrors.carbs = 'Use a number 0 or greater.';
    if (parsedFat == null) nextErrors.fat = 'Use a number 0 or greater.';

    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0 || parsedKcal == null || parsedProtein == null || parsedCarbs == null || parsedFat == null) {
      return null;
    }

    return {
      kcalTarget: parsedKcal,
      proteinTargetG: parsedProtein,
      carbsTargetG: parsedCarbs,
      fatTargetG: parsedFat,
    };
  };

  const disabled = loading || saving || Boolean(formError && !kcalTarget);

  return (
    <ModalShell
      visible={visible}
      title="SETTINGS"
      onClose={onClose}
      onSave={save}
      saveDisabled={disabled}
      saveLabel={saving ? 'SAVING' : 'SAVE'}
    >
      {loading && <Text style={styles.status}>Loading settings...</Text>}
      {formError && <Text style={styles.formError}>{formError}</Text>}
      <Field label="DAILY NET KCAL TARGET" value={kcalTarget} onChange={setKcalTarget} keyboardType="numeric" error={errors.kcalTarget} />
      <Field label="PROTEIN TARGET (G)" value={protein} onChange={setProtein} keyboardType="numeric" error={errors.protein} />
      <Field label="CARBS TARGET (G)" value={carbs} onChange={setCarbs} keyboardType="numeric" error={errors.carbs} />
      <Field label="FAT TARGET (G)" value={fat} onChange={setFat} keyboardType="numeric" returnKeyType="done" error={errors.fat} />
    </ModalShell>
  );
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseNonnegative(value: string): number | null {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

const styles = StyleSheet.create({
  status: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginBottom: 12 },
  formError: { color: colors.red, fontFamily: fonts.body, fontSize: 13, marginBottom: 12 },
});