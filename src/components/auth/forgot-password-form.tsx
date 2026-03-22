'use client';

import { useActionState } from 'react';
import { ArrowRightIcon, EnvelopeIcon, ArrowLeftIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPassword } from '@/actions/auth';
import { DictionaryTypes } from '@/lib/i18n';
import Link from 'next/link';

interface ForgotPasswordFormProps {
  t: DictionaryTypes;
}

export function ForgotPasswordForm({ t }: ForgotPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(forgotPassword, null);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center text-center">
        <h2 className="font-serif text-2xl font-bold italic text-foreground">{t.auth.forgotPassword.successTitle}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-foreground">
          {t.auth.forgotPassword.emailLabel}
        </Label>
        <div className="relative">
          <EnvelopeIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t.auth.forgotPassword.emailPlaceholder}
            className="h-11 rounded-lg border-border bg-input pl-10 text-sm placeholder:text-muted-foreground/60"
            required
          />
        </div>
        {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="h-12 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {isPending ? '...' : t.auth.forgotPassword.submit}
        {!isPending && <ArrowRightIcon className="ml-2 h-4 w-4" />}
      </Button>
      <Link
        href="/login"
        className="flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        {t.auth.forgotPassword.back}
      </Link>
    </form>
  );
}
