# kcalc Agent Notes

These notes are for any coding agent working in this repo. They capture project-specific infrastructure decisions and session lessons so the app stays model-agnostic and reproducible.

## Source Of Truth

- Product spec: `C:\Users\jpcarlson\.kcalc\docs\kcalc-build-plan.md`.
- Current foundation plan: `C:\Users\jpcarlson\.kcalc\docs\plans\2026-07-05-kcalc-foundation.md`.
- Repo root: `C:\Users\jpcarlson\.kcalc\kcalc`.
- Android package: `com.dyscostic.kcalc`.

## Expo And Versions

Expo changes quickly. Before changing Expo, React Native, native modules, app config, EAS config, or package versions, read the exact versioned Expo docs relevant to the target SDK.

- The current implementation intentionally follows Plan 1 on Expo SDK 54.
- `AGENTS.md` previously pointed at Expo SDK 57 docs because current Expo behavior matters; do not silently upgrade this app to SDK 57 unless a plan explicitly calls for that migration.
- After dependency changes, run `npx.cmd expo install --check` and resolve compatibility warnings.
- Use `npx.cmd expo install <package>` for Expo SDK packages whenever possible.

Known SDK 54-compatible pins from the foundation commit:

- `expo ~54.0.0`
- `react 19.1.0`
- `react-native 0.81.5`
- `jest ~29.7.0`
- `@types/jest 29.5.14`

## Windows Command Notes

This repo is commonly worked on from PowerShell on Windows.

- Use `npm.cmd`, `npx.cmd`, and similar `.cmd` shims when PowerShell blocks `npm.ps1` with execution policy errors.
- `npm install` may work through approval tooling, but direct local verification commands should prefer `npm.cmd`.
- Avoid shell pipelines for destructive filesystem work. Use PowerShell cmdlets with literal paths.

Useful commands:

```powershell
npm.cmd install
npm.cmd test -- --runInBand
npm.cmd run typecheck
npx.cmd expo install --check
npx.cmd eas build:list --platform android --limit 1 --non-interactive
```

## EAS Notes

The EAS project is linked in `app.json`:

- Account/project: `@jpcarlson/kcalc`
- Project ID: `ef728ace-a1f0-472e-82d2-bf3d7d871a37`

Fresh EAS projects may need:

```powershell
npx.cmd eas init --non-interactive --force
```

Cloud builds can outlive local command timeouts. If `eas build` times out locally, check whether it actually started:

```powershell
npx.cmd eas build:list --platform android --limit 1 --non-interactive
```

## Test And Type Rules

- Run `npm.cmd test -- --runInBand` and `npm.cmd run typecheck` before committing.
- Node tests must not import React Native or Expo runtime modules.
- DB tests use `better-sqlite3` through `__tests__/helpers/testDb.ts` and the `SqlDb` interface.
- Production DB access goes through `src/db/index.ts` and `expo-sqlite`.

## Git And Local Files

- Do not revert user changes.
- `LICENSE` may be locally untracked; do not assume it belongs to the current task unless explicitly requested.
- `CLAUDE.md`, `.claude/`, and `.agents/` are ignored as local/tooling state.
- `AGENTS.md` is intentionally tracked so future agents get these notes.

## Superpowers Skills

Some plans may mention Superpowers skills such as `superpowers:subagent-driven-development` or `superpowers:executing-plans`.

- If the active tool registry exposes subagents, use them for independent plan tasks.
- If the skill registry does not expose the `superpowers:` names but the files exist locally, read the relevant `SKILL.md` directly and follow the workflow.
- Local observed plugin skill path: `C:\Users\jpcarlson\.codex\.tmp\plugins\plugins\superpowers\skills`.
- Do not block implementation solely because the skill prefix is unavailable when the instructions are readable.

## Current Foundation Shape

- App shell is custom state-based tabs, not React Navigation.
- Screens: Today live dashboard; Chat and Trends placeholders.
- Storage: SQLite schema v1 with repos for weights, meals, exercise, SFL, chat, and settings.
- Defaults: 1500 net kcal, 150g protein, 110g carbs, 50g fat, 200cm, age 42, male.
- Daily net: meal kcal minus exercise kcal.
- Weight deltas: most recent prior entry, not calendar yesterday; 7-day comparison uses latest entry with date <= date minus 7.