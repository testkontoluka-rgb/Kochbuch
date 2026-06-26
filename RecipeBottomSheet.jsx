import { useState } from 'react';
import NutritionCard from './NutritionCard.jsx';
import { IconX, IconEdit, IconTrash } from './Icons.jsx';

/**
 * RecipeBottomSheet — Vollständige Rezeptdetail-Ansicht
 */
export default function RecipeBottomSheet({ recipe, onClose, onDelete, onEdit }) {
  const [nutritionView, setNutritionView] = useState('pro_portion');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(recipe.id);
    } else {
      setConfirmDelete(true);
      // Auto-Reset nach 3 s
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      className="sheet-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={recipe.titel}
    >
      <div className="sheet">
        <div className="sheet-handle" aria-hidden="true" />

        {/* Header */}
        <div className="sheet-header">
          <h2 className="sheet-header-title">{recipe.titel}</h2>
          <button className="sheet-close-btn" onClick={onClose} aria-label="Schließen">
            <IconX size={16} />
          </button>
        </div>

        {/* Meta-Badges */}
        <div className="sheet-meta-row" style={{ padding: '0 20px 4px' }}>
          <span className="sheet-badge">
            {recipe.portionen} {recipe.portionen === 1 ? 'Portion' : 'Portionen'}
          </span>
          <span className="sheet-badge">
            {recipe.zutaten.length} Zutaten
          </span>
          {recipe.createdAt && (
            <span className="sheet-badge">
              {new Date(recipe.createdAt).toLocaleDateString('de-DE')}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="sheet-body">
          {/* Nährwert-Karte */}
          <NutritionCard
            gesamt={recipe.gesamt}
            pro_portion={recipe.pro_portion}
            view={nutritionView}
            onToggleView={setNutritionView}
          />

          {/* Zutaten */}
          <div className="section-label" style={{ padding: 0, marginTop: 4, marginBottom: 12 }}>
            Zutaten
          </div>
          {recipe.zutaten.map((z, i) => (
            <div key={z.id || i} className="sheet-ingredient-row">
              <span className="sheet-ingredient-name">{z.name}</span>
              <span className="sheet-ingredient-menge">{z.menge}</span>
              <span className="sheet-ingredient-kcal">{z.kcal} kcal</span>
            </div>
          ))}

          {/* Zubereitung */}
          {recipe.anleitung && recipe.anleitung.length > 0 && (
            <>
              <div className="section-label" style={{ padding: 0, marginTop: 20, marginBottom: 12 }}>
                Zubereitung
              </div>
              {recipe.anleitung.map((schritt, i) => (
                <div key={i} className="sheet-step">
                  <span className="sheet-step-num">{i + 1}</span>
                  <span>{schritt}</span>
                </div>
              ))}
            </>
          )}

          {/* KI-Hinweis */}
          {recipe.hinweis && (
            <div className="hinweis-box" style={{ margin: '16px 0 0' }}>
              <span>💡</span>
              <span>{recipe.hinweis}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sheet-footer">
          <button
            className={confirmDelete ? 'btn-danger' : 'btn-secondary'}
            style={{ flex: 1 }}
            onClick={handleDelete}
          >
            <IconTrash size={14} style={{ marginRight: 4 }} />
            {confirmDelete ? 'Wirklich löschen?' : 'Löschen'}
          </button>
          <button
            className="btn-primary"
            style={{ flex: 2 }}
            onClick={() => onEdit(recipe)}
          >
            <IconEdit size={14} style={{ marginRight: 4 }} />
            Bearbeiten
          </button>
        </div>
      </div>
    </div>
  );
}
