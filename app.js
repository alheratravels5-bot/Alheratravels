import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check & diagnostic API endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'AL-HERA TRAVELS ERP & Portal',
    timestamp: new Date().toISOString(),
    node_version: process.version,
    port: PORT,
  });
});

// Serve static assets from the 'dist' directory
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  // Static assets with caching
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
  }));

  // Handle client-side Single Page Application (SPA) routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Helpful diagnostic page if dist folder is missing
  app.get('*', (req, res) => {
    res.status(503).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Al-Hera Travels - Server Ready</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0F1E36; color: #fff; text-align: center; }
            .card { background: #162a4d; padding: 40px; border-radius: 16px; border: 1px solid #d97706; max-width: 520px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            h1 { color: #f59e0b; margin-top: 0; font-size: 24px; }
            p { font-size: 14px; line-height: 1.6; color: #cbd5e1; }
            code { background: #0b1424; padding: 4px 8px; border-radius: 4px; color: #38bdf8; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>AL-HERA TRAVELS</h1>
            <p><strong>Node.js Server is running successfully on Namecheap!</strong></p>
            <p>Please make sure the <code>dist/</code> folder containing built production assets is present in your application root directory.</p>
          </div>
        </body>
      </html>
    `);
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AL-HERA TRAVELS] Production Server running on port ${PORT}`);
});
