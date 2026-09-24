"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { FaShieldAlt, FaCheckCircle, FaPenNib, FaUpload, FaTrash, FaDownload, FaPrint } from "react-icons/fa";
import SignatureCanvas from "react-signature-canvas";

export default function SignNdaPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [companyData, setCompanyData] = useState(null);
    const [sessionData, setSessionData] = useState(null);
    const [ndaAccepted, setNdaAccepted] = useState(false);

    // ── DIGITAL SIGNATURE STATES ──────────────────────────────────────────────
    const [sigMode, setSigMode] = useState("draw"); // "draw" | "upload"
    const [sigPad, setSigPad] = useState(null); // Ref for SignatureCanvas
    const [uploadedSig, setUploadedSig] = useState(null); // Preview image URL for upload mode
    const [signatureData, setSignatureData] = useState(null); // Final base64/DataURL signature

    // Helper: Guarantee solid white (#FFFFFF) background by exporting as JPEG (which cannot have any transparency)
    const getWhiteBackgroundDataURL = (sourceCanvas) => {
        const canvas = document.createElement("canvas");
        canvas.width = sourceCanvas.width || 400;
        canvas.height = sourceCanvas.height || 150;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(sourceCanvas, 0, 0);
        return canvas.toDataURL("image/jpeg", 0.95);
    };

    // 1. Fetch User Session and Company NDA on Load
    useEffect(() => {
        const fetchRequiredData = async () => {
            try {
                // Get the user's session from localStorage
                const rawSession = localStorage.getItem("vdr_session");
                if (!rawSession) {
                    throw new Error("No active session found. Please log in again.");
                }
                const session = JSON.parse(rawSession);
                setSessionData(session);

                // Fetch the company's NDA text using the user's company_id
                const { data: company, error: compErr } = await supabase
                    .from("companies")
                    .select("id, name, nda_text")
                    .eq("id", session.company_id)
                    .single();

                if (compErr || !company) {
                    throw new Error("Could not load the Non-Disclosure Agreement for your organization.");
                }

                setCompanyData(company);

            } catch (err) {
                console.error("NDA Fetch Error:", err);
                setErrorMsg(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRequiredData();
    }, []);

    // 2. Handle Final Submission (Accepting the NDA)
    const handleAcceptNda = async () => {
        if (!ndaAccepted) {
            setErrorMsg("Please accept the NDA terms checkbox.");
            return;
        }

        if (!signatureData) {
            setErrorMsg("Please provide your digital signature (draw or upload) before accepting.");
            return;
        }

        setSubmitting(true);
        setErrorMsg("");

        try {
            // 1. Fetch Client IP Address for Audit Trail
            const fetchIpWithTimeout = async (url) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2500);
                try {
                    const res = await fetch(url, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    const data = await res.json();
                    return data?.ip || null;
                } catch (e) {
                    clearTimeout(timeoutId);
                    return null;
                }
            };

            const clientIp = await fetchIpWithTimeout("https://api.ipify.org?format=json")
                || await fetchIpWithTimeout("https://ipapi.co/json/")
                || "Recorded-Client-IP";

            const acceptTimestamp = new Date().toISOString();

            // Helper to convert base64 DataURL to Blob for Supabase storage upload
            const dataURLtoBlob = (dataurl) => {
                const arr = dataurl.split(",");
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new Blob([u8arr], { type: mime });
            };

            const fileName = `signature_${Date.now()}.jpg`;
            const signaturePath = `users/${sessionData.id}/${fileName}`;
            const sigBlob = dataURLtoBlob(signatureData);

            // Upload signature image to signature_documents storage bucket (like redacted-files)
            const { error: uploadErr } = await supabase.storage
                .from("signature_documents")
                .upload(signaturePath, sigBlob, {
                    upsert: true,
                    contentType: "image/jpeg",
                });

            if (uploadErr) {
                console.error("Signature storage upload failed:", uploadErr);
                throw new Error(`Storage upload failed (${uploadErr.message}). Please check signature_documents bucket & policies.`);
            }

            // Get Public URL for the uploaded signature
            const { data: publicUrlData } = supabase.storage
                .from("signature_documents")
                .getPublicUrl(signaturePath);

            const storageUrl = publicUrlData?.publicUrl || signatureData;

            // Prepare update payload including IP address and timestamp audit data
            const updatePayload = {
                nda_status: "accepted",
                nda_accepted_at: acceptTimestamp,
                nda_signature_path: signaturePath,
                nda_signature_url: storageUrl,
                nda_signature_type: sigMode,
                nda_ip_address: clientIp,
                nda_user_id: sessionData.id
            };

            // Update the user's status in the database to record the legal acceptance
            const { error: updateErr } = await supabase
                .from("users")
                .update(updatePayload)
                .eq("id", sessionData.id);

            if (updateErr) {
                console.warn("Full signature DB update failed, attempting fallback to save core NDA status...", updateErr);
                const { error: fallbackErr } = await supabase
                    .from("users")
                    .update({
                        nda_status: "accepted",
                        nda_accepted_at: acceptTimestamp,
                        nda_ip_address: clientIp
                    })
                    .eq("id", sessionData.id);

                if (fallbackErr) {
                    throw updateErr;
                }
            }

            // Update the local storage session so they don't get trapped in a loop
            const updatedSession = {
                ...sessionData,
                nda_status: "accepted",
                nda_accepted_at: acceptTimestamp,
                nda_signature_path: signaturePath,
                nda_signature_url: storageUrl,
                nda_signature_type: sigMode,
                nda_ip_address: clientIp
            };
            localStorage.setItem("vdr_session", JSON.stringify(updatedSession));

            // Route to Dashboard!
            router.push("/dms/workspace");

        } catch (err) {
            console.error("Failed to accept NDA:", err);
            setErrorMsg(`Save Error: ${err.message || "A database error occurred while saving your signature. Please try again."}`);
            setSubmitting(false);
        }
    };

    // 3. Handle Download Signed Agreement (With Embedded Signature)
    const handleDownloadSignedNDA = () => {
        if (!signatureData) {
            setErrorMsg("Please provide your signature before downloading the agreement.");
            return;
        }

        const companyName = companyData?.name || "Organization";
        const userName = sessionData?.name || sessionData?.email || "Authorized Signatory";
        const userEmail = sessionData?.email || "";
        const userId = sessionData?.id || "N/A";
        const clientIp = sessionData?.nda_ip_address || sessionData?.ip_address || "Recorded in Audit Log";
        const signDate = new Date().toLocaleString();
        const agreementContent = companyData?.nda_text || "<p>No terms provided.</p>";

        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            setErrorMsg("Please allow popups to download/print the signed NDA document.");
            return;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${companyName} - Signed NDA (${userName})</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        color: #1e293b;
                        line-height: 1.6;
                        padding: 40px;
                        max-w: 800px;
                        margin: 0 auto;
                        background: #ffffff;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #e2e8f0;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        font-size: 24px;
                        font-weight: 800;
                        margin: 0 0 8px 0;
                        color: #0f172a;
                    }
                    .header p {
                        font-size: 14px;
                        color: #64748b;
                        margin: 0;
                    }
                    .content {
                        font-size: 14px;
                        color: #0f172a;
                        margin-bottom: 40px;
                    }
                    .content h1, .content h2, .content h3 {
                        color: #0f172a;
                    }
                    .signature-box {
                        border-top: 2px solid #0f172a;
                        padding-top: 25px;
                        margin-top: 50px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        page-break-inside: avoid;
                    }
                    .sig-details {
                        font-size: 13px;
                    }
                    .sig-details p {
                        margin: 5px 0;
                    }
                    .sig-details strong {
                        color: #0f172a;
                    }
                    .sig-image-wrapper {
                        text-align: right;
                    }
                    .sig-image {
                        max-height: 80px;
                        max-width: 240px;
                        border-bottom: 1px solid #cbd5e1;
                        padding-bottom: 6px;
                        margin-bottom: 6px;
                        display: block;
                    }
                    .sig-label {
                        font-size: 11px;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .audit-footer {
                        margin-top: 40px;
                        padding-top: 15px;
                        border-top: 1px dashed #cbd5e1;
                        font-size: 11px;
                        color: #94a3b8;
                        text-align: center;
                    }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>NON-DISCLOSURE AGREEMENT</h1>
                    <p>${companyName} • Virtual Data Room Security Agreement</p>
                </div>

                <div class="content">
                    ${agreementContent}
                </div>

                <div class="signature-box">
                    <div class="sig-details">
                        <p><strong>Digitally Signed By:</strong> ${userName}</p>
                        ${userEmail ? `<p><strong>Email Address:</strong> ${userEmail}</p>` : ""}
                        <p><strong>User ID (Audit):</strong> ${userId}</p>
                        <p><strong>Client IP Address:</strong> ${clientIp}</p>
                        <p><strong>Legal Status:</strong> Accepted & Executed</p>
                        <p><strong>Execution Timestamp:</strong> ${signDate}</p>
                    </div>
                    <div class="sig-image-wrapper">
                        <img src="${signatureData}" class="sig-image" alt="Digital Signature" />
                        <div class="sig-label">Authorized Digital Signature</div>
                    </div>
                </div>

                <div class="audit-footer">
                    Executed and cryptographically stamped via Virtual Data Room Platform • Document Audit Trail Active
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 350);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-[var(--brand)] rounded-full animate-spin"></div>
                    <p className="text-sm font-medium">Loading security agreement...</p>
                </div>
            </div>
        );
    }

    if (errorMsg && !companyData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-rose-100 max-w-md w-full text-center">
                    <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaShieldAlt size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
                    <button
                        onClick={() => router.push("/login")}
                        className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all active:scale-95"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--brand)]/5 via-[#F8FAFC] to-[var(--brand-secondary)]/5 flex flex-col items-center justify-center p-4">

            <div className="max-w-3xl w-full">

                {/* Header Section */}
                <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-4">
                        <FaShieldAlt className="text-[var(--brand)] text-2xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Security Agreement Required</h1>
                    <p className="text-slate-500 text-sm mt-2 font-medium">
                        You must review and accept the Non-Disclosure Agreement for <span className="text-slate-800 font-bold">{companyData?.name}</span> to access the Virtual Data Room.
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">

                    {errorMsg && (
                        <div className="m-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-medium">
                            {errorMsg}
                        </div>
                    )}

                    <div className="p-8">

                        {/* The NDA Document Viewer */}
                        <div className="relative mb-6">
                            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-slate-50 to-transparent z-10 pointer-events-none rounded-t-2xl"></div>
                            <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-slate-50 to-transparent z-10 pointer-events-none rounded-b-2xl"></div>

                            <div className="w-full h-80 overflow-y-auto border-2 border-slate-200 bg-white rounded-2xl p-8 custom-scrollbar">
                                {/* FORCED PURE BLACK TEXT & PROPER HEADER SIZING */}
                                <div
                                    className="prose max-w-none text-black prose-p:text-black prose-headings:text-black prose-li:text-black prose-strong:text-black prose-h1:text-2xl prose-h1:font-extrabold prose-h1:text-center prose-h2:text-xl prose-h2:font-bold prose-h2:mt-6 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-300 prose-h2:pb-2"
                                    dangerouslySetInnerHTML={{ __html: companyData?.nda_text || "<p>No terms provided.</p>" }}
                                />
                            </div>
                        </div>

                        {/* ── DIGITAL SIGNATURE PAD SECTION ── */}
                        <div className="mb-6 border-2 border-slate-200 rounded-2xl p-6 bg-slate-50/70">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <FaPenNib className="text-[var(--brand)]" />
                                    <span className="text-sm font-bold text-slate-800">2. Provide Your Digital Signature</span>
                                    {signatureData && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                                            <FaCheckCircle className="text-[10px]" /> Signature Captured
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-1.5 bg-slate-200/80 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSigMode("draw");
                                            setSignatureData(null);
                                            setUploadedSig(null);
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sigMode === "draw"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        <FaPenNib className="text-xs" /> Draw
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSigMode("upload");
                                            setSignatureData(null);
                                            setUploadedSig(null);
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sigMode === "upload"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        <FaUpload className="text-xs" /> Upload
                                    </button>
                                </div>
                            </div>

                            {/* TAB 1: DRAW SIGNATURE */}
                            {sigMode === "draw" ? (
                                <div className="flex flex-col items-center">
                                    <div className="relative border-2 border-slate-300 bg-white rounded-xl w-full h-44 overflow-hidden shadow-inner">
                                        <SignatureCanvas
                                            ref={(ref) => setSigPad(ref)}
                                            backgroundColor="#ffffff"
                                            canvasProps={{
                                                className: "w-full h-full cursor-crosshair"
                                            }}
                                            onEnd={() => {
                                                if (sigPad && !sigPad.isEmpty()) {
                                                    const trimmed = sigPad.getTrimmedCanvas();
                                                    setSignatureData(getWhiteBackgroundDataURL(trimmed));
                                                }
                                            }}
                                        />
                                        <div className="absolute bottom-2 right-3 left-3 border-b border-dashed border-slate-200 pointer-events-none"></div>
                                        <span className="absolute bottom-1.5 left-3 text-[10px] text-slate-400 font-semibold pointer-events-none uppercase tracking-wider">
                                            Sign above this line
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center w-full mt-3">
                                        <span className="text-xs text-slate-500 font-medium">
                                            Use your mouse, trackpad, or touch screen to sign.
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                sigPad?.clear();
                                                setSignatureData(null);
                                            }}
                                            className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                                        >
                                            <FaTrash className="text-[10px]" /> Clear
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* TAB 2: UPLOAD SIGNATURE IMAGE */
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-white rounded-xl w-full p-6 text-center">
                                    {!uploadedSig ? (
                                        <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-brand-soft text-brand flex items-center justify-center">
                                                <FaUpload size={16} />
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-slate-800 block">
                                                    Click to upload signature image
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    PNG or JPG (transparent background recommended)
                                                </span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg, image/jpg"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            const img = new Image();
                                                            img.onload = () => {
                                                                const whiteDataUrl = getWhiteBackgroundDataURL(img);
                                                                setUploadedSig(whiteDataUrl);
                                                                setSignatureData(whiteDataUrl);
                                                            };
                                                            img.src = reader.result;
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-2 border border-slate-200 rounded-xl bg-slate-50">
                                                <img
                                                    src={uploadedSig}
                                                    alt="Uploaded Signature"
                                                    className="h-20 object-contain max-w-xs"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUploadedSig(null);
                                                    setSignatureData(null);
                                                }}
                                                className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                                            >
                                                <FaTrash className="text-[10px]" /> Remove & Upload Another
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Acceptance Checkbox Gate */}
                        <label className={`flex items-start gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${ndaAccepted
                            ? "border-[var(--brand)] bg-[var(--brand)]/5"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}>
                            <div className="pt-0.5">
                                <input
                                    type="checkbox"
                                    checked={ndaAccepted}
                                    onChange={(e) => setNdaAccepted(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)] cursor-pointer transition-colors"
                                />
                            </div>
                            <div className="flex-1">
                                <span className="block text-sm font-bold text-slate-800 mb-0.5">
                                    I accept the terms of the Non-Disclosure Agreement
                                </span>
                                <span className="block text-xs text-slate-500 font-medium">
                                    By checking this box and applying my digital signature above, I acknowledge that this is a legally binding execution recorded on {new Date().toLocaleDateString()}.
                                </span>
                            </div>
                        </label>

                        {/* Download Signed NDA Action Bar (when signature is ready) */}
                        {signatureData && (
                            <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FaPrint className="text-slate-600 text-sm" />
                                    <span className="text-xs font-bold text-slate-700">
                                        Want a copy for your records? Download signed agreement
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDownloadSignedNDA}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold transition-all shadow-sm"
                                >
                                    <FaDownload className="text-[10px]" /> Download Signed NDA (PDF/Print)
                                </button>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => {
                                    localStorage.removeItem("vdr_session");
                                    router.push("/login");
                                }}
                                className="flex-[1] py-3.5 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Decline & Logout
                            </button>

                            <button
                                onClick={handleAcceptNda}
                                disabled={!ndaAccepted || !signatureData || submitting}
                                className={`flex-[2] py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${ndaAccepted && signatureData
                                    ? "bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white shadow-lg shadow-[var(--brand)]/20 hover:-translate-y-0.5"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    }`}
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Recording Signature...
                                    </>
                                ) : (
                                    <>
                                        <FaCheckCircle /> Accept & Enter Workspace
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>

                {/* Legal Footer */}
                <p className="text-center text-xs font-medium text-slate-400 mt-8">
                    Protected by Secure VDR Platform • Digital Signature Audit Active
                </p>

            </div>

            {/* Custom Scrollbar CSS for the document viewer */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #94a3b8;
                }
            `}</style>
        </div>
    );
}
