"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";

export default function DMSRegister() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Starting...");
  const [dealType, setDealType] = useState("");
  const [participantType, setParticipantType] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [projectId, setProjectId] = useState("");
  
  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [companyType, setCompanyType] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('inviteToken');
      const proj = searchParams.get('projectId');
      if (token) {
        setInviteToken(token);
        setProjectId(proj);
        setDealType("M&A");
        setParticipantType("Buyer");
      }
    }
  }, []);

  useEffect(() => {
    if (!isSubmitting) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isSubmitting]);

  useEffect(() => {
    if (progress >= 0 && progress < 30) {
      setLoadingText("Initializing setup...");
    } else if (progress >= 30 && progress < 50) {
      setLoadingText("Creating your account...");
    } else if (progress >= 50 && progress < 90) {
      setLoadingText("Almost ready your account...");
    } else if (progress >= 90 && progress < 100) {
      setLoadingText("Ready your account...");
    } else if (progress === 100) {
      setLoadingText("Account created! Redirecting...");

      const roleToSet = participantType || 'Buyer';
      localStorage.setItem('userRole', roleToSet);

      const timeout = setTimeout(() => {
        if (inviteToken) {
          router.push('/dms/workspace');
        } else if (roleToSet === 'Buyer') {
          router.push('/dms/marketplace');
        } else {
          router.push('/dms/workspace');
        }
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [progress, router, inviteToken, participantType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, lastName, email, password, dealType, participantType, companyType, companyName, inviteToken, projectId
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      const data = await res.json();
      if (data.userId) localStorage.setItem('userId', data.userId);
      if (data.companyId) localStorage.setItem('companyId', data.companyId);
      
      // The progress effect will handle the loading bar and redirect
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      alert(error.message);
    }
  };
  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center p-4 md:p-8 font-sans overflow-hidden">
      <div className="w-full max-w-6xl h-[95vh] max-h-[900px] min-h-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Panel */}
        <div className="relative md:w-[50%] lg:w-[45%] bg-[#0b1120] text-white p-10 md:p-16 flex flex-col justify-center">
          <Link href="/dms" className="absolute top-10 left-10 md:top-16 md:left-16 flex items-center text-gray-400 hover:text-white transition-colors group w-fit">
            <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to DMS</span>
          </Link>

          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Join Secure DMS</h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Create an account to browse confidential acquisition opportunities, execute NDAs, and manage end-to-end deal workflows in a single secure environment.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="md:w-[50%] lg:w-[55%] flex p-8 md:p-12 lg:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-lg m-auto py-8">
          {!isSubmitting && (
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                {inviteToken ? "Accept Deal Invitation" : "Create an account"}
              </h2>
              {inviteToken ? (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg flex items-start gap-3 text-sm">
                  <i className="fas fa-info-circle mt-0.5"></i>
                  <p>You have been invited to securely access a confidential deal. Please create your buyer account to proceed.</p>
                </div>
              ) : (
                <p className="text-gray-500 text-lg">Already have an account? <Link href="/dms/login" className="text-[#3b82f6] font-semibold hover:underline">Sign in</Link></p>
              )}
            </div>
          )}

          {isSubmitting ? (
            <div className="py-20 flex flex-col justify-center h-full min-h-[400px] animate-fade-in">
              <div className="mb-10">
                <h3 className="text-2xl font-bold text-[#3b82f6] mb-3 transition-all duration-300">{loadingText}</h3>
                <p className="text-gray-500 text-lg">Please wait while we provision your secure environment.</p>
              </div>

              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-[#3b82f6] transition-all duration-1000 ease-linear relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="mt-4 text-right font-bold text-gray-400 text-lg">
                {progress}%
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* 1. First Name & Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white" placeholder="John" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white" placeholder="Doe" required />
                </div>
              </div>

              {/* 2. Which type? */}
              {!inviteToken && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Which type?</label>
                  <select
                    value={dealType}
                    onChange={(e) => setDealType(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white appearance-none"
                  >
                    <option value="" disabled>Select type...</option>
                    <option value="M&A">M&A</option>
                  </select>
                </div>
              )}

              {/* 3. Type (Buyer/Seller) */}
              {dealType === "M&A" && !inviteToken && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    value={participantType}
                    onChange={(e) => {
                      setParticipantType(e.target.value);
                    }}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white appearance-none"
                  >
                    <option value="" disabled>Select participant type...</option>
                    <option value="Buyer">Buyer</option>
                    <option value="Seller">Seller</option>
                  </select>
                </div>
              )}

              {/* 4. Conditional Fields */}
              {(participantType === "Seller" || participantType === "Buyer") && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white" placeholder="Company Name" required />
                </div>
              )}

              {(participantType === "Seller" || participantType === "Buyer") && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Type</label>
                  <select value={companyType} onChange={(e) => setCompanyType(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white appearance-none">
                    <option value="" disabled>Select your company type...</option>
                    <option>Corporate Development</option>
                    <option>Private Equity</option>
                    <option>Investment Bank</option>
                    <option>Law Firm</option>
                    <option>Advisor</option>
                    <option>Other</option>
                  </select>
                </div>
              )}

              {/* 5. Work Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Work Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white" placeholder="john@company.com" required />
              </div>
              
              {/* 6. Password */}
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
                    minLength={8} 
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Must be at least 8 characters long.</p>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <input type="checkbox" id="terms" required className="mt-1 w-5 h-5 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6] cursor-pointer" />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                  I agree to the <a href="#" className="text-[#3b82f6] font-medium hover:underline">Terms of Service</a> and <a href="#" className="text-[#3b82f6] font-medium hover:underline">Privacy Policy</a>.
                </label>
              </div>

              <button type="submit" className="w-full bg-[#3b82f6] hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg transition-colors mt-8 shadow-md hover:shadow-lg text-lg">
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
