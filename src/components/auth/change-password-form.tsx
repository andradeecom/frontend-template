'use client';

import { useActionState } from 'react';
import { ArrowRightIcon, LockIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePassword } from '@/actions/auth';
import { DictionaryTypes } from '@/lib/i18n';

interface ChangePasswordFormProps {
  t: DictionaryTypes;
  lang: string;
}

export function ChangePasswordForm({ t, lang }: ChangePasswordFormProps) {
  const [state, formAction, isPending] = useActionState(changePassword, null);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="lang" value={lang} />
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-sm font-semibold text-foreground">
          {t.auth.changePassword.newPasswordLabel}
        </Label>
        <div className="relative">
          <LockIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            placeholder={t.auth.changePassword.newPasswordPlaceholder}
            className="h-11 rounded-lg border-border bg-input pl-10 text-sm placeholder:text-muted-foreground/60"
            required
            minLength={8}
          />
        </div>
        {state?.errors?.newPassword && <p className="text-sm text-destructive">{state.errors.newPassword[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
          {t.auth.changePassword.confirmPasswordLabel}
        </Label>
        <div className="relative">
          <LockIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder={t.auth.changePassword.confirmPasswordPlaceholder}
            className="h-11 rounded-lg border-border bg-input pl-10 text-sm placeholder:text-muted-foreground/60"
            required
            minLength={8}
          />
        </div>
        {state?.errors?.confirmPassword && (
          <p className="text-sm text-destructive">{state.errors.confirmPassword[0]}</p>
        )}
      </div>

      {state?.errors?._form && <p className="text-sm text-destructive">{state.errors._form[0]}</p>}

      <Button
        type="submit"
        disabled={isPending}
        className="h-12 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {isPending ? '...' : t.auth.changePassword.submit}
        {!isPending && <ArrowRightIcon className="ml-2 h-4 w-4" />}
      </Button>
    </form>
  );
}
