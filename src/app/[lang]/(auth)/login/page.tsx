import { AuthLayout } from '@/components/auth/auth-layout';
import { LoginForm } from '@/components/auth/login-form';
import { getPageDictionary } from '@/lib/i18n';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default async function LoginPage({ params }: PageProps<'/[lang]/login'>) {
  const { lang } = await params;
  const t = await getPageDictionary(lang);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

  return (
    <AuthLayout t={t}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <LoginForm t={t} lang={lang} />
      </GoogleOAuthProvider>
    </AuthLayout>
  );
}
