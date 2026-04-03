import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Locale, supportedLocales } from '@/lib/i18n';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete('refresh_token');
  cookieStore.delete('access_token');
  cookieStore.delete('user_data');

  let locale = request.nextUrl.searchParams.get('locale') as Locale;
  if (!locale || !supportedLocales.includes(locale)) locale = 'en';
  const url = new URL(`/${locale}/login`, request.url);
  return NextResponse.redirect(url);
}
