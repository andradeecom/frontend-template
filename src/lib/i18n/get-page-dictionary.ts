import 'server-only';
import { notFound } from 'next/navigation';
import { getDictionary } from './get-dictionary';
import { hasLocale } from './i18n-config';

export async function getPageDictionary(lang: string) {
  if (!hasLocale(lang)) notFound();
  return getDictionary(lang);
}
