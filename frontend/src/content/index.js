import { useState, useEffect, useRef } from 'react';
import siteSettingsData from './data/siteSettings.json';
import digitalServicesData from './data/digitalServices.json';
import workshopsData from './data/workshops.json';
import philosophyData from './data/philosophy.json';
import {
  validatePhilosophyQuote,
  validateService,
  validateProblem,
  validateProcessStep,
  validateProject,
  validateFormat,
  validatePastWorkshop,
  validateFaqItem,
  validateTeamMember,
  validateProof,
  sanitizeCollection
} from './validators';

const STATIC_REGISTRY = {
  siteSettings: siteSettingsData,
  digitalServices: digitalServicesData,
  workshops: workshopsData,
  philosophy: philosophyData
};

/**
 * Validates and sanitizes a complete page/content payload
 */
export function sanitizePayload(key, payload, isProd = false) {
  if (!payload || typeof payload !== 'object') {
    return STATIC_REGISTRY[key] || {};
  }

  const result = { ...payload };

  if (key === 'philosophy') {
    if (Array.isArray(payload.quotes)) {
      const validQuotes = payload.quotes.filter(q => validatePhilosophyQuote(q));
      result.quotes = validQuotes.length > 0 ? validQuotes : STATIC_REGISTRY.philosophy.quotes;
      if (isProd) {
        result.quotes = result.quotes.filter(q => q.status === 'published');
      }
      result.quotes.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    }
    return result;
  }

  if (key === 'digitalServices') {
    if (payload.problems?.items) {
      result.problems = {
        ...payload.problems,
        items: sanitizeCollection(payload.problems.items, validateProblem, isProd)
      };
    }
    if (payload.services?.items) {
      result.services = {
        ...payload.services,
        items: sanitizeCollection(payload.services.items, validateService, isProd)
      };
    }
    if (payload.work?.projects) {
      result.work = {
        ...payload.work,
        projects: sanitizeCollection(payload.work.projects, validateProject, isProd)
      };
    }
    if (payload.process?.items) {
      result.process = {
        ...payload.process,
        items: sanitizeCollection(payload.process.items, validateProcessStep, isProd)
      };
    }
    return result;
  }

  if (key === 'workshops') {
    if (payload.problems?.items) {
      result.problems = {
        ...payload.problems,
        items: sanitizeCollection(payload.problems.items, validateProblem, isProd)
      };
    }
    if (payload.formats?.items) {
      result.formats = {
        ...payload.formats,
        items: sanitizeCollection(payload.formats.items, validateFormat, isProd)
      };
    }
    if (payload.work?.pastWorkshops) {
      result.work = {
        ...payload.work,
        pastWorkshops: sanitizeCollection(payload.work.pastWorkshops, validatePastWorkshop, isProd)
      };
    }
    if (payload.about?.team) {
      result.about = {
        ...payload.about,
        team: sanitizeCollection(payload.about.team, validateTeamMember, isProd),
        proof: sanitizeCollection(payload.about.proof || [], validateProof, isProd)
      };
    }
    return result;
  }

  if (key === 'siteSettings') {
    if (payload.faq) {
      result.faq = sanitizeCollection(payload.faq, validateFaqItem, isProd);
    }
    return result;
  }

  return result;
}

/**
 * Static bundled content source
 */
export class StaticSource {
  async fetchContent(key, isProd = false) {
    const raw = STATIC_REGISTRY[key] || {};
    return sanitizePayload(key, raw, isProd);
  }
}

/**
 * Remote API content source with 3s timeout
 */
