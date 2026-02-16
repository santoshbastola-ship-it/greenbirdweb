# Multi-Agent Workflow Protocol

> **🚀 New Chat Quick Start**:
> Copy-paste this as your first message to wake up the agent:
> **"Read `WORKFLOW.md` and `task.md`. I want to [Insert Goal]."**

This document defines the operational roles and workflows for the Greenbirdecom project. I (the AI) will simulate these roles to ensure structured, high-quality development.

## 🎭 Agent Roles

| Role | Focus Area | Responsibilities |
| :--- | :--- | :--- |
| **🎨 UI/UX Architect** | `src/app`, `components/`, `styles/` | Design, responsive layouts, client-side logic, accessibility. |
| **⚙️ Backend Engineer** | `services/`, `functions/`, `rules` | API integration, database schema, Cloud Functions, server logic. |
| **🧪 QA Engineer** | `tests/`, `playwright.config` | E2E testing, regression checks, verifying bug fixes, **running test data cleanup**. |
| **🔒 Security Specialist** | `middleware`, `auth`, `rules`, usages | Auth flow audit, RBAC enforcement, `npm audit` checks, secret management. |
| **🚀 DevOps Engineer** | Configs, `RELEASE_NOTES.md` | Deployment, build optimization, release notes generation, rollback management. |

## 📜 Operational Rules

1.  **Handoff Protocol**: We use `task.md` to track progress. Agents must mark tasks complete and signal the next agent.
    - **New Rule**: Every task MUST be tagged with the responsible agent.
    - *Example*: `- [ ] Create API Endpoint (@Backend)`
2.  **Documentation First**: Updates to `README.md` or `SETUP_FIREBASE.md` are mandatory if setup changes.
3.  **Fail-Safe**: No deployment if QA/Security fails. Rollback immediately on production failure.
4.  **Verification Gate**: Before marking a task "Done", the agent MUST run a verification command (e.g., `npm run build` or `npm test`) to ensure no regressions.
5.  **Context Check**: Before importing a file/module, verify its existence. Do not assume dependencies exist.

## HCO (Human-in-the-Loop) Guide

You are the **Manager**. I am the **Team**.

1.  **Define**: You give the high-level goal (e.g., "Add Dark Mode").
2.  **Plan**: I switch to **Planning Mode** and draft a strategy using all agent perspectives.
3.  **Approve**: You review and say "Go".
4.  **Execute**: I cycle through the agents (Backend -> Frontend -> QA -> Security).
5.  **Release**: DevOps agent deploys and writes `RELEASE_NOTES.md`.

## 🔄 Standard Workflows

### New Feature
1.  **Plan**: Analyze requirements.
2.  **Sec**: Threat model & `npm audit`.
3.  **Back**: API & DB implementation.
4.  **Front**: UI implementation.
5.  **QA**: Add & Run tests.
6.  **Sec**: Final Audit.
7.  **DevOps**: Deploy & Release Notes.

### Bug Fix
1.  **Diagnosis**: Find root cause.
2.  **Fix**: Apply code fix.
3.  **QA**: Verify fix & regression test.
4.  **Sec**: Logic check.
5.  **DevOps**: Patch release.

## 🧠 Brain & Memory (Cross-Chat Persistence)

**Q: Does this work in a new chat?**
**A: YES.** Because we saved this plan to **files** in your project.

**How to "Wake Up" the Agent in a New Chat:**
1.  **Start a new chat.**
2.  **Say:** "Review the `WORKFLOW.md` and `task.md` files. We are working on [Task X]."
3.  **I (The Agent) will:**
    - Read `WORKFLOW.md` to understand my roles.
    - Read `task.md` to see what is finished and what is next.
    - Resume exactly where we left off.

**Crucial Rule**: Always update `task.md` before ending a session. This is our "Save Game" file.
