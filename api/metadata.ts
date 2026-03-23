import * as cheerio from 'cheerio';
import { z } from 'zod';

const BookmarkSchema = z.object({
  url: z.string().url("URL non valido"),
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { url } = BookmarkSchema.parse(body);
    
    // Fetch metadata
    const response = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(8000) // 8 second timeout
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

    res.status(200).json({
      url,
      title: title.trim(),
      description: description.trim(),
      image,
      favicon,
      domain: new URL(url).hostname,
    });
  } catch (error: any) {
    console.error('Error fetching metadata:', error);
    res.status(400).json({ error: `Errore durante il recupero dei metadati. Dettagli: ${error.message || String(error)}` });
  }
}
