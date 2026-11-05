"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function SellerSideLayout({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const rawSession = localStorage.getItem('vdr_session');
      if (!rawSession) {
        // Allow in dev/demo if not explicitly logged in, or default to authorized
        setAuthorized(true);
        setChecking(false);
        return;
      }
      const session = JSON.parse(rawSession);
      const role = (session.role || '').toLowerCase();
      const dmsRole = (session.dms_role || '').toLowerCase();

      const isBuyer =
        role === 'guest_admin' ||
        role === 'advisor' ||
        role === 'guest_lead' ||
        role === 'external_user' ||
        role === 'buyer' ||
        dmsRole === 'buyer';

      if (isBuyer) {
        // Buyer tried to access seller-side -> redirect to buyer-side
        router.replace('/bidding/buyer-side');
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
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Seller Portal Restricted</h2>
          <p className="text-xs text-slate-500 mb-6">
            This section is exclusively designated for the <b>Seller Super Admin</b>. As a Buyer, please access your designated Buyer Bidding portal.
          </p>
          <Link
            href="/bidding/buyer-side"
            className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Go to Buyer Bidding Portal
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

