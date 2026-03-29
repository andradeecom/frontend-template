'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { api, deleteUserCookie } from '@/lib/api/api';
import { forgotPasswordSchema, changePasswordSchema } from '@/lib/validations/auth';

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
