/**
 * Family-friendly profanity filter.
 */
const REPLACEMENTS = [
  [/\b(what\s+the\s+)f(?:uck|ck|cking|ckin'?)\b/gi, '$1fluff'],
  [/\bwtf\b/gi, 'what the fluff'],
  [/\bwth\b/gi, 'what the heck'],
  [/\b(what\s+the\s+)hell\b/gi, '$1heck'],
  [/\bomfg\b/gi, 'oh my goodness'],
  [/\bomg\b/gi, 'oh my gosh'],
  [/\bmother\s*f(?:ucker|cker|ckr)\b/gi, 'mother trucker'],
  [/\bmf\b/gi, 'mega fudge'],
  [/\b(son\s+of\s+a\s+)b(?:itch|tch)\b/gi, '$1bench'],
  [/\bb(?:itch|tch)(?:es|in')?\b/gi, 'biscuit'],
  [/\ba(?:ss|sshole|sses)\b/gi, 'tush'],
  [/\bbutt\b/gi, 'booty'],
  [/\bd(?:amn|mn)(?:it)?\b/gi, 'dang'],
  [/\bhell\b/gi, 'heck'],
  [/\bs(?:hit|ht|h\*t)(?:ty)?\b/gi, 'shoot'],
  [/\bcrap\b/gi, 'crud'],
  [/\bf(?:uck|ck|cking|ckin'?)\b/gi, 'fudge'],
  [/\b(?:bull)?s(?:hit|ht)\b/gi, 'nonsense'],
  [/\bp(?:iss|ss)(?:ed|ing)?\b/gi, 'tinkle'],
  [/\bsl(?:ut|utt?y)\b/gi, 'silly goose'],
  [/\bwhore\b/gi, 'silly billy'],
  [/\bstupid\b/gi, 'silly'],
  [/\bidiot\b/gi, 'goober'],
  [/\bdumb(?:a(?:ss|ss)?)?\b/gi, 'silly'],
  [/\bjerk\b/gi, 'goofball'],
  [/\bpr(?:ick|icks)\b/gi, 'goober'],
  [/\bf+u+c+k+\b/gi, 'fudge'],
  [/\bs+h+i+t+\b/gi, 'shoot'],
  [/\bb+i+t+c+h+\b/gi, 'biscuit'],
];

export function funnyCurseFilter(text) {
  if (!text || typeof text !== 'string') return text || '';
  let out = text;
  for (const [pattern, replacement] of REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
