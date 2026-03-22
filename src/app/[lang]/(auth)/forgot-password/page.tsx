import { AuthLayout } from '@/components/auth/auth-layout';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { getPageDictionary } from '@/lib/i18n';

export default async function ForgotPasswordPage({ params }: PageProps<'/[lang]/forgot-password'>) {
  const { lang } = await params;
  const t = await getPageDictionary(lang);

  return (
    <AuthLayout t={t}>
      <ForgotPasswordForm t={t} />
    </AuthLayout>
  );
}
