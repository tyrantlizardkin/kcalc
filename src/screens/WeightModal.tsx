import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Field } from '../components/Field';
import { ModalShell } from '../components/ModalShell';
import { getRepos } from '../db';
import { todayIso } from '../lib/dates';
import { colors, fonts } from '../theme';

export function WeightModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const [lbs, setLbs] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const value = parseFloat(lbs);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a weight greater than 0.');
      setFormError(null);
      return;
    }

    setSaving(true);
    setError(undefined);
    setFormError(null);
    try {
      const repos = await getRepos();
      await repos.weights.upsert(todayIso(), value);
      setLbs('');
      onSaved();
      onClose();
    } catch {
      setFormError('Could not save weight. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell visible={visible} title="TODAY'S WEIGHT" onClose={onClose} onSave={save} saveDisabled={saving} saveLabel={saving ? 'SAVING' : 'SAVE'}>
      {formError && <Text style={styles.formError}>{formError}</Text>}
      <Field label="WEIGHT (LBS)" value={lbs} onChange={setLbs} keyboardType="numeric" returnKeyType="done" error={error} />
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  formError: { color: colors.red, fontFamily: fonts.body, fontSize: 13, marginBottom: 12 },
});