/**
 * Client-side keyword search service. No API calls.
 */
import { getClientFallbackResponse } from './keywordSearch.js';

const MAX_QUERY_LENGTH = 2000;

export function search(opts) {
  const { context, query, data = [], getAboutResponse, aboutPhrases, eventsResponseTemplate, showcaseResponseTemplate } = opts;
  const queryStr = String(query || '').trim().slice(0, MAX_QUERY_LENGTH);
  if (!queryStr) return null;
  // context accepts any string; 'events' gets event-specific search, others use generic item search
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
