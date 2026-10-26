"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";

export default function DMSLogin() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [modal, setModal] = useState(null); // { type: 'success' | 'info' | 'error', title: string, message: string, buttonText?: string }

  // Cooldown countdown to avoid multiple rapid clicks
  useEffect(() => {
    if (resetCooldown > 0) {
      const timer = setTimeout(() => setResetCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resetCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModal(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errText = errorData.error || 'Login failed';

        if (res.status === 403 && (errText.includes('verification') || errText.includes('approval'))) {
          setModal({
            type: 'info',
            title: 'Company Verification',
            message: errText,
            buttonText: 'OK'
          });
        } else if (res.status === 403 && errText.includes('suspended')) {
          setModal({
            type: 'error',
            title: 'Account Suspended',
            message: errText,
            buttonText: 'OK'
          });
        } else {
          setModal({
            type: 'error',
            title: 'Invalid Credentials',
            message: '',
            buttonText: 'Try again'
          });
        }
        setIsSubmitting(false);
        return;
      }

      const { data } = await res.json();

      // 1. Store VDR session so VDR pages (/workspace, /documents, etc.) recognize the user
      const vdrSession = {
        id: data.id,
        company_id: data.company_id,
        companyName: data.companyName,
        name: data.name,
        email: data.email,
        role: data.role,
        nda_status: data.nda_status || 'not_required',
        request_status: data.request_status || 'approved'
      };
      localStorage.setItem('vdr_session', JSON.stringify(vdrSession));

      // 2. Store DMS session keys
      localStorage.setItem('userRole', data.dmsRole || 'buyer');
      localStorage.setItem('vdrRole', data.role || 'external_user');
      localStorage.setItem('companyId', data.company_id || '');
      localStorage.setItem('companyName', data.companyName || '');
      localStorage.setItem('userId', data.id);
      localStorage.setItem('userName', data.name || 'User');
      localStorage.setItem('userEmail', data.email || email);
      localStorage.setItem('verificationStatus', data.verification_status || 'unverified');
      localStorage.setItem('loginTimestamp', Date.now().toString());

      // Show real-time success modal card (tick mark + Login successful only, no redirect message)
      setModal({
        type: 'success',
        title: 'Login successful',
        message: ''
      });

      // 3. Role-based redirect logic after brief delay
      setTimeout(async () => {
        const isMarketplaceAccessible = data.role === 'super_admin' || data.role === 'guest_admin';

        if (!isMarketplaceAccessible) {
          if (data.nda_status === 'pending') {
            router.push('/sign-nda');
          } else {
            router.push('/workspace');
          }
          return;
        }

        // Marketplace owners redirect
        if (data.role === 'guest_admin') {
          try {
            const dealsRes = await fetch(`/api/dms/buyer-deals?buyerId=${data.id}`);
            const dealsData = await dealsRes.json();
            if (dealsData.deals && dealsData.deals.length > 0) {
              const hasDirectInviteDeals = dealsData.deals.some(deal => !deal.proposalId);

              if (hasDirectInviteDeals) {
                router.push('/dms/marketplace/workspace');
                return;
              }
            }
          } catch (e) {
            console.error("Failed to check buyer deals", e);
          }
          router.push('/dms/marketplace/find_deal');
        } else {
          router.push('/dms/marketplace/overview');
        }
      }, 1400);
    } catch (error) {
      console.error(error);
      setModal({
        type: 'error',
        title: 'Invalid Credentials',
        message: '',
        buttonText: 'Try again'
      });
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setModal({
        type: 'info',
        title: 'Work Email Required',
        message: 'Please enter your work email in the field above to receive a password reset link.',
        buttonText: 'OK',
      });
      return;
    }

    setIsResetting(true);
    setModal(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 404) {
          setModal({
            type: 'error',
            title: 'Account Not Found',
            message: data.error || 'No account was found with this work email address.',
            buttonText: 'Try again',
          });
        } else {
          setModal({
            type: 'error',
            title: 'Reset Failed',
            message: data.error || 'Failed to send password reset email. Please try again.',
            buttonText: 'Try again',
          });
        }
        setIsResetting(false);
        return;
      }

      setResetCooldown(60); // 60-second cooldown to prevent spamming
      setModal({
        type: 'info',
        title: 'Reset Link Sent',
        message: `A password reset link has been sent to ${email.trim()}. Please check your inbox.`,
        buttonText: 'OK',
      });
      setIsResetting(false);
    } catch (err) {
      console.error('Forgot password error:', err);
      setModal({
        type: 'error',
        title: 'Connection Error',
        message: 'Could not connect to the server. Please check your connection and try again.',
        buttonText: 'Try again',
      });
      setIsResetting(false);
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center p-4 md:p-8 font-sans overflow-hidden relative">
      {/* Real-time Toast/Card Notification Modal - Center of Screen with Light Grey Tint & Subtle Blur */}
      {modal && (
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/25 backdrop-blur-[2px] flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in"
          onClick={() => {
            if (modal.type !== 'success') setModal(null);
          }}
        >
          <style>{`
            @keyframes swalScale {
              0% { opacity: 0; transform: scale(0.75); }
              100% { opacity: 1; transform: scale(1); }
            }
            @keyframes swalIconPop {
              0% { opacity: 0; transform: scale(0.5); }
              60% { opacity: 1; transform: scale(1.08); }
              100% { transform: scale(1); }
            }
          `}</style>
          <div 
            className="bg-white rounded-[5px] shadow-2xl pt-9 pb-8 px-6 sm:px-10 w-[92%] sm:w-[440px] max-w-[440px] flex flex-col items-center text-center animate-[swalScale_0.2s_cubic-bezier(0.16,1,0.3,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Success Icon (Image 2) */}
            {modal.type === 'success' && (
              <div className="w-[88px] h-[88px] rounded-full border-[4px] border-[#a5dc86] flex items-center justify-center mb-6 animate-[swalIconPop_0.35s_cubic-bezier(0.16,1,0.3,1)] select-none">
                <svg className="w-12 h-12 text-[#a5dc86]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}

            {/* 2. Alert Icon for Company Verification (Alert / Warning) */}
            {modal.type === 'info' && (
              <div className="w-[88px] h-[88px] rounded-full border-[4px] border-[#f8bb86] flex items-center justify-center mb-6 animate-[swalIconPop_0.35s_cubic-bezier(0.16,1,0.3,1)] select-none">
                <span className="text-[#f8bb86] text-[58px] font-normal leading-none font-sans select-none -mt-1">!</span>
              </div>
            )}

            {/* 3. Error / Invalid Credentials Icon (Image 3) */}
            {modal.type === 'error' && (
              <div className="w-[88px] h-[88px] rounded-full border-[4px] border-[#f27474] flex items-center justify-center mb-6 animate-[swalIconPop_0.35s_cubic-bezier(0.16,1,0.3,1)] select-none">
                <svg className="w-11 h-11 text-[#f27474]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            )}

            {/* Title */}
            <h3 className={`text-[27px] sm:text-[30px] font-semibold text-[#545454] tracking-tight ${modal.message ? 'mb-2' : (modal.type === 'success' ? 'mb-2' : 'mb-6')}`}>
              {modal.title}
            </h3>

            {/* Subtitle / Description (Only displayed when message exists) */}
            {modal.message ? (
              <p className="text-[16px] sm:text-[17px] text-[#545454] font-normal leading-relaxed max-w-[320px] mb-7">
                {modal.message}
              </p>
            ) : null}

            {/* Action Button: 'Try again' for error, 'OK' for info, Hidden on success */}
            {modal.type !== 'success' && (
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-8 py-2.5 bg-[#7066e0] hover:bg-[#5e54d1] active:bg-[#4d43be] active:scale-95 text-white font-medium text-[15px] rounded-[4px] shadow-sm transition-all cursor-pointer min-w-[95px]"
              >
                {modal.buttonText || 'Try again'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl h-[95vh] max-h-[900px] min-h-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Panel */}
        <div className="relative md:w-[50%] lg:w-[45%] bg-[#0b1120] text-white p-10 md:p-16 flex flex-col justify-center">
          <Link href="/dms" className="absolute top-10 left-10 md:top-16 md:left-16 flex items-center text-gray-400 hover:text-white transition-colors group w-fit">
            <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to DMS</span>
          </Link>

          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Welcome Back</h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Sign in to your Secure DMS account to access your confidential data rooms, manage deals, and review NDAs in one unified environment.
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="md:w-[50%] lg:w-[55%] flex p-8 md:p-12 lg:p-16 bg-white overflow-y-auto">
          <div className="w-full max-w-md m-auto py-8">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Sign in</h2>
              <p className="text-gray-500 text-lg">Don't have an account? <Link href="/dms/register" className="text-[#3b82f6] font-semibold hover:underline">Create one</Link></p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Work Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white" placeholder="example@company.com" required disabled={isSubmitting} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white pr-10"
                    placeholder="••••••••"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    disabled={isResetting || isSubmitting || resetCooldown > 0}
                    onClick={handleForgotPassword}
                    className="text-sm font-medium text-[#3b82f6] hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {isResetting ? "Sending reset link..." : (resetCooldown > 0 ? `Resend link in ${resetCooldown}s` : "Forgot password?")}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#3b82f6] hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg transition-colors mt-8 shadow-md hover:shadow-lg text-lg flex justify-center items-center h-[60px]"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
