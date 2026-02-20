---
description: Workflow for fixing bugs using the Multi-Agent system
---

# Bug Fix Workflow

This workflow guides the team through the standard Bug Fix process.

## 1. 🕵️ Diagnosis
- [ ] **QA/Users**: Identify the bug.
- [ ] **Team**: Reproduce the bug locally.
- [ ] **QA**: Create a failing test case (if possible).

## 2. 🛠️ Fix Implementation
- [ ] **Relevant Agent**: Review [UI_GUIDELINES.md](file:///Users/santoshbastola/Desktop/Greenbirdecom/UI_GUIDELINES.md) if applying UI fixes.
- [ ] **Relevant Agent**: Apply the fix (Frontend or Backend).
- [ ] **Relevant Agent**: Verify fix locally.

## 3. 🧪 Verification
- [ ] **QA**: Run `npx playwright test`.
- [ ] **QA**: Ensure no regressions.

## 4. 🔒 Security Check
- [ ] **Security**: Verify the fix doesn't introduce new holes (e.g., exposing error details).

## 5. 🚀 Patch Release
- [ ] **DevOps**: Deploy the fix.
- [ ] **DevOps**: Update `RELEASE_NOTES.md` with a "Fixed" entry.
