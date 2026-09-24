"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";

export default function DMSLogin() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const { data } = await res.json();
      
      localStorage.setItem('userRole', data.dmsRole || 'buyer');
      localStorage.setItem('vdrRole', data.role || 'external_user');
      localStorage.setItem('companyId', data.company_id);
      localStorage.setItem('userId', data.id);
      localStorage.setItem('userName', data.name || 'User');
      localStorage.setItem('loginTimestamp', Date.now().toString());

      if (data.dmsRole === 'buyer') {
        try {
          const dealsRes = await fetch(`/api/dms/buyer-deals?buyerId=${data.id}`);
          const dealsData = await dealsRes.json();
          if (dealsData.deals && dealsData.deals.length > 0) {
            // Check if they have ANY deal that was created from a direct invite (known buyer)
            // A direct invite deal will not have a proposalId attached.
            const hasDirectInviteDeals = dealsData.deals.some(deal => !deal.proposalId);
            
            if (hasDirectInviteDeals) {
              router.push('/dms/workspace');
              return;
            }
          }
        } catch (e) {
          console.error("Failed to check buyer deals", e);
        }
        // If they only have deals from proposals (unknown buyer), or no deals at all, go to marketplace
        router.push('/dms/marketplace');
      } else {
        router.push('/dms/workspace');
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
      setIsSubmitting(false);
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
                <a href="#" className="text-sm font-medium text-[#3b82f6] hover:underline">Forgot password?</a>
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
