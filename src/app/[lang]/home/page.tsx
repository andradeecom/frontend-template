import { getUserFromCookie } from '@/lib/api';
import { logout } from '@/actions/auth';
import { ProfileCard } from '@/components/auth/profile-card';

export default async function Home() {
  const user = await getUserFromCookie();

  return (
    <section className="flex items-center justify-center min-h-screen">
      <ProfileCard user={user} onLogout={logout} />
    </section>
  );
}
