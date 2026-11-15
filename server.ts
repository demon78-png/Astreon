import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createApiApp } from './src/server/apiApp.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Process-level safety guards to prevent pre-warming crashes
process.on('uncaughtException', (err: any) => {
  if (err?.code === 'EADDRINUSE') {
    console.warn('[ASTREON Server] Handled EADDRINUSE conflict on port:', err.port);
    return;
  }
  console.error('[ASTREON Server] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[ASTREON Server] Unhandled Rejection:', reason);
});

const app = createApiApp();

// Determine port:
// In AI Studio / Cloud Run, Nginx binds to 8080 and proxies traffic to the app on port 3000.
// If process.env.PORT is 8080, the Node.js server must bind to 3000 to avoid EADDRINUSE.
const defaultAppPort = process.env.DEFAULT_APP_PORT ? parseInt(process.env.DEFAULT_APP_PORT, 10) : 3000;
let cliPort: number | undefined;
const portIdx = process.argv.indexOf('--port');
if (portIdx !== -1 && process.argv[portIdx + 1]) {
  const parsed = parseInt(process.argv[portIdx + 1], 10);
  if (!isNaN(parsed) && parsed !== 8080) cliPort = parsed;
}

let PORT = defaultAppPort;
if (cliPort) {
  PORT = cliPort;
} else if (process.env.APP_PORT) {
  PORT = parseInt(process.env.APP_PORT, 10);
} else if (process.env.PORT && parseInt(process.env.PORT, 10) !== 8080) {
  PORT = parseInt(process.env.PORT, 10);
}

const isProduction = process.env.NODE_ENV === 'production';

// ======================== FRONTEND VITE MOUNT ========================

async function startServer() {
  try {
    const distPath = path.join(__dirname, 'dist');
    const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

    if (isProduction && hasDist) {
      console.log('[ASTREON] Serving production static bundle from /dist');
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.log('[ASTREON] Mounting Vite middleware mode');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false
        },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[ASTREON] Server running successfully at http://0.0.0.0:${PORT}`);
    });

    server.on('error', (err: any) => {
      if (err?.code === 'EADDRINUSE') {
        console.warn(`[ASTREON] Port ${PORT} already occupied. Retrying on port 3000...`);
        if (PORT !== 3000) {
          PORT = 3000;
          const fallbackServer = app.listen(PORT, '0.0.0.0', () => {
            console.log(`[ASTREON] Server fallback active at http://0.0.0.0:${PORT}`);
          });
          fallbackServer.on('error', (fallbackErr) => {
            console.error('[ASTREON] Fallback server listen error:', fallbackErr);
            process.exit(1);
          });
        } else {
          console.error('[ASTREON] Primary port 3000 already in use.');
          process.exit(1);
        }
      } else {
        console.error('[ASTREON] Server listen error:', err);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('[ASTREON] Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
