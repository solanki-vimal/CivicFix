// server.js
// Entry point for the CivicFix MERN backend application.

// Load environment variables early
require('dotenv').config();

// Validate all required env vars before anything else starts up
const { validateEnv } = require('./config/index');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Database will be connected during startServer() startup phase

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

// Sets 14+ secure HTTP response headers (CSP, X-Frame-Options, HSTS, etc.)
app.use(helmet());

// CORS configuration (allow requests from frontend client)
// credentials: true is required for cookies/sessions, requiring a strict origin.
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting on all routes (a stricter authLimiter gets applied to
// auth-specific routes once they exist, in Week 2)
app.use(generalLimiter);

// Cookie Parser is required to parse req.cookies.token for JWT auth
app.use(cookieParser());

// Server-side session middleware backed by MongoDB store
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback_session_secret_for_local_dev',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────


// Basic health check route — confirms the server is up and DB is connected
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
  });
});

// ─── Error Handlers ───────────────────────────────────────────────────────────

// Catch 404 and forward to error handler
app.use(notFound);

// Central error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Establish Database Connection
    await connectDB();

    // 2. Start Express Server listening
    const server = app.listen(PORT, () => {
      console.log(
        `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
    });

    // Handle unhandled promise rejections gracefully
    process.on('unhandledRejection', (error, promise) => {
      console.error(`❌ Unhandled Rejection: ${error.message}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`❌ Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

startServer();
