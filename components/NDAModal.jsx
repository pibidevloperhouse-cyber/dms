"use client";

import { useState, useRef } from "react";
import { FaTimes, FaUpload, FaEraser, FaCheck } from "react-icons/fa";
import SignatureCanvas from 'react-signature-canvas';

export default function NDAModal({ isOpen, onClose, onAccept, projectName, companyName }) {
  const [signatureType, setSignatureType] = useState('draw'); // 'draw' or 'upload'
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const sigCanvas = useRef(null);

  if (!isOpen) return null;

  const handleClearSignature = () => {
    sigCanvas.current?.clear();
    setHasDrawn(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (signatureType === 'draw' && !hasDrawn) return;
    if (signatureType === 'upload' && !uploadedImage) return;

    let signatureData = null;
    if (signatureType === 'draw') {
      signatureData = sigCanvas.current.toDataURL();
    } else {
      signatureData = uploadedImage;
    }

    onAccept(signatureData);
  };

  const isSubmitDisabled = (signatureType === 'draw' && !hasDrawn) || (signatureType === 'upload' && !uploadedImage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Non-Disclosure Agreement</h2>
            <p className="text-sm text-gray-500 mt-1">Please review and sign to access the data room.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
          
          {/* T&C Text */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 h-48 overflow-y-auto text-sm text-gray-700 leading-relaxed shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 text-base">CONFIDENTIALITY AGREEMENT</h3>
            <p className="mb-3">This Non-Disclosure Agreement (the "Agreement") is entered into with respect to the project "{projectName}" involving {companyName}.</p>
            <p className="mb-3">1. <strong>Confidential Information.</strong> The Receiving Party understands that the Disclosing Party has disclosed or may disclose information relating to the Project, which to the extent previously, presently, or subsequently disclosed to the Receiving Party is hereinafter referred to as "Confidential Information" of the Disclosing Party.</p>
            <p className="mb-3">2. <strong>Non-Use and Non-Disclosure.</strong> The Receiving Party agrees not to use any Confidential Information for any purpose except to evaluate and engage in discussions concerning a potential business relationship between the parties.</p>
            <p className="mb-3">3. <strong>Maintenance of Confidentiality.</strong> The Receiving Party agrees that it shall take reasonable measures to protect the secrecy of and avoid disclosure and unauthorized use of the Confidential Information of the Disclosing Party.</p>
            <p>By signing below, you agree to be bound by these terms.</p>
          </div>

          {/* Signature Area */}
          <div>
            <div className="flex justify-between items-end mb-3">
              <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">Your Signature</label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setSignatureType('draw')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${signatureType === 'draw' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Draw
                </button>
                <button 
                  onClick={() => setSignatureType('upload')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${signatureType === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Upload
                </button>
              </div>
            </div>

            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg overflow-hidden relative group transition-colors hover:border-gray-400 min-h-[160px] flex items-center justify-center">
              
              {signatureType === 'draw' && (
                <>
                  <div className="absolute inset-0">
                    <SignatureCanvas 
                      penColor="black"
                      canvasProps={{ className: "w-full h-full" }}
                      ref={sigCanvas}
                      onEnd={() => setHasDrawn(true)}
                    />
                  </div>
                  {!hasDrawn && <div className="absolute pointer-events-none text-gray-400 font-medium text-sm">Sign here...</div>}
                  <button 
                    onClick={handleClearSignature}
                    className="absolute top-2 right-2 text-xs text-gray-500 hover:text-gray-900 bg-white shadow-sm border border-gray-200 px-2 py-1 rounded-md z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                  >
                    <FaEraser /> Clear
                  </button>
                </>
              )}

              {signatureType === 'upload' && (
                <div className="w-full p-4 flex flex-col items-center justify-center relative">
                  {uploadedImage ? (
                    <div className="relative w-full h-32 flex justify-center">
                      <img src={uploadedImage} alt="Signature" className="max-h-full object-contain" />
                      <button 
                        onClick={() => setUploadedImage(null)}
                        className="absolute top-0 right-0 text-xs text-gray-500 hover:text-red-600 bg-white shadow-sm border border-gray-200 px-2 py-1 rounded-md z-10 flex items-center gap-1 font-medium"
                      >
                        <FaTimes /> Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center p-6 border-2 border-transparent hover:bg-gray-50 rounded-lg w-full transition-colors">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                        <FaUpload className="text-xl" />
                      </div>
                      <span className="text-sm font-bold text-gray-700 mb-1">Click to upload signature</span>
                      <span className="text-xs text-gray-400">PNG, JPG up to 2MB</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-white border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-bold transition-colors text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`px-6 py-2.5 rounded-lg font-bold transition-colors text-sm shadow-sm flex items-center gap-2 ${
              isSubmitDisabled 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-[var(--brand)] hover:bg-[var(--brand-secondary)] text-white'
            }`}
          >
            <FaCheck /> Submit & Enter Data Room
          </button>
        </div>

      </div>
    </div>
  );
}
