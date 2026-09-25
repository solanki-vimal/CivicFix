# CivicFix

A Web-Based Civic Issue Reporting and Resolution Tracking System.

A full-stack MERN web application where citizens report local infrastructure problems (potholes, garbage, broken streetlights, water leakage) with photos and GPS location. Issues are publicly visible, community-upvotable, and tracked through a complete resolution lifecycle by municipal authority accounts.

> **Status:** Backend foundation, authentication, Department/Category management, and the full Issue backend (including comments) are complete and tested end-to-end against a live database. Image uploads, real-time updates, and the frontend are still ahead — see [Roadmap](#roadmap).

---

## Current Progress

**Implemented — Phase 1 (Server foundation):**
- Base Express server with MongoDB Atlas connection (Mongoose)
- Environment variable validation at startup (fails fast if config is missing)
- Security middleware: Helmet (secure headers), rate limiting (`express-rate-limit`)
- Server-side session store (`express-session` + `connect-mongo`)
- Centralized error handling
- `GET /health` check endpoint

**Implemented — Phase 2 (Authentication):**
- Dual auth: email/password (Passport Local) and Google OAuth2 (Passport Google), both issuing a JWT in an httpOnly, `SameSite=Strict` cookie — no server-side session used for auth state
- Google login links to an existing email/password account by matching email, instead of creating a duplicate user
- Password hashing (bcrypt), Zod-validated request bodies, `authLimiter` (10 requests / 15 min) on auth-sensitive routes
- Password reset flow via Resend: SHA-256-hashed, time-limited reset tokens; `forgot-password` always returns the same response regardless of whether the account exists, to prevent email enumeration
- Endpoints: `signup`, `login`, `google`, `google/callback`, `logout`, `me`, `forgot-password`, `reset-password/:token`
- Fully tested end-to-end against live Atlas: all 8 endpoints, including the Google-account-linking edge case

**Implemented — Phase 3 (Schemas + Department/Category management):**
- All 7 MongoDB schemas built upfront, before any controller or route — `User`, `Department`, `Category`, `Issue`, `StatusHistory`, `Comment`, `Notification`
- 15 indexes total across the 7 models, each tied to an actual query pattern rather than indexing every field independently — includes a geospatial `2dsphere` index on `Issue.location`, a sparse unique index on `User.googleId`, and a compound unique index on `{department, name}` for `Category`
- Full CRUD for Departments and Categories, restricted to `super_admin` on all write operations
- The Category → Department link is the auto-routing mechanism issues will use in Phase 4: re-mapping a category's department takes effect immediately for future issues, while issues already created keep the department they were routed to at creation time
- Duplicate-name conflicts return `409`, correctly enforced on both create and update
- Fully tested end-to-end against live Atlas, including authorization checks (a `citizen` correctly receives `403` on admin-only routes) and category re-routing between departments

**Implemented — Phase 4 (Issue backend + comments):**
- Issue creation auto-routed to a department via `resolveDepartmentForCategory()` — the department is derived server-side from the chosen category, never trusted from the client body
- `GET /api/issues` with category/status/department filters, geospatial `$near` search (lng/lat/radius), and pagination — `$near` supplies its own distance-based sort, so the default `createdAt` sort only applies when no geo filter is active
- `GET /api/issues/mine`, `GET /api/issues/:id`, `PATCH /api/issues/:id/status`, `PATCH /api/issues/:id/upvote`
- Every real status change writes a `StatusHistory` audit entry; an assignee- or priority-only update does not, keeping the timeline free of no-op entries
- Status updates are department-scoped: `staff`/`dept_admin` can only act on issues within their own department, `super_admin` can act on any — this scoping isn't explicit in the API doc's endpoint table but matches the role permissions described in section 2 of the project doc
- Comments (`POST`/`GET /api/issues/:id/comments`), nested under the issue route via `express.Router({ mergeParams: true })`; `isOfficialUpdate` is set server-side from the poster's role, never client-supplied
- A generic `validateQuery` middleware was added alongside the existing body validator, for Zod-validated query-string parameters (with `z.coerce` for numeric ones)
- Fully tested end-to-end against live Atlas: creation + auto-routing correctness, geo search, pagination, cross-department `403` on status updates, rejection without a reason correctly blocked, upvote toggle, and comment authoring/listing including the official-update badge

**Not yet built** (planned — see roadmap below): image uploads, real-time updates, admin dashboards, notifications, frontend.

---

## Tech Stack (implemented so far)

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Server | Express.js |
| Database | MongoDB Atlas, Mongoose |
| Auth | Passport.js (Local + Google OAuth2), JWT, bcrypt |
| Validation | Zod |
| Email | Resend |
| Security | Helmet, express-rate-limit, httpOnly/SameSite cookies |
| Sessions | express-session, connect-mongo (reserved for admin dashboard preferences) |

File storage (Cloudinary), real-time updates (Socket.io), and the React frontend will be added in later stages of development and documented here once implemented.

---

## Getting Started

```bash
cd Server
npm install
cp .env.example .env   # then fill in your own values
npm run dev
```

Server starts on `http://localhost:5000` (or the `PORT` you set in `.env`).

Confirm it's running:
```bash
curl http://localhost:5000/health
```

### Environment Variables

See `.env.example` for the full list. As of Phase 3, `config/index.js` validates 12 required variables at startup:

- `PORT`, `NODE_ENV`, `CLIENT_URL`, `MONGO_URI`, `SESSION_SECRET`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

Cloudinary variables are present in `.env.example` for convenience but are **not yet validated at startup** — they stay out of `validateEnv()` until the Phase 5 upload pipeline actually reads them, so a missing Cloudinary key doesn't block the server from booting over a feature that isn't built yet.

---

## Project Structure

```
CivicFix/
├── README.md
├── LICENSE
└── Server/
    ├── server.js                    # App entry point
    ├── .env.example
    ├── config/
    │   ├── db.js                    # MongoDB connection
    │   ├── index.js                 # Environment variable validation
    │   └── passport.js              # Local + Google OAuth2 strategies
    ├── controllers/
    │   ├── authController.js
    │   ├── departmentController.js
    │   ├── categoryController.js
    │   ├── issueController.js
    │   └── commentController.js
    ├── middleware/
    │   ├── auth.js                  # protect + authorize(...roles)
    │   ├── errorHandler.js
    │   ├── rateLimiter.js           # authLimiter + generalLimiter
    │   └── validate.js              # generic Zod body + query validators
    ├── models/
    │   ├── User.js
    │   ├── Department.js
    │   ├── Category.js
    │   ├── Issue.js
    │   ├── StatusHistory.js
    │   ├── Comment.js
    │   └── Notification.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── departmentRoutes.js
    │   ├── categoryRoutes.js
    │   ├── issueRoutes.js
    │   └── commentRoutes.js         # nested under /api/issues/:id/comments
    ├── utils/
    │   ├── AppError.js
    │   ├── generateToken.js         # JWT signing + cookie helper
    │   └── sendEmail.js             # Resend wrapper
    └── validators/
        ├── authValidators.js
        ├── departmentValidators.js
        ├── categoryValidators.js
        ├── issueValidators.js
        └── commentValidators.js
```

---

## Testing Approach

Each week's models are tested and validated against a live MongoDB Atlas connection before controllers/routes are built on top of them — schema correctness is established first, per the course's schema-first requirement.

Controllers and routes are tested end-to-end using the Talend API Tester browser extension against a running local server connected to live Atlas: request/response shapes, status codes, authorization boundaries, rate limiting, cookie behavior, and edge cases (duplicate keys, invalid tokens, cross-role access) are all verified manually before a phase is considered complete.

---

## Roadmap

Development follows a phase-by-phase plan. Rough shape of what's ahead:

- **Phase 5:** Image upload pipeline (Multer → Cloudinary), Socket.io real-time layer, `GET /api/issues/analytics/summary` and `GET /api/departments/:id/analytics` (deferred from earlier phases pending real aggregation data)
- **Phases 6–8:** React frontend — auth flow, public issue feed with map view, report-issue form
- **Phase 9:** Admin dashboards & analytics
- **Phase 10:** In-app + email notifications (Resend) on status change
- **Phase 11:** PWA support, polish
- **Phase 12:** Deployment (Vercel + Render + Atlas)

## License

This project is licensed under the [MIT License](LICENSE).