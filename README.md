# Greenbird Homestead PWA

A modern, full-stack E-commerce Progressive Web Application (PWA) built for localized commerce in Nepal. This project demonstrates high-level expertise in React 19, Next.js, Firebase, and advanced automated testing.

## 🚀 Key Features

- **Progressive Web App (PWA)**: Fully installable with offline capabilities and push notifications.
- **Advanced Admin Dashboard**: Comprehensive management of sales, purchases, stock, and bookings.
- **Nepali Localization**: Support for Nepali dates (`nepali-date-converter`) and custom localized UI elements.
- **Dynamic Image Management**: Integrated image cropping and compression (`react-image-crop`, `browser-image-compression`).
- **Real-time Synchronization**: Powered by Firebase Firestore for seamless multi-device updates.
- **Secure Communication**: Twilio integration for automated notifications.
- **Rich Text Editing**: Integrated `react-quill-new` for detailed product descriptions.

## 🛠 Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Next.js 15+](https://nextjs.org/) (App Router & Turbo)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend/Database**: [Firebase](https://firebase.google.com/) (Firestore, Auth, Storage, Cloud Functions)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Testing**: [Playwright](https://playwright.dev/) (End-to-End Testing)
- **Utilities**: `lucide-react`, `date-fns`, `clsx`, `tailwind-merge`

## 🤖 Advanced Development Workflow

This project leverages a **Multi-Agent Developer System** (Antigravity) for rapid feature implementation and bug fixing. 
- Integrated custom `Workflow.md` for standardized agentic development.
- Automated release processes (`scripts/full-deploy.js`, `scripts/quick-deploy.js`).
- Rigorous E2E test suites for image persistence, admin flows, and hydration stability.

## 📥 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Configure your `.env.local` with Firebase and Twilio credentials.

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Testing**:
   ```bash
   npm run test
   ```

## 🏗 Project Structure

- `src/`: Core application logic and UI components.
- `functions/`: Firebase Cloud Functions for backend logic (Twilio, Order Processing).
- `tests/`: Comprehensive Playwright E2E test suites.
- `scripts/`: Deployment and maintenance utilities.

---
Built with 💚 and AI-assisted workflows.
