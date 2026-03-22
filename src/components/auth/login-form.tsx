'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, EnvelopeIcon, LockIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/actions/auth';
import { DictionaryTypes } from '@/lib/i18n';

interface LoginFormProps {
  t: DictionaryTypes;
  lang: string;
}

export function LoginForm({ t, lang }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(login, null);

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
            placeholder={t.auth.login.emailPlaceholder}
            className="h-11 rounded-lg border-border bg-input pl-10 text-sm placeholder:text-muted-foreground/60"
            required
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
            href="/forgot-password"
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
            placeholder={t.auth.login.passwordPlaceholder}
            className="h-11 rounded-lg border-border bg-input pl-10 text-sm placeholder:text-muted-foreground/60"
            required
          />
        </div>
        {state?.errors?.password && <p className="text-sm text-destructive">{state.errors.password[0]}</p>}
      </div>

      {state?.errors?._form && <p className="text-sm text-destructive">{state.errors._form[0]}</p>}

      <Button
        type="submit"
        disabled={isPending}
        className="h-12 w-full cursor-pointer rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {isPending ? '...' : t.auth.login.submit}
        {!isPending && <ArrowRightIcon className="ml-2 h-4 w-4" />}
      </Button>
    </form>
  );
}
