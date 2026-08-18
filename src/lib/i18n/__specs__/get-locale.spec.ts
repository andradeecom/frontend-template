import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { getLocale } from '@/lib/i18n/get-locale';
import { i18n } from '@/lib/i18n';

/**
 * Locale detection runs in the middleware, on every request, before anything
 * else. A throw here is a 500 on the whole site rather than a bad guess at a
 * language, so the failure modes matter more than the matching accuracy.
 */

const requestWith = (headers: Record<string, string> = {}) =>
  new NextRequest(new URL('http://localhost:3000/'), { headers });

describe('getLocale', () => {
  it('matches a supported language', () => {
    expect(getLocale(requestWith({ 'accept-language': 'pt-BR,pt;q=0.9' }))).toBe('pt');
  });

  it('falls back to the default for an unsupported language', () => {
    expect(getLocale(requestWith({ 'accept-language': 'ja-JP' }))).toBe(i18n.defaultLocale);
  });

  /*
   * Regression: Negotiator returns ['*'] rather than [] when no usable
   * Accept-Language is present, so a length check alone let the wildcard reach
   * matchLocale, which throws RangeError. Requests without the header are
   * routine — curl, uptime checks, bots — so this crashed the middleware for
   * all of them.
   */
  it('returns the default when no Accept-Language is sent', () => {
    expect(() => getLocale(requestWith())).not.toThrow();
    expect(getLocale(requestWith())).toBe(i18n.defaultLocale);
  });

  it('returns the default for an explicit wildcard', () => {
    expect(() => getLocale(requestWith({ 'accept-language': '*' }))).not.toThrow();
    expect(getLocale(requestWith({ 'accept-language': '*' }))).toBe(i18n.defaultLocale);
  });

  it('returns the default for a malformed header instead of throwing', () => {
    const malformed = requestWith({ 'accept-language': '!!!not a tag!!!' });
    expect(() => getLocale(malformed)).not.toThrow();
    expect(getLocale(malformed)).toBe(i18n.defaultLocale);
  });
});
