import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { calcNutrition } from '../utils/nutrition.js';
import NutritionCard from './NutritionCard.jsx';
import {
  IconArrowLeft, IconPlus, IconTrash, IconChevronRight, IconX,
} from './Icons.jsx';

/**
 * ReviewScreen — Prüfen und Bearbeiten eines geparsten Rezepts
 */
export default function ReviewScreen({ recipe, categories, onSave, onDiscard, onAddCategory }) {
  const [draft,        setDraft]        = useState(() => deepClone(recipe));
  const [nutritionView, setNutritionView] = useState('pro_portion');
  const [expandedIdx,  setExpandedIdx]  = useState(null); // geöffnete Zutat
  const [showNewCat,   setShowNewCat]   = useState(false);
  const [newCatName,   setNewCatName]   = useState('');
  const [newCatEmoji,  setNewCatEmoji]  = useState('🍽️');

  // Nährwerte live neu berechnen wenn Zutaten/Portionen sich ändern
  useEffect(() => {
    const { gesamt, pro_portion } = calcNutrition(draft.zutaten, draft.portionen);
    setDraft(prev => ({ ...prev, gesamt, pro_portion }));
  }, [draft.zutaten, draft.portionen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Draft-Helfer ────────────────────────────────────────
  const set = (field, value) => setDraft(prev => ({ ...prev, [field]: value }));

  // Zutat ändern
  const updateZutat = (idx, field, value) => {
    const z = [...draft.zutaten];
    z[idx] = { ...z[idx], [field]: field === 'name' || field === 'menge' ? value : (parseFloat(value) || 0) };
    set('zutaten', z);
  };

  const removeZutat = (idx) => {
    set('zutaten', draft.zutaten.filter((_, i) => i !== idx));
    if (expandedIdx === idx) setExpandedIdx(null);
  };

  const addZutat = () => {
    const newZ = { id: uuidv4(), name: '', menge: '', kcal: 0, eiweiss: 0, kh: 0, fett: 0 };
    set('zutaten', [...draft.zutaten, newZ]);
    setExpandedIdx(draft.zutaten.length); // neu hinzugefügte Zeile direkt aufklappen
  };

  // Schritt ändern
  const updateSchritt = (idx, value) => {
    const a = [...draft.anleitung];
    a[idx] = value;
    set('anleitung', a);
  };

  const removeSchritt = (idx) => {
    set('anleitung', draft.anleitung.filter((_, i) => i !== idx));
  };

  const addSchritt = () => {
    set('anleitung', [...draft.anleitung, '']);
  };

  // Kategorie
  const handleCreateCategory = useCallback(() => {
    if (!newCatName.trim()) return;
    const cat = { id: uuidv4(), name: newCatName.trim(), emoji: newCatEmoji };
    onAddCategory(cat);
    set('catId', cat.id);
    setShowNewCat(false);
    setNewCatName('');
    setNewCatEmoji('🍽️');
  }, [newCatName, newCatEmoji, onAddCategory]);

  // Speichern
  const handleSave = () => {
    const trimmed = { ...draft, titel: draft.titel.trim() || 'Unbenanntes Rezept' };
    onSave(trimmed);
  };

  return (
    <div className="screen review-screen">
      {/* Header: Zurück + Titel */}
      <div className="review-header">
        <button className="review-back-btn" onClick={onDiscard} aria-label="Zurück">
          <IconArrowLeft size={18} />
        </button>
        <input
          className="review-title-field"
          value={draft.titel}
          onChange={(e) => set('titel', e.target.value)}
          placeholder="Rezepttitel"
          aria-label="Rezepttitel"
        />
      </div>

      {/* Nutrition Card */}
      <NutritionCard
        gesamt={draft.gesamt}
        pro_portion={draft.pro_portion}
        view={nutritionView}
        onToggleView={setNutritionView}
      />

      {/* Portionen */}
      <div className="section-label">Portionen</div>
      <div className="portions-row">
        <span className="portions-label">Anzahl Portionen</span>
        <div className="portions-stepper">
          <button
            onClick={() => set('portionen', Math.max(1, draft.portionen - 1))}
            disabled={draft.portionen <= 1}
            aria-label="Portionen verringern"
          >−</button>
          <span className="portions-value">{draft.portionen}</span>
          <button
            onClick={() => set('portionen', draft.portionen + 1)}
            aria-label="Portionen erhöhen"
          >+</button>
        </div>
      </div>

      {/* Kategorie */}
      <div className="section-label">Kategorie</div>
      <div className="category-chips">
        <button
          className={`category-chip${!draft.catId ? ' active' : ''}`}
          onClick={() => set('catId', null)}
        >
          Keine
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-chip${draft.catId === cat.id ? ' active' : ''}`}
            onClick={() => set('catId', cat.id)}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
        <button
          className="category-chip category-chip-new"
          onClick={() => setShowNewCat(s => !s)}
        >
          <IconPlus size={12} /> Neu
        </button>
      </div>

      {/* Neue Kategorie inline anlegen */}
      {showNewCat && (
        <div style={{ padding: '12px 20px 0', animation: 'fadeIn 0.15s ease' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <EmojiPickerMini selected={newCatEmoji} onSelect={setNewCatEmoji} />
            <input
              className="category-name-input"
              style={{ marginTop: 10 }}
              placeholder="Kategoriename (z. B. Frühstück)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
              autoFocus
            />
            <button
              className="btn-primary"
              onClick={handleCreateCategory}
              disabled={!newCatName.trim()}
            >
              Kategorie anlegen
            </button>
          </div>
        </div>
      )}

      {/* Zutaten */}
      <div className="section-label">Zutaten</div>
      <div className="ingredient-list">
        {draft.zutaten.map((z, idx) => (
          <div key={z.id || idx} className="ingredient-row">
            <div
              className="ingredient-row-main"
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            >
              <span>{z.name || <em style={{ color: 'var(--text-light)' }}>Neue Zutat</em>}</span>
              <span className="ingredient-menge">{z.menge}</span>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{z.kcal} kcal</span>
              <IconChevronRight
                className={`ingredient-expand-icon${expandedIdx === idx ? ' open' : ''}`}
              />
            </div>

            {expandedIdx === idx && (
              <>
                <div className="ingredient-row-inputs">
                  <div className="ingredient-input-group full-width">
                    <label htmlFor={`zutat-name-${idx}`}>Zutat</label>
                    <input
                      id={`zutat-name-${idx}`}
                      className="ingredient-input"
                      value={z.name}
                      onChange={(e) => updateZutat(idx, 'name', e.target.value)}
                      placeholder="Name"
                    />
                  </div>
                  <div className="ingredient-input-group full-width">
                    <label htmlFor={`zutat-menge-${idx}`}>Menge</label>
                    <input
                      id={`zutat-menge-${idx}`}
                      className="ingredient-input"
                      value={z.menge}
                      onChange={(e) => updateZutat(idx, 'menge', e.target.value)}
                      placeholder="z. B. 200 g"
                    />
                  </div>
                  <div className="ingredient-input-group">
                    <label htmlFor={`zutat-kcal-${idx}`}>kcal</label>
                    <input id={`zutat-kcal-${idx}`} type="number" min="0" className="ingredient-input"
                      value={z.kcal} onChange={(e) => updateZutat(idx, 'kcal', e.target.value)} />
                  </div>
                  <div className="ingredient-input-group">
                    <label htmlFor={`zutat-eiweiss-${idx}`}>Eiweiß (g)</label>
                    <input id={`zutat-eiweiss-${idx}`} type="number" min="0" className="ingredient-input"
                      value={z.eiweiss} onChange={(e) => updateZutat(idx, 'eiweiss', e.target.value)} />
                  </div>
                  <div className="ingredient-input-group">
                    <label htmlFor={`zutat-kh-${idx}`}>KH (g)</label>
                    <input id={`zutat-kh-${idx}`} type="number" min="0" className="ingredient-input"
                      value={z.kh} onChange={(e) => updateZutat(idx, 'kh', e.target.value)} />
                  </div>
                  <div className="ingredient-input-group">
                    <label htmlFor={`zutat-fett-${idx}`}>Fett (g)</label>
                    <input id={`zutat-fett-${idx}`} type="number" min="0" className="ingredient-input"
                      value={z.fett} onChange={(e) => updateZutat(idx, 'fett', e.target.value)} />
                  </div>
                </div>
                <div className="ingredient-row-actions">
                  <button className="btn-danger" style={{ padding: '8px 14px', fontSize: 13 }}
                    onClick={() => removeZutat(idx)}>
                    <IconTrash size={13} style={{ marginRight: 5 }} /> Zutat löschen
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <button className="btn-add-row" style={{ marginLeft: 20, marginTop: 8 }} onClick={addZutat}>
        <IconPlus size={16} /> Zutat hinzufügen
      </button>

      {/* Zubereitung */}
      <div className="section-label">Zubereitung</div>
      <div className="anleitung-list">
        {draft.anleitung.map((schritt, idx) => (
          <div key={idx} className="anleitung-item">
            <textarea
              className="anleitung-textarea"
              value={schritt}
              onChange={(e) => updateSchritt(idx, e.target.value)}
              placeholder={`Schritt ${idx + 1}…`}
              rows={2}
              aria-label={`Schritt ${idx + 1}`}
            />
            <button
              className="anleitung-remove-btn"
              onClick={() => removeSchritt(idx)}
              aria-label="Schritt löschen"
            >
              <IconX size={16} />
            </button>
          </div>
        ))}
      </div>
      <button className="btn-add-row" style={{ marginLeft: 20, marginTop: 8 }} onClick={addSchritt}>
        <IconPlus size={16} /> Schritt hinzufügen
      </button>

      {/* KI-Hinweis */}
      {draft.hinweis && (
        <div className="hinweis-box">
          <span>💡</span>
          <span>{draft.hinweis}</span>
        </div>
      )}

      {/* Speichern / Verwerfen */}
      <div className="save-actions">
        <button className="btn-secondary" style={{ flex: 1 }} onClick={onDiscard}>Verwerfen</button>
        <button className="btn-primary"   style={{ flex: 2 }} onClick={handleSave}>Speichern</button>
      </div>
    </div>
  );
}

// Mini Emoji-Picker
const EMOJIS = ['🍽️','🥗','🍝','🍲','🥘','🍳','🥞','🥐','🍰','🎂','🍪','🥦','🥕','🍖','🍗','🐟','🥩','🌮','🌯','🥙','🧆','🥚','🧀','🥑','🍅'];

function EmojiPickerMini({ selected, onSelect }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 8 }}>
        Emoji wählen
      </div>
      <div className="emoji-picker-row">
        {EMOJIS.map(e => (
          <button
            key={e}
            className={`emoji-option${selected === e ? ' selected' : ''}`}
            onClick={() => onSelect(e)}
            type="button"
            aria-label={`Emoji ${e}`}
            aria-pressed={selected === e}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
