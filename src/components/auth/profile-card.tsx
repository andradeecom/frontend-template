'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/lib/types/auth';

interface ProfileCardProps {
  user: User | null;
  onLogout: (formData: FormData) => Promise<void>;
}

export function ProfileCard({ user, onLogout }: ProfileCardProps) {
  if (!user) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>User profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">No user found.</p>
          <form action={onLogout}>
            <Button type="submit" variant="destructive">
              Logout
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  const initials =
    user.firstName && user.lastName
      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
      : `${user.email.charAt(0).toUpperCase()}${user.email.charAt(1).toUpperCase()}`;

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <Avatar size="lg">
          {user.profileImageUrl ? <AvatarImage src={user.profileImageUrl} alt="User profile" /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <CardTitle>User profile</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        <p>
          <strong>ID:</strong> {user.id}
        </p>
        <p>
          <strong>First name:</strong> {user.firstName}
        </p>
        <p>
          <strong>Last name:</strong> {user.lastName}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Role:</strong> {user.role}
        </p>
        <p>
          <strong>Must change password:</strong> {user.mustChangePassword ? 'Yes' : 'No'}
        </p>

        <form action={onLogout} className="pt-3">
          <Button type="submit" variant="destructive">
            Logout
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
