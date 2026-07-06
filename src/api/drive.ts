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
