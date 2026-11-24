# AlumSphere

[![E2E tests](https://github.com/priyanshu3027/AlumSphere/actions/workflows/e2e.yml/badge.svg)](https://github.com/priyanshu3027/AlumSphere/actions/workflows/e2e.yml)

An AI-powered alumni networking and placement platform. Students and alumni build connections, message each other in real time, share jobs and events, and get AI help with their careers: resume analysis, career roadmaps and job recommendations.

**Stack:** React 19 (Vite, Tailwind CSS) · Node.js · Express 5 · MongoDB (Mongoose) · Socket.io · JWT · OpenAI and Gemini APIs

## Features

- **Authentication and access control:** JWT authentication, role-based access for students, alumni and admins, alumni verification status, and TOTP two-factor authentication.
- **Networking:** profiles, connection requests and AI-suggested connections.
- **Real-time chat:** one-to-one messaging over Socket.io with typing indicators, plus in-app notifications.
- **Jobs and placements:** job postings, applications, saved jobs and a job-match score.
- **Community:** posts feed with likes and comments, groups, events and announcements.
- **AI Hub:** career chatbot, resume analysis from an uploaded PDF, job recommendations, career roadmap generation, skill trends and market insights.
- **Gamification:** points and a leaderboard.
- **Admin dashboard:** platform stats, alumni verification and user management.

## Architecture

```text
React SPA (Vite)
      │  REST (Axios) + Socket.io
      ▼
Express API  ──►  MongoDB (Mongoose)
      │
      ▼
AI services (OpenAI, Gemini)
```

## Project structure

```text
backend/
  config/        MongoDB connection
  controllers/   13 controllers (auth, users, jobs, events, chat, AI, admin, ...)
  middleware/    JWT auth, error handler, file upload
  models/        10 Mongoose models
  routes/        13 route modules mounted under /api
  seed/          sample data script
  server.js      Express and Socket.io entry point
frontend/
  src/pages/       14 pages (Dashboard, Network, Chat, Jobs, Events, AI Hub, Admin, ...)
  src/components/  shared UI components
  src/context/     auth and socket providers
  src/api/         Axios client
  Dockerfile       multi-stage build, served by Nginx
e2e/               Playwright end-to-end tests
docker-compose.yml MongoDB + API + frontend
```

## API overview

The backend exposes 70+ REST endpoints across 13 route modules.

| Base path | Area |
|---|---|
| `/api/auth` | Registration, login, two-factor authentication |
| `/api/users` | Profiles and user directory |
| `/api/connections` | Connection requests |
| `/api/chat` | Conversations and messages |
| `/api/notifications` | In-app notifications |
| `/api/jobs` | Job postings and applications |
| `/api/events` | Events |
| `/api/community` | Groups |
| `/api/posts` | Posts feed |
| `/api/announcements` | Announcements |
| `/api/gamification` | Points and leaderboard |
| `/api/ai` | Chatbot, resume analysis, recommendations, roadmap, insights |
| `/api/admin` | Admin operations |

## Getting started

You need Node.js 18 or newer and a MongoDB instance (local or Atlas).

```bash
git clone https://github.com/priyanshu3027/AlumSphere.git
cd AlumSphere
cd backend && npm install
cd ../frontend && npm install
```

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/alumsphere
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=
GEMINI_API_KEY=
```

Create `frontend/.env` so the client talks to your local API:

```env
VITE_API_URL=http://localhost:5000
```

Run the app:

```bash
cd backend
npm run seed      # optional: load sample data
npm run dev:all   # API on port 5000, Vite dev server on port 5173
```

## Run with Docker

The whole stack (MongoDB, the API, and the React build served by Nginx) starts with one command:

```bash
docker compose up -d --build --wait
docker compose exec -T backend npm run seed   # optional: demo accounts and sample data
```

Open http://localhost:8080. Nginx serves the frontend and proxies `/api`, `/uploads` and `/socket.io` to the backend, so the browser only talks to one origin.

After seeding, the login page's quick-demo buttons work (student, verified alumni and admin). AI features return built-in sample responses unless `OPENAI_API_KEY` or `GEMINI_API_KEY` is set in your shell before starting the stack.

Stop everything with `docker compose down` (add `-v` to also delete the database volume).

## End-to-end tests

The `e2e/` folder holds a Playwright suite of 27 tests that runs against the seeded Docker stack:

- **Smoke:** API health, landing page, JSON 404 for unknown API routes
- **Authentication:** redirect for signed-out visitors, registration, duplicate email, wrong password, sign in and sign out
- **Navigation:** every sidebar page renders inside the app shell with no uncaught browser errors
- **Jobs:** listing, search, a verified alumni posting a job, a student applying with a cover letter
- **Permissions:** students and unverified alumni cannot post jobs, students cannot reach the admin API

```bash
cd e2e
npm ci
npx playwright install chromium
npx playwright test          # expects the stack on http://localhost:8080
npx playwright show-report   # open the HTML report
```

Set `E2E_BASE_URL` to run the suite against a different deployment.

GitHub Actions runs the same steps (build the stack, seed, run Playwright) on every push to `main` and on every pull request, and uploads the HTML report as an artifact.

## Roadmap

- Hosted live demo
- Unit tests for the API controllers

## Author

Priyanshu Singh · [LinkedIn](https://www.linkedin.com/in/priyanshu-singh-2672912a5/) · [Portfolio](https://priyanshucodez.netlify.app)
