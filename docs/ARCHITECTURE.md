# Greenbird E-commerce Architecture

This document provides a high-level overview of the application architecture, explaining the roles of Code, Firebase, Google Cloud, WhatsApp, and the AI Agent (Antigravity).

## Architecture Diagram

```mermaid
graph TD
    User([User / Devices])
    
    subgraph Development_Environment [Development]
        Antigravity([Antigravity (AI Agent)])
    end

    subgraph Greenbird_App [Greenbird Application Code]
        NextJS[Next.js 16 PWA\n(App Router)]
        Services[Service Layer\n(Business Logic)]
    end

    subgraph Infrastructure [Google Cloud Platform / Firebase]
        Hosting[Firebase Hosting]
        Auth[Firebase Authentication]
        Firestore[Cloud Firestore\n(NoSQL Database)]
        Storage[Firebase Storage\n(Media Assets)]
        Functions[Cloud Functions Gen 2\n(Server-Side Runtime)]
    end

    subgraph External_Services [External Integrations]
        Meta[WhatsApp / Meta Graph API]
    end

    %% Interactions
    Antigravity -- "Develops, Refactors, Deploys" --> Greenbird_App
    
    User -- "Accesses URL" --> Hosting
    Hosting -- "Serves Static & Dynamic Content" --> Functions
    Functions -- "Executes" --> NextJS
    NextJS -- "Invokes" --> Services
    
    Services -- "Manages Data" --> Firestore
    Services -- "Identifies Users" --> Auth
    Services -- "Stores Images" --> Storage
    
    Services -- "Sends Notifications" --> Meta
    Meta -- "Delivers Messages" --> User
```

## Component Roles

### 1. Code (Greenbird Application)
The core application is built using **Next.js 16** (React framework).
*   **Frontend**: Provides the User Interface (Storefront, Admin Dashboard), styled with **Tailwind CSS**. It is a Progressive Web App (PWA) capable of offline functionality (via `next-pwa`).
*   **Service Layer** (`src/services/`): Handles all business logic. Key services include:
    *   `whatsapp.service.ts`: Manages messaging logic and cost optimization.
    *   `auth.service.ts`: Handles user login and sessions.
    *   `transaction.service.ts` & `product.service.ts`: Manage e-commerce data.
    *   `energyService.ts`: Specialized service for Greenbird functionalities.

### 2. Firebase (Backend-as-a-Service)
Firebase provides the backend infrastructure, managed by Google Cloud.
*   **Hosting**: Delivers the application to users securely (HTTPS).
*   **Authentication**: Manages user sign-in (Google, Email) and security tokens.
*   **Cloud Firestore**: The central database storing all application data (Users, Products, Orders, WhatsApp Interactions) in real-time.
*   **Storage**: Stores uploaded product images and assets.

### 3. Google Cloud Platform (Infrastructure)
Firebase sits on top of Google Cloud.
*   **Cloud Functions**: When specialized server-side logic runs (like Next.js API routes or heavy processing), it executes on Google Cloud Functions (Gen 2).
*   **Region**: Explicitly configured for `us-central1` to ensure low latency and consistent availability.

### 4. WhatsApp / Meta (Communication)
Directly integrated for customer engagement.
*   **Notifications**: The app sends automated order updates (Confirmed, Shipped) to users.
*   **Interaction Logic**: The `WhatsappService` intelligently tracks "24-hour windows" to minimize costs—using free-form messages when a user has recently replied, and paid templates only when necessary.

### 5. Antigravity (AI Agent)
Your AI development partner.
*   **Role**: Antigravity exists within the IDE/Development environment to analyze the codebase, implement features (like this architecture review), debug issues, and manage deployments.
*   **Workflow**: Reads code -> Plans changes -> Edits files -> Verifies results -> Deploys to Firebase.
