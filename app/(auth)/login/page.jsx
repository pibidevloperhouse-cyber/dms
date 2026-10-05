"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle, FaFacebook } from 'react-icons/fa';
import { FiShield } from "react-icons/fi";
import { supabase } from '@/utils/supabase/client';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectionPopup, setRejectionPopup] = useState({ show: false, reason: null });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      const user = result.data;

      // Check workspace request status for approval flow
      let requestStatus = user.request_status || 'approved';
      let rejectionReason = null;
      try {
        const resStatus = await fetch(`/api/request-workspace?email=${encodeURIComponent(user.email)}`);
        const statusData = await resStatus.json();
        if (statusData && statusData.status) {
          requestStatus = statusData.status;
          rejectionReason = statusData.rejection_reason;
        }
      } catch (err) {
        console.warn('Could not fetch workspace request status:', err);
      }

      if (requestStatus === 'rejected') {
        setRejectionPopup({
          show: true,
          reason: rejectionReason
        });
        setIsLoading(false);
        return;
      }

      // 2. Add nda_status and request_status to local storage so the whole app knows
      localStorage.setItem('vdr_session', JSON.stringify({
        id: user.id,
        company_id: user.company_id,
        name: user.name,
        email: user.email,
        role: user.role,
        nda_status: user.nda_status,
        request_status: requestStatus
      }));

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      // 3. THE FORK IN THE ROAD: Check if they are forced to sign the NDA
      if (user.nda_status === 'pending') {
        setSuccess('Update Required: Redirecting to NDA...');
        setTimeout(() => {
          router.push('/sign-nda'); // <--- CORRECTED
        }, 1500);
      } else {
        setSuccess(`${user.name} login successfully`);
        setTimeout(() => {
          const redirectUrl = sessionStorage.getItem('vdr_redirect_url');
          if (redirectUrl) {
            sessionStorage.removeItem('vdr_redirect_url');
            router.push(redirectUrl);
          } else {
            router.push('/workspace'); // Normal login redirects to workspace
          }
        }, 1500);
      }

    } catch (err) {
      setError('Login failed: ' + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand)]/10 via-white to-[var(--brand-secondary)]/10 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--brand)]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--brand-secondary)]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="relative w-full max-w-md">

        {/* Header */}
        <div className="flex flex-col items-center justify-center gap-3 mb-8 text-center">
          <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center shadow-md shadow-[var(--brand)]/20">
            <FiShield className="text-white text-2xl" strokeWidth={2.8} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Login</h1>
            <p className="text-gray-600 text-sm">Virtual Data Room Access</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm">

          {/* Animated Popup for Success/Error */}
          {(success || error) && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-transparent transition-opacity duration-300">
              <style>{`
                @keyframes popIn {
                  0% { transform: scale(0.9); opacity: 0; }
                  100% { transform: scale(1); opacity: 1; }
                }
                @keyframes drawStroke {
                  0% { stroke-dashoffset: 40; }
                  100% { stroke-dashoffset: 0; }
                }
              `}</style>
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center animate-[popIn_0.3s_cubic-bezier(0.16,1,0.3,1)] border border-slate-100">
                {success ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5 shadow-inner shadow-green-100">
                      <svg className="w-10 h-10 text-green-500" style={{ strokeDasharray: 40, animation: 'drawStroke 0.6s ease-out forwards' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Success!</h3>
                    <p className="text-slate-500 font-medium text-[15px]">{success}</p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-5 shadow-inner shadow-rose-100">
                      <svg className="w-10 h-10 text-rose-500" style={{ strokeDasharray: 40, animation: 'drawStroke 0.6s ease-out forwards' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Login Failed</h3>
                    <p className="text-slate-500 font-medium text-[15px]">{error}</p>
                    <button
                      onClick={() => setError('')}
                      className="mt-8 w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition-colors duration-200"
                    >
                      Try Again
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  id="email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition disabled:bg-gray-100 placeholder-gray-400 text-gray-900"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition disabled:bg-gray-100 placeholder-gray-400 text-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => { if (!isLoading) setShowPassword(!showPassword); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-gray-300 text-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)] cursor-pointer"
                />
                <span className="text-gray-600">Remember me</span>
              </label>
              {/* <Link href="/forgot-password" className="text-brand hover:text-brand-dark font-medium transition">
                Forgot Password?
              </Link> */}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[var(--brand)]/20"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-500 text-sm">Or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 text-sm p-2 mt-3">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[var(--brand)] hover:text-[var(--brand-dark)] font-semibold transition">
              Register
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Secure VDR Platform • Encrypted Connection
        </p>
        {/* Rejection Popup Modal */}
        {rejectionPopup.show && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 border border-red-100">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
                <FiShield className="text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Workspace Request Rejected</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Your plan request has been rejected. Please contact support.
              </p>
              {rejectionPopup.reason && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg text-left border border-red-100">
                  <strong>Reason:</strong> {rejectionPopup.reason}
                </div>
              )}
              <div className="pt-2">
                <button
                  onClick={() => setRejectionPopup({ show: false, reason: null })}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  Close & Contact Support
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}






