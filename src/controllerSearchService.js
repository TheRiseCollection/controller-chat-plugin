/**
 * Client-side keyword search service. No API calls.
 */
import { getClientFallbackResponse } from './keywordSearch.js';

const MAX_QUERY_LENGTH = 2000;

export function search(opts) {
  const { context, query, data = [], getAboutResponse, aboutPhrases, eventsResponseTemplate, showcaseResponseTemplate } = opts;
  const queryStr = String(query || '').trim().slice(0, MAX_QUERY_LENGTH);
  if (!queryStr || !['events', 'showcase', 'products', 'software'].includes(context)) return null;
  if (data && data.length > 0) {
    return getClientFallbackResponse({
      context,
      query: queryStr,
      data,
      getAboutResponse,
      aboutPhrases,
      eventsResponseTemplate,
      showcaseResponseTemplate,
    });
  }
  return null;
}
