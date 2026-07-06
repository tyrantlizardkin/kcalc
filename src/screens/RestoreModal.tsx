import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { ModalShell } from '../components/ModalShell';
import { DriveBackupFile, listBackups, restoreBackup } from '../api/drive';
import { getDb, getRepos } from '../db';
import { colors, fonts } from '../theme';

export function RestoreModal({ visible, onClose, onRestored }: { visible: boolean; onClose: () => void; onRestored: () => void }) {
  const [files, setFiles] = useState<DriveBackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setError(null);
    listBackups()
      .then(setFiles)
      .catch(() => setError('Could not load backups from Drive.'))
      .finally(() => setLoading(false));
  }, [visible]);

  const confirmAndRestore = (file: DriveBackupFile) => {
    Alert.alert(
      'Replace all local data?',
      `This restores "${file.name}" and permanently deletes everything currently on this device. This cannot be undone.`,
      [
        { text: 'CANCEL', style: 'cancel' },
        { text: 'REPLACE', style: 'destructive', onPress: () => runRestore(file) },
      ]
    );
  };

  const runRestore = async (file: DriveBackupFile) => {
    setRestoring(true);
    setError(null);
    try {
      const [repos, db] = await Promise.all([getRepos(), getDb()]);
      await restoreBackup(file.id, repos, db);
      onRestored();
      onClose();
    } catch {
      setError('Restore failed. Local data was not modified.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <ModalShell visible={visible} title="RESTORE FROM DRIVE" onClose={onClose} onSave={onClose} saveLabel="CLOSE">
      {loading && <Text style={styles.status}>Loading backups…</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && files.length === 0 && !error && <Text style={styles.status}>No backups found.</Text>}
      {files.map((file) => (
        <Pressable key={file.id} accessibilityRole="button" disabled={restoring} style={styles.row} onPress={() => confirmAndRestore(file)}>
          <Text style={styles.rowText}>{file.name}</Text>
          <Text style={styles.rowDate}>{new Date(file.createdTime).toLocaleString()}</Text>
        </Pressable>
      ))}
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  status: { color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginBottom: 10 },
  error: { color: colors.red, fontFamily: fonts.body, fontSize: 13, marginBottom: 10 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowText: { color: colors.fg, fontFamily: fonts.bodySemi, fontSize: 14 },
  rowDate: { color: colors.comment, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
});
