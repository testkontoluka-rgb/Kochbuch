/**
 * storage.js — Persistenz via localStorage
 * Für eine spätere Ausbaustufe (Supabase/Firebase-Sync) können die
 * Funktionen einfach gegen API-Calls ausgetauscht werden.
 */

const RECIPES_KEY    = 'kochbuch_recipes';
const CATEGORIES_KEY = 'kochbuch_categories';

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('localStorage write error:', e);
  }
}

// ── Recipes ──────────────────────────────────────────────────
export function loadRecipes()          { return read(RECIPES_KEY); }
export function saveRecipes(list)      { write(RECIPES_KEY, list); }

export function addRecipe(recipe) {
  const list = loadRecipes();
  list.unshift(recipe); // neuestes zuerst
  saveRecipes(list);
}

export function updateRecipe(recipe) {
  const list = loadRecipes().map(r => r.id === recipe.id ? recipe : r);
  saveRecipes(list);
}

export function deleteRecipe(id) {
  saveRecipes(loadRecipes().filter(r => r.id !== id));
}

// ── Categories ───────────────────────────────────────────────
export function loadCategories()       { return read(CATEGORIES_KEY); }
export function saveCategories(list)   { write(CATEGORIES_KEY, list); }

export function addCategory(cat) {
  const list = loadCategories();
  list.push(cat);
  saveCategories(list);
}

export function deleteCategory(id) {
  saveCategories(loadCategories().filter(c => c.id !== id));
  // Rezepte dieser Kategorie auf null setzen
  const recipes = loadRecipes().map(r => r.catId === id ? { ...r, catId: null } : r);
  saveRecipes(recipes);
}
