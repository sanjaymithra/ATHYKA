// Central Unified Animation Loop Scheduler
// Replaces multiple uncoordinated rAF loops with a single loop,
// visibility culling, adaptive quality scaling, and tab visibility freeze.

const animations = new Map();
let rafId = null;
let lastTime = 0;
let isLoopRunning = false;

// Adaptive Quality State
let qualityScale = 1.0; // 1.0 -> 0.75 -> 0.5
let fpsCap = 60; // 60 -> 45 -> 30
let movingAvgFrameTime = 16.67;
let highFrameTimeDuration = 0;
let lowFrameTimeDuration = 0;

function computeAdaptiveQuality(dt) {
  // Clamp delta to avoid massive spikes skewing moving average
  const clampedDt = Math.min(dt, 100);
  movingAvgFrameTime = movingAvgFrameTime * 0.9 + clampedDt * 0.1;

  if (movingAvgFrameTime > 20) {
    highFrameTimeDuration += dt;
    lowFrameTimeDuration = 0;

    if (highFrameTimeDuration >= 1000) {
      highFrameTimeDuration = 0;
      if (qualityScale > 0.75) {
        qualityScale = 0.75;
      } else if (qualityScale > 0.5) {
        qualityScale = 0.5;
        fpsCap = 45;
      } else if (fpsCap > 30) {
        fpsCap = 30;
      }
    }
  } else if (movingAvgFrameTime < 12) {
    lowFrameTimeDuration += dt;
    highFrameTimeDuration = 0;

    if (lowFrameTimeDuration >= 5000) {
      lowFrameTimeDuration = 0;
      if (fpsCap < 45) {
        fpsCap = 45;
      } else if (fpsCap < 60) {
        fpsCap = 60;
      } else if (qualityScale < 0.75) {
        qualityScale = 0.75;
      } else if (qualityScale < 1.0) {
        qualityScale = 1.0;
      }
    }
  } else {
    highFrameTimeDuration = 0;
    lowFrameTimeDuration = 0;
  }
}

function tick(now) {
  if (!isLoopRunning) return;

  const dt = lastTime ? now - lastTime : 16.67;
  lastTime = now;

  computeAdaptiveQuality(dt);

  // Run registered animations in priority order
  const sorted = Array.from(animations.values()).sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const item of sorted) {
    // Check visibility predicate
    if (item.getVisible && !item.getVisible()) {
      continue;
    }

    // Check FPS cap
    const targetFps = Math.min(item.fps || 60, fpsCap);
    const minInterval = 1000 / targetFps - 1.0; // small tolerance
    if (now - (item.lastRun || 0) < minInterval) {
      continue;
    }

    item.lastRun = now;
    try {
      item.callback(now, dt, qualityScale);
    } catch (err) {
      console.error(`Error in animation loop [${item.id}]:`, err);
    }
  }

  rafId = requestAnimationFrame(tick);
}

function startLoop() {
  if (isLoopRunning) return;
  if (typeof window === 'undefined') return;
  isLoopRunning = true;
  lastTime = performance.now();
  rafId = requestAnimationFrame(tick);
}

function stopLoop() {
  isLoopRunning = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

// Handle tab visibility: freeze when tab is hidden, resume when visible
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopLoop();
    } else {
      if (animations.size > 0) {
        startLoop();
      }
    }
  });
}

/**
 * Register an animation callback with the central loop scheduler.
 * @param {string} id Unique identifier
 * @param {function} callback (now, dt, qualityScale) => void
 * @param {object} options { getVisible?: () => boolean, fps?: number, priority?: number }
 * @returns {function} Unsubscribe function
 */
export function registerAnimation(id, callback, options = {}) {
  animations.set(id, {
    id,
    callback,
    getVisible: options.getVisible || null,
    fps: options.fps || 60,
    priority: options.priority || 0,
    lastRun: 0
  });

  if (!isLoopRunning && animations.size > 0 && typeof document !== 'undefined' && !document.hidden) {
    startLoop();
  }

  return () => unregisterAnimation(id);
}

/**
 * Unregister an animation callback.
 * @param {string} id
 */
export function unregisterAnimation(id) {
  animations.delete(id);
  if (animations.size === 0) {
    stopLoop();
  }
}

/**
 * Get current adaptive quality scale (1.0, 0.75, or 0.5)
 */
export function getQualityScale() {
  return qualityScale;
}

/**
 * Get current DPR capped at maxCap (default 1.5) and scaled by adaptive quality
 */
export function getCurrentDPR(maxCap = 1.5) {
  if (typeof window === 'undefined') return 1;
  const rawDpr = window.devicePixelRatio || 1;
  return Math.min(rawDpr, maxCap) * qualityScale;
}

/**
 * Get live stats for profiling and monitoring
 */
export function getLoopStats() {
  return {
    activeAnimations: animations.size,
    isLoopRunning,
    movingAvgFrameTime,
    qualityScale,
    fpsCap
  };
}
