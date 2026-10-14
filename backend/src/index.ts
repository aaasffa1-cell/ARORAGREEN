import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { authenticateSession } from './middleware/auth';
import { pool } from './db/pool';
import { getSmtpStatus, verifySmtpConnection } from './services/mailer';

import authRouter from './routes/auth.routes';
import tournamentsRouter from './routes/tournaments.routes';
import squadsRouter from './routes/squads.routes';
import registrationsRouter from './routes/registrations.routes';
import paymentsRouter from './routes/payments.routes';
import matchesRouter from './routes/matches.routes';
import resultsRouter from './routes/results.routes';
import notificationsRouter from './routes/notifications.routes';
import settingsRouter from './routes/settings.routes';
import adminRouter from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration supporting credentials (cookies) across localhost and Vercel domains
app.use(
  cors({
    origin: (origin: any, callback: any) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin serverless rewrites)
      if (!origin) return callback(null, true);

      const configuredOrigins = (process.env.FRONTEND_URL || '')
        .split(',')
        .map((o: string) => o.trim())
        .filter(Boolean);

      const isAllowed =
        origin === 'http://localhost:5173' ||
        origin === 'http://127.0.0.1:5173' ||
        configuredOrigins.includes(origin) ||
        origin.endsWith('.vercel.app');

      if (isAllowed) {
        return callback(null, true);
      }

      // Default allow with credentials in production
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Parsers
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Session Authentication Middleware
app.use(authenticateSession);

// Healthcheck
app.get(['/api/health', '/health', '/api', '/'], (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'ARORA ESPORTS API',
    environment: process.env.NODE_ENV || 'production',
    serverless: !!process.env.VERCEL,
    timestamp: new Date().toISOString(),
  });
});

// Database connectivity healthcheck
app.get(['/api/health/db', '/health/db'], async (req: Request, res: Response) => {
  try {
    const dbRes = await pool.query("SELECT current_database(), current_user, count(*)::int as table_count FROM information_schema.tables WHERE table_schema = 'public'");
    res.json({
      status: 'connected',
      database: dbRes.rows[0].current_database,
      user: dbRes.rows[0].current_user,
      table_count: dbRes.rows[0].table_count,
    });
  } catch (err: any) {
    const errorDetails = err.name === 'AggregateError' 
      ? (err.errors || []).map((e: any) => e.message || e.code).join(' | ') 
      : (err.message || String(err));
    res.status(500).json({
      status: 'error',
      name: err.name,
      message: errorDetails,
      tip: errorDetails.includes('ECONNREFUSED') ? 'DATABASE_URL is missing or pointing to localhost in environment variables' : undefined,
    });
  }
});

// SMTP connectivity healthcheck
app.get(['/api/health/smtp', '/health/smtp'], async (req: Request, res: Response) => {
  const status = getSmtpStatus();
  const verification = await verifySmtpConnection();
  res.json({
    smtp: status,
    connection_test: verification,
  });
});

// Mount Routes (supporting both /api/* and root rewrites)
app.use(['/api/auth', '/auth'], authRouter);
app.use(['/api/tournaments', '/tournaments'], tournamentsRouter);
app.use(['/api/squads', '/squads'], squadsRouter);
app.use(['/api/registrations', '/registrations'], registrationsRouter);
app.use(['/api/payments', '/payments'], paymentsRouter);
app.use(['/api/matches', '/matches'], matchesRouter);
app.use(['/api/results', '/results'], resultsRouter);
app.use(['/api/notifications', '/notifications'], notificationsRouter);
app.use(['/api/settings', '/settings'], settingsRouter);
app.use(['/api/admin', '/admin'], adminRouter);

// 404 handler for unmatched API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl || req.url}` });
});

// Centralized error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error occurred.',
  });
});

// In serverless environments (like Vercel), the app is exported and invoked by Vercel handlers
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 [ARORA ESPORTS] API Server running on port ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🎮 Frontend Origin: ${FRONTEND_URL}`);
    console.log(`======================================================\n`);
  });
}

export default app;
