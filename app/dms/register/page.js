"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { Country, State, City } from 'country-state-city';

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
  const [buyerType, setBuyerType] = useState("");
  const [buyerSubRole, setBuyerSubRole] = useState("");
  
  // Extra fields for Seller
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sellerRole, setSellerRole] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [country, setCountry] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [city, setCity] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [proofOfAuthority, setProofOfAuthority] = useState(null);
  const [additionalDocument, setAdditionalDocument] = useState(null);
  const [secIdNumber, setSecIdNumber] = useState("");
  const [aumDocument, setAumDocument] = useState(null);
  const [secRegistrationDocument, setSecRegistrationDocument] = useState(null);
  const [backersListDocument, setBackersListDocument] = useState(null);
  const [companyFinancialsDocument, setCompanyFinancialsDocument] = useState(null);
  const [networthCertificate, setNetworthCertificate] = useState(null);
  const [proofOfFundsDocument, setProofOfFundsDocument] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [companyDescription, setCompanyDescription] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [headquarters, setHeadquarters] = useState("");
  const [companyCapitalValue, setCompanyCapitalValue] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [keyPartners, setKeyPartners] = useState([]);
  const [partnerName, setPartnerName] = useState("");
  const [partnerLinkedIn, setPartnerLinkedIn] = useState("");
  const [fundingSource, setFundingSource] = useState("");
  const [targetIndustries, setTargetIndustries] = useState([]);
  const [revenueRange, setRevenueRange] = useState("");
  const [ebitdaRange, setEbitdaRange] = useState("");
  const [equityRange, setEquityRange] = useState("");
  const [geography, setGeography] = useState("");
  const [ownershipStake, setOwnershipStake] = useState([]);
  const [businessTraits, setBusinessTraits] = useState("");
  const [managementPreference, setManagementPreference] = useState([]);
  const [financingMethods, setFinancingMethods] = useState([]);
  const [timelineToClose, setTimelineToClose] = useState("");
  const [dealBreakers, setDealBreakers] = useState("");
  const [isTargetIndustriesOpen, setIsTargetIndustriesOpen] = useState(false);
  const [isFinancingMethodsOpen, setIsFinancingMethodsOpen] = useState(false);

  const allIndustries = [
    "Technology", "IT Services", "Software Product", "SaaS (Software as a Service)",
    "AI / Machine Learning", "Cloud Computing", "Cybersecurity", "FinTech",
    "Banking & Financial Services", "Insurance", "Healthcare", "Pharmaceuticals",
    "Biotechnology", "Manufacturing", "Automotive", "E-commerce", "Retail",
    "Telecommunications", "Media & Entertainment", "Education / EdTech",
    "Real Estate", "Construction", "Energy & Utilities", "Logistics & Transportation",
    "Agriculture / AgriTech", "Food & Beverage", "Consulting", "Aerospace & Defense",
    "Travel & Hospitality", "Other"
  ];

  const allFinancingMethods = [
    "Cash", "Bank Loan / Debt", "Seller Financing", "SBA Loan", "Venture Capital", 
    "Private Equity", "Equity Financing", "Mezzanine Financing", "Asset-Based Lending", 
    "Earn-out", "Other"
  ];

  const countries = [
    { code: "+91", iso: "in", length: 10 },
    { code: "+1", iso: "us", length: 10 },
    { code: "+44", iso: "gb", length: 10 },
    { code: "+61", iso: "au", length: 9 },
    { code: "+81", iso: "jp", length: 10 },
    { code: "+49", iso: "de", length: 11 },
    { code: "+33", iso: "fr", length: 9 },
    { code: "+971", iso: "ae", length: 9 }
  ];
  
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

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
      setLoadingText("Your company is under verification. Redirecting to login...");

      const timeout = setTimeout(() => {
        router.push('/dms/login');
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [progress, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (participantType === "Buyer" && currentStep === 1) {
      setCurrentStep(2);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('dealType', dealType);
      formData.append('participantType', participantType);
      formData.append('companyType', companyType);
      formData.append('companyName', companyName);
      formData.append('inviteToken', inviteToken);
      formData.append('projectId', projectId);
      formData.append('buyerType', buyerType);
      formData.append('buyerSubRole', buyerSubRole);
      formData.append('phoneNumber', `${selectedCountry.code} ${phoneNumber}`);
      formData.append('sellerRole', sellerRole);
      formData.append('websiteUrl', websiteUrl);
      formData.append('country', country);
      formData.append('stateRegion', stateRegion);
      formData.append('city', city);
      formData.append('linkedinUrl', linkedinUrl);
      formData.append('licenseNumber', licenseNumber);
      
      if (proofOfAuthority) {
        formData.append('proofOfAuthority', proofOfAuthority);
      }
      if (additionalDocument) {
        formData.append('additionalDocument', additionalDocument);
      }
      formData.append('secIdNumber', secIdNumber);
      if (aumDocument) formData.append('aumDocument', aumDocument);
      if (secRegistrationDocument) formData.append('secRegistrationDocument', secRegistrationDocument);
      if (backersListDocument) formData.append('backersListDocument', backersListDocument);
      if (companyFinancialsDocument) formData.append('companyFinancialsDocument', companyFinancialsDocument);
      if (networthCertificate) formData.append('networthCertificate', networthCertificate);
      if (proofOfFundsDocument) formData.append('proofOfFundsDocument', proofOfFundsDocument);
      formData.append('companyDescription', companyDescription);
      formData.append('foundedYear', foundedYear);
      formData.append('headquarters', headquarters);
      formData.append('companyCapitalValue', companyCapitalValue);
      formData.append('teamSize', teamSize);
      formData.append('keyPartners', JSON.stringify(keyPartners));
      formData.append('fundingSource', fundingSource);
      formData.append('targetIndustries', JSON.stringify(targetIndustries));
      formData.append('revenueRange', revenueRange);
      formData.append('ebitdaRange', ebitdaRange);
      formData.append('equityRange', equityRange);
      formData.append('geography', geography);
      formData.append('ownershipStake', JSON.stringify(ownershipStake));
      formData.append('businessTraits', businessTraits);
      formData.append('managementPreference', JSON.stringify(managementPreference));
      formData.append('financingMethods', JSON.stringify(financingMethods));
      formData.append('timelineToClose', timelineToClose);
      formData.append('dealBreakers', dealBreakers);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      const data = await res.json();
      // Do not store session variables since they are under verification
      
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
                {currentStep === 2 ? "Company Profile" : (inviteToken ? "Accept Deal Invitation" : "Create an account")}
              </h2>
              {currentStep === 1 && (
                inviteToken ? (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg flex items-start gap-3 text-sm">
                    <i className="fas fa-info-circle mt-0.5"></i>
                    <p>You have been invited to securely access a confidential deal. Please create your buyer account to proceed.</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-lg">Already have an account? <Link href="/dms/login" className="text-[#3b82f6] font-semibold hover:underline">Sign in</Link></p>
                )
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
            <form onSubmit={handleSubmit}>
              <div className={currentStep === 1 ? "space-y-6" : "hidden"}>
              {/* 1. First Name & Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white" placeholder="Doe" />
                </div>
              </div>

              {/* 2. Operational Type */}
              {!inviteToken && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Operational Type</label>
                  <select
                    value={dealType}
                    onChange={(e) => setDealType(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white appearance-none"
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
                    }} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white appearance-none"
                  >
                    <option value="" disabled>Select participant type...</option>
                    <option value="Buyer">Buyer</option>
                    <option value="Seller">Seller</option>
                  </select>
                </div>
              )}

              {/* 3.1. Buyer Role (Buyer) */}
              {participantType === "Buyer" && !inviteToken && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Buyer Role</label>
                  <select
                    value={buyerSubRole}
                    onChange={(e) => setBuyerSubRole(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white appearance-none"
                  >
                    <option value="" disabled>Select buyer role...</option>
                    <option value="Private Equity (PE)">Private Equity (PE)</option>
                    <option value="Venture Capital (VC)">Venture Capital (VC)</option>
                    <option value="Family Office">Family Office</option>
                    <option value="Search Fund">Search Fund</option>
                    <option value="Independent Sponsor">Independent Sponsor</option>
                    <option value="Holding Company">Holding Company</option>
                    <option value="Corporate M&A">Corporate M&A</option>
                    <option value="Individual Investor">Individual Investor</option>
                    <option value="Lender">Lender</option>
                  </select>
                </div>
              )}

              {/* 3.5. Buyer Type */}
              {participantType === "Buyer" && !inviteToken && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Registering as</label>
                  <select
                    value={buyerType}
                    onChange={(e) => setBuyerType(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white appearance-none"
                  >
                    <option value="" disabled>Select Individual or Company...</option>
                    <option value="Individual">Individual</option>
                    <option value="Company">Company</option>
                  </select>
                </div>
              )}

              {/* 4. Conditional Fields */}
              {(participantType === "Seller" || (participantType === "Buyer" && buyerType === "Company")) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white" placeholder="Company Name" />
                </div>
              )}

              {(participantType === "Seller" || (participantType === "Buyer" && buyerType === "Company")) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Type</label>
                  <select value={companyType} onChange={(e) => setCompanyType(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white appearance-none">
                    <option value="" disabled>Select your company type...</option>
                    <option>Technology</option>
                    <option>IT Services</option>
                    <option>Software Product</option>
                    <option>SaaS (Software as a Service)</option>
                    <option>AI / Machine Learning</option>
                    <option>Cloud Computing</option>
                    <option>Cybersecurity</option>
                    <option>FinTech</option>
                    <option>Banking & Financial Services</option>
                    <option>Insurance</option>
                    <option>Healthcare</option>
                    <option>Pharmaceuticals</option>
                    <option>Biotechnology</option>
                    <option>Manufacturing</option>
                    <option>Automotive</option>
                    <option>E-commerce</option>
                    <option>Retail</option>
                    <option>Telecommunications</option>
                    <option>Media & Entertainment</option>
                    <option>Education / EdTech</option>
                    <option>Real Estate</option>
                    <option>Construction</option>
                    <option>Energy & Utilities</option>
                    <option>Logistics & Transportation</option>
                    <option>Agriculture / AgriTech</option>
                    <option>Food & Beverage</option>
                    <option>Consulting</option>
                    <option>Aerospace & Defense</option>
                    <option>Travel & Hospitality</option>
                    <option>Other</option>
                  </select>
                </div>
              )}

              {/* Shared Fields */}
              {participantType && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <div className="flex rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#3b82f6] focus-within:border-[#3b82f6] bg-gray-50 focus-within:bg-white transition-all">
                      <div className="relative border-r border-gray-300 flex items-center">
                        <button 
                          type="button"
                          onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)} 
                          className="flex items-center gap-2 bg-transparent py-3 pl-3 pr-2 outline-none text-gray-700 h-full rounded-l-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <img src={`https://flagcdn.com/w20/${selectedCountry.iso}.png`} alt={selectedCountry.iso} className="w-5 h-auto shadow-sm" />
                          <span className="text-sm font-medium">{selectedCountry.code}</span>
                          <svg className={`w-4 h-4 text-gray-500 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        
                        {isCountryDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsCountryDropdownOpen(false)}></div>
                            <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-200 shadow-xl rounded-lg z-50 max-h-60 overflow-y-auto">
                              {countries.map(c => (
                                <button
                                  key={c.code}
                                  type="button"
                                  className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm transition-colors border-b border-gray-100 last:border-0"
                                  onClick={() => {
                                    setSelectedCountry(c);
                                    setIsCountryDropdownOpen(false);
                                    setPhoneNumber(phoneNumber.slice(0, c.length));
                                  }}
                                >
                                  <img src={`https://flagcdn.com/w20/${c.iso}.png`} alt={c.iso} className="w-5 h-auto shadow-sm" />
                                  <span className="font-medium text-gray-700">{c.code}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <input 
                        type="tel" 
                        value={phoneNumber} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= selectedCountry.length) {
                            setPhoneNumber(val);
                          }
                        }}
                        className="w-full px-3 py-3 outline-none bg-transparent rounded-r-lg" 
                        placeholder={selectedCountry.iso === 'in' ? "00000 00000" : "0000 000 000"} 
                        maxLength={selectedCountry.length} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Company Website URL</label>
                      <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white" placeholder="https://www.example.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn Company URL (Optional)</label>
                      <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white" placeholder="https://linkedin.com/company/..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                      <select 
                        value={selectedCountryCode} 
                        onChange={(e) => {
                          const code = e.target.value;
                          setSelectedCountryCode(code);
                          setCountry(Country.getCountryByCode(code)?.name || "");
                          setSelectedStateCode("");
                          setStateRegion("");
                          setCity("");
                        }} 
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white appearance-none" >
                        <option value="" disabled>Select Country...</option>
                        {Country.getAllCountries().map(c => (
                          <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State / Province</label>
                      <select 
                        value={selectedStateCode} 
                        onChange={(e) => {
                          const code = e.target.value;
                          setSelectedStateCode(code);
                          setStateRegion(State.getStateByCodeAndCountry(code, selectedCountryCode)?.name || "");
                          setCity("");
                        }} 
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white appearance-none" disabled={!selectedCountryCode || State.getStatesOfCountry(selectedCountryCode).length === 0}
                      >
                        <option value="" disabled>Select State...</option>
                        {selectedCountryCode && State.getStatesOfCountry(selectedCountryCode).map((s, i) => (
                          <option key={`${s.isoCode}-${i}`} value={s.isoCode}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                      <select 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)} 
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white appearance-none" disabled={!selectedCountryCode}
                      >
                        <option value="" disabled>Select City...</option>
                        {(selectedStateCode 
                            ? City.getCitiesOfState(selectedCountryCode, selectedStateCode) 
                            : selectedCountryCode 
                              ? City.getCitiesOfCountry(selectedCountryCode) 
                              : []
                        ).map((c, i) => (
                          <option key={`${c.name}-${i}`} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Extra Seller Fields */}
              {participantType === "Seller" && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Seller Role</label>
                    <select value={sellerRole} onChange={(e) => setSellerRole(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white appearance-none">
                      <option value="" disabled>Select role...</option>
                      <option value="owner">Owner</option>
                      <option value="advisor">Advisor</option>
                      <option value="broker">Broker</option>
                    </select>
                  </div>

                  {sellerRole === 'owner' ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Business Registration Certificate <span className="text-red-500">*</span></label>
                      <input type="file" onChange={(e) => setProofOfAuthority(e.target.files[0])} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                  ) : sellerRole === 'advisor' || sellerRole === 'broker' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">License Number</label>
                        <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white" placeholder="License Number" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Client Representation Letter <span className="text-red-500">*</span></label>
                        <input type="file" onChange={(e) => setProofOfAuthority(e.target.files[0])} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Proof of Authority <span className="text-red-500">*</span></label>
                        <input type="file" onChange={(e) => setProofOfAuthority(e.target.files[0])} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Document</label>
                        <input type="file" onChange={(e) => setAdditionalDocument(e.target.files[0])} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Proof of Document (Buyer) */}
              {participantType === "Buyer" && (
                (buyerSubRole === "Private Equity (PE)" || buyerSubRole === "Venture Capital (VC)" || buyerSubRole === "Family Office") ? (
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Securities Exchange Commission ID Number</label>
                      <input type="text" value={secIdNumber} onChange={(e) => setSecIdNumber(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white" placeholder="Enter SEC ID Number" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col h-full">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">AUM (Assets Under Management) Statement <span className="text-red-500">*</span></label>
                        <input type="file" onChange={(e) => setAumDocument(e.target.files[0])} required className="mt-auto w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      </div>
                      <div className="flex flex-col h-full">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">SEC Registration Document <span className="text-red-500">*</span></label>
                        <input type="file" onChange={(e) => setSecRegistrationDocument(e.target.files[0])} required className="mt-auto w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      </div>
                    </div>
                  </div>
                ) : (buyerSubRole === "Search Fund" || buyerSubRole === "Independent Sponsor") ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Backers List Document <span className="text-red-500">*</span></label>
                    <input 
                      type="file" 
                      onChange={(e) => setBackersListDocument(e.target.files[0])} required 
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                ) : (buyerSubRole === "Holding Company" || buyerSubRole === "Corporate M&A") ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company Financials Document <span className="text-red-500">*</span></label>
                    <input 
                      type="file" 
                      onChange={(e) => setCompanyFinancialsDocument(e.target.files[0])} required 
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                ) : (buyerSubRole === "Individual Investor") ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col h-full">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Networth Certificate <span className="text-red-500">*</span></label>
                      <input type="file" onChange={(e) => setNetworthCertificate(e.target.files[0])} required className="mt-auto w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                    <div className="flex flex-col h-full">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Proof of Funds Document <span className="text-red-500">*</span></label>
                      <input type="file" onChange={(e) => setProofOfFundsDocument(e.target.files[0])} required className="mt-auto w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                  </div>
                ) : buyerSubRole !== "Lender" ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Proof of Document</label>
                    <input 
                      type="file" 
                      onChange={(e) => setProofOfAuthority(e.target.files[0])} 
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                    />
                  </div>
                ) : null
              )}

              {/* 5. Work Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Work Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white" placeholder="john@company.com" />
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
                    placeholder="••••••••" minLength={8} 
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
                <input type="checkbox" id="terms" className="mt-1 w-5 h-5 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6] cursor-pointer" />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                  I agree to the <a href="#" className="text-[#3b82f6] font-medium hover:underline">Terms of Service</a> and <a href="#" className="text-[#3b82f6] font-medium hover:underline">Privacy Policy</a>.
                </label>
              </div>

              <button type="submit" className="w-full bg-[#3b82f6] hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg transition-colors mt-8 shadow-md hover:shadow-lg text-lg">
                {participantType === "Buyer" ? "Next" : "Create Account"}
              </button>
              </div>

              <div className={currentStep === 2 ? "space-y-6 animate-fade-in" : "hidden"}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Description</label>
                  <textarea 
                    value={companyDescription} 
                    onChange={(e) => setCompanyDescription(e.target.value)} 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white min-h-[150px] resize-y" 
                    placeholder="Briefly describe your company's operations, focus, and strategic goals..."  required={currentStep === 2} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Founded Date</label>
                  <input 
                    type="date"
                    value={foundedYear}
                    onChange={(e) => setFoundedYear(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Headquarters</label>
                  <select 
                    value={headquarters} 
                    onChange={(e) => setHeadquarters(e.target.value)} 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white appearance-none" 
                  >
                    <option value="" disabled>Select Headquarters...</option>
                    {Country.getAllCountries().map(c => (
                      <option key={c.isoCode} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Capital Value (in USD)</label>
                  <input 
                    type="number"
                    value={companyCapitalValue}
                    onChange={(e) => setCompanyCapitalValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="e.g. 5000000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Team Size</label>
                  <input 
                    type="number"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="e.g. 150"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Key Partners</label>
                  
                  {/* Main Input Display Area */}
                  <div className="w-full min-h-[60px] px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 flex flex-wrap gap-2 mb-3">
                    {keyPartners.length === 0 && <span className="text-gray-400">No partners added yet...</span>}
                    {keyPartners.map((partner, index) => (
                      <div key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        <span className="font-semibold">{partner.name}</span>
                        <span className="text-blue-400">|</span>
                        <span className="text-xs truncate max-w-[150px]">{partner.linkedin}</span>
                        <button type="button" onClick={() => setKeyPartners(keyPartners.filter((_, i) => i !== index))} className="text-blue-500 hover:text-blue-800 ml-1 focus:outline-none">
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Sub Inputs for Entry */}
                  <div className="flex flex-col md:flex-row gap-3">
                    <input 
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="Partner Name"
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-white text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if(partnerName && partnerLinkedIn) {
                            setKeyPartners([...keyPartners, { name: partnerName, linkedin: partnerLinkedIn }]);
                            setPartnerName("");
                            setPartnerLinkedIn("");
                          }
                        }
                      }}
                    />
                    <input 
                      type="url"
                      value={partnerLinkedIn}
                      onChange={(e) => setPartnerLinkedIn(e.target.value)}
                      placeholder="LinkedIn URL"
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-white text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if(partnerName && partnerLinkedIn) {
                            setKeyPartners([...keyPartners, { name: partnerName, linkedin: partnerLinkedIn }]);
                            setPartnerName("");
                            setPartnerLinkedIn("");
                          }
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        if(partnerName && partnerLinkedIn) {
                          setKeyPartners([...keyPartners, { name: partnerName, linkedin: partnerLinkedIn }]);
                          setPartnerName("");
                          setPartnerLinkedIn("");
                        }
                      }}
                      className="bg-[#3b82f6] hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors whitespace-nowrap text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Funding Source <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <select 
                    value={fundingSource} 
                    onChange={(e) => setFundingSource(e.target.value)} 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white appearance-none" 
                  >
                    <option value="" disabled>Select Funding Source...</option>
                    <option value="Bootstrapped / Self-Funded">Bootstrapped / Self-Funded</option>
                    <option value="Angel Investors">Angel Investors</option>
                    <option value="Venture Capital">Venture Capital</option>
                    <option value="Private Equity">Private Equity</option>
                    <option value="Debt Financing / Bank Loan">Debt Financing / Bank Loan</option>
                    <option value="Public Markets">Public Markets</option>
                    <option value="Corporate Backed / Strategic Investor">Corporate Backed / Strategic Investor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Target Industries</label>
                  
                  {/* Custom Dropdown Trigger / Display area */}
                  <div 
                    onClick={() => setIsTargetIndustriesOpen(!isTargetIndustriesOpen)}
                    className="w-full min-h-[50px] px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 flex flex-wrap gap-2 cursor-pointer focus-within:ring-2 focus-within:ring-[#3b82f6] transition-all"
                  >
                    {targetIndustries.length === 0 && <span className="text-gray-400 my-auto">Select Target Industries...</span>}
                    {targetIndustries.map(industry => (
                      <span key={industry} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                        {industry}
                        <button type="button" onClick={() => setTargetIndustries(targetIndustries.filter(i => i !== industry))} className="text-blue-500 hover:text-blue-800 ml-1 font-bold focus:outline-none">&times;</button>
                      </span>
                    ))}
                  </div>

                  {/* Dropdown Options */}
                  {isTargetIndustriesOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsTargetIndustriesOpen(false)}></div>
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 shadow-xl rounded-lg z-50 max-h-64 overflow-y-auto p-2">
                        {allIndustries.map(industry => (
                          <label key={industry} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                            <input 
                              type="checkbox" 
                              checked={targetIndustries.includes(industry)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTargetIndustries([...targetIndustries, industry]);
                                } else {
                                  setTargetIndustries(targetIndustries.filter(i => i !== industry));
                                }
                              }}
                              className="w-4 h-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6] cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 font-medium">{industry}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Revenue Range</label>
                  <input 
                    type="text"
                    value={revenueRange}
                    onChange={(e) => setRevenueRange(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="e.g. $1M - $5M"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">EBITDA Range</label>
                  <input 
                    type="text"
                    value={ebitdaRange}
                    onChange={(e) => setEbitdaRange(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="e.g. $500K - $2M"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Equity Range</label>
                  <input 
                    type="text"
                    value={equityRange}
                    onChange={(e) => setEquityRange(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="e.g. 10% - 25%"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Geography</label>
                  <select 
                    value={geography} 
                    onChange={(e) => setGeography(e.target.value)} 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white appearance-none" 
                  >
                    <option value="" disabled>Select Target Geography...</option>
                    {Country.getAllCountries().map(c => (
                      <option key={c.isoCode} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Ownership Stake Sought</label>
                  <div className="flex flex-wrap gap-6">
                    {['100%', 'Majority', 'Minority'].map(stake => (
                      <label key={stake} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={ownershipStake.includes(stake)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setOwnershipStake([...ownershipStake, stake]);
                            } else {
                              setOwnershipStake(ownershipStake.filter(s => s !== stake));
                            }
                          }}
                          className="w-5 h-5 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6] cursor-pointer"
                        />
                        <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">{stake}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Traits Wanted <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input 
                    type="text"
                    value={businessTraits}
                    onChange={(e) => setBusinessTraits(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="e.g. High recurring revenue, strong management team..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Management</label>
                  <div className="flex flex-wrap gap-6">
                    {['Owner Stay', 'Owner Exits'].map(pref => (
                      <label key={pref} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={managementPreference.includes(pref)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setManagementPreference([...managementPreference, pref]);
                            } else {
                              setManagementPreference(managementPreference.filter(p => p !== pref));
                            }
                          }}
                          className="w-5 h-5 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6] cursor-pointer"
                        />
                        <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">{pref}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Financing Method</label>
                  
                  <div 
                    onClick={() => setIsFinancingMethodsOpen(!isFinancingMethodsOpen)}
                    className="w-full min-h-[50px] px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 flex flex-wrap gap-2 cursor-pointer focus-within:ring-2 focus-within:ring-[#3b82f6] transition-all"
                  >
                    {financingMethods.length === 0 && <span className="text-gray-400 my-auto">Select Financing Methods...</span>}
                    {financingMethods.map(method => (
                      <span key={method} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                        {method}
                        <button type="button" onClick={() => setFinancingMethods(financingMethods.filter(i => i !== method))} className="text-blue-500 hover:text-blue-800 ml-1 font-bold focus:outline-none">&times;</button>
                      </span>
                    ))}
                  </div>

                  {isFinancingMethodsOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsFinancingMethodsOpen(false)}></div>
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 shadow-xl rounded-lg z-50 max-h-64 overflow-y-auto p-2">
                        {allFinancingMethods.map(method => (
                          <label key={method} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                            <input 
                              type="checkbox" 
                              checked={financingMethods.includes(method)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFinancingMethods([...financingMethods, method]);
                                } else {
                                  setFinancingMethods(financingMethods.filter(i => i !== method));
                                }
                              }}
                              className="w-4 h-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6] cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 font-medium">{method}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Timeline to Close (in Days)</label>
                  <input 
                    type="number"
                    value={timelineToClose}
                    onChange={(e) => setTimelineToClose(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="e.g. 90"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Deal Breakers <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <textarea 
                    value={dealBreakers}
                    onChange={(e) => setDealBreakers(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all bg-gray-50 focus:bg-white resize-y min-h-[100px]"
                    placeholder="List any strict deal breakers here..."
                  ></textarea>
                </div>
                <div className="flex gap-4 mt-8">
                  <button type="button" onClick={() => setCurrentStep(1)} className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 px-4 rounded-lg transition-colors shadow-sm hover:shadow text-lg">
                    Back
                  </button>
                  <button type="submit" className="w-2/3 bg-[#3b82f6] hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg text-lg">
                    Create Account
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
