"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminWorkspaceRequestsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/business-owner/workspace-requests');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-10 h-10 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-600 font-semibold text-sm">Redirecting to Business Owner Command Center...</p>
      <a 
        href="/business-owner/workspace-requests" 
        className="mt-3 text-xs text-[var(--brand)] hover:underline font-bold"
      >
        Click here if not redirected automatically
      </a>
    </div>
  );
}
