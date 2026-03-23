import express from 'express';
import { createServer as createViteServer } from 'vite';
import * as cheerio from 'cheerio';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/firebase-config', (req, res) => {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load firebase config' });
  }
});

const BookmarkSchema = z.object({
  url: z.string().url("URL non valido"),
});

app.post('/api/metadata', async (req, res) => {
  try {
    const { url } = BookmarkSchema.parse(req.body);
    
    // Fetch metadata
    const response = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' 
      } 
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || url;
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    let image = $('meta[property="og:image"]').attr('content') || '';
    let favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '/favicon.ico';

    // Resolve relative URLs
    const resolveUrl = (base: string, relative: string) => {
      if (!relative) return '';
      try { return new URL(relative, base).href; } catch { return relative; }
    };

    image = resolveUrl(url, image);
    favicon = resolveUrl(url, favicon);
    
    // Fallback favicon if relative failed or was just /favicon.ico
    if (favicon === '/favicon.ico') {
      favicon = resolveUrl(url, '/favicon.ico');
    }

    res.json({
      url,
      title: title.trim(),
      description: description.trim(),
      image,
      favicon,
      domain: new URL(url).hostname,
    });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(400).json({ error: 'Errore durante il recupero dei metadati. Verifica l\'URL.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
