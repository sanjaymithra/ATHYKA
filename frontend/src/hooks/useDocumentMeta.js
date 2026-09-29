import { useEffect } from 'react';

/**
 * Hook to manage page SEO title, description, and OpenGraph tags
 */
export function useDocumentMeta(meta = {}) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (meta.title) {
      document.title = meta.title;
    }

    if (meta.description) {
      let descMeta = document.querySelector('meta[name="description"]');
      if (!descMeta) {
        descMeta = document.createElement('meta');
        descMeta.setAttribute('name', 'description');
        document.head.appendChild(descMeta);
      }
      descMeta.setAttribute('content', meta.description);

      // OpenGraph description
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute('content', meta.description);
    }

    if (meta.title) {
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', meta.title);
    }
  }, [meta.title, meta.description]);
}
