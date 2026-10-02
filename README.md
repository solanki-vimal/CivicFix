# CivicFix

A Web-Based Civic Issue Reporting and Resolution Tracking System.

A full-stack MERN web application where citizens report local infrastructure problems (potholes, garbage, broken streetlights, water leakage) with photos and GPS location. Issues are publicly visible, community-upvotable, and tracked through a complete resolution lifecycle by municipal authority accounts.

> **Status:** The full backend (auth, RBAC, all 7 collections, Issues with auto-routing/images/real-time/analytics) and the frontend's auth flow are complete and tested end-to-end. The public issue feed, map, and report-issue form are still ahead — see [Roadmap](#roadmap).

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

**Implemented — Phase 5 (Uploads, real-time, analytics):**
- Image upload pipeline: Multer memory-storage middleware (type/size/count limits: 3 images, 5MB each, jpg/png/webp only) streams buffers directly to Cloudinary — never written to disk — with a resize-1200px/quality-80/WebP transformation applied on upload
- Issue creation switched to `multipart/form-data`; `lng`/`lat` are flat top-level fields rather than a nested `location` object, since multipart text fields can't carry nested JSON without extra client-side encoding
- Socket.io wired onto the same `http.Server` as Express (`server.js` now uses `http.createServer(app)` rather than `app.listen()` directly): an `issue:{id}` room a client explicitly joins/leaves for one issue's detail page, plus an unscoped global broadcast channel for the admin dashboard's live new-issue counter
- `statusUpdate` emits to the relevant issue's room on every real status change; `newIssue` broadcasts globally on creation
- `GET /api/issues/analytics/summary` (`super_admin`): issues by category/status, 12-week trend, average resolution time overall and per department, top 5 unresolved issues by upvotes
- `GET /api/departments/:id/analytics` (`dept_admin` scoped to their own department, `super_admin` any): open issue count, resolved this month vs. last month, staff workload
- Cloudinary env vars moved from present-but-unvalidated to required in `config/index.js`, now that they're actually read
- Fully tested end-to-end against live Atlas: real image upload + Cloudinary URL verification, Multer limit errors, geo search radius behavior, live `statusUpdate`/`newIssue` events confirmed via a standalone Socket.io test page, upvote toggle, comment authoring, and both analytics endpoints including the department-scoping `403` check

