"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function BuyerSideLayout({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const rawSession = localStorage.getItem('vdr_session');
      if (!rawSession) {
        setAuthorized(true);
        setChecking(false);
        return;
      }
      const session = JSON.parse(rawSession);
      const role = (session.role || '').toLowerCase();
      const dmsRole = (session.dms_role || '').toLowerCase();

      const isSellerSuperAdmin =
        role === 'super_admin' && dmsRole !== 'buyer';

      if (isSellerSuperAdmin) {
        // Seller Super Admin tried to access buyer-side -> redirect to seller-side
        router.replace('/bidding/seller-side');
        return;
      }

      setAuthorized(true);
    } catch (e) {
      setAuthorized(true);
    } finally {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F8F9FB]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#F8F9FB]">
        <div className="bg-white border-2 border-gray-300 rounded-2xl p-8 max-w-md text-center shadow-md shadow-gray-300/80">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Buyer Portal Restricted</h2>
          <p className="text-xs text-slate-500 mb-6">
            This section is exclusively designated for the <b>Buyer Guest Admin</b>. As a Seller Super Admin, please manage bids from your Seller Bidding Dashboard.
          </p>
          <Link
            href="/bidding/seller-side"
            className="inline-block px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Go to Seller Bidding Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

