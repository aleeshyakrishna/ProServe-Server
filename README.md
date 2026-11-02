# ProServe API – AI-Enabled Service Booking Platform

The backend for **ProServe**, a full-stack service booking platform (similar to Urban Company). Customers find and book home services such as cleaning, plumbing and electrical work. Providers list their services, and an AI assistant helps users find the right one.

The frontend lives in a separate repo: [ProServe_Client](https://github.com/aleeshyakrishna/ProServe_Client) (Next.js).

## Features

- **Authentication** with Supabase Auth: register, login, logout, refresh token, forgot/reset password, change password
- **Role-based access control:** `CUSTOMER`, `SERVICE_PROVIDER` and `ADMIN`, enforced by `authenticate` and `requireRoles` middleware
- **Services, categories and bookings:** full CRUD with search, category and location filters
- **AI booking assistant:** Gemini function calling with read-only tools (search services, get details, check availability), argument validation and model fallback
- **Validation** of every request body with Zod
- **Consistent API responses** and central error handling
- **Automated tests:** 34 Jest + Supertest tests (see [Testing](#testing))

## Tech Stack

| Area | Tools |
|---|---|
| Runtime | Node.js, TypeScript (strict mode) |
| Framework | Express 5 |
| Database | PostgreSQL (Supabase) with Drizzle ORM |
| Auth | Supabase Auth (Bearer token or `ps_access_token` cookie) |
| AI | Google Gemini (`@google/genai`) |
| Validation | Zod |
| Testing | Jest, Supertest, ts-jest |

## Architecture

Each request flows through clear layers, so business logic never lives in routes:

```
Route → Middleware (auth, roles, validation) → Controller → Service → Repository → Database
```

```
src/
├── app.ts            # Express app (exported for tests)
├── server.ts         # Starts the server
├── config/           # Environment, Supabase and Gemini clients
├── routes/           # URL → controller mapping
├── middlewares/      # authenticate, requireRoles, validate, error handler
├── controllers/      # Read the request, send the response
├── services/         # Business logic (incl. assistant/ for the AI tools)
├── repositories/     # Database queries
├── validations/      # Zod schemas
├── db/               # Drizzle schema, connection and seed
├── utils/            # AppError, asyncHandler, response helpers
└── __tests__/        # Jest test suite
```

## API Overview

All routes are under `/api`.

| Resource | Routes | Access |
|---|---|---|
| Health | `GET /health` | Public |
| Auth | `POST /auth/register`, `/login`, `/logout`, `/refresh-token`, `/forgot-password`, `/reset-password`, `/change-password` · `GET /auth/me` · `PATCH /auth/profile` | Public, or logged in for `me`, `logout`, `change-password` and `profile` |
| Categories | `GET /categories`, `GET /categories/:id` | Public |
| | `POST`, `PUT /:id`, `DELETE /:id` | Logged in |
| Services | `GET /services`, `GET /services/:id` | Public |
| | `POST`, `PUT /:id` | `SERVICE_PROVIDER` |
| | `DELETE /:id` | `ADMIN` |
| Bookings | `GET`, `GET /:id` | Logged in |
| | `POST`, `PUT /:id` | `CUSTOMER` or `SERVICE_PROVIDER` |
| | `DELETE /:id` | `ADMIN` |
| Users | `GET`, `GET /:id` | Logged in |
| | `POST`, `PUT /:id`, `DELETE /:id` | `ADMIN` |
| AI | `POST /ai/chat`, `/ai/search`, `/ai/assistant` | Public |

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```
PORT=5001
NODE_ENV=development
DATABASE_URL=postgres://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
```

Optional: `GEMINI_MODEL` and `GEMINI_FALLBACK_MODELS` choose which Gemini models the assistant uses.

### 3. Set up the database

```bash
npm run db:push
```

```bash
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

The API runs at `http://localhost:5001`. Check it with `GET /api/health`.

## Testing

The API has **34 automated tests** written with **Jest** and **Supertest**.

```bash
npm test
```

```bash
npm run test:coverage
```

### How the tests work

- **Supertest** sends real HTTP requests to the exported Express app (`app.ts`), so no server is started.
- **Only things outside our code are mocked:** the Supabase client, the repositories and the service layer. The real `authenticate`, `requireRoles` and `validate` middleware, the controllers and the error handler all run for real.
- **Tests never touch real data.** `src/__tests__/setup-test.env.ts` sets fake environment variables, and `.env` does not override them while `NODE_ENV=test`.

### What is covered

| File | Tests | What it checks |
|---|---|---|
| `health.test.ts` | 1 | The app starts and responds |
| `protected-routes.test.ts` | 7 | No token → 401 on bookings, users, services and auth routes |
| `auth-middleware.test.ts` | 6 | Invalid token, bad header, cookie token, 404 no account, 403 inactive account, 403 wrong role |
| `categories.test.ts` | 8 | Public list, 401s, 400 validation errors, 201 create, 200 update |
| `validations.test.ts` | 7 | Zod schema rules for categories, services and bookings |
| `assistant-tools.test.ts` | 5 | AI tool layer: unknown tool, invalid arguments, available-only search, never throws |

Coverage highlights: `authenticate.middleware.ts` 94% lines and 91% branches, `validate.middleware.ts` and the category and service schemas 100%, AI `tools.ts` 76%.

### Other scripts

| Script | What it does |
|---|---|
| `npm run eval:assistant` | Runs the AI assistant evaluation suite against Gemini |
| `npm run gemini:models` | Lists the Gemini models available to your API key |
| `npm run test:legacy` | The old manual test runner. **It writes to the real database**, so prefer `npm test` |

## Roadmap

- [x] Authentication and role-based access control
- [x] Services, categories and bookings API
- [x] AI booking assistant with Gemini
- [x] Automated API tests (Jest + Supertest)
- [ ] End-to-end tests with Playwright (frontend)
- [ ] CI with GitHub Actions
- [ ] Docker and docker-compose
- [ ] Redis + BullMQ queue for booking emails
- [ ] AWS deployment

## Author

Built and maintained by **Aleeshya Krishna MV**, a full-stack developer focused on scalable systems and modern web architecture.