export class ApiSource {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async fetchContent(key, isProd = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`${this.baseUrl}/content/${key}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Content API error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      return sanitizePayload(key, json, isProd);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`[ATHYKA Content] Failed to fetch "${key}" from API, falling back to static snapshot:`, err.message);
      return new StaticSource().fetchContent(key, isProd);
    }
  }
}

// Global active source dispatcher
function getActiveSource() {
  // Support dev-time mock API or env-configured endpoint
  if (typeof window !== 'undefined' && window.__ATHYKA_MOCK_CONTENT?.[window.__ATHYKA_CURRENT_KEY]) {
    return {
      async fetchContent(key, isProd) {
        return sanitizePayload(key, window.__ATHYKA_MOCK_CONTENT[key], isProd);
      }
    };
  }

  const apiBase = import.meta.env?.VITE_CONTENT_API;
  if (apiBase) {
    return new ApiSource(apiBase);
  }

  return new StaticSource();
}

/**
 * Async content getter
 */
export async function getContent(key) {
  const isProd = Boolean(import.meta.env?.PROD);
  const source = getActiveSource();
  return source.fetchContent(key, isProd);
}

// In-memory memory cache for SWR
const memoryCache = new Map();

// Event bus for remote updates
const updateSubscribers = new Set();
export function notifyContentUpdate(key) {
  updateSubscribers.forEach(cb => cb(key));
}

/**
 * Internal base SWR hook
 */
function useBaseContent(key) {
  const isProd = Boolean(import.meta.env?.PROD);

  const [data, setData] = useState(() => {
    if (memoryCache.has(key)) {
      return memoryCache.get(key);
    }
    const initial = sanitizePayload(key, STATIC_REGISTRY[key] || {}, isProd);
    memoryCache.set(key, initial);
    return initial;
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const revalidate = async () => {
      try {
        if (typeof window !== 'undefined') {
          window.__ATHYKA_CURRENT_KEY = key;
        }
        const source = getActiveSource();
        const isApiOrMock = (typeof window !== 'undefined' && window.__ATHYKA_MOCK_CONTENT) ||
          Boolean(import.meta.env?.VITE_CONTENT_API);

        if (isApiOrMock) {
          const fresh = await source.fetchContent(key, isProd);
          if (isMountedRef.current && fresh) {
            memoryCache.set(key, fresh);
            setData(fresh);
          }
        }
      } catch (err) {
        console.warn(`[useContent] Revalidation failed for "${key}":`, err);
      }
    };

    revalidate();

    const onUpdate = (updatedKey) => {
      if (updatedKey === key || updatedKey === '*') {
        revalidate();
      }
    };
    updateSubscribers.add(onUpdate);

    return () => {
      isMountedRef.current = false;
      updateSubscribers.delete(onUpdate);
    };
  }, [key, isProd]);

  return data;
}

/**
 * Enhanced content hook with support for collections and querying
 */
export function useContent(key, options = {}) {
  const baseKey = key === 'projects' ? 'digitalServices' : (key === 'pastWorkshops' ? 'workshops' : key);
  const data = useBaseContent(baseKey);

  if (key === 'projects') {
    const all = data.work?.projects || [];
    const { page = 1, pageSize = 12, filters = {} } = options;

    const filtered = all.filter(p => {
      if (filters.service && !p.services?.includes(filters.service)) return false;
      if (filters.industry && p.industry !== filters.industry) return false;
      if (filters.year && String(p.year) !== String(filters.year)) return false;
      if (filters.q) {
        const query = filters.q.toLowerCase().trim();
        const searchable = `${p.name} ${p.client} ${p.challenge} ${p.approach} ${p.result} ${p.outcome}`.toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      return true;
    });

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const validPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
    const startIdx = (validPage - 1) * pageSize;
    const items = filtered.slice(startIdx, startIdx + pageSize);

    const services = Array.from(new Set(all.flatMap(p => p.services || []))).sort();
    const industries = Array.from(new Set(all.map(p => p.industry).filter(Boolean))).sort();
    const years = Array.from(new Set(all.map(p => p.year).filter(Boolean))).sort((a, b) => b - a);

    return {
      items,
      allItems: filtered,
      totalCount,
      totalPages,
      page: validPage,
      pageSize,
      availableFilters: { services, industries, years }
    };
  }

  if (key === 'pastWorkshops') {
    const all = data.work?.pastWorkshops || [];
    const { page = 1, pageSize = 12, filters = {} } = options;

    const filtered = all.filter(w => {
      if (filters.topic && w.topic !== filters.topic) return false;
      if (filters.institutionType && w.institutionType !== filters.institutionType) return false;
      if (filters.year && String(w.year) !== String(filters.year)) return false;
      if (filters.q) {
        const query = filters.q.toLowerCase().trim();
        const searchable = `${w.institution} ${w.city} ${w.topicTitle} ${w.challenge} ${w.outcomes}`.toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      return true;
    });

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const validPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
    const startIdx = (validPage - 1) * pageSize;
    const items = filtered.slice(startIdx, startIdx + pageSize);

    const topics = Array.from(new Set(all.map(w => w.topic).filter(Boolean))).sort();
    const institutionTypes = Array.from(new Set(all.map(w => w.institutionType).filter(Boolean))).sort();
    const years = Array.from(new Set(all.map(w => w.year).filter(Boolean))).sort((a, b) => b - a);

    return {
      items,
      allItems: filtered,
      totalCount,
      totalPages,
      page: validPage,
      pageSize,
      availableFilters: { topics, institutionTypes, years }
    };
  }

  return data;
}

// Attach dev helpers to window for automated testing
if (typeof window !== 'undefined') {
  window.__athykaContent = {
    getContent,
    setMockContent: (key, mockData) => {
      window.__ATHYKA_MOCK_CONTENT = window.__ATHYKA_MOCK_CONTENT || {};
      window.__ATHYKA_MOCK_CONTENT[key] = mockData;
      memoryCache.delete(key);
      notifyContentUpdate(key);
    },
    resetMockContent: () => {
      window.__ATHYKA_MOCK_CONTENT = null;
      memoryCache.clear();
      notifyContentUpdate('*');
    }
  };
}
