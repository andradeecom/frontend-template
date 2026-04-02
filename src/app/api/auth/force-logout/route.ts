import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete('refresh_token');
  cookieStore.delete('access_token');
  cookieStore.delete('user_data');

  const locale = request.nextUrl.searchParams.get('locale') || 'en';
  const url = new URL(`/${locale}/login`, request.url);
  return NextResponse.redirect(url);
}
