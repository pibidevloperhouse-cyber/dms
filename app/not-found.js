"use client";

import Link from "next/link";
import { FaHome, FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Animated Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#00c875] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
        <div className="mb-8 relative">
          <h1 className="text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-500 leading-none drop-shadow-sm select-none">
            404
          </h1>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
          Oops! Looks like you're lost.
        </h2>
        <p className="text-lg text-gray-500 mb-10 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm hover:shadow group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
          <Link 
            href="/dms"
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0b1120] text-white font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <FaHome />
            Return Home
          </Link>
        </div>
      </div>

      {/* Footer text */}
      <div className="absolute bottom-8 text-sm text-gray-400 font-medium">
        © {new Date().getFullYear()} Vishwa Tech. All rights reserved.
      </div>
      
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
