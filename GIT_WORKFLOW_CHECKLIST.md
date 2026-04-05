# Daily Commit-Push Checklist

Use this checklist every time you finish a coding session.

## 1) Sync before coding

```bash
git checkout main
git pull origin main
```

If team uses feature branches:

```bash
git checkout -b feat/<short-task-name>
```

## 2) Code and run locally

```bash
pnpm install
pnpm dev
```

Quick verification before commit:

```bash
pnpm lint
pnpm build
```

## 3) Review your changes

```bash
git status
git diff
```

Make sure no sensitive files are included (`.env`, API keys, credentials).

## 4) Commit safely

```bash
git add .
git commit -m "feat: short message about why this change is needed"
```

Preferred commit prefixes:
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code cleanup, no behavior change
- `docs:` documentation only
- `chore:` maintenance tasks

## 5) Push to GitHub

For `main` branch:

```bash
git push origin main
```

For feature branch:

```bash
git push -u origin feat/<short-task-name>
```

Then open a Pull Request on GitHub.

## 6) Final check

```bash
git status
```

Expected output: `working tree clean`.

## Recovery tips

- Wrong files staged:
  ```bash
  git restore --staged <file>
  ```
- Undo last local commit (keep changes):
  ```bash
  git reset --soft HEAD~1
  ```
- See commit history:
  ```bash
  git log --oneline --decorate -n 10
  ```
