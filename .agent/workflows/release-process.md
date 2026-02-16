---
description: Workflow for releasing the application (Quick vs Full)
---

# Release Process Workflow

This workflow defines the release paths for Greenbirdecom.

## Option A: 🖥️ Local Testing (Safe)
**Command**: "Agent, start the dev server."
**Script**: `npm run dev`
**Use Case**: You want to test features on your machine (`localhost:3000`) before any deployment.
**Agent Role**: I will run the terminal command and keep it running while you test.

## Option B: ⚡️ Quick Release (Production Bypass)
**Command**: "Agent, do a quick release."
**Script**: `npm run deploy:quick`
**Use Case**: You want to push a small change or hotfix to the **Live Production Server** immediately, skipping tests and version bumps.
**⚠️ Risks**: High. Bypasses automated testing. Use only for trivial UI tweaks or urgent fixes.
**Process**:
1.  Build Application & Functions.
2.  Deploy to Firebase Hosting & Functions.
3.  *Skips*: Tests, Version Bump, Release Notes.

## Option C: 🚀 Full Deployment (Standard)
**Command**: "Agent, deploy to production with message: [Summary]"
**Script**: `npm run deploy:full "[Summary]"`
**Use Case**: Standard release procedure for new features.
**Process**:
1.  **Clean**: Cleans test data.
2.  **Bump**: Increments Patch Version (e.g., 0.2.22 -> 0.2.23).
3.  **Docs**: Updates `RELEASE_NOTES.md` with your summary.
4.  **Git**: Commits and Pushes to repo.
5.  **Test**: Runs `npm run test` (Playwright).
6.  **Build**: Builds App & Functions.
7.  **Deploy**: Pushes to Firebase.
