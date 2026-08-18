import { getAuthUser } from '@/lib/api';
import { logout } from '@/actions/auth';
import { ProfileCard } from '@/components/auth/profile-card';

export default async function Home() {
  // Read from the backend rather than a browser cookie: the session id is
  // opaque, so the server is the only thing that can say who the user is.
  const user = await getAuthUser();

  return (
    <section className="flex items-center justify-center min-h-screen">
      <ProfileCard user={user} onLogout={logout} />
    </section>
  );
}
