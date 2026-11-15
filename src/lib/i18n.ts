import { useStore } from './store';
import translations from './translations.json';

export type Language = 'el' | 'en';
const dictionary: Record<string, string> = translations;
const phrases = Object.keys(dictionary).filter(key => key.length >= 3).sort((a,b) => b.length-a.length);
export function translate(text: string | undefined, language: Language): string {
  if (!text) return '';
  if (language === 'el' || !text) return text;
  if (dictionary[text]) return dictionary[text];
  const trimmed = text.trim();
  if (dictionary[trimmed]) return text.replace(trimmed, dictionary[trimmed]);
  let result = text;
  for (const key of phrases) {
    const replacement = dictionary[key];
    if (replacement === undefined) continue;
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, 'gu'), () => replacement);
  }
  return result;
}
export function useI18n() {
  const language = useStore(s => s.language ?? 'el');
  return { language, t: (text: string | undefined) => translate(text, language), pick: (el: string, en: string) => language === 'en' ? en : el };
}