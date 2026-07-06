import Constants from 'expo-constants';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const SCOPES = ['https://www.googleapis.com/auth/drive.appdata'];

let configured = false;
function ensureConfigured(): void {
  if (configured) return;
  const webClientId = Constants.expoConfig?.extra?.googleWebClientId as string | undefined;
  GoogleSignin.configure({ webClientId, scopes: SCOPES, offlineAccess: false });
  configured = true;
}

export async function driveSignIn(): Promise<void> {
  ensureConfigured();
  await GoogleSignin.hasPlayServices();
  await GoogleSignin.signIn();
}

export async function driveSignOut(): Promise<void> {
  await GoogleSignin.signOut();
}

export async function isDriveSignedIn(): Promise<boolean> {
  ensureConfigured();
  return GoogleSignin.hasPreviousSignIn();
}

async function getAccessToken(): Promise<string> {
  const tokens = await GoogleSignin.getTokens();
  return tokens.accessToken;
}

import { dumpAll, hashDump } from '../lib/backup';
import { Repos } from '../db';

const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const MAX_VERSIONS = 30;

export type DriveBackupFile = { id: string; name: string; createdTime: string };

export async function backupIfChanged(repos: Repos): Promise<{ uploaded: boolean; hash: string }> {
  const dump = await dumpAll(repos);
  const hash = await hashDump(dump);
  const settings = await repos.settings.getAll();
  if (settings.lastBackupHash === hash) {
    return { uploaded: false, hash };
  }

  const token = await getAccessToken();
  const boundary = 'kcalc-backup-boundary';
  const metadata = { name: `kcalc-backup-${Date.now()}.json`, parents: ['appDataFolder'] };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(dump)}\r\n` +
    `--${boundary}--`;

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!response.ok) {
    throw new Error(`Drive upload failed: ${response.status}`);
  }

  await repos.settings.set({ lastBackupHash: hash, lastBackupAt: Date.now() });
  await pruneOldVersions(token);
  return { uploaded: true, hash };
}

async function pruneOldVersions(token: string): Promise<void> {
  const files = await listBackupFiles(token);
  const stale = files.slice(MAX_VERSIONS);
  for (const file of stale) {
    await fetch(`${FILES_URL}/${file.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  }
}

async function listBackupFiles(token: string): Promise<DriveBackupFile[]> {
  const url = `${FILES_URL}?spaces=appDataFolder&fields=files(id,name,createdTime)&orderBy=createdTime desc&pageSize=100`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Drive list failed: ${response.status}`);
  const json = (await response.json()) as { files: DriveBackupFile[] };
  return json.files;
}
