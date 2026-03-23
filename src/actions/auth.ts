'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { api, setUserCookie, deleteUserCookie, setAccessTokenCookie } from '@/lib/api/api';
import { loginSchema, forgotPasswordSchema, changePasswordSchema } from '@/lib/validations/auth';

export interface FormState {
  errors?: {
    email?: string[];
    password?: string[];
    newPassword?: string[];
    confirmPassword?: string[];
    currentPassword?: string[];
    _form?: string[];
  };
  success?: boolean;
  message?: string;
}

export async function login(prevState: FormState | null, formData: FormData): Promise<FormState> {
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      // TODO: Use `z.treeifyError(err)` instead of deprecated `flatten()`
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;
  const lang = (formData.get('lang') as string) || 'en';

  let result;
  try {
    result = await api.auth.login(email, password);
  } catch (error) {
    return {
      errors: {
        _form: [error instanceof Error ? error.message : 'Login failed'],
      },
    };
  }

  // Forward Set-Cookie headers from backend to browser (refresh_token). This server action runs on the server
  await forwardCookies(result.setCookieHeaders);

  // Store access token and user data in cookies
  await setAccessTokenCookie(result.data.accessToken);
  await setUserCookie(result.data.user);

  // Redirect OUTSIDE try-catch so Next.js handles the redirect error
  if (result.data.user.mustChangePassword) {
    redirect(`/${lang}/change-password`);
  } else {
    redirect(`/${lang}/`);
  }
}

export async function logout(): Promise<void> {
  // Detect lang from referer before clearing cookies
  const headerStore = await headers();
  const referer = headerStore.get('referer') || '';
  const lang = referer.match(/\/([a-z]{2})\//)?.[1] || 'en';

  try {
    await api.auth.logout();
  } catch {
    // Continue with logout even if backend call fails
  }

  // Delete all auth cookies from browser
  const cookieStore = await cookies();
  cookieStore.delete('refresh_token');
  cookieStore.delete('access_token');
  await deleteUserCookie();

  redirect(`/${lang}/login`);
}

export async function changePassword(prevState: FormState | null, formData: FormData): Promise<FormState> {
  const validatedFields = changePasswordSchema.safeParse({
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
    currentPassword: formData.get('currentPassword'),
  });

  if (!validatedFields.success) {
    return {
      // TODO: Use `z.treeifyError(err)` instead of deprecated `flatten()`
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { newPassword, confirmPassword, currentPassword } = validatedFields.data;
  const lang = (formData.get('lang') as string) || 'en';

  try {
    await api.auth.changePassword({
      newPassword,
      confirmPassword,
      currentPassword,
    });
  } catch (error) {
    return {
      errors: {
        _form: [error instanceof Error ? error.message : 'Failed to change password'],
      },
    };
  }

  redirect(`/${lang}/`);
}

export async function forgotPassword(prevState: FormState | null, formData: FormData): Promise<FormState> {
  const validatedFields = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      // TODO: Use `z.treeifyError(err)` instead of deprecated `flatten()`
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email } = validatedFields.data;

  try {
    await api.auth.forgotPassword(email);

    return {
      success: true,
      message: 'Password reset email sent',
    };
  } catch {
    return {
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent.',
    };
  }
}

/**
 * Parse raw Set-Cookie headers and forward them to the browser.
 */
async function forwardCookies(setCookieHeaders: string[]): Promise<void> {
  const cookieStore = await cookies();

  for (const header of setCookieHeaders) {
    const [nameValue, ...parts] = header.split(';');
    const eqIndex = nameValue.indexOf('=');
    if (eqIndex === -1) continue;

    const name = nameValue.slice(0, eqIndex).trim();
    const value = nameValue.slice(eqIndex + 1).trim();

    const options: Record<string, unknown> = {};
    for (const part of parts) {
      const trimmed = part.trim();
      const lower = trimmed.toLowerCase();
      if (lower === 'httponly') options.httpOnly = true;
      else if (lower === 'secure') options.secure = true;
      else if (lower.startsWith('path=')) options.path = trimmed.split('=')[1];
      else if (lower.startsWith('max-age=')) options.maxAge = parseInt(trimmed.split('=')[1], 10);
      else if (lower.startsWith('samesite='))
        options.sameSite = trimmed.split('=')[1].toLowerCase() as 'lax' | 'strict' | 'none';
      else if (lower.startsWith('domain=')) options.domain = trimmed.split('=')[1];
    }

    cookieStore.set(name, value, options);
  }
}
