/**
 * Generic client-side keyword search. No site-specific data.
 */
import { generateEventSlug } from './eventSlug.js';

function deduplicateEvents(events) {
  if (!Array.isArray(events) || events.length === 0) return [];
  const seen = new Map();
  for (const e of events) {
    const key = generateEventSlug(e.title || '') + '|' + (e.city || '');
    if (!seen.has(key)) seen.set(key, e);
  }
  return Array.from(seen.values());
}

function isListAllEventsQuery(query) {
  const q = String(query || '').toLowerCase().trim().replace(/\s*(please|thanks|thx)\.?$/i, '').trim();
  return /^(list|show|get|give me|what are)\s+(all\s+)?(the\s+)?(upcoming\s+)?events?$/i.test(q)
    || /^(all|upcoming)\s+events?$/i.test(q)
    || q === 'events'
    || /^(show|list)\s+(me\s+)?(all\s+)?(the\s+)?events?$/i.test(q)
    || /^list\s+all\s+events?$/i.test(q);
}

/**
 * @param {string} query
 * @param {string[]} aboutPhrases - e.g. ['about us', 'what is this site']
 * @returns {boolean}
 */
export function isAboutQuery(query, aboutPhrases = ['about us', 'what is this site', 'what is this website']) {
  const q = String(query || '').toLowerCase().trim();
  return aboutPhrases.some(p => q.includes(p.toLowerCase()));
}

/**
 * @param {Object} opts
 * @param {'events'|'showcase'|'products'} opts.context
 * @param {string} opts.query
 * @param {Array} opts.data
 * @param {() => string} [opts.getAboutResponse] - Called when about intent detected
 * @param {string[]} [opts.aboutPhrases]
 * @param {(count: number, query: string) => string} [opts.eventsResponseTemplate]
 * @param {(count: number) => string} [opts.showcaseResponseTemplate]
 */
export function getClientFallbackResponse(opts) {
  const {
    context,
    query,
    data,
    getAboutResponse,
    aboutPhrases = ['about us', 'what is this site', 'what is this website'],
    eventsResponseTemplate = (count) => `Here are ${count} event(s) matching your search.`,
    showcaseResponseTemplate = (count) => `I found ${count} match(es).`,
  } = opts;

  if (isAboutQuery(query, aboutPhrases) && getAboutResponse) {
    return { text: getAboutResponse(), results: [] };
  }
  if (!data || !Array.isArray(data)) {
    return {
      text: context === 'events' ? "I couldn't find any events." : "I couldn't find any matches.",
      results: [],
    };
  }
  const listAllLimit = context === 'events' && isListAllEventsQuery(query) ? 999 : 10;
  let results = context === 'events' ? keywordSearchEvents(data, query, listAllLimit) : keywordSearchShowcase(data, query);
  if (context === 'events') results = deduplicateEvents(results);
  const text = context === 'events' ? eventsResponseTemplate(results.length, query) : showcaseResponseTemplate(results.length);
  return { text, results };
}

export function keywordSearchEvents(events, query, limit = 10) {
  if (!Array.isArray(events) || events.length === 0) return [];
  const q = String(query || '').toLowerCase().trim();
  const words = q.split(/\s+/).filter(w => w.length > 2);
  const now = new Date();
  const filtered = events.filter(e => {
    if (e.status === 'canceled' || e.canceled) return false;
    const dateStr = e.date;
    if (dateStr && dateStr !== 'recurring') {
      const d = new Date(dateStr + 'T00:00:00');
      if (d < now) return false;
    }
    return true;
  });
  if (words.length === 0) return filtered.slice(0, limit);
  const scored = filtered.map(e => {
    const text = [e.title, e.location, e.city, e.state, e.category].filter(Boolean).join(' ').toLowerCase();
    let score = 0;
    for (const w of words) {
      if (text.includes(w)) score += 10;
    }
    return { event: e, score };
  });
  scored.sort((a, b) => b.score - a.score);
  if (scored[0]?.score === 0) return filtered.slice(0, limit);
  return scored.filter(s => s.score > 0).slice(0, limit).map(s => s.event);
}

export function keywordSearchShowcase(items, query) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const q = String(query || '').toLowerCase().trim();
  const words = q.split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return items.slice(0, 5);
  const scored = items.map(item => {
    const text = [item.name, item.description, (item.services || []).join(' '), (item.features || []).join(' ')].filter(Boolean).join(' ').toLowerCase();
    let score = 0;
    for (const w of words) {
      if (text.includes(w)) score += 10;
    }
    return { item, score };
  });
  scored.sort((a, b) => b.score - a.score);
  if (scored[0]?.score === 0) return items.slice(0, 5);
  return scored.filter(s => s.score > 0).slice(0, 5).map(s => s.item);
}
