import { AuthLayout } from '@/components/auth/auth-layout';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { getPageDictionary, toLocale } from '@/lib/i18n';

export default async function ForgotPasswordPage({ params }: PageProps<'/[lang]/forgot-password'>) {
  const { lang: rawLang } = await params;
  const lang = toLocale(rawLang);
  const t = await getPageDictionary(lang);

  return (
    <AuthLayout t={t} lang={lang}>
      <ForgotPasswordForm t={t} />
    </AuthLayout>
  );
}
