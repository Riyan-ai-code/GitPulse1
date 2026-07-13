# Architecture Blueprint 📐

This document outlines the high-level architecture, module boundaries, authentication lifecycle, and data flow of **GitPulse Light**.

---

## 🗺️ High-Level System Architecture

GitPulse utilizes a client-server architecture composed of a Next.js Single Page Application (SPA) on the frontend, and a Node.js/Express.js Modular Monolith on the backend, integrated with Supabase for historical storage/caching and GitHub REST/GraphQL APIs for real-time repository extraction.

### 🗺️ System Flow Diagram
![GitPulse System Flow Diagram](./system_flow_diagram.png)

```mermaid
graph TD
    %% 1. User/Frontend Entry Points
    subgraph Frontend [Next.js Client Dashboard]
        UI[User Dashboard UI]
        ThemeMgr[Theme Manager Light/Dark]
        TabMgr[Tabs: Overview, Commits, GSoC, AI Insights]
    end

    %% 2. OAuth Authentication Flow
    subgraph Auth [OAuth Session Lifecycle]
        LoginLink[1. OAuth Login URL] -->|Redirects| GH_Auth[2. GitHub Consent Screen]
        GH_Auth -->|Returns Auth Code| AuthRoute[3. GET /api/auth/callback]
        AuthRoute -->|Exchange Auth Code| TokenSwap[4. GitHub OAuth Token Swap]
        TokenSwap -->|Set HttpOnly Cookie| Cookie[github_access_token]
        Cookie -->|Context Bound| AsyncStore[AsyncLocalStorage Request Scope]
    end

    %% 3. Backend Module Orchestration
    subgraph Backend [Express API Modules]
        Router[API Router Route]
        RepoSvc[Repository Service]
        CommitSvc[Commits Service]
        ContribSvc[Contributors Service]
        AnalysisSvc[Analysis Engine]
        GsocSvc[GSoC Portal Service]
    end

    %% 4. Data Storage & AI Intelligence Layers
    subgraph StorageAI [Data & AI Integration Layers]
        CacheDB[(Supabase Cache Table)]
        HistoryDB[(Supabase History Table)]
        Gemini[Google Gemini API gemini-flash]
        GitHubAPI[GitHub REST & GraphQL API]
    end

    %% Flow connections
    UI -->|Analyze Repo request| Router
    Router -->|Authenticate token| AsyncStore
    AsyncStore -->|Query Cached Data| CacheDB
    
    %% Cache results
    CacheDB -->|Cache Hit: Return payload| UI
    CacheDB -->|Cache Miss| AnalysisSvc
    
    %% Concurrent resolutions
    AnalysisSvc -->|Concurrently Promise.all| RepoSvc
    AnalysisSvc -->|Concurrently Promise.all| CommitSvc
    AnalysisSvc -->|Concurrently Promise.all| ContribSvc
    
    RepoSvc & CommitSvc & ContribSvc -->|GitHub Queries| GitHubAPI
    
    %% Processing and AI
    AnalysisSvc -->|Calculate Metrics| ScoringRules[Rules: Health & Commit Quality]
    AnalysisSvc -->|Assemble stats & folder tree| GeminiPrompt[Prompt Builder]
    GeminiPrompt -->|Generate recommendations| Gemini
    
    %% Save to DB and Return
    ScoringRules & Gemini -->|Log Audit & Cache Results| WriteDB[Save to History & Cache Tables]
    WriteDB --> CacheDB
    WriteDB --> HistoryDB
    AnalysisSvc -->|Return Integrated JSON Response| UI
```

---

## 📦 Backend Architectural Boundaries

The backend is structured as a **Modular Monolith** located under `backend/src/modules/`. Each module is encapsulated and owns its business logic, routes, and controllers, preventing spaghetti code dependencies:

1. **`auth` Module:** Coordinates GitHub OAuth 2.0 authentication. Swaps auth codes for GitHub Access Tokens, setting them securely in `HttpOnly` client-side cookies.
2. **`repository` Module:** Extracts top-level repository metadata (stars, forks, license, and primary language) and computes codebase composition maps.
3. **`commits` Module:** Fetches commits, evaluates commit frequencies, and profiles commit timelines (time-of-day/day-of-week).
4. **`contributors` Module:** Extracts the list of contributors and their active commit shares.
5. **`analysis` Module:** Orchestrates health score calculations, commit quality reviews, and interacts with the AI Engine.
6. **`gsoc` Module:** Manages the GSoC accepted organizations and student projects data archive.

### 🧵 Request Context Isolation (Continuation Local Storage)
To support seamless GitHub API calls across multiple users, the backend isolates the active user's GitHub Access Token using Node's native `AsyncLocalStorage` inside `backend/src/shared/context/authContext.js`.
Every incoming request runs within a scoped execution context, making the token globally accessible to the GitHub API client wrapper (`backend/src/shared/client/github.js`) without needing to pass it through every function call.

---

## 🖥️ Frontend Architectural Boundaries

The frontend is a single-page application built on **Next.js** (App Router, Tailwind CSS, TS) located in the `frontend/` directory.

### Core Layout & Components
*   **Routing:** Utilizes Next.js file-based App Router. The primary page (`frontend/src/app/page.tsx`) acts as the parent entry point, wrapping the main [Dashboard](file:///c:/Users/DELL/Desktop/pulse/frontend/src/components/Dashboard.tsx) component.
*   **State Orchestration:** The Dashboard component acts as the global state orchestrator, managing:
    *   Currently active tab (Overview, Commits, GSoC, etc.).
    *   Active repository under analysis (owner and name).
    *   Auth states (logged-in user information, session validation status).
    *   Application theme (toggles `.dark` on `document.documentElement`).

---

## 🔐 Authentication & Session Lifecycle

GitPulse integrates **GitHub OAuth 2.0** with strict security practices:

```mermaid
sequenceDiagram
    participant User as User Browser
    participant FE as Frontend Dashboard
    participant BE as Express Backend
    participant GH as GitHub OAuth
    
    User->>FE: Click Login with GitHub
    FE->>BE: GET /api/auth/login
    BE-->>User: Redirect to GitHub Authorize page
    User->>GH: Authorize Application
    GH-->>User: Redirect back with ?code=XYZ
    User->>BE: GET /api/auth/callback?code=XYZ
    BE->>GH: Swap Code for Access Token
    GH-->>BE: Returns GitHub token
    BE->>User: Set HttpOnly Cookie (github_access_token)
    BE-->>User: Redirect to FE Dashboard (?auth_success=true)
```

### Security Measures:
*   **HttpOnly Cookies:** The actual GitHub OAuth token is never exposed to client-side JavaScript, protecting the token from Cross-Site Scripting (XSS) attacks.
*   **Cookie Expiry & Refresh:** Access tokens are managed with short expiration parameters and refreshed seamlessly if session parameters persist.
*   **CORS Policies:** Restricts communication strictly between the configured `FRONTEND_URL` and `FRONTEND_ORIGIN` variables.
