import 'server-only';

export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  mustChangePassword: boolean;
}

export function sanitizeUser(user: Record<string, unknown>): UserDTO {
  return {
    id: user.id as string,
    email: user.email as string,
    firstName: user.firstName as string,
    lastName: user.lastName as string,
    role: user.role as string,
    mustChangePassword: user.mustChangePassword as boolean,
  };
}
