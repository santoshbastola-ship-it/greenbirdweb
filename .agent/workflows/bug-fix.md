---
description: Workflow for fixing bugs using the Multi-Agent system
---

# Bug Fix Workflow

This workflow guides the team through the standard Bug Fix process.

## 1. 🕵️ Diagnosis
- [ ] **PM**: Register the bug ticket, define priorities, and assign it to the developer team.
- [ ] **QA/Users**: Identify and document the bug.
- [ ] **Team (UI/UX or Backend)**: Reproduce the bug locally using the emulator.
- [ ] **QA**: Create a failing test case (if possible).

## 2. 🛠️ Fix Implementation
- [ ] **Relevant Agent**: Review [UI_GUIDELINES.md](file:///Users/santoshbastola/Desktop/Greenbirdecom/UI_GUIDELINES.md) if applying UI fixes.
- [ ] **Relevant Agent**: Apply the fix (Frontend or Backend).
- [ ] **Relevant Agent**: Verify fix locally inside the emulator.

## 3. 🧪 Verification & SRE Review
- [ ] **QA**: Run `npx playwright test` and verify strict mode is satisfied.
- [ ] **SRE**: Verify there are no memory leaks or layout shifts introduced by the changes.
- [ ] **QA**: Ensure no regressions in other screens.

## 4. 🔒 Security Check
- [ ] **Security**: Verify the fix doesn't introduce new holes (e.g., exposing error details or client key leaks).

## 5. 🚀 Patch Release & Documentation
- [ ] **DevOps**: Run compilation build (`npm run build`) and deploy the fix.
- [ ] **Doc Agent**: Document the resolution in comments and update `RELEASE_NOTES.md` under a "Fixed" entry.

