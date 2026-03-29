import { getUserFromCookie } from '@/lib/api';

export default async function Home() {
  const user = await getUserFromCookie();

  return (
    <div>
      <h1>Home {user ? `- Welcome, ${user.firstName}` : ''}</h1>
    </div>
  );
}