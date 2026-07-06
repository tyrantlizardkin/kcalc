import React, { useEffect, useState } from 'react';
import { Field } from '../components/Field';
import { ModalShell } from '../components/ModalShell';
import { getRepos } from '../db';

export function SettingsModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const [kcalTarget, setKcalTarget] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  useEffect(() => {
    if (!visible) return;
    getRepos().then(async (repos) => {
      const s = await repos.settings.getAll();
      setKcalTarget(String(s.kcalTarget));
      setProtein(String(s.proteinTargetG));
      setCarbs(String(s.carbsTargetG));
      setFat(String(s.fatTargetG));
    });
  }, [visible]);

  const save = async () => {
    const repos = await getRepos();
    await repos.settings.set({
      kcalTarget: parseInt(kcalTarget, 10) || 1500,
      proteinTargetG: parseFloat(protein) || 0,
      carbsTargetG: parseFloat(carbs) || 0,
      fatTargetG: parseFloat(fat) || 0,
    });
    onSaved();
    onClose();
  };

  return (
    <ModalShell visible={visible} title="SETTINGS" onClose={onClose} onSave={save}>
      <Field label="DAILY NET KCAL TARGET" value={kcalTarget} onChange={setKcalTarget} keyboardType="numeric" />
      <Field label="PROTEIN TARGET (G)" value={protein} onChange={setProtein} keyboardType="numeric" />
      <Field label="CARBS TARGET (G)" value={carbs} onChange={setCarbs} keyboardType="numeric" />
      <Field label="FAT TARGET (G)" value={fat} onChange={setFat} keyboardType="numeric" />
    </ModalShell>
  );
}