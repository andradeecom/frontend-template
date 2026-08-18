'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import type { DictionaryTypes } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/i18n-config';
import type { User } from '@/lib/types/auth';

interface ProfileCardProps {
  user: User | null;
  onLogout: (formData: FormData) => Promise<void>;
  lang: Locale;
  t: DictionaryTypes;
}

export function ProfileCard({ user, onLogout, lang, t }: ProfileCardProps) {
  const languageSwitcher = <LanguageSwitcher current={lang} labels={t.common.language} className="w-40" />;

  if (!user) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t.profile.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">{t.profile.notFound}</p>
          <div className="flex items-center justify-between gap-4">
            <form action={onLogout}>
              <Button type="submit" variant="destructive">
                {t.profile.logout}
              </Button>
            </form>
            {languageSwitcher}
          </div>
        </CardContent>
      </Card>
    );
  }

  const initials =
    user.firstName && user.lastName
      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
      : `${user.email.charAt(0).toUpperCase()}${user.email.charAt(1).toUpperCase()}`;

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <Avatar size="lg">
          {user.profileImageUrl ? <AvatarImage src={user.profileImageUrl} alt={t.profile.title} /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <CardTitle>{t.profile.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        <p>
          <strong>{t.profile.id}:</strong> {user.id}
        </p>
        <p>
          <strong>{t.profile.firstName}:</strong> {user.firstName}
        </p>
        <p>
          <strong>{t.profile.lastName}:</strong> {user.lastName}
        </p>
        <p>
          <strong>{t.profile.email}:</strong> {user.email}
        </p>
        <p>
          <strong>{t.profile.role}:</strong> {user.role}
        </p>
        <p>
          <strong>{t.profile.mustChangePassword}:</strong> {user.mustChangePassword ? t.profile.yes : t.profile.no}
        </p>

        <div className="flex items-center justify-between gap-4 pt-3">
          <form action={onLogout}>
            <Button type="submit" variant="destructive">
              {t.profile.logout}
            </Button>
          </form>

          {languageSwitcher}
        </div>
      </CardContent>
    </Card>
  );
}
