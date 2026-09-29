/**
 * UTM Parameter Capture & Persistence
 * Automatically parses marketing UTM query parameters on initial page load
 * and stores them in sessionStorage for booking lead attribution.
 */

const UTM_STORAGE_KEY = 'athyka_utm';

export function initUtmCapture() {
  if (typeof window === 'undefined') return;

  try {
    const params = new URLSearchParams(window.location.search);
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const captured = {};
    let hasUtm = false;

    for (const key of utmKeys) {
      const val = params.get(key);
      if (val) {
        captured[key.replace('utm_', '')] = val;
        hasUtm = true;
      }
    }

    if (hasUtm) {
      const existing = getStoredUtm();
      const merged = { ...existing, ...captured, capturedAt: new Date().toISOString() };
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
    }
  } catch (err) {
    console.warn('[ATHYKA UTM] Could not parse UTM params:', err);
  }
}

export function getStoredUtm() {
  if (typeof window === 'undefined') return {};
  try {
    const data = sessionStorage.getItem(UTM_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (err) {
    return {};
  }
}
