import { AuthLayout } from '@/components/auth/auth-layout';
import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { getPageDictionary, toLocale } from '@/lib/i18n';

export default async function ChangePasswordPage({ params }: PageProps<'/[lang]/change-password'>) {
  const { lang: rawLang } = await params;
  const lang = toLocale(rawLang);
  const t = await getPageDictionary(lang);

  return (
    <AuthLayout t={t} lang={lang}>
      <ChangePasswordForm t={t} lang={lang} />
    </AuthLayout>
  );
}
