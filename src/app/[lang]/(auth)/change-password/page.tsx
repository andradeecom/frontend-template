import { AuthLayout } from '@/components/auth/auth-layout';
import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { getPageDictionary } from '@/lib/i18n';

export default async function ChangePasswordPage({ params }: PageProps<'/[lang]/change-password'>) {
  const { lang } = await params;
  const t = await getPageDictionary(lang);

  return (
    <AuthLayout t={t}>
      <ChangePasswordForm t={t} lang={lang} />
    </AuthLayout>
  );
}
