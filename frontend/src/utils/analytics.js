/**
 * Lightweight Analytics Tracking Stub
 * Emits debug events locally and acts as the future integration point for
 * production telemetry (PostHog, Google Analytics, Plausible, etc.).
 */
export function track(event, props = {}) {
  const payload = {
    event,
    props,
    path: typeof window !== 'undefined' ? window.location.pathname : '',
    timestamp: new Date().toISOString()
  };

  if (typeof window !== 'undefined' && window.__ATHYKA_TRACK_LOG) {
    window.__ATHYKA_TRACK_LOG.push(payload);
  }

  // Debug log in dev / browser console
  console.debug(`[ATHYKA Analytics] ${event}:`, props);
}

if (typeof window !== 'undefined') {
  window.__ATHYKA_TRACK_LOG = window.__ATHYKA_TRACK_LOG || [];
  window.athykaTrack = track;
}
