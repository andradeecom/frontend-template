import { AuthLayout } from '@/components/auth/auth-layout';
import { LoginForm } from '@/components/auth/login-form';
import { getPageDictionary } from '@/lib/i18n';

export default async function LoginPage({ params }: PageProps<'/[lang]/login'>) {
  const { lang } = await params;
  const t = await getPageDictionary(lang);

  return (
    <AuthLayout t={t}>
      <LoginForm t={t} lang={lang} />
    </AuthLayout>
  );
}
