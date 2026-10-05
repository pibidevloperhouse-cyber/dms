"use client";

import { useState } from "react";
import { FaPlus, FaEdit, FaTrashAlt, FaCopy, FaFileAlt, FaCheckCircle } from "react-icons/fa";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "Initial Teaser Message",
      subject: "Opportunity: Strategic Acquisition in SaaS",
      content: "Hi {BuyerName},\n\nWe recently listed an opportunity on the Secure DMS Marketplace that aligns with your active mandate. The company is a fast-growing B2B SaaS platform with strong ARR. \n\nPlease let me know if you would like me to grant you NDA access.\n\nBest regards,\n{SellerName}",
      lastUpdated: "Oct 01, 2026"
    },
    {
      id: 2,
      name: "NDA Access Granted",
      subject: "NDA Access Approved - Project Phoenix",
      content: "Hello {BuyerName},\n\nThank you for your interest. We have reviewed your profile and approved your access request. You can now execute the NDA in the Tracker to access the full teaser and financial highlights.\n\nLooking forward to our discussion.\n\nBest,\n{SellerName}",
      lastUpdated: "Sep 28, 2026"
    },
    {
      id: 3,
      name: "Request for Information Follow-up",
      subject: "Checking in on Project Phoenix",
      content: "Hi {BuyerName},\n\nI noticed you recently executed the NDA and reviewed the teaser for Project Phoenix. I would love to schedule a brief 15-minute introductory call to discuss the opportunity and answer any initial questions you might have.\n\nLet me know your availability this week.\n\nBest,\n{SellerName}",
      lastUpdated: "Sep 15, 2026"
    }
  ]);

  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full">
      <div className="pt-8 px-4 md:px-8 pb-12 max-w-[1400px] w-full mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Message Templates</h1>
            <p className="text-gray-500 text-sm max-w-2xl">
              Create and manage standard message templates to quickly communicate with buyers across your active deals.
            </p>
          </div>
          <button className="flex items-center gap-2 bg-[#008f70] hover:bg-[#007058] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm shrink-0">
            <FaPlus /> Create Template
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center shrink-0">
                    <FaFileAlt className="text-lg" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{template.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">Last updated: {template.lastUpdated}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleCopy(template.content, template.id)}
                    className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                    title="Copy content"
                  >
                    {copiedId === template.id ? <FaCheckCircle className="text-teal-500" /> : <FaCopy />}
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                    <FaEdit />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Subject Line</span>
                  <p className="font-medium text-gray-800 text-sm bg-gray-50 px-3 py-2 rounded border border-gray-100">{template.subject}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Message Content</span>
                  <div className="bg-gray-50 px-3 py-3 rounded border border-gray-100 min-h-[120px]">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{template.content}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {templates.length === 0 && (
          <div className="bg-white border border-gray-200 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <FaFileAlt className="text-gray-300 text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-500 max-w-sm mb-6">Create standardized messages to speed up your communication with prospective buyers.</p>
            <button className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">
              <FaPlus /> Create your first template
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
