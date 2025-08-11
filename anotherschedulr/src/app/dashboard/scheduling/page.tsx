"use client";

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SchedulingPageBuilder from '@/components/schedulingPageBuilder';

const SchedulingPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (status === "unauthenticated" || !session) {
    router.push('/signin');
    return null;
  }

  return <SchedulingPageBuilder />;
};

export default SchedulingPage;