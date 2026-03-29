'use client';

import { useEffect, useTransition } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { setAccessTokenClient, setUserClient } from '@/lib/auth-store';

export default function GoogleCallbackPage() {
  const [isPending, startTransition] = useTransition();
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = params.lang || 'en';

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const userRaw = searchParams.get('user');

    if (!accessToken || !userRaw) {
      const langFromPath = window.location.pathname.split('/')[1] || 'en';
      router.replace(`/${langFromPath}/login`);
      return;
    }

    startTransition(() => {
      try {
        const user = JSON.parse(userRaw) as import('@/lib/types/auth').LoginResponse['user'];
        setAccessTokenClient(accessToken);
        setUserClient(user);

        if (user.mustChangePassword) {
          router.replace(`/${lang}/change-password`);
          return;
        }

        router.replace(`/${lang}/home`);
      } catch {
        router.replace(`/${lang}/login`);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
      {isPending ? 'Completing Google sign-in...' : 'Redirecting...'}
    </div>
  );
}
