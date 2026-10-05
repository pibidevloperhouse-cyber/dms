'use client';

import React, { useEffect, useState } from 'react';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { Building2, User, Globe, Briefcase, ChartLine, CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, DollarSign, Users, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OnboardingWizard() {
  const router = useRouter();
  const { step, formData, nextStep, prevStep, updateFormData } = useOnboardingStore();
  const [mounted, setMounted] = useState(false);
  const [isVerifyingUrl, setIsVerifyingUrl] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      nextStep();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, userId should be extracted from your session hook (e.g. useSession)
      // For testing, we send a dummy string or rely on the backend to use the logged-in user.
      const response = await fetch('/api/dms/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          formData, 
          userId: 'dummy-user-id-for-testing-replace-later' 
        }),
      });

      if (response.ok) {
        alert("Profile Saved! Redirecting to Marketplace...");
        router.push('/dms/marketplace');
      } else {
        alert("Failed to save data. Check console.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUrlVerify = async () => {
    if (!formData.websiteUrl) return;
    setIsVerifyingUrl(true);
    // Simulate SSL/API check
    setTimeout(() => setIsVerifyingUrl(false), 1500);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome to DMS</h2>
              <p className="text-gray-500 mt-2">Let's start with some basic information about you.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Entity</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => updateFormData({ sellerType: 'individual' })}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      formData.sellerType === 'individual' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <User size={20} />
                    <span className="font-semibold">Individual</span>
                  </button>
                  <button
                    onClick={() => updateFormData({ sellerType: 'company' })}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      formData.sellerType === 'company' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <Building2 size={20} />
                    <span className="font-semibold">Company</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Are you the Owner or a Broker?</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => updateFormData({ isBroker: false })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      !formData.isBroker ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200'
                    }`}
                  >
                    Owner
                  </button>
                  <button
                    onClick={() => updateFormData({ isBroker: true })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.isBroker ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200'
                    }`}
                  >
                    Broker
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => updateFormData({ linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Startup Details</h2>
              <p className="text-gray-500 mt-2">Tell buyers about the business you are selling.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Startup Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => updateFormData({ companyName: e.target.value })}
                  placeholder="e.g. Acme Corp"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => updateFormData({ websiteUrl: e.target.value })}
                    placeholder="https://acme.com"
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button 
                    onClick={handleUrlVerify}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2 whitespace-nowrap"
                  >
                    {isVerifyingUrl ? <span className="animate-pulse">Checking...</span> : <><ShieldCheck size={18}/> Verify SSL</>}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => updateFormData({ country: e.target.value })}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="US">United States</option>
                    <option value="India">India</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Singapore">Singapore</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Size</label>
                  <select
                    value={formData.teamSize}
                    onChange={(e) => updateFormData({ teamSize: e.target.value })}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="Solo">Solo</option>
                    <option value="2-10">2-10 Employees</option>
                    <option value="11-50">11-50 Employees</option>
                    <option value="50+">50+ Employees</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Granular Financials</h2>
              <p className="text-gray-500 mt-2">Numbers matter. Provide accurate financial metrics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2"><DollarSign size={18} className="text-green-600"/> Revenue & Profit</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">TTM Revenue (USD)</label>
                  <input
                    type="number"
                    value={formData.ttmRevenue}
                    onChange={(e) => updateFormData({ ttmRevenue: e.target.value })}
                    className="w-full p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">TTM Profit (USD)</label>
                  <input
                    type="number"
                    value={formData.ttmProfit}
                    onChange={(e) => updateFormData({ ttmProfit: e.target.value })}
                    className="w-full p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Activity size={18} className="text-blue-600"/> SaaS Metrics</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ARR (USD)</label>
                  <input
                    type="number"
                    value={formData.arr}
                    onChange={(e) => updateFormData({ arr: e.target.value })}
                    className="w-full p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Churn Rate (%)</label>
                  <input
                    type="number"
                    value={formData.churnRate}
                    onChange={(e) => updateFormData({ churnRate: e.target.value })}
                    className="w-full p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Business Context</h2>
              <p className="text-gray-500 mt-2">Help buyers understand the story behind the numbers.</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competitors</label>
                <textarea
                  rows="2"
                  value={formData.competitors}
                  onChange={(e) => updateFormData({ competitors: e.target.value })}
                  placeholder="Who are your main competitors?"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Growth Opportunities</label>
                <textarea
                  rows="2"
                  value={formData.growthOpportunities}
                  onChange={(e) => updateFormData({ growthOpportunities: e.target.value })}
                  placeholder="If you kept the business, how would you grow it?"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Selling</label>
                <textarea
                  rows="2"
                  value={formData.reasonForSelling}
                  onChange={(e) => updateFormData({ reasonForSelling: e.target.value })}
                  placeholder="Why are you selling?"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                ></textarea>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Pricing & Review</h2>
              <p className="text-gray-500 mt-2">Set your expectations for the acquisition.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl space-y-6">
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">Asking Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    value={formData.askingPrice}
                    onChange={(e) => updateFormData({ askingPrice: e.target.value })}
                    className="w-full p-4 pl-8 text-xl font-bold rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                    placeholder="1,000,000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Price Justification</label>
                <textarea
                  rows="3"
                  value={formData.priceJustification}
                  onChange={(e) => updateFormData({ priceJustification: e.target.value })}
                  placeholder="Explain why you are asking for this price (e.g. 5x ARR multiple)..."
                  className="w-full p-3 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white"
                ></textarea>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-start gap-3">
              <ShieldCheck className="text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 leading-relaxed">
                <strong className="text-gray-800 block mb-1">Privacy Notice</strong>
                By proceeding, you agree to generate an anonymous Teaser. Buyers will not see your actual startup name or URL until an NDA is signed. Next step: Identity Verification via Persona.
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col pt-12 pb-24 font-sans">
      <div className="max-w-3xl w-full mx-auto px-6">
        
        {/* Progress Bar & Header */}
        <div className="mb-10">
          <div className="flex justify-between text-sm font-medium text-gray-400 mb-2 px-1">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}% Completed</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-12 overflow-hidden relative">
          
          {/* Subtle Background Decoration */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

          <div className="relative z-10">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors ${
                step === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft size={18} /> Back
            </button>
            
            {step < totalSteps ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all active:scale-95"
              >
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg shadow-green-200 transition-all active:scale-95"
              >
                Complete & Verify <CheckCircle2 size={18} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
