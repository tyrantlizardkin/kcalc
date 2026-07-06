import React, { useState } from 'react';
import { Field } from '../components/Field';
import { ModalShell } from '../components/ModalShell';
import { getRepos } from '../db';
import { todayIso } from '../lib/dates';

export function ManualMealModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const save = async () => {
    const repos = await getRepos();
    await repos.meals.insert({
      date: todayIso(),
      name: name.trim() || 'Meal',
      detail: detail.trim(),
      kcal: parseInt(kcal, 10) || 0,
      proteinG: parseFloat(protein) || 0,
      carbsG: parseFloat(carbs) || 0,
      fatG: parseFloat(fat) || 0,
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
    onSaved();
    onClose();
  };

  return (
    <ModalShell visible={visible} title="LOG A MEAL" onClose={onClose} onSave={save}>
      <Field label="NAME" value={name} onChange={setName} />
      <Field label="DETAIL" value={detail} onChange={setDetail} />
      <Field label="KCAL" value={kcal} onChange={setKcal} keyboardType="numeric" />
      <Field label="PROTEIN (G)" value={protein} onChange={setProtein} keyboardType="numeric" />
      <Field label="CARBS (G)" value={carbs} onChange={setCarbs} keyboardType="numeric" />
      <Field label="FAT (G)" value={fat} onChange={setFat} keyboardType="numeric" />
    </ModalShell>
  );
}