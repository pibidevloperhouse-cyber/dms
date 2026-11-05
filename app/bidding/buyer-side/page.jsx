"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BuyerOverviewRedirect() {
  const router = useRouter();

  useEffect(() => {
    // The Overview section has been removed; direct all buyer traffic to "My bid"
    router.replace('/bidding/buyer-side/my-bid');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-[#F8F9FB]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500">Loading your bid portal...</p>
      </div>
    </div>
  );
}
