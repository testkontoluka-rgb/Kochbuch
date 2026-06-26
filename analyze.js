/**
 * Netlify Function: analyze
 * POST /api/analyze
 *
 * Verwendet Google Gemini (kostenlos via AI Studio).
 *
 * Umgebungsvariablen:
 *   GEMINI_API_KEY  — API-Key von aistudio.google.com (Pflicht, kostenlos)
 *   GEMINI_MODEL    — optional, Standard: gemini-1.5-flash
 */

const SYSTEM_PROMPT = `Du bist ein Ernährungsexperte und Koch. Du erhältst ein Rezept als Bild(er) ODER als Text/Caption (evtl. mit Hashtags/Emojis). Aufgabe:
1. Lies Titel und Zutaten mit Mengen aus (ignoriere Hashtags, Werbung, Beiwerk).
2. Erkenne die Portionenzahl, falls angegeben (sonst schätze sinnvoll, z. B. 4).
3. Schätze für JEDE Zutat realistische Nährwerte anhand üblicher Lebensmitteldaten (pro angegebener Menge): kcal, Eiweiß (g), Kohlenhydrate (g), Fett (g).
4. Berechne Gesamtsumme und Werte pro Portion.
5. Gib die Zubereitung als nummerierte Schrittliste ("anleitung") an. Es MUSS immer eine Anleitung dabei sein — fehlen Schritte in der Quelle, leite knappe, sinnvolle Schritte aus den Zutaten ab.

Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Markdown, ohne Erklärtext. Alle Zahlen als reine Zahlen (keine Einheiten im Zahlenfeld). Deutsche Zutatennamen. Format:
{"titel":"...","portionen":4,"zutaten":[{"name":"Mehl","menge":"200 g","kcal":728,"eiweiss":21,"kh":152,"fett":2}],"gesamt":{"kcal":0,"eiweiss":0,"kh":0,"fett":0},"pro_portion":{"kcal":0,"eiweiss":0,"kh":0,"fett":0},"anleitung":["Schritt 1","Schritt 2"],"hinweis":"kurzer Hinweis zu Annahmen, oder leer"}
Falls kein Rezept mit Mengenangaben erkennbar ist: {"fehler":"Kein Rezept mit Mengenangaben erkennbar."}
Gib kompaktes JSON ohne Zeilenumbrüche zurück und halte "hinweis" auf maximal 12 Wörter.`;

/**
 * Parst die LLM-Antwort robust: entfernt Markdown-Fences, sucht ersten {...}-Block
 */
function extractJSON(raw) {
  let cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Kein JSON-Objekt in der Antwort gefunden.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

/**
 * Ruft Gemini API auf (generateContent)
 */
async function callGemini(parts, model, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json', // erzwingt reines JSON
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API Fehler ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/**
 * Baut den Parts-Array je nach Eingabetyp auf
 */
function buildParts(body) {
  if (body.type === 'images') {
    const imageParts = body.images.map(img => ({
      inlineData: {
        mimeType: img.mimeType || 'image/jpeg',
        data: img.base64,
      },
    }));
    return [
      { text: 'Bitte analysiere das/die folgende(n) Bild(er) und extrahiere das Rezept als JSON:' },
      ...imageParts,
    ];
  } else {
    return [{ text: `Bitte analysiere folgenden Rezepttext und extrahiere das Rezept als JSON:\n\n${body.text}` }];
  }
}

/**
 * Mit einem automatischen Retry bei JSON-Parsefehler
 */
async function analyzeWithRetry(body, model, apiKey) {
  const parts = buildParts(body);
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw    = await callGemini(parts, model, apiKey);
      const parsed = extractJSON(raw);
      return parsed;
    } catch (err) {
      lastError = err;
      if (attempt === 1) console.warn(`Attempt ${attempt} failed: ${err.message} — retrying…`);
    }
  }
  throw lastError;
}

// ── Netlify Handler ──────────────────────────────────────────
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Nur POST erlaubt.' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY ist nicht konfiguriert.' }),
    };
  }

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Ungültiger JSON-Body.' }) };
  }

  if (!body.type || (body.type !== 'images' && body.type !== 'text')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Fehlender Parameter: type.' }) };
  }
  if (body.type === 'text' && (!body.text || body.text.trim().length < 5)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Kein Text übergeben.' }) };
  }
  if (body.type === 'images' && (!Array.isArray(body.images) || body.images.length === 0)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Keine Bilder übergeben.' }) };
  }

  try {
    const result = await analyzeWithRetry(body, model, apiKey);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error('analyze error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Analyse fehlgeschlagen: ${err.message}. Bitte erneut versuchen.` }),
    };
  }
};
