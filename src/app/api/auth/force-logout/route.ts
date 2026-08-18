import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/api/session';
import { Locale, supportedLocales } from '@/lib/i18n';

/**
 * Drops a session cookie the backend has already rejected.
 *
 * This exists because cookies cannot be mutated during an RSC render, so the
 * server API layer delegates the deletion here when it sees a 401.
 */
export async function POST(request: NextRequest) {
  await clearSessionCookie();

  let locale = request.nextUrl.searchParams.get('locale') as Locale;
  if (!locale || !supportedLocales.includes(locale)) locale = 'en';
  const url = new URL(`/${locale}/login`, request.url);
  return NextResponse.redirect(url);
}
