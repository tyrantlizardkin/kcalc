import React, { useState } from 'react';
import { Field } from '../components/Field';
import { ModalShell } from '../components/ModalShell';
import { getRepos } from '../db';
import { todayIso } from '../lib/dates';

export function WeightModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const [lbs, setLbs] = useState('');

  const save = async () => {
    const value = parseFloat(lbs);
    if (!Number.isFinite(value) || value <= 0) {
      onClose();
      return;
    }
    const repos = await getRepos();
    await repos.weights.upsert(todayIso(), value);
    setLbs('');
    onSaved();
    onClose();
  };

  return (
    <ModalShell visible={visible} title="TODAY'S WEIGHT" onClose={onClose} onSave={save}>
      <Field label="WEIGHT (LBS)" value={lbs} onChange={setLbs} keyboardType="numeric" />
    </ModalShell>
  );
}