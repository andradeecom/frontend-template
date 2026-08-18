'use server';

import { redirect } from 'next/navigation';
import { api, apiBase } from '@/lib/api/api';
import { clearSessionCookie, forwardSessionCookies } from '@/lib/api/session';
import { forgotPasswordSchema, changePasswordSchema, loginSchema } from '@/lib/validations/auth';
import type { LoginResponse } from '@/lib/types/auth';

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

/**
 * Signs in on the server so the session cookie is set by the backend and
 * relayed to the browser as httpOnly. The credential never passes through
 * client JavaScript at any point.
 */
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

  let user: LoginResponse['user'];

  try {
    const response = await fetch(`${apiBase()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      return { errors: { _form: [body.message || 'Invalid credentials'] } };
    }

    // Relay the backend's httpOnly session cookie to the browser verbatim.
    await forwardSessionCookies(response.headers.getSetCookie());

    ({ user } = (await response.json()) as LoginResponse);
  } catch {
    return { errors: { _form: ['Unable to reach the server. Please try again.'] } };
  }

  /*
   * Locale-less on purpose: the middleware rewrites `/home` to the negotiated
   * locale without a redirect, so the visitor keeps the clean URL. Redirecting
   * to `/${lang}/home` would pin the prefix into the address bar and bypass
   * that entirely.
   */
  redirect(user.mustChangePassword ? '/change-password' : '/home');
}

export async function logout(): Promise<void> {
  try {
    // Deletes the session row, so the id is dead server-side immediately —
    // not merely forgotten by this browser.
    await api.auth.logout();
  } catch {
    // Continue with logout even if backend call fails
  }

  await clearSessionCookie();

  redirect('/login');
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

  redirect('/');
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
