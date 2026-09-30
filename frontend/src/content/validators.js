/**
 * ATHYKA Content Validators
 * Hand-written, zero-dependency validation for all admin collections.
 * Corrupted or invalid records are logged with console.warn and skipped so
 * the UI never crashes.
 */

/**
 * Validates a single Philosophy Quote.
 * Contract:
 * - exactly 2 lines (array of 2 strings)
 * - each line <= 20 characters (excluding asterisks)
 * - at most one *accent* word across the entire quote
 */
export function validatePhilosophyQuote(quote) {
  if (!quote || typeof quote !== 'object') {
    console.warn('[ATHYKA Validation] Invalid quote object:', quote);
    return false;
  }

  if (!quote.id || typeof quote.id !== 'string') {
    console.warn('[ATHYKA Validation] Quote missing valid id:', quote);
    return false;
  }

  if (!Array.isArray(quote.lines) || quote.lines.length !== 2) {
    console.warn(`[ATHYKA Validation] Quote "${quote.id}" must contain exactly 2 lines:`, quote.lines);
    return false;
  }

  for (let i = 0; i < 2; i++) {
    const line = quote.lines[i];
    if (typeof line !== 'string') {
      console.warn(`[ATHYKA Validation] Quote "${quote.id}" line ${i} is not a string:`, line);
      return false;
    }
    // Clean asterisks to test readable length
    const cleanLine = line.replace(/\*/g, '').trim();
    if (cleanLine.length > 20) {
      console.warn(`[ATHYKA Validation] Quote "${quote.id}" line ${i} exceeds 20 characters (${cleanLine.length} chars): "${cleanLine}"`);
      return false;
    }
  }

  // Count asterisks markers
  const fullText = quote.lines.join(' ');
  const accentMatches = fullText.match(/\*[^*]+\*/g) || [];
  if (accentMatches.length > 1) {
    console.warn(`[ATHYKA Validation] Quote "${quote.id}" has ${accentMatches.length} accents (max 1 allowed):`, quote.lines);
    return false;
  }

  return true;
}

export function validateService(item) {
  if (!item || typeof item !== 'object') return false;
  if (!item.id || typeof item.id !== 'string') return false;
  if (!item.kicker || typeof item.kicker !== 'string') return false;
  if (!item.title || typeof item.title !== 'string') return false;
  if (!item.challenge || typeof item.challenge !== 'string') return false;
  if (!item.body || typeof item.body !== 'string') return false;
  if (!Array.isArray(item.solves)) return false;
  return true;
}

export function validateProblem(item) {
  if (!item || typeof item !== 'object') return false;
  if (!item.id || typeof item.id !== 'string') return false;
  if (!item.provocation || typeof item.provocation !== 'string') return false;
  if (!item.solution || typeof item.solution !== 'string') return false;
  return true;
}

export function validateProcessStep(item) {
  if (!item || typeof item !== 'object') return false;
  if (!item.id || typeof item.id !== 'string') return false;
  if (!item.title || typeof item.title !== 'string') return false;
  if (!item.body || typeof item.body !== 'string') return false;
  return true;
}

export function validateProject(item) {
  if (!item || typeof item !== 'object') return false;
  if (!item.id || typeof item.id !== 'string') return false;
  if (!item.name || typeof item.name !== 'string') return false;
  if (!item.challenge || typeof item.challenge !== 'string') return false;
  return true;
}

export function validateFormat(item) {
  if (!item || typeof item !== 'object') return false;
  if (!item.id || typeof item.id !== 'string') return false;
  if (!item.name || typeof item.name !== 'string') return false;
  if (!item.duration || typeof item.duration !== 'string') return false;
  return true;
}

export function validatePastWorkshop(item) {
  if (!item || typeof item !== 'object') return false;
  if (!item.id || typeof item.id !== 'string') return false;
  if (!item.institution || typeof item.institution !== 'string') return false;
  return true;
}

export function validateFaqItem(item) {
  if (!item || typeof item !== 'object') return false;
  if (!item.id || typeof item.id !== 'string') return false;
  if (!item.question || typeof item.question !== 'string') return false;
  if (!item.answer || typeof item.answer !== 'string') return false;
  return true;
}

export function validateTeamMember(item) {
  if (!item || typeof item !== 'object') return false;
  if (!item.id || typeof item.id !== 'string') return false;
  if (!item.name || typeof item.name !== 'string') return false;
  if (!item.role || typeof item.role !== 'string') return false;
  return true;
}

export function validateProof(item) {
  if (!item || typeof item !== 'object') return false;
  if (!item.id || typeof item.id !== 'string') return false;
  if (!item.value || typeof item.value !== 'string') return false;
  if (!item.label || typeof item.label !== 'string') return false;
  return true;
}

/**
 * Filter an array of items by validator, sort by order, and respect status
 */
export function sanitizeCollection(items, validator, isProd = false) {
  if (!Array.isArray(items)) return [];
  return items
    .filter(item => {
      const isValid = validator(item);
      if (!isValid) {
        console.warn('[ATHYKA Validation] Skipping invalid record:', item);
        return false;
      }
      if (isProd && item.status && item.status !== 'published') {
        return false;
      }
      return true;
    })
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}
