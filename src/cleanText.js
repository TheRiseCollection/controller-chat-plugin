/**
 * Strip HTML, entities, emojis for safe display. No DOMPurify dependency.
 * @param {string} html - Raw text (may have HTML/entities/emojis)
 * @returns {string} - Clean plain text
 */
export function cleanText(html) {
  if (!html || typeof html !== 'string') return '';
  let s = String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#0*38;/g, '&')
    .replace(/&hellip;/g, '...')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/\\n/g, ' ');
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');
  s = s.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  s = s.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{FE00}-\u{FE0F}]/gu, '');
  return s.trim().replace(/\s+/g, ' ');
}
