import { getStoredUtm } from './utm';
import { track } from './analytics';

const PENDING_LEADS_KEY = 'athyka.leads.pending';

/**
 * Builds a stable lead submission object adhering to the admin ingestion contract
 */
export function createLeadObject(type, fields) {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const id = `lead_${timestamp}_${randomSuffix}`;

  return {
    id,
    type, // 'call' | 'workshop'
    fields,
    utm: getStoredUtm(),
    page: typeof window !== 'undefined' ? window.location.pathname : '/',
    createdAt: new Date().toISOString()
  };
}

/**
 * Queue a lead in localStorage if the network request fails
 */
export function queuePendingLead(lead) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PENDING_LEADS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push(lead);
    localStorage.setItem(PENDING_LEADS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('[ATHYKA Leads] Failed to queue lead in localStorage:', err);
  }
}

/**
 * Retry queued pending leads against an endpoint
 */
export async function retryPendingLeads(endpoint) {
  if (typeof window === 'undefined' || !endpoint) return;
  try {
    const raw = localStorage.getItem(PENDING_LEADS_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return;

    const remaining = [];
    for (const lead of list) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead)
        });
        if (!res.ok) remaining.push(lead);
      } catch (e) {
        remaining.push(lead);
      }
    }

    if (remaining.length === 0) {
      localStorage.removeItem(PENDING_LEADS_KEY);
    } else {
      localStorage.setItem(PENDING_LEADS_KEY, JSON.stringify(remaining));
    }
  } catch (err) {
    console.warn('[ATHYKA Leads] Error processing queued leads:', err);
  }
}

/**
 * Dispatches a lead to the API endpoint or falls back to a formatted mailto: URL
 */
export async function submitLead(type, fields, settings = {}) {
  const lead = createLeadObject(type, fields);
  track('booking_submit', { variant: type, id: lead.id });

  const endpoint = settings.leadEndpoint || import.meta.env?.VITE_LEAD_ENDPOINT;

  if (endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      });

      if (!response.ok) {
        throw new Error(`Endpoint returned status ${response.status}`);
      }

      return { success: true, method: 'api', lead };
    } catch (err) {
      console.warn('[ATHYKA Leads] API POST failed, queueing lead and preparing fallback:', err);
      queuePendingLead(lead);
    }
  }

  // Fallback to mailto link
  const email = settings.contactEmail || import.meta.env?.VITE_CONTACT_EMAIL || 'contact@athyka.com';
  const subject = type === 'call'
    ? `ATHYKA Discovery Call Inquiry — ${fields.name || 'Website Lead'}`
    : `ATHYKA Workshop Booking Request — ${fields.institution || 'Campus Lead'}`;

  const bodyLines = [
    `TYPE: ${type.toUpperCase()}`,
    `PAGE: ${lead.page}`,
    `TIMESTAMP: ${lead.createdAt}`,
    '----------------------------------------',
    ...Object.entries(fields).map(([k, v]) => `${k.toUpperCase()}: ${v}`),
    '----------------------------------------',
    'MARKETING ATTRIBUTION (UTM):',
    JSON.stringify(lead.utm, null, 2)
  ];

  const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

  // If in browser and no endpoint was set, trigger mailto client after a brief delay
  if (typeof window !== 'undefined' && !endpoint) {
    window.location.href = mailtoUrl;
  }

  return { success: true, method: endpoint ? 'queued' : 'mailto', mailtoUrl, lead };
}
