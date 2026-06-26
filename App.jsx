import { useState, useCallback } from 'react';
import {
  loadRecipes, saveRecipes, addRecipe, updateRecipe, deleteRecipe as deleteRec,
  loadCategories, saveCategories, addCategory as addCat, deleteCategory as deleteCat,
} from './storage.js';
import BottomTabBar    from './BottomTabBar.jsx';
import ScanScreen      from './ScanScreen.jsx';
import ReviewScreen    from './ReviewScreen.jsx';
import RecipesScreen   from './RecipesScreen.jsx';
import CategoriesScreen from './CategoriesScreen.jsx';
import Toast           from './Toast.jsx';

export default function App() {
  const [tab,          setTab]          = useState('scan');
  const [recipes,      setRecipes]      = useState(() => loadRecipes());
  const [categories,   setCategories]   = useState(() => loadCategories());
  const [reviewRecipe, setReviewRecipe] = useState(null); // Rezept in Prüfansicht
  const [toast,        setToast]        = useState(null); // { msg, key }

  const showToast = useCallback((msg) => {
    setToast({ msg, key: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }, []);

  // ── Rezept speichern (neu oder Update) ──────────────────────
  const handleSaveRecipe = useCallback((recipe) => {
    const existing = recipes.find(r => r.id === recipe.id);
    if (existing) {
      updateRecipe(recipe);
      setRecipes(loadRecipes());
      showToast('Rezept aktualisiert ✓');
    } else {
      addRecipe(recipe);
      setRecipes(loadRecipes());
      showToast('Rezept gespeichert ✓');
    }
    setReviewRecipe(null);
    setTab('recipes');
  }, [recipes, showToast]);

  // ── Rezept löschen ──────────────────────────────────────────
  const handleDeleteRecipe = useCallback((id) => {
    deleteRec(id);
    setRecipes(loadRecipes());
    showToast('Rezept gelöscht');
  }, [showToast]);

  // ── Kategorie anlegen ───────────────────────────────────────
  const handleAddCategory = useCallback((cat) => {
    addCat(cat);
    setCategories(loadCategories());
    showToast(`Kategorie „${cat.name}" angelegt`);
  }, [showToast]);

  // ── Kategorie löschen ───────────────────────────────────────
  const handleDeleteCategory = useCallback((id) => {
    deleteCat(id);
    setCategories(loadCategories());
    setRecipes(loadRecipes()); // catId wurde auf null gesetzt
    showToast('Kategorie gelöscht');
  }, [showToast]);

  // ── Review öffnen (auch aus Rezeptliste zum Bearbeiten) ─────
  const handleOpenReview = useCallback((recipe) => {
    setReviewRecipe(recipe);
    setTab('scan'); // Review liegt auf dem Scan-Tab
  }, []);

  return (
    <div className="app-shell">
      {/* Haupt-Screens */}
      {reviewRecipe ? (
        <ReviewScreen
          recipe={reviewRecipe}
          categories={categories}
          onSave={handleSaveRecipe}
          onDiscard={() => { setReviewRecipe(null); }}
          onAddCategory={handleAddCategory}
        />
      ) : tab === 'scan' ? (
        <ScanScreen
          onAnalyzed={(parsed) => setReviewRecipe(parsed)}
        />
      ) : tab === 'recipes' ? (
        <RecipesScreen
          recipes={recipes}
          categories={categories}
          onDelete={handleDeleteRecipe}
          onEdit={handleOpenReview}
        />
      ) : (
        <CategoriesScreen
          categories={categories}
          recipes={recipes}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}

      {/* Tab-Bar (immer sichtbar, außer Review) */}
      {!reviewRecipe && (
        <BottomTabBar active={tab} onChange={setTab} />
      )}

      {/* Toast */}
      {toast && <Toast key={toast.key} message={toast.msg} />}
    </div>
  );
}
