/**
 * Generate a URL-friendly slug from a title.
 * @param {string} title - Event or item title
 * @returns {string} URL-friendly slug
 */
export function generateEventSlug(title) {
  if (!title || typeof title !== 'string') return '';
  let s = title
    .replace(/&amp;/gi, '&')
    .replace(/&#0*38;/g, '&')
    .replace(/&#x0*26;/gi, '&');
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
