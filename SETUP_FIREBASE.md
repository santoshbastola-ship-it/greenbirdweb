# Firebase & App Setup Guide

This guide will help you connect your database and install the application on your devices.

## Part 1: Connect Database (Firebase)

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**.
3. Enter a project name (e.g., `greenbird-pwa`).
4. Disable Google Analytics (optional, simplifies setup).
5. Click **Create project** and wait.

### 2. Register Your Web App (Get Keys)
*This step "adds the app" to your Firebase project so you can get the secret keys.*

1. In the Project Overview (Home) of your new project, look for the text **"Get started by adding Firebase to your app"**.
2. Click the **Web icon** (It looks like this: `</>`).
3. **App nickname**: Enter `Greenbird Web`.
4. Leave "Also set up Firebase Hosting" **unchecked** for now.
5. Click **Register app**.
6. **IMPORTANT**: You will now see a code block labeled `const firebaseConfig = { ... }`.
   *   Copy the values from this block. You need them for the next step.
   *   It usually looks like this:
       ```javascript
       apiKey: "AIzaSy...",
       authDomain: "...",
       projectId: "...",
       // etc...
       ```
7. Click **Continue to console**.

### 3. Update Local Environment
1. Open the file `.env.local` in your project folder.
2. Replace `replace_me` with the actual values you just copied:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=Paste_Your_ApiKey_Here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=Paste_Your_AuthDomain_Here
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=Paste_Your_ProjectId_Here
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=Paste_Your_StorageBucket_Here
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=Paste_Your_MessagingSenderId_Here
   NEXT_PUBLIC_FIREBASE_APP_ID=Paste_Your_AppId_Here
   ```
3. Save the file.
4. **Restart your server**: Press `Ctrl+C` in your terminal, then run `npm run dev`.

### 4. Enable Services (Database & Login)
1. **Firestore Database**:
   *   Go to **Build** > **Firestore Database**.
   *   Click **Create database**.
   *   Select a location (e.g., `asia-south1`).
   *   Select **Start in test mode**.
   *   Click **Create**.
2. **Authentication**:
   *   Go to **Build** > **Authentication**.
   *   Click **Get started**.
   *   Select **Email/Password**.
   *   Enable it.
   *   Click **Save**.
3. **Storage**:
   *   Go to **Build** > **Storage**.
   *   Click **Get started**.
   *   Select **Start in test mode**.
   *   Click **Done**.
4. **Service Account (For Push Notifications)**:
   *   Go to **Project settings** (gear icon) > **Service accounts**.
   *   Click **Generate new private key**.
   *   Open the downloaded JSON file.
   *   Add these to your `.env.local` file:
       ```env
       FIREBASE_CLIENT_EMAIL=client_email_from_json
       FIREBASE_PRIVATE_KEY="private_key_from_json"
       ```
   *   **Note**: Wrap the private key in quotes. It contains newlines (`\n`), which are handled by the app.

---

## Part 2: Install App on Device (PWA)

Your application is a Progressive Web App (PWA). You don't need the App Store or Play Store to install it.

### On Android (Chrome)
1. Open your website URL in Chrome (e.g., `http://localhost:3000` or your deployed URL).
2. Tap the **three dots** (menu) in the top-right corner.
3. Tap **"Install App"** or **"Add to Home Screen"**.
4. Tap **Install**.
5. The Greenbird icon will appear on your home screen like a native app.

### On iOS (Safari)
1. Open your website URL in Safari.
2. Tap the **Share** button (box with an arrow pointing up) at the bottom.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add** in the top-right corner.
5. The Greenbird icon will appear on your home screen.

### On Desktop (Chrome/Edge)
1. Open the website.
2. Look for an **Install icon** (monitor with a down arrow) in the right side of the address bar.
3. Click it and select **Install**.
