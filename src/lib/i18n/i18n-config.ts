export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'pt'],
} as const;

export type Locale = (typeof i18n)['locales'][number];
export const hasLocale = (locale: string): locale is Locale => i18n.locales.includes(locale as Locale);
export const supportedLocales = i18n.locales;
