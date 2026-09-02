# Coding Standards & Agent Rules: Greenbird Homestead PWA

This document establishes the architecture rules, constraints, and boundaries that must be followed by any autonomous AI agent working in this repository. These rules prevent configuration drift, credentials leaks, and redundant implementations.

---

## 1. Stack Boundaries & Architecture

### Shopping Cart Management
* **Active Stack**: All cart state and shopping operations must use the Zustand-based store defined in [`src/store/useCartStore.ts`](file:///Users/santoshbastola/Desktop/Greenbirdecom/src/store/useCartStore.ts).
* **Banned Patterns**: Do NOT introduce new React Context providers or local component state for global cart operations. `CartContext.tsx` has been deleted and must not be re-introduced.

### Styling & Brand Guidelines
* **Color System**: Always use the CSS variables defined in [`src/app/globals.css`](file:///Users/santoshbastola/Desktop/Greenbirdecom/src/app/globals.css) for brand actions.
  * Primary Green: `var(--forest-green)` or tailwind class `bg-forest-green`
  * Secondary Brown: `var(--earthy-brown)` or tailwind class `bg-earthy-brown`
* **Tailwind v4 Standard**: Avoid deprecated Tailwind v3 config practices. All custom themes and styles must be defined inside the `@theme inline` block in `globals.css`.
* **Touch Targets**: Buttons, inputs, and links must maintain a minimum clickable dimension of `44x44px` for accessibility, which is globally enforced.

### Localized Date Processing
* **Rule**: For display or storage of localized Nepali dates, use `nepali-date-converter` and utility methods in [`src/lib/date-helper.ts`](file:///Users/santoshbastola/Desktop/Greenbirdecom/src/lib/date-helper.ts). Never format localized dates inline with ad-hoc logic.

---

## 2. Security & Credentials Rules

### Client-Side Key Leaks
* **Rule**: Never expose sensitive keys, authorization headers, or access tokens on the client side. Any variable that is not prefixed with `NEXT_PUBLIC_` is invisible to the browser.
* **Prohibition**: Do not add secrets to `next.config.ts`'s `env` block. All messaging and secure notification dispatches must run on serverless backend runtimes.

### Database Security
* **Rules version**: If Firestore or Storage rules must be modified, updates must be committed to `storage.rules` or a future `firestore.rules` file in version control. Direct console edits are forbidden.

---

## 3. Serverless Functions & API Operations

### API Endpoints
* **Standard**: The Next.js frontend is statically compiled (`output: 'export'`). Therefore, Next.js API routes inside `src/app/api` are non-functional at runtime.
* **Active Routing**: All backend API endpoints must be implemented inside the Firebase Functions Gen 2 codebase (`functions/src`). Express routes inside `functions/src/index.ts` handle `/api/**` rewrites.

---

## 4. Testing & Local Validation

### Emulator Mandate
* **Rule**: E2E tests must never interact with the live production Firebase project (`greenbird-56584`). All testing and data mutations must run against the local Firebase Emulators.
* **Commands**: Use `npm run test` (which executes `firebase emulators:exec "playwright test"`) to run E2E suites.
* **Environment Flag**: Browser and runner codes must detect the emulator context using `process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true"`.
