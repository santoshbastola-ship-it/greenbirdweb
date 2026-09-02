---
description: Workflow for adding a new feature using the Multi-Agent system
---

# New Feature Implementation Workflow

This workflow guides the team through the standard Feature Implementation process.

## 1. 📋 Planning & Requirements (PM / Manager)
- [ ] **Manager (User)**: Defines the feature request and business goals.
- [ ] **PM**: Designs the user stories, coordinates planning mode, writes the checklist (`task.md`), and initiates `implementation_plan.md`.
- [ ] **Team (AI)**: Refines `implementation_plan.md` technical details.
- [ ] **Manager**: Approves the plan.

## 2. 🛡️ Security Review (Security Specialist)
- [ ] **Security**: Run `npm audit` to check for vulnerabilities.
- [ ] **Security**: Review design for data access roles and rules.
- [ ] **Security**: Update Firestore/Storage security rules.

## 3. ⚙️ Backend Implementation (Backend Engineer & Doc Agent)
- [ ] **Backend**: Create or modify Firebase data connectors in `src/services/*.service.ts`.
- [ ] **Backend**: Write cloud backend functions in `functions/src`.
- [ ] **Doc Agent**: Update `SETUP_FIREBASE.md` if database schemas or environment variables change.

## 4. 🎨 Frontend Implementation (UI/UX Architect)
- [ ] **Frontend**: Review [UI_GUIDELINES.md](file:///Users/santoshbastola/Desktop/Greenbirdecom/UI_GUIDELINES.md) to ensure design consistency.
- [ ] **Frontend**: Create components and routes in `src/components/` and `src/app/`.
- [ ] **Frontend**: Verify PWA responsiveness (mobile viewport alignment).

## 5. 🧪 Verification & SRE Review (QA & SRE)
- [ ] **QA**: Create a Playwright integration test suite: `tests/<feature>.spec.ts`.
- [ ] **QA**: Run E2E verification test commands (`npm run test`).
- [ ] **SRE**: Verify Next.js compilation, package sizes, and PWA assets (`sw.js` and `manifest.json`) are correct.

## 6. 🔒 Final Security Audit (Security Specialist)
- [ ] **Security**: Inspect code for key leaks, injection vulnerabilities, and cross-site scripting (XSS).
- [ ] **Security**: Check final configuration variables.

## 7. 🚀 Release & Documentation (DevOps & Doc Agent)
- [ ] **DevOps**: Run deployment commands (`deploy:full`) to push code to Firebase production.
- [ ] **Doc Agent**: Review comment logs, sync codebase docs, and draft details in `RELEASE_NOTES.md`.
- [ ] **PM**: Verify the deploy matches requirements and closes the user request.

