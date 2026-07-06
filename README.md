# kcalc

kcalc is a personal Android nutrition and weight logging app. The foundation build is an Expo dev-client app with local SQLite storage, a Dracula-themed Today dashboard, manual meal and weight entry, settings, and a tested domain/data layer ready for the later Gemini, Health Connect, Trends, and backup plans.

## Current Status

Plan 1 foundation is implemented:

- Expo SDK 54 TypeScript app
- EAS development APK profile
- SQLite schema v1 and repository layer
- Jest tests for dates, schema, repos, net calories, weight deltas, moving average, and flags
- Today tab with kcal hero, macro cards, weight row, and meal log
- Chat and Trends placeholder tabs
- Manual meal, weight, and settings modals

## Tech Stack

- Expo SDK 54
- React Native 0.81.5
- TypeScript strict mode
- `expo-sqlite` for local persistence
- `jest` + `ts-jest` + `better-sqlite3` for Node-side data tests
- EAS dev-client builds for Android

## Setup

```powershell
npm.cmd install
```

PowerShell may block `npm.ps1` on some machines. Use `npm.cmd` and `npx.cmd` commands in that case.

## Development Commands

```powershell
npm.cmd test -- --runInBand
npm.cmd run typecheck
npx.cmd expo install --check
npx.cmd expo start --dev-client
```

The app is intended for an Expo development build, not Expo Go.

## Android Dev Build

The development profile is defined in `eas.json` and builds an APK:

```powershell
npx.cmd eas build --profile development --platform android --non-interactive
```

If a build command times out locally, check the cloud build status:

```powershell
npx.cmd eas build:list --platform android --limit 1 --non-interactive
```

The EAS project is linked as `@jpcarlson/kcalc`.

## Project Layout

```text
src/
  components/   reusable UI pieces
  db/           SqlDb interface, schema, repositories, production SQLite binding
  lib/          dates, net kcal, deltas, moving average, flags
  screens/      Today, placeholders, and entry modals
  theme.ts      Dracula palette and font names
__tests__/      Node tests for db and domain logic
```

## Data Model

SQLite tables:

- `weights`
- `meals`
- `exercise`
- `sfl`
- `chat_messages`
- `settings`

All DB code depends on `SqlDb`, which lets production use `expo-sqlite` and tests use in-memory `better-sqlite3`.

## Domain Rules

- Daily net kcal = meal kcal minus exercise kcal.
- Default target is 1500 net kcal.
- Macro defaults are 150g protein, 110g carbs, and 50g fat.
- Weight deltas compare against the most recent prior entry, not calendar yesterday.
- Seven-day weight delta uses the latest entry with date less than or equal to date minus 7.
- Outlier weights remain in moving averages but mark affected calculations.

## Verification

Before committing changes:

```powershell
npm.cmd test -- --runInBand
npm.cmd run typecheck
npx.cmd expo install --check
```

## Google Drive Backup Setup

kcalc backs up to your own Google Drive `appDataFolder` using your own OAuth client (testing mode — no Google verification needed for personal single-user use):

1. In Google Cloud Console, create a project (or reuse one), enable the "Google Drive API".
2. Create an OAuth 2.0 Client ID of type "Android", using package name `com.dyscostic.kcalc` and the SHA-1 fingerprint of your EAS build's signing credential (`npx.cmd eas credentials` to view it).
3. Also create a "Web application" OAuth client ID (required by `@react-native-google-signin/google-signin` as the `webClientId` even on Android).
4. Put the web client ID in `app.config.ts` under `extra.googleWebClientId`.

## Planned Next Work

- Plan 2: photo recognition with Gemini and confirm-to-log flow
- Plan 3: chat assistant with SQLite tool calls
- Plan 4: Trends chart and deterministic markdown import
- Plan 5: Health Connect exercise sync
- Plan 6: Google Drive backup/restore and polish