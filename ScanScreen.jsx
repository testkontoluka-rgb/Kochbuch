import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { processImage, dataUrlToBase64 } from '../utils/imageUtils.js';
import { IconCamera, IconText, IconLink, IconUpload, IconAlertCircle, IconX } from './Icons.jsx';

/**
 * ScanScreen — drei Eingabemodi: Bild, Text, Link
 */
export default function ScanScreen({ onAnalyzed }) {
  const [mode,    setMode]    = useState('bild');  // 'bild' | 'text' | 'link'
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Bild-Modus
  const [images,   setImages]   = useState([]); // [{ dataUrl, thumb, name }]
  const fileInputRef = useRef(null);

  // Text-Modus
  const [text, setText] = useState('');

  // Link-Modus
  const [linkUrl,  setLinkUrl]  = useState('');
  const [caption,  setCaption]  = useState('');  // geladene Caption
  const [linkReady, setLinkReady] = useState(false); // Caption geladen?

  const clearError = () => setError(null);

  // ── Bildverarbeitung ──────────────────────────────────────
  const handleFiles = useCallback(async (files) => {
    clearError();
    const results = [];
    for (const file of Array.from(files)) {
      try {
        const { dataUrl, thumb } = await processImage(file);
        results.push({ id: uuidv4(), dataUrl, thumb, name: file.name });
      } catch (err) {
        setError(err.message);
        return;
      }
    }
    setImages(prev => [...prev, ...results].slice(0, 5)); // max 5 Bilder
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // ── Caption laden (Link-Modus) ────────────────────────────
  const handleFetchCaption = async () => {
    if (!linkUrl.trim()) { setError('Bitte eine URL eingeben.'); return; }
    clearError();
    setLoading(true);
    setCaption('');
    setLinkReady(false);
    try {
      const res = await fetch('/api/fetch-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        // Graceful fallback: Caption konnte nicht geladen werden
        setMode('text');
        setError(
          data.error ||
          'Caption konnte nicht geladen werden — dieser Beitrag ist vermutlich privat oder Login-geschützt. Bitte füge die Caption manuell ein.'
        );
      } else {
        setCaption(data.caption);
        setLinkReady(true);
      }
    } catch {
      setMode('text');
      setError('Netzwerkfehler beim Laden der Caption. Bitte füge den Text manuell ein.');
    } finally {
      setLoading(false);
    }
  };

  // ── KI-Analyse aufrufen ───────────────────────────────────
  const handleAnalyze = async () => {
    clearError();

    // Validierung
    if (mode === 'bild' && images.length === 0) {
      setError('Bitte mindestens ein Foto oder Screenshot hochladen.');
      return;
    }
    if (mode === 'text' && text.trim().length < 10) {
      setError('Bitte einen längeren Rezepttext eingeben (mindestens 10 Zeichen).');
      return;
    }
    if (mode === 'link' && !linkReady && !caption) {
      setError('Bitte lade zuerst die Caption über den „Laden"-Button.');
      return;
    }

    setLoading(true);

    try {
      let body;
      if (mode === 'bild') {
        body = {
          type: 'images',
          images: images.map(img => ({
            base64: dataUrlToBase64(img.dataUrl),
            mimeType: 'image/jpeg',
          })),
        };
      } else {
        const inputText = mode === 'link' ? caption : text;
        body = { type: 'text', text: inputText };
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Serverfehler (${res.status})`);
      }

      if (data.fehler) {
        setError(`KI-Rückmeldung: ${data.fehler}`);
        return;
      }

      // Rezept-Objekt aufbauen
      const recipe = {
        id:        uuidv4(),
        titel:     data.titel     || 'Unbekanntes Rezept',
        portionen: data.portionen || 4,
        zutaten:   (data.zutaten  || []).map(z => ({
          id:      uuidv4(),
          name:    z.name    || '',
          menge:   z.menge   || '',
          kcal:    Number(z.kcal)    || 0,
          eiweiss: Number(z.eiweiss) || 0,
          kh:      Number(z.kh)      || 0,
          fett:    Number(z.fett)    || 0,
        })),
        anleitung: data.anleitung || [],
        gesamt:    data.gesamt    || { kcal: 0, eiweiss: 0, kh: 0, fett: 0 },
        pro_portion: data.pro_portion || { kcal: 0, eiweiss: 0, kh: 0, fett: 0 },
        catId:     null,
        thumb:     images[0]?.thumb || null,
        hinweis:   data.hinweis   || '',
        createdAt: Date.now(),
      };

      onAnalyzed(recipe);
      // State zurücksetzen
      setImages([]);
      setText('');
      setLinkUrl('');
      setCaption('');
      setLinkReady(false);

    } catch (err) {
      setError(err.message || 'Unbekannter Fehler bei der Analyse.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Kochbuch.</h1>
        <p>Rezept scannen und Nährwerte berechnen</p>
      </div>

      {/* Segmented Control */}
      <div className="segmented-control" role="tablist">
        {[
          { id: 'bild', label: '📷 Bild' },
          { id: 'text', label: '✏️ Text' },
          { id: 'link', label: '🔗 Link' },
        ].map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={mode === id}
            className={`segmented-btn${mode === id ? ' active' : ''}`}
            onClick={() => { setMode(id); clearError(); }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Fehler-Banner */}
      {error && (
        <div className="error-banner">
          <IconAlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}

      {/* Lade-Spinner */}
      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
          <p>
            {mode === 'link' && !linkReady
              ? 'Caption wird geladen…'
              : 'KI analysiert das Rezept…\nDas kann einen Moment dauern.'}
          </p>
        </div>
      ) : (
        <>
          {/* ── BILD-MODUS ── */}
          {mode === 'bild' && (
            <div className="input-area">
              {/* Kein capture-Attribut → Browser zeigt Auswahl: Kamera ODER Galerie */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,image/heic,image/heif"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div
                className="image-upload-area"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                aria-label="Bilder hochladen"
              >
                <IconUpload />
                <p>
                  <strong>Foto aufnehmen oder aus Galerie wählen</strong><br/>
                  JPEG, PNG, HEIC · bis zu 5 Bilder<br/>
                  <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                    Bilder werden vor dem Upload auf ~1100 px verkleinert
                  </span>
                </p>
                {/* Zusätzliche Buttons: explizit Kamera vs. Galerie */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '9px 16px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--primary)', color: 'white',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>
                    <input type="file" accept="image/*" capture="environment" multiple
                      style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files)} />
                    📷 Kamera
                  </label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '9px 16px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)', color: 'var(--text)',
                    border: '1.5px solid var(--border)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>
                    <input type="file" accept="image/*,image/heic,image/heif" multiple
                      style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files)} />
                    🖼️ Galerie
                  </label>
                </div>
              </div>

              {images.length > 0 && (
                <div className="image-preview-grid" style={{ marginTop: 12 }}>
                  {images.map((img) => (
                    <div key={img.id} className="image-preview-item">
                      <img src={img.dataUrl} alt={img.name} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImages(prev => prev.filter(i => i.id !== img.id));
                        }}
                        aria-label="Bild entfernen"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TEXT-MODUS ── */}
          {mode === 'text' && (
            <div className="input-area">
              <textarea
                className="text-input-field"
                placeholder="Rezept-Text oder Caption hier einfügen…&#10;&#10;Hashtags, Emojis und Werbetexte werden von der KI ignoriert."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                aria-label="Rezepttext"
              />
            </div>
          )}

          {/* ── LINK-MODUS ── */}
          {mode === 'link' && (
            <div className="input-area">
              <div className="link-input-wrap">
                <input
                  type="url"
                  className="link-input-field"
                  placeholder="https://www.instagram.com/p/… oder TikTok-Link"
                  value={linkUrl}
                  onChange={(e) => { setLinkUrl(e.target.value); setCaption(''); setLinkReady(false); }}
                  aria-label="Rezept-Link"
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchCaption()}
                />
                <button
                  className="btn-secondary"
                  onClick={handleFetchCaption}
                  disabled={!linkUrl.trim()}
                  style={{ flexShrink: 0, padding: '14px 16px' }}
                >
                  Laden
                </button>
              </div>

              {caption && (
                <div className="caption-preview">
                  <div className="caption-preview-label">Geladene Caption</div>
                  {caption}
                </div>
              )}

              <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 10, lineHeight: 1.5 }}>
                Funktioniert nur für <strong>öffentliche</strong> Beiträge.
                Bei privaten Beiträgen bitte Caption manuell im Text-Tab einfügen.
              </p>
            </div>
          )}

          {/* Analyse-Button */}
          <div className="scan-cta">
            <button
              className="btn-primary"
              onClick={handleAnalyze}
              disabled={
                (mode === 'bild' && images.length === 0) ||
                (mode === 'text' && text.trim().length < 10) ||
                (mode === 'link' && !linkReady)
              }
            >
              <span>✨</span>
              Rezept analysieren
            </button>
          </div>
        </>
      )}
    </div>
  );
}
