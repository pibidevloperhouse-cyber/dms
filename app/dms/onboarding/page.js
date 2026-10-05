"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaCloud, 
  FaEnvelopeOpenText, 
  FaMobileAlt, 
  FaBitcoin, 
  FaBrain, 
  FaGlobe, 
  FaUsers, 
  FaStore,
  FaArrowRight,
  FaChevronRight,
  FaTimes
} from "react-icons/fa";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startupTypes = [
    { id: "saas", name: "SaaS", icon: <FaCloud className="text-3xl mb-3" /> },
    { id: "newsletter", name: "Newsletter", icon: <FaEnvelopeOpenText className="text-3xl mb-3" /> },
    { id: "mobile_app", name: "Mobile app", icon: <FaMobileAlt className="text-3xl mb-3" /> },
    { id: "crypto", name: "Crypto", icon: <FaBitcoin className="text-3xl mb-3" /> },
    { id: "ai", name: "AI", icon: <FaBrain className="text-3xl mb-3" /> },
    { id: "digital", name: "Digital", icon: <FaGlobe className="text-3xl mb-3" /> },
    { id: "agency", name: "Agency", icon: <FaUsers className="text-3xl mb-3" /> },
    { id: "marketplace", name: "Marketplace", icon: <FaStore className="text-3xl mb-3" /> },
  ];

  const toggleType = (id) => {
    setSelectedTypes(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleInterest = (item) => {
    setSelectedInterests(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleNext = async () => {
    if (step === 1 && selectedTypes.length === 0) return;
    
    if (step < 6) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      setTimeout(() => {
        router.push("/dms/marketplace/find_deal");
      }, 800);
    }
  };

  const handleSkip = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      handleNext();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep1 = () => (
    <div className="w-full max-w-4xl animate-fade-in-up">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-[#1e293b] mb-12 tracking-tight">
        Which startup types interest you?
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {startupTypes.map((type) => {
          const isSelected = selectedTypes.includes(type.id);
          return (
            <button
              key={type.id}
              onClick={() => toggleType(type.id)}
              className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-200 cursor-pointer shadow-sm
                ${isSelected 
                  ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-md transform -translate-y-1' 
                  : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:shadow-md'
                }`}
            >
              <div className={`transition-colors duration-200 ${isSelected ? 'text-blue-600' : 'text-indigo-900/70'}`}>
                {type.icon}
              </div>
              <span className={`font-semibold text-sm ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                {type.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderHistogram = (title, data, minLabel, maxLabel) => (
    <div className="w-full max-w-3xl animate-fade-in-up flex flex-col items-center">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-[#1e293b] mb-16 tracking-tight">
        {title}
      </h1>
      
      {/* Histogram Chart */}
      <div className="w-full relative h-40 flex items-end justify-between px-1 gap-1 mb-4">
        {data.map((val, i) => (
          <div 
            key={i} 
            className="bg-[#5c69fb] w-full rounded-t-sm transition-all duration-500 ease-out" 
            style={{ height: `${val}%` }}
          ></div>
        ))}
        {/* Baseline & Thumbs */}
        <div className="absolute -bottom-1 left-0 right-0 h-1.5 bg-[#5c69fb] rounded-full"></div>
        <div className="absolute -bottom-2 left-0 w-3.5 h-3.5 bg-[#5c69fb] rounded-full shadow border-2 border-white"></div>
        <div className="absolute -bottom-2 right-0 w-3.5 h-3.5 bg-[#5c69fb] rounded-full shadow border-2 border-white"></div>
      </div>

      {/* Inputs */}
      <div className="flex items-center gap-6 w-full mt-8">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Min</label>
          <input 
            type="text" 
            className="w-full border border-gray-200 rounded-lg p-3.5 text-sm font-medium text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={minLabel} 
            readOnly 
          />
        </div>
        <div className="text-gray-400 mt-6">—</div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Max</label>
          <input 
            type="text" 
            className="w-full border border-gray-200 rounded-lg p-3.5 text-sm font-medium text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={maxLabel} 
            readOnly 
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="w-full max-w-3xl animate-fade-in-up">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-[#1e293b] mb-12 tracking-tight">
        Which industries, business models, and tech stacks interest you?
      </h1>
      
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 mb-6">Choose your interests</h3>
        
        <div className="mb-6 relative">
          <h4 className="text-[13px] font-bold text-gray-700 mb-3">Industries</h4>
          <div className="flex gap-3 overflow-hidden pr-8">
            {["Education & Training", "Advertising", "Religion & Spirituality", "Pet Care"].map(item => {
              const isSelected = selectedInterests.includes(item);
              return (
                <button 
                  key={item} 
                  onClick={() => toggleInterest(item)}
                  className={`px-4 py-2 border rounded-full text-[13px] whitespace-nowrap transition-colors ${
                    isSelected 
                      ? 'border-[#4f46e5] bg-[#eef2ff] text-[#4f46e5] font-semibold' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <div className="absolute right-0 top-7 bottom-0 w-12 flex items-center justify-end pr-1 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none">
            <FaChevronRight className="text-gray-600 text-sm" />
          </div>
        </div>

        <div className="mb-6 relative">
          <h4 className="text-[13px] font-bold text-gray-700 mb-3">Business models</h4>
          <div className="flex gap-3 overflow-hidden pr-8">
            {["Subscription", "Ecommerce", "Agency-based", "Ecosystem", "On-Demand"].map(item => {
              const isSelected = selectedInterests.includes(item);
              return (
                <button 
                  key={item} 
                  onClick={() => toggleInterest(item)}
                  className={`px-4 py-2 border rounded-full text-[13px] whitespace-nowrap transition-colors ${
                    isSelected 
                      ? 'border-[#4f46e5] bg-[#eef2ff] text-[#4f46e5] font-semibold' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <div className="absolute right-0 top-7 bottom-0 w-12 flex items-center justify-end pr-1 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none">
            <FaChevronRight className="text-gray-600 text-sm" />
          </div>
        </div>

        <div className="mb-6 relative">
          <h4 className="text-[13px] font-bold text-gray-700 mb-3">Tech stacks</h4>
          <div className="flex gap-3 overflow-hidden pr-8">
            {["Freshdesk", "React Native", "MySQL", "Wix", "Amazon Web Services"].map(item => {
              const isSelected = selectedInterests.includes(item);
              return (
                <button 
                  key={item} 
                  onClick={() => toggleInterest(item)}
                  className={`px-4 py-2 border rounded-full text-[13px] whitespace-nowrap transition-colors ${
                    isSelected 
                      ? 'border-[#4f46e5] bg-[#eef2ff] text-[#4f46e5] font-semibold' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <div className="absolute right-0 top-7 bottom-0 w-12 flex items-center justify-end pr-1 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none">
            <FaChevronRight className="text-gray-600 text-sm" />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-[13px] font-bold text-gray-700 mb-3">Enter an interest and press enter to add</h4>
        <div className="w-full border border-gray-300 rounded-lg p-3 min-h-[50px] flex items-center bg-white">
          <span className="px-3 py-1.5 bg-[#eef2ff] text-[#4f46e5] rounded text-sm font-medium flex items-center gap-2">
            Business-to-business (B2B) <FaTimes className="text-[#a5b4fc] cursor-pointer hover:text-[#6366f1]" />
          </span>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="w-full max-w-2xl mx-auto animate-fade-in-up flex flex-col items-center">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-[#1e293b] mb-16 tracking-tight">
        In which countries would you prefer your startup to reside?
      </h1>
      
      <div className="w-full text-left">
        <label className="block text-xs font-bold text-gray-500 mb-2">Country</label>
        <div className="w-full border border-gray-200 rounded-lg p-4 min-h-[56px] flex items-center bg-white shadow-sm">
          <span className="text-[15px] font-medium text-gray-700 flex items-center justify-between w-full">
            india
            <FaTimes className="text-gray-400 cursor-pointer hover:text-gray-600" />
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-white border-b border-gray-100">
        <div className="flex items-center text-blue-600 font-bold text-2xl tracking-tighter">
          <span className="text-3xl mr-2">◮</span> DMS
        </div>
        <Link href="/dms/marketplace" className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
          Exit
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderHistogram(
          "What is your ideal revenue multiple range?",
          [90, 95, 40, 20, 10, 5, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 15, 0],
          "0x", 
          "20x+"
        )}
        {step === 3 && renderHistogram(
          "What is your ideal profit multiple range?",
          [10, 80, 90, 90, 50, 40, 30, 20, 5, 10, 2, 0, 5, 2, 0, 0, 0, 30, 0],
          "0x", 
          "20x+"
        )}
        {step === 4 && renderHistogram(
          "What is your ideal trailing twelve-month (TTM) revenue range?",
          [100, 98, 80, 40, 30, 20, 15, 12, 10, 8, 7, 5, 4, 3, 2, 1, 1, 5, 80, 2],
          "$0", 
          "$1,000,000+"
        )}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
      </main>

      {/* Footer / Progress Bar */}
      <footer className="w-full bg-white border-t border-gray-200 sticky bottom-0">
        {/* Progress bar line */}
        <div className="w-full h-1 bg-blue-100 absolute top-0 left-0">
          <div 
            className="h-full bg-[#3b47e5] transition-all duration-500 rounded-r-full" 
            style={{ width: `${(step / 6) * 100}%` }}
          ></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            {step > 1 ? (
              <button 
                onClick={handleBack}
                className="text-sm font-bold text-[#1e293b] hover:text-gray-600 px-4 py-2"
              >
                Back
              </button>
            ) : <div></div>}
          </div>
          
          <div className="flex items-center gap-3">
            {step >= 5 && (
              <button 
                onClick={handleSkip}
                className="px-6 py-2.5 rounded-lg font-bold text-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors bg-white shadow-sm"
              >
                Skip
              </button>
            )}
            <button 
              onClick={handleNext}
              disabled={(step === 1 && selectedTypes.length === 0) || isSubmitting}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-sm transition-all duration-200
                ${(step > 1 || selectedTypes.length > 0)
                  ? 'bg-[#1e293b] hover:bg-[#0f172a] text-white shadow hover:shadow-md' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              {isSubmitting ? 'Saving...' : 'Next'}
              {!isSubmitting && <FaArrowRight className="text-xs" />}
            </button>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
