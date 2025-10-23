import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard immediately
    router.push('/dashboard');
  }, [router]);

  // Show loading while redirecting
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-cyan-400 mb-8"></div>
      <h2 className="text-4xl font-black text-gray-200 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent tracking-tight">
        Loading Dashboard...
      </h2>
    </main>
  );
}