**Implemented — Phase 6 (React frontend: auth flow):**
- Vite + React scaffold (`Client/`), React Router for navigation
- `AuthContext` restores the session on load via `GET /me`, so a page refresh doesn't log the user out; `SocketContext` connects via `socket.io-client`, scoped to only what the backend currently supports (issue rooms + global broadcasts, no authenticated user room yet)
- Axios client configured with `withCredentials: true` — required for the httpOnly JWT cookie to actually be sent
- Login and Signup pages built with React Hook Form + Zod, mirroring the backend's validation rules; Signup includes a confirm-password field (client-side only, stripped before the API call) and a show/hide toggle
- Google OAuth as a real full-page redirect (`window.location.href`), matching the backend's redirect-based flow rather than an XHR call
- `ProtectedRoute` and `PublicOnlyRoute` both wait for the initial session check before deciding whether to redirect, avoiding a flash-redirect on every page load
- A placeholder `/dashboard` route — the exact path the backend's Google OAuth callback redirects to — showing the logged-in user's name, email, role, and live Socket.io connection status
- Design tokens (sage/teal/marigold palette, Newsreader + IBM Plex Sans type, the doc's status-badge colors) defined once as CSS variables in `index.css` for later phases to reuse
- Fully tested in-browser end-to-end: signup, session persistence across refresh, logout actually blocking the protected route (not just hiding a button), and Google OAuth
- The forgot-password UI is deliberately not built yet — it's explicitly Phase 11 scope in the project plan, even though the backend endpoint exists since Phase 2

**Not yet built** (planned — see roadmap below): public issue feed, map, report-issue form, admin dashboard UI, notifications.

---

## Tech Stack (implemented so far)

**Backend**

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Server | Express.js |
| Database | MongoDB Atlas, Mongoose |
| Auth | Passport.js (Local + Google OAuth2), JWT, bcrypt |
| Validation | Zod |
| Email | Resend |
| File storage | Multer (memory storage) + Cloudinary (resize/quality/WebP transform) |
| Real-time | Socket.io (room-scoped + global events) |
| Security | Helmet, express-rate-limit, httpOnly/SameSite cookies |
| Sessions | express-session, connect-mongo (reserved for admin dashboard preferences) |

**Frontend**

| Layer | Technology |
|---|---|
| Build tool | Vite |
| UI | React 18 |
| Routing | React Router 7 |
| HTTP client | Axios (`withCredentials: true` for the cookie-based JWT) |
| Forms | React Hook Form + Zod |
| Real-time | socket.io-client |

React-Leaflet (map), Recharts (dashboards), and vite-plugin-pwa will be added as the phases that need them are built.

---

## Getting Started

Backend and frontend run as two separate processes, in two terminals.

**Backend:**
```bash
cd Server
npm install
cp .env.example .env   # then fill in your own values
npm run dev
```
Starts on `http://localhost:5000` (or the `PORT` you set in `.env`). Confirm it's running:
```bash
curl http://localhost:5000/health
```

**Frontend:**
```bash
cd Client
npm install
npm run dev
```
Starts on `http://localhost:5173`. This exact port matters — the backend's `CLIENT_URL`, CORS policy, and Socket.io CORS check are all set to `http://localhost:5173`; if Vite falls back to a different port because 5173 is already in use, requests will fail CORS.

### Environment Variables

**Server** — see `Server/.env.example` for the full list. As of Phase 5, `config/index.js` validates 15 required variables at startup:

- `PORT`, `NODE_ENV`, `CLIENT_URL`, `MONGO_URI`, `SESSION_SECRET`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Client** — see `Client/.env.example`. Both fall back to sensible localhost defaults, so a `.env` file is optional for local development:

- `VITE_API_BASE_URL` (default `http://localhost:5000/api`)
- `VITE_SOCKET_URL` (default `http://localhost:5000`)

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
    │   ├── passport.js              # Local + Google OAuth2 strategies
    │   ├── cloudinary.js            # Cloudinary v2 credentials
    │   └── socket.js                # Socket.io init + emit helpers
    ├── controllers/
    │   ├── authController.js
    │   ├── departmentController.js  # includes getDepartmentAnalytics
    │   ├── categoryController.js
    │   ├── issueController.js       # includes getIssuesAnalyticsSummary
    │   └── commentController.js
    ├── middleware/
    │   ├── auth.js                  # protect + authorize(...roles)
    │   ├── errorHandler.js          # includes Multer error handling
    │   ├── rateLimiter.js           # authLimiter + generalLimiter
    │   ├── validate.js              # generic Zod body + query validators
    │   └── upload.js                # Multer memory storage config
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
    │   ├── departmentRoutes.js      # includes /:id/analytics
    │   ├── categoryRoutes.js
    │   ├── issueRoutes.js           # includes /analytics/summary
    │   └── commentRoutes.js         # nested under /api/issues/:id/comments
    ├── utils/
    │   ├── AppError.js
    │   ├── generateToken.js         # JWT signing + cookie helper
    │   ├── sendEmail.js             # Resend wrapper
    │   └── uploadToCloudinary.js    # buffer -> Cloudinary stream upload
    └── validators/
        ├── authValidators.js
        ├── departmentValidators.js
        ├── categoryValidators.js
        ├── issueValidators.js
        └── commentValidators.js

Client/
├── index.html
├── vite.config.js
├── .env.example
└── src/
    ├── main.jsx                     # entry point: Router + AuthProvider + SocketProvider
    ├── App.jsx                      # route definitions
    ├── index.css                    # design tokens (palette, type, status colors)
    ├── api/
    │   ├── axiosClient.js           # withCredentials: true for the cookie-based JWT
    │   └── authApi.js
    ├── context/
    │   ├── AuthContext.jsx
    │   └── SocketContext.jsx
    ├── components/
    │   ├── ProtectedRoute.jsx
    │   ├── PublicOnlyRoute.jsx
    │   ├── AuthLayout.jsx           # shared split-panel shell for Login/Signup
    │   ├── FormField.jsx            # labeled input, optional show/hide toggle
    │   └── GoogleButton.jsx
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── SignupPage.jsx
    │   └── DashboardPage.jsx        # placeholder protected page
    └── validation/
        └── authSchemas.js           # mirrors Server/validators/authValidators.js
```

---

## Testing Approach

Each week's models are tested and validated against a live MongoDB Atlas connection before controllers/routes are built on top of them — schema correctness is established first, per the course's schema-first requirement.

Controllers and routes are tested end-to-end using the Talend API Tester browser extension against a running local server connected to live Atlas: request/response shapes, status codes, authorization boundaries, rate limiting, cookie behavior, and edge cases (duplicate keys, invalid tokens, cross-role access) are all verified manually before a phase is considered complete.

Frontend features are tested manually in-browser against the real running backend — actual clicks and form input, not just that a component renders — checking both the visible behavior and the browser console/network tab for anything that fails silently.

---

## Roadmap

Development follows a phase-by-phase plan. Rough shape of what's ahead:

- **Phases 7–8:** React frontend — public issue feed with map view, report-issue form
- **Phase 9:** Admin dashboard UI (consuming the analytics endpoints built in Phase 5)
- **Phase 10:** In-app + email notifications (Resend) on status change, including the `user:{id}` Socket.io room deferred from Phase 5
- **Phase 11:** PWA support, polish
- **Phase 12:** Deployment (Vercel + Render + Atlas)

## License

This project is licensed under the [MIT License](LICENSE).