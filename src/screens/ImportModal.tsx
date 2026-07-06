import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Field } from '../components/Field';
import { ModalShell } from '../components/ModalShell';
import { getRepos } from '../db';
import { parseSflMarkdown, parseWeightLog } from '../lib/importParser';
import { colors, fonts } from '../theme';

export function ImportModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const [weightPaste, setWeightPaste] = useState('');
  const [sflPaste, setSflPaste] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const weightEntries = parseWeightLog(weightPaste);
    const sflItems = parseSflMarkdown(sflPaste);

    if (weightEntries.length === 0 && sflItems.length === 0) {
      setFormError('Nothing parsed from either paste. Check the format and try again.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const repos = await getRepos();
      await Promise.all([
        ...weightEntries.map((entry) => repos.weights.upsert(entry.date, entry.lbs)),
        ...sflItems.map((item) => repos.sfl.upsert(item)),
      ]);
      setWeightPaste('');
      setSflPaste('');
      onSaved();
      onClose();
    } catch {
      setFormError('Could not import. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell visible={visible} title="IMPORT DATA" onClose={onClose} onSave={save} saveDisabled={saving} saveLabel={saving ? 'IMPORTING' : 'IMPORT'}>
      {formError && <Text style={styles.formError}>{formError}</Text>}
      <Field label="WEIGHT LOG PASTE" value={weightPaste} onChange={setWeightPaste} multiline numberOfLines={6} />
      <Field label="STANDARD FOOD LIST PASTE" value={sflPaste} onChange={setSflPaste} multiline numberOfLines={6} returnKeyType="done" />
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  formError: { color: colors.red, fontFamily: fonts.body, fontSize: 13, marginBottom: 12 },
});
