import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { NextRequest } from 'next/server';
import { i18n } from './i18n-config';

export function getLocale(request: NextRequest): string | undefined {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const locales: string[] = i18n.locales as unknown as string[];

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();

  if (!languages || languages.length === 0) {
    return i18n.defaultLocale;
  }

  const locale = matchLocale(languages, locales, i18n.defaultLocale);

  return locale;
}
