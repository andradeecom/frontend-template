import 'server-only';

import { redirect } from 'next/navigation';
import { getAuthUser } from './api';

export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export async function requireRole(allowedRoles: UserRole[]): Promise<void> {
  const user = await getAuthUser();

  if (!allowedRoles.includes(user.role as UserRole)) {
    redirect('/');
  }
}

export async function hasRole(role: UserRole): Promise<boolean> {
  try {
    const user = await getAuthUser();
    return user.role === role;
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  return hasRole('ADMIN');
}

export async function isInstructor(): Promise<boolean> {
  return hasRole('INSTRUCTOR');
}

export async function isStudent(): Promise<boolean> {
  return hasRole('STUDENT');
}
