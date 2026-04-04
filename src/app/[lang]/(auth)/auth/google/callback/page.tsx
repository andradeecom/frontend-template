'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { exchangeGoogleCode } from '@/lib/api/client-api';
import { setAccessTokenClient, setUserClient } from '@/lib/auth-store';

function GoogleCallbackInner() {
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = params.lang || 'en';
  const exchanged = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      router.replace(`/${lang}/login`);
      return;
    }

    if (exchanged.current) return;
    exchanged.current = true;

    exchangeGoogleCode(code)
      .then((result) => {
        setAccessTokenClient(result.accessToken);
        setUserClient(result.user);

        if (result.user.mustChangePassword) {
          router.replace(`/${lang}/change-password`);
          return;
        }

        router.replace(`/${lang}/home`);
      })
      .catch(() => {
        router.replace(`/${lang}/login`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
      Completing Google sign-in...
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          Redirecting...
        </div>
      }
    >
      <GoogleCallbackInner />
    </Suspense>
  );
}
