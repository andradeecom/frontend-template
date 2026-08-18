'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, EnvelopeIcon, LockIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DictionaryTypes } from '@/lib/i18n';
import { getGoogleAuthUrl } from '@/lib/api/client-api';
import { login, type FormState } from '@/actions/auth';

interface LoginFormProps {
  t: DictionaryTypes;
  lang: string;
}

export function LoginForm({ t, lang }: LoginFormProps) {
  /*
   * Login runs as a Server Action rather than a client fetch. The credential is
   * an httpOnly cookie set server-side, so it is never visible to this
   * component — there is nothing here to store, and nothing for injected
   * script to read.
   */
  const [state, formAction, pending] = useActionState<FormState | null, FormData>(login, null);

  function onGoogleLogin(): void {
    window.location.assign(getGoogleAuthUrl(lang));
  }

  function onAppleLogin(): void {
    window.alert('Apple Sign-In coming soon.');
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="lang" value={lang} />
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-foreground">
          {t.auth.login.emailLabel}
        </Label>
        <div className="relative">
          <EnvelopeIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t.auth.login.emailPlaceholder}
            className="h-11 rounded-lg border-border bg-input pl-10 text-sm placeholder:text-muted-foreground/60"
          />
        </div>
        {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-semibold text-foreground">
            {t.auth.login.passwordLabel}
          </Label>
          <Link
            href={`/${lang}/forgot-password`}
            className="text-sm font-semibold text-foreground transition-colors hover:text-muted-foreground"
          >
            {t.auth.login.forgotPassword}
          </Link>
        </div>
        <div className="relative">
          <LockIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder={t.auth.login.passwordPlaceholder}
            className="h-11 rounded-lg border-border bg-input pl-10 text-sm placeholder:text-muted-foreground/60"
          />
        </div>
        {state?.errors?.password && <p className="text-sm text-destructive">{state.errors.password[0]}</p>}
      </div>

      {state?.errors?._form && <p className="text-sm text-destructive">{state.errors._form[0]}</p>}

      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full cursor-pointer rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {pending ? '...' : t.auth.login.submit}
        {!pending && <ArrowRightIcon className="ml-2 h-4 w-4" />}
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t.auth.login.or}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={onGoogleLogin}
          disabled={pending}
          className="h-11 w-full cursor-pointer rounded-lg"
        >
          <GoogleIcon className="mr-2 size-4" />
          {t.auth.login.continueWithGoogle}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onAppleLogin}
          disabled={pending}
          className="h-11 w-full cursor-pointer rounded-lg"
        >
          <AppleIcon className="mr-2 size-8" />
          {t.auth.login.continueWithApple}
        </Button>
      </div>
    </form>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M21.805 10.023h-9.751v3.956h5.611c-.241 1.273-.965 2.35-2.053 3.073v2.554h3.318c1.942-1.789 3.06-4.426 2.875-7.316-.001-.757-.088-1.509-.26-2.267z"
        fill="#4285F4"
      />
      <path
        d="M12.054 22c2.617.077 5.168-.852 7.041-2.566l-3.318-2.554c-.983.669-2.152 1.009-3.34.973-2.514-.041-4.727-1.663-5.486-4.061H3.518v2.635C5.29 19.955 8.532 22.127 12.054 22z"
        fill="#34A853"
      />
      <path d="M6.951 13.792a6.12 6.12 0 010-3.584V7.573H3.518a10.186 10.186 0 000 9.854l3.433-2.635z" fill="#FBBC04" />
      <path
        d="M12.054 6.012c1.416-.023 2.782.508 3.831 1.49l2.864-2.864C16.905 2.968 14.505 2 12.054 2 8.532 1.873 5.29 4.045 3.518 7.573l3.433 2.635c.759-2.398 2.972-4.02 5.486-4.061z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M16.365 12.343c.016 1.828 1.594 2.435 1.612 2.443-.013.044-.252.863-.832 1.71-.502.733-1.022 1.462-1.843 1.477-.806.015-1.065-.479-1.988-.479-.924 0-1.211.464-1.973.493-.793.03-1.396-.792-1.902-1.521-1.033-1.496-1.822-4.228-.763-6.067.526-.914 1.466-1.492 2.486-1.507.776-.015 1.509.523 1.988.523.478 0 1.375-.647 2.317-.552.394.016 1.5.159 2.209 1.197-.057.035-1.319.768-1.311 2.283zM14.97 6.5c.421-.51.706-1.219.628-1.925-.607.024-1.339.404-1.774.914-.39.451-.731 1.174-.64 1.865.677.052 1.365-.346 1.786-.854z"
      />
    </svg>
  );
}
