/**
 * nutrition.js — Client-seitige Nährwert-Berechnung
 * Summen und Pro-Portion live aus Zutaten-Array errechnen,
 * sodass Korrekturen der Nutzer sofort wirken.
 */

/**
 * Berechnet Gesamt- und Pro-Portion-Werte aus dem Zutaten-Array.
 * @param {Array} zutaten - [{kcal, eiweiss, kh, fett}, ...]
 * @param {number} portionen
 * @returns {{ gesamt, pro_portion }}
 */
export function calcNutrition(zutaten, portionen) {
  const gesamt = zutaten.reduce(
    (acc, z) => ({
      kcal:    acc.kcal    + (parseFloat(z.kcal)    || 0),
      eiweiss: acc.eiweiss + (parseFloat(z.eiweiss) || 0),
      kh:      acc.kh      + (parseFloat(z.kh)      || 0),
      fett:    acc.fett    + (parseFloat(z.fett)     || 0),
    }),
    { kcal: 0, eiweiss: 0, kh: 0, fett: 0 }
  );

  const p = Math.max(1, portionen);
  const pro_portion = {
    kcal:    Math.round(gesamt.kcal    / p),
    eiweiss: Math.round((gesamt.eiweiss / p) * 10) / 10,
    kh:      Math.round((gesamt.kh      / p) * 10) / 10,
    fett:    Math.round((gesamt.fett    / p) * 10) / 10,
  };

  return {
    gesamt: {
      kcal:    Math.round(gesamt.kcal),
      eiweiss: Math.round(gesamt.eiweiss * 10) / 10,
      kh:      Math.round(gesamt.kh      * 10) / 10,
      fett:    Math.round(gesamt.fett    * 10) / 10,
    },
    pro_portion,
  };
}

/**
 * Makro-Anteile in % für den Balken (basierend auf Kalorien-Anteil)
 * Eiweiß: 4 kcal/g, KH: 4 kcal/g, Fett: 9 kcal/g
 */
export function calcMacroPercent(values) {
  const pKcal = (values.eiweiss || 0) * 4;
  const cKcal = (values.kh      || 0) * 4;
  const fKcal = (values.fett    || 0) * 9;
  const total = pKcal + cKcal + fKcal || 1;
  return {
    protein: Math.round((pKcal / total) * 100),
    carbs:   Math.round((cKcal / total) * 100),
    fat:     Math.round((fKcal / total) * 100),
  };
}
