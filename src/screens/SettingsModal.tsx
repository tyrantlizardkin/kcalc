import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { backupIfChanged, driveSignIn, driveSignOut, isDriveSignedIn } from '../api/drive';
import { Field } from '../components/Field';
import { ModalShell } from '../components/ModalShell';
import { getRepos } from '../db';
import { requestHealthPermissions, syncExercise } from '../health/healthConnect';
import { dumpAll } from '../lib/backup';
import { colors, fonts } from '../theme';

type SettingsErrors = Partial<Record<'kcalTarget' | 'protein' | 'carbs' | 'fat', string>>;

export function SettingsModal({
  visible,
  onClose,
  onSaved,
  onOpenImport,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  onOpenImport: () => void;
}) {
  const [kcalTarget, setKcalTarget] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastHcSyncMs, setLastHcSyncMs] = useState(0);
  const [hcStatus, setHcStatus] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [driveSignedIn, setDriveSignedIn] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<number | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);

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
        setLastHcSyncMs(s.lastHcSyncMs);
        setLastBackupAt(s.lastBackupAt);
      })
      .catch(() => {
        if (active) setFormError('Could not load settings. Close and try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    isDriveSignedIn().then((signedIn) => {
      if (active) setDriveSignedIn(signedIn);
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

  const syncNow = async () => {
    setSyncing(true);
    setHcStatus(null);
    try {
      const granted = await requestHealthPermissions();
      if (!granted) {
        setHcStatus('Health Connect permission not granted.');
        return;
      }
      const repos = await getRepos();
      const result = await syncExercise(repos);
      setLastHcSyncMs(Date.now());
      setHcStatus(`Synced ${result.inserted + result.updated} entr${result.inserted + result.updated === 1 ? 'y' : 'ies'}.`);
    } catch {
      setHcStatus('Sync failed. Manual and chat logging still work.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDriveSignIn = async () => {
    setBackupError(null);
    try {
      await driveSignIn();
      setDriveSignedIn(true);
    } catch {
      setBackupError('Google sign-in failed. Try again.');
    }
  };

  const handleDriveSignOut = async () => {
    await driveSignOut();
    setDriveSignedIn(false);
  };

  const handleBackupNow = async () => {
    setBackupBusy(true);
    setBackupError(null);
    try {
      const repos = await getRepos();
      await backupIfChanged(repos);
      const fresh = await repos.settings.getAll();
      setLastBackupAt(fresh.lastBackupAt);
    } catch {
      setBackupError('Backup failed. Will retry automatically.');
    } finally {
      setBackupBusy(false);
    }
  };

  const handleExport = async () => {
    setBackupError(null);
    try {
      const repos = await getRepos();
      const dump = await dumpAll(repos);
      const path = `${FileSystem.cacheDirectory}kcalc-export-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(dump, null, 2));
      await Sharing.shareAsync(path, { mimeType: 'application/json' });
    } catch {
      setBackupError('Export failed. Try again.');
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
      <Pressable
        accessibilityLabel="Import data"
        accessibilityRole="button"
        style={styles.importButton}
        onPress={() => {
          onClose();
          onOpenImport();
        }}
      >
        <Text style={styles.importButtonText}>IMPORT DATA</Text>
      </Pressable>
      <Text style={styles.section}>HEALTH CONNECT</Text>
      <Text style={styles.status}>
        {lastHcSyncMs > 0 ? `Last synced ${new Date(lastHcSyncMs).toLocaleString()}` : 'Never synced'}
      </Text>
      {hcStatus && <Text style={styles.formError}>{hcStatus}</Text>}
      <Pressable accessibilityLabel="Sync Health Connect now" accessibilityRole="button" style={styles.hcButton} disabled={syncing} onPress={syncNow}>
        <Text style={styles.hcButtonText}>{syncing ? 'SYNCING' : 'SYNC NOW'}</Text>
      </Pressable>
      <Text style={styles.section}>BACKUP</Text>
      {backupError && <Text style={styles.formError}>{backupError}</Text>}
      <Text style={styles.status}>
        {driveSignedIn
          ? lastBackupAt
            ? `Last backup: ${new Date(lastBackupAt).toLocaleString()}`
            : 'Signed in. No backup yet.'
          : 'Not signed in to Google Drive.'}
      </Text>
      <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={driveSignedIn ? handleDriveSignOut : handleDriveSignIn}>
        <Text style={styles.secondaryButtonText}>{driveSignedIn ? 'SIGN OUT' : 'SIGN IN TO GOOGLE DRIVE'}</Text>
      </Pressable>
      {driveSignedIn && (
        <Pressable accessibilityRole="button" disabled={backupBusy} style={styles.secondaryButton} onPress={handleBackupNow}>
          <Text style={styles.secondaryButtonText}>{backupBusy ? 'BACKING UP…' : 'BACK UP NOW'}</Text>
        </Pressable>
      )}
      <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={handleExport}>
        <Text style={styles.secondaryButtonText}>EXPORT DATA (JSON)</Text>
      </Pressable>
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
  importButton: { marginTop: 16, backgroundColor: colors.surface, borderRadius: 8, padding: 14, alignItems: 'center' },
  importButtonText: { fontFamily: fonts.condensed, fontSize: 14, color: colors.muted, letterSpacing: 2 },
  section: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 2, color: colors.muted, marginTop: 8, marginBottom: 8 },
  hcButton: { backgroundColor: colors.surface, borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 4 },
  hcButtonText: { fontFamily: fonts.condensed, fontSize: 14, color: colors.fg, letterSpacing: 2 },
  secondaryButton: { padding: 12, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', marginBottom: 8 },
  secondaryButtonText: { fontFamily: fonts.condensed, fontSize: 13, color: colors.fg, letterSpacing: 1.5 },
});