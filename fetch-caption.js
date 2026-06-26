/**
 * Netlify Function: fetch-caption
 * POST /api/fetch-caption
 *
 * Lädt serverseitig die Caption eines öffentlichen Instagram- oder TikTok-Beitrags.
 * Kein CORS-Problem, kein API-Key im Client.
 *
 * Strategie:
 *   TikTok  → oEmbed-API  (https://www.tiktok.com/oembed?url=...)
 *   Instagram / generisch → Seiten-HTML laden und og:description / og:title parsen
 *
 * Bekannte Grenzen:
 *   • Funktioniert nur für öffentliche Beiträge
 *   • Instagram liefert seit ~2023 oft sehr kurze og:description
 *   • Private Beiträge / Login-Pflicht → Fehler → Frontend fällt auf Text-Modus zurück
 */

const MIN_CAPTION_LEN = 25; // Kürzere Texte gelten als nicht brauchbar

/**
 * HTML-Entities dekodieren (amp, lt, gt, quot, apos, numerisch)
 */
function decodeEntities(str) {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g,   (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .trim();
}

/**
 * Meta-Tag-Wert aus HTML extrahieren (property oder name)
 */
function extractMeta(html, property) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeEntities(m[1]);
  }
  return null;
}

/**
 * TikTok: oEmbed API
 */
async function fetchTikTok(url) {
  const oembed = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  const res    = await fetch(oembed, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KochbuchBot/1.0)' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`TikTok oEmbed ${res.status}`);
  const data = await res.json();
  // `title` enthält in der Regel die Caption
  const caption = data.title || data.author_name || '';
  if (caption.length < MIN_CAPTION_LEN) throw new Error('TikTok-Caption zu kurz oder leer');
  return caption;
}

/**
 * Generisch (Instagram & andere): Seite laden, og:description lesen
 */
async function fetchGeneric(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} beim Laden der Seite`);

  // Nur die ersten 80 KB lesen (Meta-Tags stehen im <head>)
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let html = '';
  let done = false;

  while (!done && html.length < 80_000) {
    const chunk = await reader.read();
    done  = chunk.done;
    if (chunk.value) html += decoder.decode(chunk.value, { stream: true });
  }

  // Versuche og:description, dann og:title
  const caption =
    extractMeta(html, 'og:description') ||
    extractMeta(html, 'twitter:description') ||
    extractMeta(html, 'og:title') ||
    null;

  if (!caption || caption.length < MIN_CAPTION_LEN) {
    throw new Error(
      'Kein ausreichender Beschreibungstext gefunden. Der Beitrag ist möglicherweise privat oder Login-geschützt.'
    );
  }

  return caption;
}

// ── Netlify Handler ──────────────────────────────────────────
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Nur POST erlaubt.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ungültiger JSON-Body.' }) };
  }

  const { url } = body;
  if (!url || typeof url !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Fehlender Parameter: url.' }) };
  }

  const trimmedUrl = url.trim();

  // URL-Validierung
  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ungültige URL.' }) };
  }

  const hostname = parsedUrl.hostname.replace(/^www\./, '');

  try {
    let caption;

    if (hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com')) {
      caption = await fetchTikTok(trimmedUrl);
    } else {
      // Instagram, Pinterest, generisch
      caption = await fetchGeneric(trimmedUrl);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption }),
    };

  } catch (err) {
    console.warn('fetch-caption error:', err.message);
    return {
      statusCode: 422, // Unprocessable — Caption nicht abrufbar
      body: JSON.stringify({
        error:
          err.message ||
          'Caption konnte nicht geladen werden. Bitte füge den Text manuell ein.',
      }),
    };
  }
};
