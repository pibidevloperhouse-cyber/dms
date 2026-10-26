"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaEye, FaEyeSlash, FaLock, FaEnvelope, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [isLinkValid, setIsLinkValid] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState(null); // { type: 'success' | 'error', title, message, buttonText?, redirect? }

  // 1. One-time link verification on page load
  useEffect(() => {
    if (!token || !emailParam) {
      setIsCheckingToken(false);
      setIsLinkValid(false);
      setModal({
        type: 'error',
        title: 'Invalid Reset Link',
        message: 'This password reset link is invalid or incomplete. Please request a new link from the login page.',
        buttonText: 'Back to Login',
        redirect: '/dms/login',
      });
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}&email=${encodeURIComponent(emailParam)}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.valid) {
          setIsLinkValid(false);
          const isUsed = data.alreadyUsed || data.error?.toLowerCase().includes('already');
          setModal({
            type: 'error',
            title: isUsed ? 'Link Already Used' : 'Reset Link Expired',
            message: data.error || 'This password reset link is no longer valid. Each link can only be used one time.',
            buttonText: 'Back to Login',
            redirect: '/dms/login',
          });
        } else {
          setIsLinkValid(true);
        }
      } catch (err) {
        console.error('Token verification error:', err);
        setIsLinkValid(false);
        setModal({
          type: 'error',
          title: 'Verification Failed',
          message: 'Unable to verify reset link. Please check your internet connection and try again.',
          buttonText: 'Back to Login',
          redirect: '/dms/login',
        });
      } finally {
        setIsCheckingToken(false);
      }
    };

    verifyToken();
  }, [token, emailParam]);

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordLengthValid = newPassword.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent any duplicate submit attempts
    if (isSubmitting || !isLinkValid) return;

    if (!newPassword || !confirmPassword) {
      setModal({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please enter both your new password and confirmation password.',
        buttonText: 'Try again',
      });
      return;
    }

    if (!passwordLengthValid) {
      setModal({
        type: 'error',
        title: 'Password Too Short',
        message: 'Your new password must be at least 6 characters long.',
        buttonText: 'Try again',
      });
      return;
    }

    if (!passwordsMatch) {
      setModal({
        type: 'error',
        title: 'Passwords Do Not Match',
        message: 'The new password and confirmation password must be exactly the same.',
        buttonText: 'Try again',
      });
      return;
    }

    setIsSubmitting(true);
    setModal(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailParam,
          token,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setIsLinkValid(false);
        setModal({
          type: 'error',
          title: data.error?.includes('already') ? 'Link Already Used' : 'Reset Failed',
          message: data.error || 'Failed to update password. This link may have already been used.',
          buttonText: 'Back to Login',
          redirect: '/dms/login',
        });
        setIsSubmitting(false);
        return;
      }

      // Invalidate the link immediately in client state so no further clicks are allowed
      setIsLinkValid(false);

      // Success modal: Green tick, title 'Password Updated', no button, auto-redirect to login
      setModal({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been changed successfully. Redirecting to login...',
      });

      setTimeout(() => {
        router.push('/dms/login');
      }, 1500);
    } catch (err) {
      console.error(err);
      setModal({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to reach the server. Please check your connection and try again.',
        buttonText: 'Try again',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center p-4 md:p-8 font-sans overflow-hidden relative">
      {/* Centered Toast / Card Modal with Subtle Blur & Slight Grey Tint */}
      {modal && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/25 backdrop-blur-[2px] flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in"
          onClick={() => {
            if (modal.type !== 'success') {
              if (modal.redirect) router.push(modal.redirect);
              else setModal(null);
            }
          }}
        >
          <style>{`
            @keyframes swalScale {
              0% { opacity: 0; transform: scale(0.75); }
              100% { transform: scale(1); }
            }
            @keyframes swalIconPop {
              0% { opacity: 0; transform: scale(0.5); }
              60% { transform: scale(1.08); }
              100% { transform: scale(1); }
            }
          `}</style>
          <div
            className="bg-white rounded-[5px] shadow-2xl pt-9 pb-8 px-6 sm:px-10 w-[92%] sm:w-[440px] max-w-[440px] flex flex-col items-center text-center animate-[swalScale_0.2s_cubic-bezier(0.16,1,0.3,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Icon */}
            {modal.type === 'success' ? (
              <div className="w-[88px] h-[88px] rounded-full border-[4px] border-[#a5dc86] flex items-center justify-center mb-6 animate-[swalIconPop_0.35s_cubic-bezier(0.16,1,0.3,1)] select-none">
                <svg className="w-12 h-12 text-[#a5dc86]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            ) : (
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

            {/* Subtitle / Description */}
            {modal.message && (
              <p className="text-[16px] sm:text-[17px] text-[#545454] font-normal leading-relaxed max-w-[320px] mb-7">
                {modal.message}
              </p>
            )}

            {/* Action Button: Hidden on success */}
            {modal.type !== 'success' && (
              <button
                type="button"
                onClick={() => {
                  if (modal.redirect) router.push(modal.redirect);
                  else setModal(null);
                }}
                className="px-8 py-2.5 bg-[#7066e0] hover:bg-[#5e54d1] active:bg-[#4d43be] active:scale-95 text-white font-medium text-[15px] rounded-[4px] shadow-sm transition-all cursor-pointer min-w-[95px]"
              >
                {modal.buttonText || 'Try again'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl h-[95vh] max-h-[900px] min-h-[520px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Panel */}
        <div className="relative md:w-[50%] lg:w-[45%] bg-[#0b1120] text-white p-10 md:p-16 flex flex-col justify-center">
          <Link href="/dms/login" className="absolute top-10 left-10 md:top-16 md:left-16 flex items-center text-gray-400 hover:text-white transition-colors group w-fit">
            <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Sign In</span>
          </Link>

          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Create New Password</h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Set a new, secure password for your confidential DMS account. Each reset link can only be used one time to ensure the highest security for your data room.
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="md:w-[50%] lg:w-[55%] flex p-8 md:p-12 lg:p-16 bg-white overflow-y-auto">
          <div className="w-full max-w-md m-auto py-8">
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Reset Password</h2>
              <p className="text-gray-500 text-sm">Please choose a strong password with at least 6 characters.</p>
            </div>

            {/* Verified Email Badge */}
            {emailParam && (
              <div className="mb-6 p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                  <FaEnvelope size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Account Work Email</div>
                  <div className="text-sm font-medium text-blue-800 truncate">{emailParam}</div>
                </div>
              </div>
            )}

            {isCheckingToken ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-3">
                <div className="w-8 h-8 border-3 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium">Verifying reset link security...</p>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <FaLock size={15} />
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter new password"
                      required
                      disabled={isSubmitting || !isLinkValid}
                    />
                    <button
                      type="button"
                      disabled={!isLinkValid}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-40"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium">
                      {passwordLengthValid ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <FaCheckCircle size={12} /> Minimum 6 characters met
                        </span>
                      ) : (
                        <span className="text-amber-600 flex items-center gap-1">
                          <FaExclamationCircle size={12} /> Needs at least 6 characters
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <FaLock size={15} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Confirm new password"
                      required
                      disabled={isSubmitting || !isLinkValid}
                    />
                    <button
                      type="button"
                      disabled={!isLinkValid}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-40"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium">
                      {passwordsMatch ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <FaCheckCircle size={12} /> Passwords match
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <FaExclamationCircle size={12} /> Passwords do not match
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !isLinkValid || !passwordsMatch || !passwordLengthValid}
                  className="w-full bg-[#3b82f6] hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-lg transition-all mt-6 shadow-md hover:shadow-lg text-base flex justify-center items-center h-[54px] cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Save Password"
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link href="/dms/login" className="text-sm font-semibold text-[#3b82f6] hover:underline">
                Return to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
