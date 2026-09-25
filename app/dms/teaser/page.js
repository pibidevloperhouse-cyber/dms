"use client";

import { Suspense, useState, useEffect } from "react";
import { FaArrowLeft, FaLock, FaCheck, FaTimes, FaPowerOff, FaThLarge, FaBriefcase, FaChartLine, FaUser } from "react-icons/fa";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function TeaserContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectName = searchParams.get('project') || "Project Aurora";
  const isApproved = searchParams.get('approved') === 'true';

  const [userRole, setUserRole] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setUserRole(localStorage.getItem('userRole'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('companyId');
    localStorage.removeItem('userName');
    router.push('/dms/login');
  };

  const handleRemoveFromMarketplace = () => {
    if (confirm("Are you sure you want to remove this teaser from the marketplace?")) {
      const marketTeasers = JSON.parse(localStorage.getItem('dms_market_teasers') || '[]');
      const updatedTeasers = marketTeasers.filter(t => t.projectName !== projectName);
      localStorage.setItem('dms_market_teasers', JSON.stringify(updatedTeasers));
      router.push('/dms/marketplace');
    }
  };

  const [requestForm, setRequestForm] = useState({
    fullName: "",
    email: "",
    company: "",
    jobTitle: "",
    investorType: "Select type",
    investmentRange: "Select range",
    message: ""
  });

  const handleFormChange = (e) => {
    setRequestForm({ ...requestForm, [e.target.name]: e.target.value });
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.fullName || !requestForm.company) {
      alert("Please provide at least a Full Name and Company.");
      return;
    }

    const projectId = searchParams.get('projectId');
    const buyerId = localStorage.getItem('userId');

    if (!projectId || !buyerId) {
      alert("Missing project ID or user ID. Please login as a buyer.");
      return;
    }

    try {
      const res = await fetch('/api/dms/proposals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          buyerId,
          message: requestForm.message,
          company: requestForm.company,
          jobTitle: requestForm.jobTitle,
          investorType: requestForm.investorType,
          investmentRange: requestForm.investmentRange,
          fullName: requestForm.fullName
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setRequestForm({
          fullName: "",
          email: "",
          company: "",
          jobTitle: "",
          investorType: "Select type",
          investmentRange: "Select range",
          message: ""
        });
        router.push('/dms/tracker');
      } else if (res.status === 409) {
        alert("You have already requested access for this deal.");
      } else {
        alert("Failed to submit request. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting request");
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-[#f8fafc] selection:bg-teal-600/20">
      
      {/* Left Sidebar (Only for logged in) */}
      {isMounted && userRole && (
        <aside className="w-[72px] bg-[#111827] flex flex-col items-center py-6 shrink-0 h-screen sticky top-0 z-50">
          {/* Logo */}
          <div className="w-10 h-10 bg-[#008f70] rounded-md flex items-center justify-center text-white font-bold text-xl mb-8 shadow-sm cursor-pointer hover:bg-[#007058] transition-colors">
            D
          </div>
          
          {/* Nav Icons */}
          <div className="flex flex-col gap-4 w-full items-center">
            {/* Overview */}
            <button 
              onClick={() => { sessionStorage.setItem('marketplaceTab', 'overview'); router.push('/dms/marketplace'); }}
              className="relative p-3 w-full flex justify-center text-white group" 
              title="Overview"
            >
              <div className="p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors">
                <FaThLarge className="w-[20px] h-[20px] text-gray-400 group-hover:text-white transition-colors" />
              </div>
            </button>
            
            {/* Marketplace */}
            <button 
              onClick={() => { sessionStorage.setItem('marketplaceTab', 'marketplace'); router.push('/dms/marketplace'); }}
              className="relative p-3 w-full flex justify-center text-white group" 
              title="Marketplace"
            >
              <div className="p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors">
                <FaBriefcase className="w-[20px] h-[20px] text-gray-400 group-hover:text-white transition-colors" />
              </div>
            </button>
            
            {/* Tracker */}
            <button 
              onClick={() => router.push('/dms/tracker')}
              className="relative p-3 w-full flex justify-center text-white group" 
              title="Tracker"
            >
              <div className="p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors">
                <FaChartLine className="w-[20px] h-[20px] text-gray-400 group-hover:text-white transition-colors" />
              </div>
            </button>
            
            {/* Profile */}
            <button 
              onClick={() => { sessionStorage.setItem('marketplaceTab', 'profile'); router.push('/dms/marketplace'); }}
              className="relative p-3 w-full flex justify-center text-white group mt-1" 
              title="Profile"
            >
              <div className="p-2.5 rounded-lg hover:bg-[#1f2937] transition-colors">
                <FaUser className="w-[20px] h-[20px] text-gray-400 group-hover:text-white transition-colors" />
              </div>
            </button>
          </div>
          
          {/* Bottom Icons */}
          <div className="mt-auto flex flex-col gap-4 text-gray-400 w-full items-center">
            <button 
              className="p-3 hover:text-red-400 transition-colors" 
              title="Logout"
              onClick={handleLogout}
            >
              <FaPowerOff className="w-[22px] h-[22px]" />
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">

      {/* Hero / Header Section */}
      <div className="bg-[#f8fafc]">
        <div className="max-w-[1500px] w-full mx-auto px-4 md:px-8 lg:px-12 pt-8 pb-12">
          {/* Back Button */}
          {/* {isApproved ? (
            <Link href="/dms/workspace" className="inline-flex items-center text-sm font-medium text-[#008f70] hover:text-[#007058] transition-colors mb-12">
              <FaArrowLeft className="mr-2" /> Back to workspace
            </Link>
          ) : (
            <Link href="/dms/marketplace" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-12">
              <FaArrowLeft className="mr-2" /> Back to marketplace
            </Link>
          )} */}

          {/* Top Badges */}
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 bg-[#008f70] text-white text-[11px] font-bold tracking-wide rounded-lg uppercase">
              Confidential Opportunity
            </span>
            <span className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">
              {projectName}
            </span>
          </div>

          {/* Header Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-6">
                {projectName}
              </h1>

              <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-8">
                A profitable mid-market B2B SaaS company providing workflow automation
                solutions to enterprise customers.
              </p>

              <div className="flex flex-wrap items-center text-sm font-medium text-[#008f70]">
                <span>B2B SaaS</span>
                <span className="mx-3 text-gray-300">/</span>
                <span className="text-[#008f70]">North America</span>
                <span className="mx-3 text-gray-300">/</span>
                <span className="text-[#008f70]">Majority Acquisition</span>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                {isApproved ? (
                  <>
                    <div className="flex items-center gap-2 mb-4 text-[#00c875]">
                      <FaCheck />
                      <h3 className="text-xs font-bold tracking-widest uppercase">Access Approved</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-6">
                      You have full access to view confidential deal documents and participate in the transaction.
                    </p>
                    <button
                      onClick={() => alert("Redirecting to Virtual Data Room (Documents)...")}
                      className="w-full py-3 bg-[#00c875] hover:bg-[#00a863] text-white text-sm font-bold rounded transition-colors"
                    >
                      Open Data Room
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4 text-gray-900">
                      <FaLock className="text-[#008f70]" />
                      <h3 className="text-xs font-bold tracking-widest uppercase">Identity Protected</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Company identity and detailed transaction information are available only to qualified buyers.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="bg-white border-t border-gray-200 py-12 md:py-16">
        <div className="max-w-[1500px] w-full mx-auto px-4 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 items-start">

            {/* Left Column (Detailed Data) */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Company Overview</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-12">
                A profitable mid-market B2B SaaS company providing workflow automation solutions to enterprise customers. The company combines a durable operating model with an attractive opportunity for a well-capitalized partner to support its next phase of growth.
              </p>

              <h2 className="text-lg font-bold text-gray-900 mb-6">Key Highlights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-12">
                {[
                  "10+ years operating history",
                  "Strong recurring revenue",
                  "90%+ customer retention",
                  "High margin business model",
                  "Experienced management team",
                  "Attractive growth opportunity"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 md:last:border-b-0">
                    <div className="w-5 h-5 bg-green-50 border border-green-100 text-green-600 rounded flex items-center justify-center flex-shrink-0">
                      <FaCheck className="text-[10px]" />
                    </div>
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <h2 className="text-lg font-bold text-gray-900 mb-6">Financial Snapshot</h2>
              <div className="bg-white border border-gray-200 rounded-xl flex flex-col md:flex-row overflow-hidden text-center md:text-left">
                <div className="p-5 flex-1 border-b md:border-b-0 md:border-r border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Revenue</p>
                  <p className="text-xl font-bold text-gray-900">$12.4M</p>
                </div>
                <div className="p-5 flex-1 border-b md:border-b-0 md:border-r border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">EBITDA</p>
                  <p className="text-xl font-bold text-gray-900">$3.1M</p>
                </div>
                <div className="p-5 flex-1 border-b md:border-b-0 md:border-r border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">EBITDA Margin</p>
                  <p className="text-xl font-bold text-gray-900">25%</p>
                </div>
                <div className="p-5 flex-1 border-b md:border-b-0 md:border-r border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">YoY Growth</p>
                  <p className="text-xl font-bold text-[#00c875]">+28% YoY</p>
                </div>
                <div className="p-5 flex-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Employees</p>
                  <p className="text-xl font-bold text-gray-900">85</p>
                </div>
              </div>
            </div>

            {/* Right Column (Transaction Overview Box) */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                <h3 className="text-[10px] font-bold text-[#008f70] tracking-widest uppercase mb-6">Transaction Overview</h3>

                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Deal Type</span>
                  <span className="text-sm font-bold text-gray-900">Majority Acquisition</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Geography</span>
                  <span className="text-sm font-bold text-gray-900">North America</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Sector</span>
                  <span className="text-sm font-bold text-gray-900">B2B SaaS</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Revenue Multiple</span>
                  <span className="text-sm font-bold text-gray-900">Confidential</span>
                </div>
                <div className="flex justify-between items-start py-3 mb-6">
                  <span className="text-sm text-gray-500 mt-0.5">Asking Price</span>
                  <span className="text-sm font-bold text-gray-900 text-right">Available upon<br />qualified access</span>
                </div>

                {!isApproved && (
                  <>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-full py-3 bg-[#0b1120] hover:bg-gray-800 text-white text-sm font-bold rounded transition-colors mb-4"
                    >
                      Request Access
                    </button>

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <svg className="w-3 h-3 text-[#00c875]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span>Controlled seller approval</span>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Request Access Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0b1120]/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#f8fafc] w-full max-w-[600px] rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.1)] relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors p-1"
            >
              <FaTimes />
            </button>

            <div className="p-8 pb-6 bg-[#f8fafc] rounded-t-xl">
              <div className="w-10 h-10 bg-[#0b1120] rounded-xl flex items-center justify-center mb-5 border border-gray-800">
                <FaLock className="text-[#008f70]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Access to This Opportunity</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Tell the deal representative who you are and why this opportunity fits your mandate.
              </p>
            </div>

            <div className="p-8 overflow-y-auto bg-white border-t border-gray-200/60">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Full Name</label>
                  <input type="text" name="fullName" value={requestForm.fullName} onChange={handleFormChange} placeholder="Alex Morgan" className="w-full border border-gray-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#008f70] focus:border-[#008f70] transition-colors text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Work Email</label>
                  <input type="email" name="email" value={requestForm.email} onChange={handleFormChange} placeholder="alex@firm.com" className="w-full border border-gray-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#008f70] focus:border-[#008f70] transition-colors text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Company</label>
                  <input type="text" name="company" value={requestForm.company} onChange={handleFormChange} placeholder="Northstar Capital" className="w-full border border-gray-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#008f70] focus:border-[#008f70] transition-colors text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Job Title</label>
                  <input type="text" name="jobTitle" value={requestForm.jobTitle} onChange={handleFormChange} placeholder="Partner" className="w-full border border-gray-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#008f70] focus:border-[#008f70] transition-colors text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Investor / Buyer Type</label>
                  <select name="investorType" value={requestForm.investorType} onChange={handleFormChange} className="w-full border border-gray-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#008f70] focus:border-[#008f70] transition-colors text-gray-900 bg-white">
                    <option>Select type</option>
                    <option>Private Equity</option>
                    <option>Strategic Buyer</option>
                    <option>Family Office</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Investment Range</label>
                  <select name="investmentRange" value={requestForm.investmentRange} onChange={handleFormChange} className="w-full border border-gray-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#008f70] focus:border-[#008f70] transition-colors text-gray-900 bg-white">
                    <option>Select range</option>
                    <option>$1M - $5M</option>
                    <option>$5M - $20M</option>
                    <option>$20M+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Message</label>
                <textarea rows="4" name="message" value={requestForm.message} onChange={handleFormChange} placeholder="Share a little about your investment mandate..." className="w-full border border-gray-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#008f70] focus:border-[#008f70] transition-colors resize-none text-gray-900"></textarea>
              </div>
            </div>

            <div className="p-6 flex justify-end bg-white rounded-b-xl border-t border-gray-100">
              <button
                onClick={handleSubmitRequest}
                className="py-2.5 px-6 bg-[#0b1120] hover:bg-gray-800 text-white text-sm font-bold rounded transition-colors"
              >
                Submit Access Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <footer className="bg-[#0b1120] text-gray-400 py-16 border-t border-white/10 mt-auto">
        <div className="max-w-[1500px] w-full mx-auto px-4 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">

            <div className="md:col-span-1">
              <h2 className="text-white text-xl font-bold tracking-tight mb-4 flex items-center">
                <span className="w-6 h-6 bg-[#008f70] rounded-md mr-2 flex items-center justify-center text-white text-xs font-serif italic">N</span>
                Secure DMS
              </h2>
              <p className="text-sm leading-relaxed text-gray-500">
                Secure, anonymous deal flow for qualified buyers and corporate development teams.
              </p>
            </div>

            <div>
              <h3 className="text-white text-sm font-bold tracking-widest uppercase mb-4">Marketplace</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/dms/marketplace" className="hover:text-white transition-colors">Browse Deals</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white text-sm font-bold tracking-widest uppercase mb-4">Resources</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Legal & Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white text-sm font-bold tracking-widest uppercase mb-4">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Support</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Partnerships</Link></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <p>&copy; 2026 Nova DMS. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>

      </div>
    </div>
  );
}

export default function DealTeaserPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] p-8 flex justify-center items-center text-gray-500">Loading...</div>}>
      <TeaserContent />
    </Suspense>
  );
}
