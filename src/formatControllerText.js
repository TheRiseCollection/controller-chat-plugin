/**
 * Format chat response text for readable display.
 */
import { cleanText } from './cleanText.js';

export function formatControllerText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const s = cleanText(raw);
  if (!s) return '';
  let out = s;
  out = out.replace(/\s+(Here are [^.!?]*[.:])/gi, '\n\n$1');
  out = out.replace(/\s*\*\s+/g, '\n• ');
  out = out.replace(/• ([^|]+) \| ([^|]+) \| ([^\n•]+?)(?=\n•|$)/g, (_, name, date, loc) => {
    return `• ${name.trim()}\n  ${date.trim()} · ${loc.trim()}`;
  });
  out = out.replace(/\s+(View all events? on the|View more on the|Visit the Products page)/gi, '\n\n$1');
  out = out.replace(/\n{3,}/g, '\n\n').trim();
  return out;
}
