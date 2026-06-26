/**
 * imageUtils.js — Clientseitige Bildverarbeitung
 *
 * • HEIC-Robustheit: versucht createImageBitmap, Fallback auf Original
 * • Verkleinert auf max 1100 px (längste Kante), JPEG q ≈ 0.82
 * • Gibt Data-URL zurück (für Vorschau + Base64-Upload)
 * • Erstellt ein kleines Thumbnail (150 px) als Karten-Vorschau
 */

const MAX_PX     = 1100;
const THUMB_PX   = 150;
const QUALITY    = 0.82;
const THUMB_QUAL = 0.75;

/**
 * Liest eine Datei als Data-URL und verkleinert sie.
 * @param {File} file
 * @returns {Promise<{ dataUrl: string, thumb: string }>}
 */
export async function processImage(file) {
  let bitmap;

  // Versuche createImageBitmap (funktioniert für HEIC in neueren Safari/Chrome)
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Fallback: wenn das Format nicht lesbar ist, gib sinnvolle Fehlermeldung
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      throw new Error(
        'HEIC-Bild konnte nicht geladen werden. Bitte konvertiere es in JPEG/PNG oder mache direkt in der App ein Foto.'
      );
    }
    throw new Error(
      `Das Bild „${file.name}" konnte nicht gelesen werden (Format: ${file.type || 'unbekannt'}).`
    );
  }

  const dataUrl = await resizeBitmap(bitmap, MAX_PX, QUALITY);
  const thumb   = await resizeBitmap(bitmap, THUMB_PX, THUMB_QUAL);
  bitmap.close?.();

  return { dataUrl, thumb };
}

/**
 * Skaliert ein ImageBitmap auf maxPx (längste Kante) und gibt eine JPEG Data-URL zurück.
 */
async function resizeBitmap(bitmap, maxPx, quality) {
  const { width, height } = bitmap;
  const scale = Math.min(1, maxPx / Math.max(width, height));
  const w = Math.round(width  * scale);
  const h = Math.round(height * scale);

  const canvas = new OffscreenCanvas(w, h);
  const ctx    = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob    = await canvas.convertToBlob({ type: 'image/jpeg', quality });
  return blobToDataUrl(blob);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Konnte Bild nicht lesen.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Extrahiert den Base64-Teil aus einer Data-URL.
 * @param {string} dataUrl
 * @returns {string} reiner Base64-String
 */
export function dataUrlToBase64(dataUrl) {
  return dataUrl.split(',')[1];
}
