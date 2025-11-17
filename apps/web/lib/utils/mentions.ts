/**
 * Extracts @mentions from text and returns an array of usernames
 */
export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const matches = Array.from(text.matchAll(mentionRegex));
  const mentions = matches.map(match => match[1]).filter(Boolean);
  return [...new Set(mentions)]; // Remove duplicates
};

