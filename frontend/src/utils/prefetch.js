/**
 * Route prefetching utility
 * Warms up React.lazy dynamic imports on hover, focus, and touchstart
 */

const PREFETCH_MAP = {
  '/digital-services': () => import('../pages/digital-services/DigitalServicesLanding'),
  '/digital-services/work': () => import('../pages/digital-services/WorkIndexPage'),
  '/digital-services/services': () => import('../pages/digital-services/ServicesIndexPage'),
  '/digital-services/contact': () => import('../pages/digital-services/ContactPage'),
  '/workshops': () => import('../pages/workshops/WorkshopsLanding'),
  '/workshops/work': () => import('../pages/workshops/WorkshopsWorkIndexPage'),
  '/workshops/about': () => import('../pages/workshops/WorkshopsAboutPage'),
  '/workshops/book': () => import('../pages/workshops/WorkshopsBookPage')
};

const prefetched = new Set();

export function prefetchRoute(path) {
  if (!path) return;
  const base = Object.keys(PREFETCH_MAP).find(k => path.startsWith(k));
  if (base && !prefetched.has(base)) {
    prefetched.add(base);
    try {
      PREFETCH_MAP[base]();
    } catch {
      // Ignore prefetch error
    }
  }
}
