# CivicFix

A Web-Based Civic Issue Reporting and Resolution Tracking System.

A full-stack MERN web application where citizens report local infrastructure problems (potholes, garbage, broken streetlights, water leakage) with photos and GPS location. Issues are publicly visible, community-upvotable, and tracked through a complete resolution lifecycle by municipal authority accounts.

> **Status:** Early development. Only the backend server foundation is built so far — see [Current Progress](#current-progress) below. This README will expand as features land.

---

## Current Progress

**Implemented:**
- Base Express server with MongoDB Atlas connection (Mongoose)
- Environment variable validation at startup (fails fast if config is missing)
- Security middleware: Helmet (secure headers), rate limiting (`express-rate-limit`)
- Server-side session store (`express-session` + `connect-mongo`)
- Centralized error handling
- `GET /health` check endpoint

**Not yet built** (planned — see roadmap below): authentication, database models, issue reporting, image uploads, real-time updates, frontend.

---

## Tech Stack (implemented so far)

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Server | Express.js |
| Database | MongoDB Atlas, Mongoose |
| Security | Helmet, express-rate-limit |
| Sessions | express-session, connect-mongo |

Frontend, authentication, file storage, and real-time features will be added in later stages of development and documented here once implemented.

---

## Getting Started

```bash
cd civic-fix-backend
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

See `.env.example` for the current required variables:
- `PORT`, `NODE_ENV`, `CLIENT_URL`
- `MONGO_URI` (MongoDB Atlas connection string)
- `SESSION_SECRET`

Additional variables (JWT secrets, Google OAuth credentials, Cloudinary keys, Resend API key) will be added to `.env.example` and `config/index.js` as the corresponding features are built — not before.

---

## Project Structure

```
civic-fix-backend/
├── server.js              # App entry point
├── config/
│   ├── db.js                # MongoDB connection
│   └── index.js              # Environment variable validation
├── middleware/
│   ├── errorHandler.js       # Centralized error handling
│   └── rateLimiter.js         # Auth + general rate limiters
└── utils/
    └── AppError.js            # Custom error class
```

---

## Roadmap

Development follows a week-by-week plan. Rough shape of what's ahead:

- Authentication (email/password + Google OAuth), JWT
- Department & Category management
- Issue reporting with geolocation and auto-routing
- Image uploads (Cloudinary)
- Real-time status updates (Socket.io)
- React frontend
- Admin dashboards & analytics
- Notifications (in-app + email)
- Deployment

## License

This project is licensed under the [MIT License](LICENSE).