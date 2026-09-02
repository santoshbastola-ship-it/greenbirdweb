# Codebase Summary & Agentic Audit: Greenbird Homestead PWA

This document provides a detailed discovery analysis of the Greenbird Homestead codebase, highlighting its technical stack, architecture, folder structure, and critical operational ambiguities. It identifies gaps where agentic understanding and safety checks are currently lacking.

---

## 🛠️ Stack Overview

| Layer | Technology | Details / Versions |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16.1.4** | App Router, React 19.2.3, configured for **static export** (`output: 'export'`). |
| **Styling** | **Tailwind CSS v4** | Utilizes `@import "tailwindcss"` and modern `@theme inline` features. |
| **State Management** | **Zustand v5.0.10** | Cart state management with persistent storage integration. |
| **Database** | **Cloud Firestore** | Firebase Client SDK (v12.8.0) client-side; Firebase Admin SDK (v13.6.0) server-side. |
| **Auth** | **Firebase Auth** | Client-side Google and Email Link authentication; Custom Claims for roles. |
| **Media Storage** | **Firebase Storage** | Public read access, authenticated write access. |
| **Serverless Runtime** | **Firebase Cloud Functions (Gen 2)** | Express app (`api`) hosted on Node 20 runtime (`us-central1`). |
| **SMS/Messaging** | **Meta Graph API (v21.0)** | Direct Facebook WhatsApp API integrations. |
| **Testing** | **Playwright v1.58.2** | End-to-end browser automation. |
| **Utilities** | `nepali-date-converter` | Used to manage and convert localized Nepali dates. |

---

## 🗺️ Structural Map

Below is a map of the repository's layout and the purpose of key files and directories:

