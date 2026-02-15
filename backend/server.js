/**
 * SyncScript Backend — Express Server
 *
 * Provides:
 *  - Redis-cached vault & source endpoints
 *  - Rate limiting (100 req / 15 min per IP)
 *  - Request logging
 *  - Realtime cache invalidation via Supabase subscription
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { rateLimiter } = require('./middleware/rateLimiter');
const { requestLogger } = require('./middleware/requestLogger');
const vaultController = require('./controllers/vaultController');
const { startRealtimeListener } = require('./services/realtimeService');

const app = express();
const PORT = process.env.PORT || 4000;

/* ------------------------------------------------------------------ */
/*  Global middleware                                                   */
/* ------------------------------------------------------------------ */

app.use(cors());
app.use(express.json());

// Structured request logging
app.use(requestLogger);

// HTTP access log (dev format)
app.use(morgan('dev'));

// Rate limiter — 100 requests per 15 minutes per IP
app.use(rateLimiter);

/* ------------------------------------------------------------------ */
/*  Routes                                                              */
/* ------------------------------------------------------------------ */

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Vault endpoints (cached via Redis)
app.get('/vault/:id', vaultController.getVault);
app.get('/vault/:id/sources', vaultController.getVaultSources);

/* ------------------------------------------------------------------ */
/*  Start server & realtime listener                                    */
/* ------------------------------------------------------------------ */

app.listen(PORT, () => {
  console.log(`[server] SyncScript backend running on http://localhost:${PORT}`);
  startRealtimeListener();
});

module.exports = app;
