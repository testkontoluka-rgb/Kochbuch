import { useState } from 'react';
import RecipeBottomSheet from './RecipeBottomSheet.jsx';

/**
 * RecipesScreen — Rezepte nach Kategorie gruppiert
 */
export default function RecipesScreen({ recipes, categories, onDelete, onEdit }) {
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Rezepte nach Kategorie gruppieren
  const grouped = groupByCategory(recipes, categories);

  if (recipes.length === 0) {
    return (
      <div className="screen">
        <div className="screen-header">
          <h1>Meine Rezepte</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📖</div>
          <h3>Noch keine Rezepte</h3>
          <p>Scanne dein erstes Rezept über den Scannen-Tab — mit Foto, Text oder Link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Meine Rezepte</h1>
        <p>{recipes.length} {recipes.length === 1 ? 'Rezept' : 'Rezepte'}</p>
      </div>

      {grouped.map(({ category, items }) => (
        <div key={category?.id ?? '__none'} className="recipes-section">
          <div className="recipes-section-header">
            <h2>
              {category ? `${category.emoji} ${category.name}` : 'Ohne Kategorie'}
            </h2>
            <span className="recipes-section-badge">{items.length}</span>
          </div>
          <div className="recipe-cards">
            {items.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => setSelectedRecipe(recipe)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Bottom Sheet Detail */}
      {selectedRecipe && (
        <RecipeBottomSheet
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onDelete={(id) => {
            onDelete(id);
            setSelectedRecipe(null);
          }}
          onEdit={(r) => {
            setSelectedRecipe(null);
            onEdit(r);
          }}
        />
      )}
    </div>
  );
}

function RecipeCard({ recipe, onClick }) {
  return (
    <article
      className="recipe-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={recipe.titel}
    >
      <div className="recipe-card-thumb">
        {recipe.thumb
          ? <img src={recipe.thumb} alt="" loading="lazy" />
          : <span className="recipe-card-thumb-placeholder">🍽️</span>
        }
      </div>
      <div className="recipe-card-body">
        <h3 className="recipe-card-title">{recipe.titel}</h3>
        <p className="recipe-card-meta">
          {recipe.portionen} {recipe.portionen === 1 ? 'Portion' : 'Portionen'} ·{' '}
          {recipe.zutaten.length} {recipe.zutaten.length === 1 ? 'Zutat' : 'Zutaten'}
        </p>
        <p className="recipe-card-kcal">
          {Math.round(recipe.pro_portion.kcal).toLocaleString('de-DE')} kcal / Portion
        </p>
      </div>
    </article>
  );
}

// ── Hilfsfunktion ──────────────────────────────────────────────
function groupByCategory(recipes, categories) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const groups  = {};

  for (const recipe of recipes) {
    const key = recipe.catId ?? '__none';
    if (!groups[key]) groups[key] = { category: catMap[key] ?? null, items: [] };
    groups[key].items.push(recipe);
  }

  // Sortierung: benannte Kategorien alphabetisch, dann „Ohne Kategorie"
  return Object.values(groups).sort((a, b) => {
    if (!a.category && b.category)  return 1;
    if (a.category  && !b.category) return -1;
    if (!a.category && !b.category) return 0;
    return a.category.name.localeCompare(b.category.name, 'de');
  });
}
