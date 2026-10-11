"use client";

import React from "react";

export default function DynamicForm({ 
  config = [], 
  formData = {}, 
  onChange, 
  participantType = "all" 
}) {
  
  const handleInputChange = (key, value) => {
    if (onChange) {
      onChange(key, value);
    }
  };

  const visibleFields = config.filter(field => 
    field.showFor.includes("all") || field.showFor.includes(participantType)
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {visibleFields.map((field) => (
        <div key={field.key} className="flex flex-col space-y-3">
          
          <label className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight flex items-center justify-between">
            <span>
              {field.label} {field.required && <span className="text-blue-600">*</span>}
            </span>
            {field.visibility === "after_nda" && (
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Private
              </span>
            )}
          </label>
          
          {field.helper && (
            <p className="text-sm text-gray-500 font-medium">{field.helper}</p>
          )}

          {/* Render inputs based on type */}
          {field.type === "text" || field.type === "email" || field.type === "phone" || field.type === "url" || field.type === "number" ? (
            <input
              type={field.type}
              value={formData[field.key] || ""}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              required={field.required}
              className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-gray-50/50 hover:bg-white"
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          ) : field.type === "textarea" ? (
            <textarea
              value={formData[field.key] || ""}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              required={field.required}
              rows={4}
              className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-gray-50/50 hover:bg-white resize-none"
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          ) : field.type === "select" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {field.options?.map((opt, i) => {
                const isSelected = formData[field.key] === opt.value;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleInputChange(field.key, opt.value)}
                    className={`flex items-center justify-between p-5 text-left border-2 rounded-xl transition-all duration-200 ${
                      isSelected 
                        ? "border-blue-600 bg-blue-50/50 shadow-md ring-1 ring-blue-600" 
                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`text-lg font-semibold ${isSelected ? "text-blue-900" : "text-gray-700"}`}>
                      {opt.label}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-blue-600" : "border-gray-300"}`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : field.type === "checkbox" ? (
            <label className="flex items-start space-x-4 p-5 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center h-6">
                <input
                  type="checkbox"
                  checked={formData[field.key] || false}
                  onChange={(e) => handleInputChange(field.key, e.target.checked)}
                  required={field.required}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-medium text-gray-900">I confirm</span>
                <span className="text-sm text-gray-500">{field.label}</span>
              </div>
            </label>
          ) : field.type === "file" ? (
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 mb-3 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 font-semibold">Click to upload <span className="font-normal">or drag and drop</span></p>
                  <p className="text-xs text-gray-400">PDF, JPG, or PNG (MAX. 10MB)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => handleInputChange(field.key, e.target.files[0])}
                  required={field.required}
                />
              </label>
            </div>
          ) : field.type === "currency" ? (
             <div className="relative flex items-center">
                <span className="absolute left-4 text-xl font-medium text-gray-400">$</span>
                <input
                  type="number"
                  value={formData[field.key] || ""}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  required={field.required}
                  className="w-full pl-10 px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-gray-50/50 hover:bg-white"
                  placeholder="0.00"
                />
             </div>
          ) : (
             <div className="text-sm text-gray-500 p-4 bg-gray-100 rounded-xl border border-dashed border-gray-300 flex items-center justify-center">
               <span className="font-mono bg-gray-200 px-2 py-1 rounded text-gray-600 text-xs mr-2">{field.type}</span>
               <span>Pending implementation</span>
             </div>
          )}
        </div>
      ))}
    </div>
  );
}
