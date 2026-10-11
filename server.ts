import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface VerifyRequest {
  url: string;
  sourceName?: string;
}

interface VerifyResponse {
  url: string;
  checkedAt: string;
  status: 'VERIFIED_REACHABLE' | 'CHECK_FAILED';
  httpCode: number;
  detectedTitle: string;
  lastModifiedHeader: string;
  errorMessage: string;
}

async function probeOfficialWebsite(targetUrl: string): Promise<VerifyResponse> {
  const checkedAt = new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        url: targetUrl,
        checkedAt,
        status: 'CHECK_FAILED',
        httpCode: 0,
        detectedTitle: '',
        lastModifiedHeader: '',
        errorMessage: 'Invalid protocol. Only HTTP/HTTPS official URLs are permitted.'
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8500);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'NextStepCareers-OfficialSourceVerifier/1.0 (+https://nextstepcareers.in)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const httpCode = response.status;
    const lastModifiedHeader = (response.headers.get('last-modified') || '').slice(0, 100);
    let detectedTitle = '';

    if (response.ok) {
      const htmlSnippet = (await response.text()).slice(0, 25000);
      const titleMatch = htmlSnippet.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        detectedTitle = titleMatch[1].replace(/\s+/g, ' ').trim().slice(0, 260);
      } else {
        detectedTitle = `HTTP ${httpCode} OK (No HTML <title> tag found)`;
      }
      return {
        url: targetUrl,
        checkedAt,
        status: 'VERIFIED_REACHABLE',
        httpCode,
        detectedTitle,
        lastModifiedHeader,
        errorMessage: ''
      };
    } else {
      return {
        url: targetUrl,
        checkedAt,
        status: 'CHECK_FAILED',
        httpCode,
        detectedTitle: '',
        lastModifiedHeader,
        errorMessage: `Server responded with HTTP ${httpCode} (${response.statusText || 'Non-200 status'})`
      };
    }
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const friendlyError = rawMsg.includes('aborted')
      ? 'Connection timed out after 8.5 seconds (source server did not respond in time).'
      : `Request failed: ${rawMsg.slice(0, 280)}`;
    return {
      url: targetUrl,
      checkedAt,
      status: 'CHECK_FAILED',
      httpCode: 0,
      detectedTitle: '',
      lastModifiedHeader: '',
      errorMessage: friendlyError
    };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '256kb' }));

  // Health & Backend Capability status endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'NextStep Careers Official Source Verification Service',
      timestamp: new Date().toISOString()
    });
  });

  // Live Server-Side Official Website Verification Endpoint
  app.post('/api/verify-source', async (req, res) => {
    const body = req.body as VerifyRequest;
    if (!body || typeof body.url !== 'string' || body.url.trim().length < 5) {
      res.status(400).json({ error: 'A valid official URL is required.' });
      return;
    }
    const result = await probeOfficialWebsite(body.url.trim());
    res.json(result);
  });

  // Batch Verification Endpoint for Multiple Official Portals
  app.post('/api/verify-batch', async (req, res) => {
    const { urls } = req.body as { urls?: string[] };
    if (!Array.isArray(urls) || urls.length === 0 || urls.length > 15) {
      res.status(400).json({ error: 'Provide an array of 1 to 15 official URLs.' });
      return;
    }
    const results = await Promise.all(urls.map(u => probeOfficialWebsite(String(u).trim())));
    res.json({ results });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NextStep Careers server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
