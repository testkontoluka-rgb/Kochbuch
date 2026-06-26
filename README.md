# Kochbuch. 🍽️

> Rezepte scannen · Nährwerte berechnen · Kategorien anlegen

Mobile-first Web-App. Foto, Caption oder Link rein → KI liest Titel, Zutaten, Anleitung und Nährwerte aus → prüfen, korrigieren, speichern.

---

## Schnellstart (lokal)

### 1. Voraussetzungen
- Node.js ≥ 18
- Netlify CLI (`npm i -g netlify-cli`)
- OpenAI API-Key (https://platform.openai.com/api-keys)

### 2. Projekt aufsetzen

```bash
git clone <dein-repo> kochbuch
cd kochbuch
npm install
```

### 3. Umgebungsvariablen anlegen

```bash
cp .env.example .env
# .env öffnen und OPENAI_API_KEY eintragen
```

`.env`:
```
OPENAI_API_KEY=sk-...
# Optional:
# OPENAI_MODEL=gpt-4o   (Standard: gpt-4o-mini, günstiger)
```

### 4. Lokal starten

```bash
npm run dev
# → http://localhost:3000
```

`netlify dev` startet Vite + Netlify Functions gleichzeitig.  
Die API-Endpunkte laufen unter `/api/analyze` und `/api/fetch-caption`.

---

## Auf Netlify deployen

### Option A — Netlify CLI (empfohlen)

```bash
netlify login
netlify init          # neues Site anlegen oder vorhandene verknüpfen
netlify env:set OPENAI_API_KEY sk-...
netlify env:set OPENAI_MODEL gpt-4o-mini
netlify deploy --prod
```

### Option B — GitHub + Netlify UI

1. Repo auf GitHub pushen
2. netlify.com → „Add new site" → „Import from Git"
3. Build-Einstellungen werden aus `netlify.toml` übernommen:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. **Site settings → Environment variables** → `OPENAI_API_KEY` + optional `OPENAI_MODEL` eintragen
5. „Deploy site"

---

## Auf Vercel deployen (Alternative)

Vercel erwartet API-Routes statt Netlify Functions.  
Verschiebe `netlify/functions/analyze.js` → `api/analyze.js`  
und `netlify/functions/fetch-caption.js` → `api/fetch-caption.js`  
und passe den Export-Stil an:

```js
// api/analyze.js (Vercel)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Nur POST' });
  // ... gleiche Logik wie im Netlify-Handler
  res.json(result);
}
```

Dann: `vercel deploy` oder über die Vercel UI mit GitHub verbinden.  
Umgebungsvariablen in **Vercel → Settings → Environment Variables** eintragen.

---

## Projektstruktur

```
kochbuch/
├── index.html                    # App-Einstieg
├── vite.config.js
├── netlify.toml                  # Build + Redirect-Regeln
├── package.json
├── .env.example                  # Vorlage für API-Keys
│
├── netlify/functions/
│   ├── analyze.js                # POST /api/analyze  → LLM-Analyse
│   └── fetch-caption.js          # POST /api/fetch-caption → Caption scrapen
│
├── public/
│   └── manifest.json             # PWA-Manifest
│
└── src/
    ├── main.jsx
    ├── App.jsx                   # Routing, State, Persistenz
    ├── styles/
    │   └── global.css            # Design-System, alle Styles
    ├── utils/
    │   ├── storage.js            # localStorage (Rezepte + Kategorien)
    │   ├── nutrition.js          # live kcal/Makro-Berechnung
    │   └── imageUtils.js         # Bild-Resize, HEIC-Handling
    └── components/
        ├── Icons.jsx
        ├── BottomTabBar.jsx
        ├── Toast.jsx
        ├── NutritionCard.jsx     # Signature-Element: kcal + Makro-Balken
        ├── ScanScreen.jsx        # Bild / Text / Link Eingabe
        ├── ReviewScreen.jsx      # Prüfen + Bearbeiten
        ├── RecipesScreen.jsx     # Rezeptliste nach Kategorien
        ├── RecipeBottomSheet.jsx # Detailansicht
        └── CategoriesScreen.jsx  # Kategorien verwalten
```

---

## Kosten (Orientierung)

| Modell | ~Kosten pro Rezept-Analyse |
|---|---|
| gpt-4o-mini | ~0,002 € (Text) / ~0,01 € (Bild) |
| gpt-4o | ~0,01 € (Text) / ~0,05 € (Bild) |

Empfehlung: **gpt-4o-mini** für den Alltag. Bei schlechten OCR-Ergebnissen auf gpt-4o wechseln.

---

## Bekannte Grenzen

### Instagram / TikTok Caption-Scraping
- Funktioniert nur für **öffentliche** Beiträge ohne Login-Pflicht.
- Instagram liefert `og:description` manchmal nur mit Teaser (ab ~2023 stärker eingeschränkt). Bei fehlender Caption → automatischer Fallback auf manuellen Text-Modus.
- TikTok oEmbed ist verlässlicher, enthält aber manchmal nur den Titel statt der vollen Caption.

### Nährwert-Genauigkeit
- Alle Werte sind **KI-Schätzungen** auf Basis typischer Lebensmitteldaten.
- Ohne Produktangaben (z. B. genaue Marke, Fettgehalt) können Abweichungen von ±20 % entstehen.
- Werte sind im Review-Screen vollständig editierbar.

### HEIC-Bilder
- `createImageBitmap` unterstützt HEIC in Safari (iOS 17+) und neueren Chromium-Versionen.
- Bei nicht unterstützten Browsern: klare Fehlermeldung + Empfehlung, das Bild zuerst in JPEG/PNG zu konvertieren.

### Persistenz
- Daten liegen nur im **localStorage des jeweiligen Browsers**.
- Kein geräteübergreifender Sync. Löscht man den Browser-Speicher, sind Rezepte weg.

---

## Ausbaustufen (nicht enthalten, aber skizziert)

### 1. Geräteübergreifende Synchronisierung
Supabase oder Firebase Auth + Realtime Database einbinden.  
`src/utils/storage.js` gegen API-Calls austauschen — der Rest der App bleibt gleich.

### 2. Video-Transkription (TikTok/Reels)
Das wäre ein eigenes, deutlich größeres Modul:
1. **Video-Download** serverseitig (yt-dlp oder TikTok oEmbed video_url)
2. **Audio-Extraktion** mit ffmpeg
3. **Transkription** mit OpenAI Whisper (`audio.transcriptions.create`)
4. Ergebnis-Text in die bestehende `analyze`-Function übergeben

Aufwand: +2–3 Serverless Functions, deutlich höhere API-Kosten (~0,006 $/Minute Audio).
