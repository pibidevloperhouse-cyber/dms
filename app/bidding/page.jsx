"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BiddingIndexPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const rawSession = localStorage.getItem('vdr_session');
      if (!rawSession) {
        // Fallback default to seller side
        router.replace('/bidding/seller-side');
        return;
      }
      const session = JSON.parse(rawSession);
      const role = (session.role || '').toLowerCase();
      const dmsRole = (session.dms_role || '').toLowerCase();

      const isBuyerRole =
        role === 'guest_admin' ||
        role === 'advisor' ||
        role === 'guest_lead' ||
        role === 'external_user' ||
        role === 'buyer' ||
        dmsRole === 'buyer';

      if (isBuyerRole) {
        router.replace('/bidding/buyer-side/my-bid');
      } else {
        // Super Admin / Seller Admin -> Seller Side
        router.replace('/bidding/seller-side');
      }
    } catch (e) {
      router.replace('/bidding/seller-side');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-[#F8F9FB]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500">Redirecting to Bidding portal...</p>
      </div>
    </div>
  );
}

