---
description: Workflow for adding a new feature using the Multi-Agent system
---

# New Feature Implementation Workflow

This workflow guides the team through the standard Feature Implementation process.

## 1. 📋 Planning (All Agents)
- [ ] **Manager (User)**: Defines the goal.
- [ ] **Team (AI)**: Switches to PLANNING mode.
- [ ] **Team**: Creates `implementation_plan.md`.
- [ ] **Manager**: Approves the plan.

## 2. 🛡️ Security Review (Security Specialist)
- [ ] **Security**: Run `npm audit` to check for existing vulnerabilities.
- [ ] **Security**: Review requirements for Auth/RBAC implications.
- [ ] **Security**: Update `firestore.rules` draft if needed.

## 3. ⚙️ Backend Implementation (Backend Engineer)
- [ ] **Backend**: Create/Update `src/services/*.service.ts`.
- [ ] **Backend**: Create/Update Cloud Functions in `functions/src`.
- [ ] **Backend**: Update `SETUP_FIREBASE.md` if DB schema changes.

## 4. 🎨 Frontend Implementation (UI/UX Architect)
- [ ] **Frontend**: Review [UI_GUIDELINES.md](file:///Users/santoshbastola/Desktop/Greenbirdecom/UI_GUIDELINES.md) to ensure brand consistency.
- [ ] **Frontend**: Create components in `src/components/`.
- [ ] **Frontend**: Update pages in `src/app/`.
- [ ] **Frontend**: Ensure responsive design (Mobile/Desktop).

## 5. 🧪 Verification (QA Engineer)
- [ ] **QA**: Create a new test file `tests/<feature>.spec.ts`.
- [ ] **QA**: Run `npx playwright test`.
- [ ] **QA**: Fix any regressions.

## 6. 🔒 Final Security Audit (Security Specialist)
- [ ] **Security**: Review code for XSS/Injection risks.
- [ ] **Security**: Verify Rule enforcement.

## 7. 🚀 Deployment & Release (DevOps Engineer)
- [ ] **DevOps**: Deploy Firestore Rules (if changed).
- [ ] **DevOps**: Deploy Application.
- [ ] **DevOps**: Generate "Customer Release Notes" in `RELEASE_NOTES.md`.
