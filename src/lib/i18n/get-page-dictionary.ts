import 'server-only';
import { notFound } from 'next/navigation';
import { getDictionary } from './get-dictionary';
import { hasLocale, type Locale } from './i18n-config';

export async function getPageDictionary(lang: string) {
  if (!hasLocale(lang)) notFound();
  return getDictionary(lang);
}

/**
 * Narrows a route param to a supported `Locale`, 404-ing otherwise.
 *
 * Route params are typed `string`, but `[lang]` only ever holds a supported
 * locale in practice — the middleware builds the path. Pages need the narrowed
 * type to pass it on, so this performs the same check `getPageDictionary` does
 * and returns the value with its type intact, rather than each page casting.
 */
export function toLocale(lang: string): Locale {
  if (!hasLocale(lang)) notFound();
  return lang;
}
