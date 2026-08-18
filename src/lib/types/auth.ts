export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileImageUrl?: string | null;
  mustChangePassword: boolean;
}

/**
 * Login returns the profile only. The credential is an httpOnly session cookie
 * set by the backend, so there is deliberately no token field here.
 */
export interface LoginResponse {
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface GoogleLoginPayload {
  code: string;
  state?: string;
  scope?: string;
  authuser?: string;
  prompt?: string;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface MessageResponse {
  message: string;
}
