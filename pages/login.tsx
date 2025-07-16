import React from 'react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import PhoneLogin from '@/components/auth/PhoneLogin';
import SEO from '@/components/ui/SEO';
import Header from '@/components/layout/Header';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const { redirect } = router.query;

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const redirectTo = typeof redirect === 'string' ? redirect : '/my-bots';
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, router, redirect]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-slate-300 font-medium">Loading...</div>
        </div>
      </>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const redirectTo = typeof redirect === 'string' ? redirect : '/my-bots';

  return (
    <>
      <SEO 
        title="Login"
        description="Sign in to AsQue to create and manage your AI chatbots"
      />
      <Header />
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-full max-w-md p-6">
          <PhoneLogin 
            redirectTo={redirectTo}
            onSuccess={() => {
              // Optionally handle success
            }}
          />
        </div>
      </div>
    </>
  );
} 