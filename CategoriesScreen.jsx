import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { IconTrash } from './Icons.jsx';

const EMOJIS = ['🍽️','🥗','🍝','🍲','🥘','🍳','🥞','🥐','🍰','🎂','🍪','🥦','🥕','🍖','🍗','🐟','🥩','🌮','🌯','🥙','🧆','🥚','🧀','🥑','🍅','🫕','🥣','🫙','🧁','🍜'];

/**
 * CategoriesScreen — Kategorien verwalten
 * Mobil-optimiert: gestapeltes Layout, breite Touch-Flächen
 */
export default function CategoriesScreen({ categories, recipes, onAddCategory, onDeleteCategory }) {
  const [selectedEmoji, setSelectedEmoji] = useState('🍽️');
  const [name, setName]                   = useState('');
  const [confirmId, setConfirmId]         = useState(null);

  const recipeCountFor = (catId) => recipes.filter(r => r.catId === catId).length;

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddCategory({ id: uuidv4(), name: name.trim(), emoji: selectedEmoji });
    setName('');
    setSelectedEmoji('🍽️');
  };

  const handleDeleteClick = (id) => {
    if (confirmId === id) {
      onDeleteCategory(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 3000);
    }
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Kategorien</h1>
        <p>Rezepte nach Themen sortieren</p>
      </div>

      <div className="categories-screen">
        {/* ── Neue Kategorie anlegen ── */}
        <div className="add-category-card">
          <h3>Neue Kategorie</h3>

          {/* Emoji-Auswahl (horizontal scrollbar) */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 8 }}>
            Emoji wählen
          </div>
          <div className="emoji-picker-row">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className={`emoji-option${selectedEmoji === e ? ' selected' : ''}`}
                onClick={() => setSelectedEmoji(e)}
                aria-label={`Emoji ${e}`}
                aria-pressed={selectedEmoji === e}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Name-Feld */}
          <input
            type="text"
            className="category-name-input"
            placeholder="Kategoriename (z. B. Frühstück, Meal-Prep…)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            aria-label="Kategoriename"
          />

          {/* Add-Button — durchgehend */}
          <button
            className="btn-primary"
            onClick={handleAdd}
            disabled={!name.trim()}
          >
            + Kategorie hinzufügen
          </button>
        </div>

        {/* ── Kategorieliste ── */}
        {categories.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 30 }}>
            <div className="empty-state-icon">🏷️</div>
            <h3>Noch keine Kategorien</h3>
            <p>Lege deine erste Kategorie an, um Rezepte zu sortieren.</p>
          </div>
        ) : (
          <div className="category-list">
            {categories.map((cat) => {
              const count = recipeCountFor(cat.id);
              return (
                <div key={cat.id} className="category-item">
                  <span className="category-item-emoji">{cat.emoji}</span>
                  <div className="category-item-info">
                    <div className="category-item-name">{cat.name}</div>
                    <div className="category-item-count">
                      {count === 0
                        ? 'Keine Rezepte'
                        : `${count} ${count === 1 ? 'Rezept' : 'Rezepte'}`}
                    </div>
                  </div>
                  <button
                    className={confirmId === cat.id ? 'btn-danger' : 'btn-icon'}
                    style={{ padding: confirmId === cat.id ? '8px 12px' : undefined, fontSize: 13 }}
                    onClick={() => handleDeleteClick(cat.id)}
                    aria-label={confirmId === cat.id ? 'Wirklich löschen?' : `${cat.name} löschen`}
                  >
                    {confirmId === cat.id ? 'Löschen?' : <IconTrash size={16} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {categories.length > 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 12, lineHeight: 1.6 }}>
            Beim Löschen einer Kategorie werden zugehörige Rezepte <em>nicht</em> gelöscht —
            sie werden in „Ohne Kategorie" verschoben.
          </p>
        )}
      </div>
    </div>
  );
}
