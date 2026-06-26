import { calcMacroPercent } from './nutrition.js';

/**
 * NutritionCard — Signature-Element der App
 * Große kcal-Zahl + Makro-Balken + Makro-Kacheln
 */
export default function NutritionCard({ gesamt, pro_portion, view, onToggleView }) {
  const values = view === 'pro_portion' ? pro_portion : gesamt;
  const pct = calcMacroPercent(values);

  return (
    <div className="nutrition-card" role="region" aria-label="Nährwerte">
      {/* Gesamt / Pro Portion Toggle */}
      <div className="nutrition-card-toggle">
        <button
          className={`nutrition-toggle-btn${view === 'gesamt' ? ' active' : ''}`}
          onClick={() => onToggleView('gesamt')}
        >
          Gesamt
        </button>
        <button
          className={`nutrition-toggle-btn${view === 'pro_portion' ? ' active' : ''}`}
          onClick={() => onToggleView('pro_portion')}
        >
          Pro Portion
        </button>
      </div>

      {/* Große kcal-Zahl */}
      <div className="nutrition-kcal" aria-label={`${values.kcal} Kilokalorien`}>
        {Math.round(values.kcal).toLocaleString('de-DE')}
      </div>
      <div className="nutrition-kcal-label">KCAL</div>

      {/* Makro-Balken */}
      <div
        className="macro-bar"
        role="img"
        aria-label={`Makros: Eiweiß ${pct.protein}%, Kohlenhydrate ${pct.carbs}%, Fett ${pct.fat}%`}
      >
        <div className="macro-bar-segment macro-bar-protein" style={{ width: `${pct.protein}%` }} />
        <div className="macro-bar-segment macro-bar-carbs"   style={{ width: `${pct.carbs}%` }} />
        <div className="macro-bar-segment macro-bar-fat"     style={{ width: `${pct.fat}%` }} />
      </div>

      {/* Makro-Kacheln */}
      <div className="macro-tiles">
        <MacroTile
          color="var(--macro-protein)"
          value={values.eiweiss}
          label="Eiweiß"
        />
        <MacroTile
          color="var(--macro-carbs)"
          value={values.kh}
          label="Kohlenhydrate"
        />
        <MacroTile
          color="var(--macro-fat)"
          value={values.fett}
          label="Fett"
        />
      </div>

      {/* Schätzungs-Hinweis */}
      <div className="estimation-hint">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Nährwerte sind KI-Schätzungen — bitte nach Bedarf korrigieren.
      </div>
    </div>
  );
}

function MacroTile({ color, value, label }) {
  return (
    <div className="macro-tile">
      <div className="macro-tile-dot" style={{ background: color }} />
      <div className="macro-tile-value">{Number(value).toLocaleString('de-DE')}</div>
      <div className="macro-tile-unit">g</div>
      <div className="macro-tile-label">{label}</div>
    </div>
  );
}
