// Adapted from Glyph Portal © 2026 Christian Katzmann, MIT (origin: ktzm.dk).

/**
 * Finds the largest opaque square inside a glyph by rasterizing it at 3x scale
 * and running a 2D dynamic programming maximum inscribed square search.
 *
 * @param {string} char The character to rasterize (e.g. 'H')
 * @param {string} fontFamily Font family string
 * @param {number|string} fontWeight Font weight (e.g. 700)
 * @param {number} fontSize Font size in pixels (1x base size)
 * @returns {{ localX: number, localY: number, radius: number, size: number }}
 *   localX, localY: offset in 1x pixels from the text baseline insertion point (gx, baseline)
 *   radius: half of the largest inscribed square side length (in 1x pixels)
 */
export function interior(char, fontFamily, fontWeight = 700, fontSize = 140) {
  if (typeof document === 'undefined') {
    return { localX: 0, localY: -fontSize * 0.4, radius: fontSize * 0.15, size: fontSize * 0.3 };
  }

  const scale = 3;
  const targetSize = fontSize * scale;
  const canvas = document.createElement('canvas');
  // Adequate buffer around character
  const dim = Math.max(64, Math.ceil(targetSize * 1.6));
  canvas.width = dim;
  canvas.height = dim;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { localX: 0, localY: -fontSize * 0.4, radius: fontSize * 0.15, size: fontSize * 0.3 };
  }

  ctx.font = `${fontWeight} ${targetSize}px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  const m = ctx.measureText(char);
  const leftPad = Math.max(16, Math.ceil(m.actualBoundingBoxLeft || 0) + 16);
  const topPad = Math.max(16, Math.ceil(m.actualBoundingBoxAscent || targetSize * 0.8) + 16);

  ctx.fillStyle = '#000000';
  ctx.fillText(char, leftPad, topPad);

  const imgData = ctx.getImageData(0, 0, dim, dim);
  const data = imgData.data;

  // 2D DP for largest square of opaque pixels (alpha >= 160)
  const dp = new Int32Array(dim * dim);
  let maxSize = 0;
  let bestX = 0;
  let bestY = 0;

  for (let y = 0; y < dim; y++) {
    const rowOffset = y * dim;
    const prevRowOffset = (y - 1) * dim;
    for (let x = 0; x < dim; x++) {
      const alpha = data[(rowOffset + x) * 4 + 3];
      if (alpha >= 160) {
        if (x === 0 || y === 0) {
          dp[rowOffset + x] = 1;
        } else {
          const left = dp[rowOffset + (x - 1)];
          const top = dp[prevRowOffset + x];
          const diag = dp[prevRowOffset + (x - 1)];
          const s = Math.min(left, top, diag) + 1;
          dp[rowOffset + x] = s;
          if (s > maxSize) {
            maxSize = s;
            bestX = x;
            bestY = y;
          }
        }
      }
    }
  }

  if (maxSize <= 0) {
    return {
      localX: 0,
      localY: -fontSize * 0.4,
      radius: Math.max(6, fontSize * 0.1),
      size: Math.max(12, fontSize * 0.2)
    };
  }

  // Center of largest square in canvas coordinates
  const centerX = bestX - maxSize / 2 + 0.5;
  const centerY = bestY - maxSize / 2 + 0.5;

  // Relative to text origin (leftPad, topPad), scaled back to 1x
  const localX = (centerX - leftPad) / scale;
  const localY = (centerY - topPad) / scale;
  const radius = (maxSize / 2) / scale;

  return {
    localX,
    localY,
    radius,
    size: maxSize / scale
  };
}

// Memory cache for interior calculations
const patchCache = new Map();

/**
 * Finds the entry ink patch in container and page coordinates for a given layout.
 * Searches for entryChar (default 'H'); if tiny (< 6px radius), scans other glyphs.
 *
 * @param {object} layout TechText layout object from getLayout()
 * @param {string} entryChar Primary target char (default 'H')
 * @returns {{ x: number, y: number, radius: number, char: string, index: number }}
 */
export function findEntryPatch(layout, entryChar = 'H') {
  if (!layout || !layout.glyphs || layout.glyphs.length === 0) {
    return { x: 0, y: 0, radius: 20, char: entryChar, index: 0 };
  }

  const { containerRect, baseline, fontFamily, fontWeight, size, glyphs } = layout;

  const cacheKey = `${entryChar}|${fontFamily}|${fontWeight}|${Math.round(size)}|${glyphs.map(g => g.char).join('')}`;
  if (patchCache.has(cacheKey)) {
    const cached = patchCache.get(cacheKey);
    // Update containerRect-based page coordinates
    return {
      ...cached,
      x: containerRect.left + cached.containerX,
      y: containerRect.top + cached.containerY
    };
  }

  // Look for target char
  let targetGlyph = glyphs.find(g => g.char === entryChar);
  let glyphIndex = glyphs.findIndex(g => g.char === entryChar);

  let patch = null;
  if (targetGlyph) {
    patch = interior(targetGlyph.char, fontFamily, fontWeight, size);
  }

  // Fallback to letter with largest radius if patch is tiny or target not found
  if (!patch || patch.radius < 6) {
    let bestRadius = 0;
    let bestGlyph = glyphs[0];
    let bestIdx = 0;
    let bestPatch = patch;

    for (let i = 0; i < glyphs.length; i++) {
      const g = glyphs[i];
      if (!g.char.trim()) continue;
      const p = interior(g.char, fontFamily, fontWeight, size);
      if (p.radius > bestRadius) {
        bestRadius = p.radius;
        bestGlyph = g;
        bestIdx = i;
        bestPatch = p;
      }
    }

    targetGlyph = bestGlyph;
    glyphIndex = bestIdx;
    patch = bestPatch;
  }

  const containerX = targetGlyph.x + targetGlyph.offset.x + patch.localX;
  const containerY = baseline + targetGlyph.offset.y + patch.localY;

  const result = {
    containerX,
    containerY,
    x: (containerRect?.left || 0) + containerX,
    y: (containerRect?.top || 0) + containerY,
    radius: patch.radius,
    char: targetGlyph.char,
    index: glyphIndex
  };

  patchCache.set(cacheKey, result);
  return result;
}
