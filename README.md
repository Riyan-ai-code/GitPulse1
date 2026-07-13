# GitPulse Light ⚡

A real-time GitHub repository analytics, health assessment, and Google Summer of Code (GSoC) exploration platform. Built for the open-source community, GitPulse allows developers, maintainers, and students to quickly evaluate public codebases, compare repositories, and research past GSoC organizations from a single, interactive dashboard.

---

## 🚀 Key Features

*   **Repository Health Assessment:** Instantly computes a `0-100` health score based on README availability, licensing, issue tracking, release patterns, and contributor activity.
*   **AI-Powered Insights (GitPulse Intelligence):** Integrates Gemini AI to analyze repository commits, code patterns, and project activity, delivering granular, high-level intelligence reports.
*   **GSoC Archive & Leaderboard Explorer:** A dedicated panel letting students explore past Google Summer of Code organizations, filtering by accepted year, development categories, and specific technologies. Includes a leaderboard of organizations sorted by total project placements.
*   **Side-by-Side Comparison:** Enables direct comparison of two public repositories across metrics like star growth, language distribution, issue density, and commit velocities.
*   **Codebase Composition:** Interactive language breakdown charts illustrating language distribution.
*   **Exportable Reports:** Options to print dashboards, export analyses as PDFs, or embed GitPulse health badges directly in a repository's GitHub README.

---

## 🛠️ Technology Stack

### Frontend
*   **Framework:** [Next.js](https://nextjs.org/) (App Router, TS)
*   **UI Components & Icons:** [Lucide React](https://lucide.dev/)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/)
*   **Charts/Analytics:** [Recharts](https://recharts.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)

### Backend & Storage
*   **Runtime:** [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
*   **Database & Caching:** [Supabase](https://supabase.com/) (using `@supabase/supabase-js` for caching analysis reports and query history)
*   **HTTP Client:** [Axios](https://axios-http.com/) (for GitHub REST and GraphQL queries)
*   **AI Engine:** [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Gemini API integration)

### Infrastructure & Tooling
*   **Orchestration:** [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
*   **Process Concurrency:** [Concurrently](https://www.npmjs.com/package/concurrently) (runs frontend and backend concurrently in dev mode)

---

## 📁 Directory Structure

```text
gitpulse-light/
├── .agents/                    # Custom agent workspaces and helper skills
├── backend/                    # Express.js server
│   ├── src/
│   │   ├── modules/            # Domain-driven backend modules
│   │   │   ├── repository/     # Repo metadata fetching
│   │   │   ├── commits/        # Commits analysis and analytics
│   │   │   ├── contributors/   # Contributor listing
│   │   │   ├── analysis/       # Health scoring & Gemini integrations
│   │   │   ├── auth/           # OAuth token handling
│   │   │   └── gsoc/           # GSoC organization archives
│   │   ├── shared/             # Global Middlewares, Clients, and Contexts
│   │   ├── app.js              # Express app definition & routes mounting
│   │   └── server.js           # Server startup script
│   └── Dockerfile              # Container specs for backend
├── frontend/                   # Next.js client
│   ├── src/
│   │   ├── app/                # Next.js app routes, layout, and global CSS
│   │   ├── components/         # Dashboard panels, charts, and visualizations
│   │   ├── lib/                # API client helpers
│   │   └── types/              # TypeScript typings
│   └── Dockerfile              # Multi-stage build client container
├── docker-compose.yml          # Container configuration for both services
├── DEPLOYMENT.md               # Quick instructions on deployment
├── architecture.md             # System architecture, module boundaries, and flows
├── system_design.md            # Database schemas, scoring algorithms, and AI specs
├── package.json                # Monorepo task configurations
└── README.md                   # This file
```

---

## 📖 System & Architectural Documentation

For deep technical analysis and blueprint specifications, refer to:
*   **[Architecture Blueprint](file:///c:/Users/DELL/Desktop/pulse/architecture.md):** Modular monolith backend layout, Next.js dashboard hierarchy, CLS context isolation, and OAuth 2.0 lifecycle.
*   **[System Design Specification](file:///c:/Users/DELL/Desktop/pulse/system_design.md):** Supabase table structures, health & commit quality formulas, Gemini AI agent specifications, and performance optimization telemetry.

---

## ⚙️ Environment Configuration

Set up a `.env` file in the root directory. Use `.env.example` as a template:

```env
# GitHub Token (for high-volume API requests)
GITHUB_TOKEN=your_github_personal_access_token

# Gemini AI Key (for repository intelligence features)
GEMINI_API_KEY=your_gemini_api_key

# Supabase Configurations (for backend history and caching)
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key

# Frontend Settings (public-facing variables)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# CORS / Origin URL
FRONTEND_URL=http://localhost:3000
```

---

## 🚀 Running the Project

### 1. Install Dependencies
You can install all dependencies for the monorepo root, backend, and frontend with a single command:
```bash
npm run install-all
```

### 2. Run in Development Mode
To run both the Next.js frontend and Express backend concurrently:
```bash
npm run dev
```
*   **Frontend:** [http://localhost:3000](http://localhost:3000)
*   **Backend:** [http://localhost:5000](http://localhost:5000)

### 3. Deploy via Docker Compose
To build and start both applications as isolated Docker containers:
```bash
docker compose up --build
```

---

## 🛡️ License
This project is open-source and available under the MIT License.
