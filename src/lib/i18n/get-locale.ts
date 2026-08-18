import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { NextRequest } from 'next/server';
import { i18n } from './i18n-config';

export function getLocale(request: NextRequest): string | undefined {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const locales: string[] = i18n.locales as unknown as string[];

  /*
   * Negotiator returns `['*']` — not an empty array — when the request carries
   * no usable Accept-Language, which is common enough (curl, health checks,
   * many bots). `matchLocale` throws a RangeError on the wildcard, so it has to
   * be filtered out before matching rather than only checking for emptiness.
   */
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages().filter((language) => language !== '*');

  if (languages.length === 0) {
    return i18n.defaultLocale;
  }

  try {
    return matchLocale(languages, locales, i18n.defaultLocale);
  } catch {
    // A malformed tag (`Accept-Language: !!!`) reaches here. A visitor sending
    // one should get the default locale, not a 500 from the middleware.
    return i18n.defaultLocale;
  }
}