```
├── .agent/                      # AI Agent workflows
│   └── workflows/
│       ├── bug-fix.md           # Step-by-step bug fix protocol
│       ├── feature-impl...md    # Step-by-step feature implementation protocol
│       └── release-process.md   # Setup details for Quick vs Full releases
├── docs/                        # Project architectural docs
│   ├── ARCHITECTURE.md          # Flow diagram mapping App to GCP/Meta
│   └── notification_triggers.md # Summary of In-App & WhatsApp notifications
├── functions/                   # Firebase Cloud Functions codebase
│   ├── src/
│   │   ├── controllers/         # Webhooks, debug tools, and notification triggers
│   │   ├── services/            # Backend WhatsApp service using Admin SDK
│   │   └── index.ts             # Express application entry point (exported as 'api')
│   ├── .env                     # Cloud functions production env variables
│   └── package.json             # Function-specific dependencies
├── scripts/                     # Operational utility scripts
│   ├── cleanup-test-data.ts     # Deletes test categories/products/transactions
│   ├── create-test-users.ts     # Seeds test admin and customer auth profiles
│   ├── full-deploy.js           # Production release command with safety checks
│   └── quick-deploy.js          # Fast deploy command skipping checks/tests
├── src/                         # Client-side Next.js codebase
│   ├── app/                     # App Router pages
│   │   ├── (public)/            # Storefront, cart, checkout, profile, blog pages
│   │   ├── admin/               # Admin dashboard and data views
│   │   ├── api/                 # Empty folder (legacy Next.js API route templates)
│   │   └── globals.css          # Tailwind CSS v4 variables & responsive utilities
│   ├── components/              # Shared React components
│   ├── config/                  # Permissions, endpoint configurations, and templates
│   ├── context/                 # React Contexts (AuthContext, CartContext)
│   ├── lib/                     # Firebase clients, date helpers, and sanitizers
│   ├── services/                # Business services interfacing with Firebase
│   └── store/                   # Zustand stores (useCartStore)
├── tests/                       # Playwright test specifications
│   ├── admin-flow.spec.ts       # E2E test for admin product & category creation
│   ├── order-payment-ui.spec.ts # E2E test for cart flow, checkout, and payments
│   └── test-utils.ts            # Test setup & Firestore teardown utilities
├── firebase.json                # Firebase configuration (routes `/api/**` to Cloud Function)
├── package.json                 # Next.js workspace scripts and dependencies
└── playwright.config.ts         # Playwright browser environment configuration
```

---

## 🔍 Critical Ambiguities & Redundancies

The following design patterns conflict, contain dead code, or pose security/operational risks for autonomous agents:

### 1. The Redundant "Double Cart" Implementation
* **Ambiguity**: The codebase contains **two** distinct shopping cart implementations:
  1. **Active**: A Zustand-based store in [`src/store/useCartStore.ts`](file:///Users/santoshbastola/Desktop/Greenbirdecom/src/store/useCartStore.ts) that is actively imported and used by pages and buttons.
  2. **Dead Code**: A React Context-based provider in [`src/context/CartContext.tsx`](file:///Users/santoshbastola/Desktop/Greenbirdecom/src/context/CartContext.tsx) (`CartProvider` and `useCart`). It is never imported, mounted, or used in the layout tree.
* **Agentic Impact**: An AI agent attempting to modify cart features might mistakenly edit the dead context code instead of the Zustand store, leading to silent bugs.

### 2. Client-Side vs. Server-Side WhatsApp Code Duplication
* **Ambiguity**: There are two copies of `whatsapp.service.ts`:
  1. **Active**: The backend service in [`functions/src/services/whatsapp.service.ts`](file:///Users/santoshbastola/Desktop/Greenbirdecom/functions/src/services/whatsapp.service.ts).
  2. **Dead Code**: The client-side service in [`src/services/whatsapp.service.ts`](file:///Users/santoshbastola/Desktop/Greenbirdecom/src/services/whatsapp.service.ts). It is **never imported or used**.
* **Security Risk**: The client-side version relies on `process.env.META_ACCESS_TOKEN` and `process.env.PHONE_NUMBER_ID`. Because Next.js uses static export (`output: 'export'`), if these variables were to be compiled into the static JS bundle, **sensitive Meta access keys would be exposed in plain text to the public web**.
* **Data Flow**: The active client instead calls [`NotificationService.sendWhatsappNotification`](file:///Users/santoshbastola/Desktop/Greenbirdecom/src/services/notification.service.ts#L193), which sends an HTTP POST request to the Firebase Cloud Function API (`/api/whatsapp/notification`), keeping all keys secure on the backend.

### 3. Out-of-Sync Env Configurations (WhatsApp Tokens)
* **Ambiguity**: The `META_ACCESS_TOKEN` defined in the root [`.env.local`](file:///Users/santoshbastola/Desktop/Greenbirdecom/.env.local) matches a different token string than the one in [`functions/.env`](file:///Users/santoshbastola/Desktop/Greenbirdecom/functions/.env). 
* **Agentic Impact**: It is unclear which token is the active and correct credential, or if one represents a staging/test account while the other represents production. An agent updating environments could inadvertently overwrite the correct token and break messaging.

### 4. Twilio Dependency vs. Meta API Realities
* **Ambiguity**: The root `package.json` declares `"twilio": "^5.12.0"` as a dependency, and the `README.md` references "Twilio integration for automated notifications." However, **Twilio is never imported or used anywhere in the codebase**. The actual notification pipeline uses direct Meta Graph API webhooks and requests.
* **Agentic Impact**: The presence of Twilio makes it appear as if there is a secondary SMS or WhatsApp gateway, leading to wasted research effort and cognitive overload.

### 5. Missing Firestore Security Rules
* **Ambiguity**: While Firestore composite indexes are tracked in [`firestore.indexes.json`](file:///Users/santoshbastola/Desktop/Greenbirdecom/firestore.indexes.json), there is **no firestore.rules file** in the repository, and the `"firestore"` configuration in [`firebase.json`](file:///Users/santoshbastola/Desktop/Greenbirdecom/firebase.json) omits rules entirely.
* **Agentic Impact**: An agent cannot audit, review, or deploy security permissions. It is unclear if Firestore rules are set to public/test-mode in the console or if they are managed manually outside of Git, which poses a severe security risk.

### 6. Local Test Suite / Dev Server Discrepancy (API 404s)
* **Ambiguity**: Playwright's config is set to run the dev server via `npm run dev` (`next dev --turbo`). However, when running locally, the dev server does **not** simulate the Firebase Routing rewrites (which redirect `/api/**` calls to the Cloud Functions emulator).
* **Silent Failure**: If E2E checkout or order tests trigger a WhatsApp or Push notification, the frontend tries to call `http://localhost:3000/api/whatsapp/notification`. The Next.js dev server has no handler for this, resulting in a **404 response**.
* **Why Tests Pass**: The tests pass because `NotificationService.createNotification` catches all fetch errors and silently logs them:
  ```typescript
  // Don't throw, just log. Notifications shouldn't break the main flow.
  ```
* **Agentic Impact**: The E2E tests are **not** validating the serverless notification routes. If the notification payload contract changes and breaks, E2E tests will still pass, creating a false sense of security.

---

## 🤖 Agentic Readiness Audit

Here is a critical assessment of what is missing or unclear for an agent to operate safely:

1. **Coding Standards**: Basic ESLint rules are active, but there are **no automated code formatters** (e.g., Prettier, EditorConfig) to prevent git diff noise across different edits.
2. **CI/CD Pipelines**: There are **no remote CI/CD pipelines** (like GitHub Actions). All tests, version bumps, and deployments are executed locally from the machine of whichever developer triggers `deploy:full`.
3. **Database Emulator Missing**: E2E tests and cleanup scripts run against the **live production Firebase project** (`greenbird-56584`), authenticated as test-admin and test-customer. An agent executing E2E tests could corrupt real customer records if a bug occurs in the cleanup scripts or if tests run concurrently with live users.
4. **Seed Credentials Bug**: The script [`scripts/create-test-users.ts`](file:///Users/santoshbastola/Desktop/Greenbirdecom/scripts/create-test-users.ts) uses `credential: applicationDefault()` to initialize the Admin SDK. This ignores the `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` defined in `.env.local` and will crash unless GCP environment variables are pre-configured in the shell.
5. **No Sandbox/Staging Target**: The `.firebaserc` file maps only a single `"default": "greenbird-56584"` target. There is no separate staging or test Firebase project.

---

## 🔒 Source of Truth Configuration Files

* **Local Environment**: [`.env.local`](file:///Users/santoshbastola/Desktop/Greenbirdecom/.env.local) (Contains Firebase client keys, service account credentials, and dev variables).
* **Cloud Functions Environment**: [`functions/.env`](file:///Users/santoshbastola/Desktop/Greenbirdecom/functions/.env) (Contains Meta/WhatsApp API secrets and Gemini Keys for production).
* **Build/PWA Rules**: [`next.config.ts`](file:///Users/santoshbastola/Desktop/Greenbirdecom/next.config.ts) (Configures Static Export `output: 'export'` and progressive web app parameters).
* **Firebase Infrastructure**: [`firebase.json`](file:///Users/santoshbastola/Desktop/Greenbirdecom/firebase.json) (Defines public directory, index location, rewrite routing to `/api/**`).
* **Zustand State Hydration**: [`src/store/useCartStore.ts`](file:///Users/santoshbastola/Desktop/Greenbirdecom/src/store/useCartStore.ts) (Persists the shopping cart state to `localStorage`).
