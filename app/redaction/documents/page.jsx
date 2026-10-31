"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import {
  FaTimes,
  FaLock,
  FaCheck,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
} from "react-icons/fa";

let pdfjsLib = null;

const loadPdfJs = async () => {
  if (!pdfjsLib) {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.mjs",
      import.meta.url
    ).toString();

    pdfjsLib = pdfjs;
  }

  return pdfjsLib;
};


/**
 * Expands an array of range strings (e.g. ["1-5", "8", "10-12"])
 * into a Set of individual page numbers. Handles multiple ranges.
 */
const expandPageRanges = (ranges = []) => {
  const pages = new Set();

  ranges.forEach((r) => {
    if (!r) return;
    const str = String(r).trim();

    if (str.includes("-")) {
      const [startRaw, endRaw] = str.split("-");
      const start = parseInt(startRaw, 10);
      const end = parseInt(endRaw, 10);
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        const lo = Math.min(start, end);
        const hi = Math.max(start, end);
        for (let p = lo; p <= hi; p++) pages.add(p);
      }
    } else {
      const n = parseInt(str, 10);
      if (!Number.isNaN(n)) pages.add(n);
    }
  });

  return pages;
};

/**
 * visibility_mode "hide": listed pages are redacted, everything else visible.
 * visibility_mode "show": only listed pages are visible, everything else redacted.
 * Empty range list = fully visible either way.
 */
const isPageRedacted = (pageNum, visibilityMode, pageRanges) => {
  const specifiedPages = expandPageRanges(pageRanges);
  if (specifiedPages.size === 0) return false;

  if (visibilityMode === "hide") {
    return specifiedPages.has(pageNum);
  }
  return !specifiedPages.has(pageNum);
};

export default function RedactionDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Configuration Drawer State
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [visibilityMode, setVisibilityMode] = useState("show"); // 'show' or 'hide'
  const [inputValue, setInputValue] = useState("");
  const [pageRanges, setPageRanges] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageRendering, setPageRendering] = useState(false);

  const canvasRef = useRef(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const raw = localStorage.getItem('vdr_session');
        if (!raw) return;
        const session = JSON.parse(raw);

        const isBuyer = session?.dms_role === 'buyer' || ['guest_admin', 'advisor', 'buyer', 'external_user', 'guest_lead'].includes(session?.role);
        const isSeller = !isBuyer;

        // ── 🛡️ SELLER SIDE: SHOW ALL FILES FROM BUYER DISCLOSURE SECTION ──
        if (isSeller) {
          const wsId = session.active_workspace_id || session.workspace_id;
          const compId = session.company_id;

          // 1. Fetch disclosure stages for this workspace/company
          let stageQuery = supabase
            .from('buyer_disclosure_stages')
            .select('id, name, stage_number');

          if (wsId) {
            stageQuery = stageQuery.eq('workspace_id', wsId);
          } else if (compId) {
            stageQuery = stageQuery.eq('company_id', compId);
          }

          let { data: stages } = await stageQuery;

          // Fallback check by compId if no stages found by workspaceId
          if ((!stages || stages.length === 0) && compId) {
            const { data: compStages } = await supabase
              .from('buyer_disclosure_stages')
              .select('id, name, stage_number')
              .eq('company_id', compId);
            if (compStages && compStages.length > 0) {
              stages = compStages;
            }
          }

          const stageIds = (stages || []).map(s => s.id);

          let disclosureItems = [];
          if (stageIds.length > 0) {
            const { data: dItems } = await supabase
              .from('buyer_disclosure_items')
              .select('*')
              .in('stage_id', stageIds);
            if (dItems) disclosureItems = dItems;
          }

          // 2. Fetch workspace folders & documents
          let fQuery = supabase.from('folders').select('*').neq('is_deleted', true);
          let dQuery = supabase.from('documents').select('*').neq('is_deleted', true);

          if (wsId) {
            fQuery = fQuery.eq('workspace_id', wsId);
            dQuery = dQuery.eq('workspace_id', wsId);
          } else if (compId) {
            fQuery = fQuery.eq('company_id', compId);
            dQuery = dQuery.eq('company_id', compId);
          }

          const [{ data: allFolders }, { data: allDocs }] = await Promise.all([fQuery, dQuery]);

          // 3. Resolve folder IDs in disclosure
          const folderIds = new Set();
          disclosureItems.filter(i => i.is_folder).forEach(it => {
            if (it.original_folder_id) folderIds.add(it.original_folder_id);
            const match = (allFolders || []).find(f =>
              f.id === it.original_folder_id ||
              (f.name && it.name && f.name.trim().toLowerCase() === it.name.trim().toLowerCase())
            );
            if (match) folderIds.add(match.id);
          });

          // Cascade to subfolders
          let added = true;
          while (added) {
            added = false;
            (allFolders || []).forEach(f => {
              if (f.parent_folder_id && folderIds.has(f.parent_folder_id) && !folderIds.has(f.id)) {
                folderIds.add(f.id);
                added = true;
              }
            });
          }

          // 4. Collect all files belonging to Buyer Disclosure
          const resultDocs = [];
          const seenIds = new Set();

          // A. Files inside disclosure folders
          (allDocs || []).forEach(doc => {
            if (doc.folder_id && folderIds.has(doc.folder_id) && !seenIds.has(doc.id)) {
              seenIds.add(doc.id);
              resultDocs.push(doc);
            }
          });

          // B. Direct file items in buyer disclosure
          disclosureItems.filter(i => !i.is_folder).forEach(item => {
            const matchDoc = (allDocs || []).find(d =>
              d.id === item.original_document_id ||
              (d.name && item.name && d.name.trim().toLowerCase() === item.name.trim().toLowerCase())
            );
            if (matchDoc) {
              if (!seenIds.has(matchDoc.id)) {
                seenIds.add(matchDoc.id);
                resultDocs.push(matchDoc);
              }
            } else {
              if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                resultDocs.push({
                  id: item.id,
                  name: item.name,
                  created_at: item.created_at,
                  file_path: null,
                  is_disclosure_item: true,
                  version: item.version
                });
              }
            }
          });

          resultDocs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setDocuments(resultDocs);
          return;
        }

        // ── FALLBACK FOR NON-SELLER USERS ──
        // 1. Fetch user's groups
        const { data: userGroups, error: groupsError } = await supabase
          .from("user_groups")
          .select("group_id")
          .eq("user_id", session.id);

        if (groupsError) throw groupsError;

        let groupIds = [];
        if (userGroups) {
          groupIds = userGroups.map(ug => ug.group_id);
        }

        // 2. Fetch redaction access for these groups
        let redactedDocIds = [];
        if (groupIds.length > 0) {
            const { data: redactionData, error: redactionError } = await supabase
              .from("permissions")
              .select("document_id")
              .in("group_id", groupIds)
              .eq("company_id", session.company_id)
              .eq("can_redact", true);
            
            if (redactionError) {
                console.warn("permissions fetch failed for redaction:", redactionError.message);
            } else if (redactionData) {
                redactedDocIds = [...new Set(redactionData.map(r => r.document_id).filter(Boolean))];
            }
        }

        // 3. Fetch documents safely
        let docsData = [];

        // 3a. Fetch user's uploaded docs
        const { data: uploadedDocs, error: uploadErr } = await supabase
          .from("documents")
          .select("*")
          .eq("company_id", session.company_id)
          .eq("workspace_id", session.active_workspace_id)
          .eq("is_deleted", false)
          .eq("uploaded_by", session.id)
          .order("created_at", { ascending: false });

        if (uploadErr) throw uploadErr;
        docsData = [...(uploadedDocs || [])];

        // 3b. Fetch redacted docs if any
        if (redactedDocIds.length > 0) {
            const existingIds = new Set(docsData.map(d => d.id));
            const idsToFetch = redactedDocIds.filter(id => !existingIds.has(id));

            if (idsToFetch.length > 0) {
                const { data: redactedDocs, error: redactErr } = await supabase
                  .from("documents")
                  .select("*")
                  .eq("company_id", session.company_id)
                  .eq("workspace_id", session.active_workspace_id)
                  .eq("is_deleted", false)
                  .in("id", idsToFetch)
                  .order("created_at", { ascending: false });

                if (redactErr) throw redactErr;
                docsData = [...docsData, ...(redactedDocs || [])];

                docsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }
        }

        setDocuments(docsData);
      } catch (err) {
        console.error("Error fetching predefined documents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

const openConfigDrawer = async (doc) => {
  setSelectedDoc(doc);
  setIsDrawerOpen(true);
  setSaveSuccess(false);
  setInputValue("");

  const { data, error } = await supabase
    .from("document_redactions")
    .select("*")
    .eq("document_id", doc.id)
    .maybeSingle();

  if (error) {
    console.error(error);
  }

  if (data) {
    setVisibilityMode(data.visibility_mode);
    setPageRanges(data.page_ranges || []);
  } else {
    setVisibilityMode("show");
    setPageRanges([]);
  }
};

  const closeConfigDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedDoc(null), 300); // Wait for transition
  };
const isValidRange = (value) => {
  if (!/^\d+(-\d+)?$/.test(value)) return false;

  if (value.includes("-")) {
    const [start, end] = value.split("-").map(Number);

    if (start > end) return false;
  }

  return true;
};

const handleAddRange = (e) => {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();

    const val = inputValue.trim().replace(/,$/, "");

    if (val) {
      if (isValidRange(val)) {
        if (!pageRanges.includes(val)) {
          setPageRanges((prev) => [...prev, val]);
        }
      } else {
        alert("Please enter a valid page range (e.g. 1, 2-5)");
      }

      setInputValue("");
    }
  }
};

  const removeRange = (rangeToRemove) => {
    setPageRanges(pageRanges.filter(r => r !== rangeToRemove));
  };

const handleSaveConfig = async () => {
  if (!selectedDoc) return;

  setIsSaving(true);

  try {
    const raw = localStorage.getItem("vdr_session");
    if (!raw) throw new Error("Session not found");

    const session = JSON.parse(raw);

    // Include current input even if Enter wasn't pressed
    let finalRanges = [...pageRanges];

    const val = inputValue.trim().replace(/,$/, "");

    if (
      val &&
      /^\d+(-\d+)?$/.test(val) &&
      !finalRanges.includes(val)
    ) {
      finalRanges.push(val);
    }

    const { error } = await supabase
      .from("document_redactions")
      .upsert(
        {
          document_id: selectedDoc.id,
          visibility_mode: visibilityMode,
          page_ranges: finalRanges,
          created_by: session.id,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "document_id",
        }
      );

    if (error) throw error;

    if (finalRanges.length > 0) {
      if (selectedDoc.is_disclosure_item) {
        await supabase
          .from("buyer_disclosure_items")
          .update({ is_redacted: true })
          .eq("id", selectedDoc.id);
      } else {
        await supabase
          .from("documents")
          .update({ is_redacted: true })
          .eq("id", selectedDoc.id);
      }
    }

    // Update UI immediately
    setPageRanges(finalRanges);
    setInputValue("");

    setSaveSuccess(true);

    setTimeout(() => {
      closeConfigDrawer();
    }, 1500);
  } catch (error) {
    console.error("Failed to save configuration:", error);
    alert("Failed to save configuration.");
  } finally {
    setIsSaving(false);
  }
};

  // The set of page-ranges to apply for preview purposes: whatever is
  // already tagged, PLUS whatever's currently typed but not yet confirmed
  // with Enter. This way "Preview" always reflects what's on screen.
  const getLivePageRanges = useCallback(() => {
    const val = inputValue.trim().replace(/,$/, "");
    if (val && isValidRange(val) && !pageRanges.includes(val)) {
      return [...pageRanges, val];
    }
    return pageRanges;
  }, [inputValue, pageRanges]);

  // Opens the preview modal and loads the PDF binary from the
  // `original-file` bucket (users/{user_id}/{file_path}).
  const openPreview = async () => {
    if (!selectedDoc) return;

    const ext = selectedDoc.file_path ? selectedDoc.file_path.split(".").pop().toLowerCase().trim() : (selectedDoc.name || "").split(".").pop().toLowerCase().trim();
    if (ext !== "pdf") {
      window.open(`/redaction/view?id=${selectedDoc.id}`, "_blank");
      return;
    }

    setIsPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    setCurrentPage(1);
    setNumPages(0);
    pdfRef.current = null;

    try {
      let storagePath = selectedDoc.original_file_path || selectedDoc.file_path; 
      if (storagePath && storagePath.includes("secure_") && !selectedDoc.original_file_path) {
        storagePath = storagePath.replace("secure_", "original_");
      }

      console.log("========== PREVIEW DEBUG ==========");
      console.log("Bucket:", "original-files");
      console.log("Storage Path:", storagePath);
      console.log("Document Name:", selectedDoc.name);
      console.log("Document Record:", selectedDoc);

      let { data: urlData, error: urlError } = await supabase.storage
        .from("original-files")
        .createSignedUrl(storagePath, 3600);

      if (urlError && selectedDoc.file_path && selectedDoc.file_path.includes("secure_")) {
        const candidate = selectedDoc.file_path.replace("secure_", "original_");
        const fallback = await supabase.storage
          .from("original-files")
          .createSignedUrl(candidate, 3600);
        if (!fallback.error && fallback.data) {
          urlData = fallback.data;
          urlError = null;
          storagePath = candidate;
        }
      }

      if (urlError && selectedDoc.file_path && storagePath !== selectedDoc.file_path) {
        const fallback = await supabase.storage
          .from("original-files")
          .createSignedUrl(selectedDoc.file_path, 3600);
        if (!fallback.error && fallback.data) {
          urlData = fallback.data;
          urlError = null;
          storagePath = selectedDoc.file_path;
        }
      }

      console.log("Signed URL:", urlData);
      console.log("URL Error:", urlError);

      if (urlError) throw urlError;

      const pdfjs = await loadPdfJs();
      if (!pdfjs) throw new Error("PDF.js failed to load");

      const pdf = await pdfjs.getDocument(urlData.signedUrl).promise;
      pdfRef.current = pdf;

      setNumPages(selectedDoc.total_pages || pdf.numPages);
    } catch (err) {
      console.error("Error loading preview:", err);
      setPreviewError(err.message || "Failed to load document preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    pdfRef.current = null;
  };

  const livePageRanges = getLivePageRanges();
  const currentPageRedacted = isPageRedacted(
    currentPage,
    visibilityMode,
    livePageRanges
  );

  // Render the current page onto the canvas whenever the page changes,
  // unless that page is redacted under the live (unsaved) rules.
  useEffect(() => {
    const renderPage = async () => {
      if (!isPreviewOpen || !pdfRef.current || !currentPage) return;
      if (currentPageRedacted) return;

      setPageRendering(true);
      try {
        const page = await pdfRef.current.getPage(currentPage);
        const scale = 1.4;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
      } catch (err) {
        console.error("Error rendering page:", err);
      } finally {
        setPageRendering(false);
      }
    };

    renderPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, isPreviewOpen, currentPageRedacted]);

  const goToPage = (n) => {
    if (n < 1 || n > numPages) return;
    setCurrentPage(n);
  };

  return (
    <div className="relative flex w-full h-full bg-[#FAFBFD] overflow-hidden">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col p-6 transition-all duration-300 ${isDrawerOpen ? 'mr-96' : ''} overflow-y-auto`}>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Predefined Documents</h1>
        
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-brand rounded-full animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center text-slate-500 py-10">
            No documents found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                onClick={() => openConfigDrawer(doc)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:border-brand hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h3 className="font-semibold text-slate-800 truncate" title={doc.name}>{doc.name}</h3>
                    <p className="text-xs text-slate-500 truncate">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-bold text-brand">Configure Redaction →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-over Config Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-96 bg-white border-l border-slate-200 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedDoc && (
          <>
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Redaction Setup</h2>
                <p className="text-xs text-slate-500 truncate w-64" title={selectedDoc.name}>{selectedDoc.name}</p>
              </div>
              <button 
                onClick={closeConfigDrawer}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
              
              {/* Document Preview Trigger */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={openPreview}
                  className="w-full h-32 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-brand hover:text-brand hover:bg-brand-soft/40 transition-colors group"
                >
                  <FaEye className="w-6 h-6 mb-1 text-slate-300 group-hover:text-brand transition-colors" />
                  <span className="text-sm font-bold">Preview Document</span>
                  <span className="text-xs text-slate-400 mt-1">See redaction rules applied live</span>
                </button>
                
                <Link
                  href={`/redaction/documents/viewer?id=${selectedDoc.id}`}
                  className="w-full h-16 bg-slate-100 rounded-xl border-2 border-slate-300 flex items-center justify-center text-slate-600 hover:border-brand hover:text-brand hover:bg-brand-soft/40 transition-colors group gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-brand transition-colors"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <span className="text-sm font-bold">Advanced Redaction Tool</span>
                </Link>
              </div>

              {/* Mode Toggle */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Visibility Mode</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setVisibilityMode('show')}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                      visibilityMode === 'show' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Show Specific Pages
                  </button>
                  <button
                    onClick={() => setVisibilityMode('hide')}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                      visibilityMode === 'hide' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Hide Specific Pages
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {visibilityMode === 'show' 
                    ? "Only the pages you specify below will be visible. All other pages will be redacted."
                    : "The pages you specify below will be redacted. All other pages will be visible."}
                </p>
              </div>

              {/* Smart Page Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Page Selection</label>
                
                {/* Tag Container */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {pageRanges.map((range) => (
                    <div 
                      key={range} 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                        visibilityMode === 'show' ? 'bg-brand-50 text-brand-dark' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      Pages {range}
                      <button 
                        onClick={() => removeRange(range)}
                        className={`hover:opacity-70 ${visibilityMode === 'show' ? 'text-brand' : 'text-rose-500'}`}
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {pageRanges.length === 0 && (
                    <span className="text-sm text-slate-400 italic">No pages specified yet.</span>
                  )}
                </div>

                {/* Input Field */}
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleAddRange}
                    placeholder="e.g. 1-3 or 5 (Press Enter)"
                    className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                    Press Enter ↵
                  </div>
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-slate-200 bg-white">
              <button 
                onClick={handleSaveConfig}
                disabled={isSaving || saveSuccess}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all ${
                  saveSuccess ? 'bg-green-500' : 'bg-brand hover:bg-brand-dark shadow-lg shadow-[var(--brand)]/20'
                }`}
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <>
                    <FaCheck /> Saved Successfully
                  </>
                ) : (
                  "Save Configuration"
                )}
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Drawer Overlay (mobile only or to click outside to close) */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-brand/20 z-40 lg:hidden"
          onClick={closeConfigDrawer}
        />
      )}

      {/* Preview Modal */}
      {isPreviewOpen && selectedDoc && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="overflow-hidden">
                <h3 className="text-base font-bold text-slate-800 truncate" title={selectedDoc.name}>
                  {selectedDoc.name}
                </h3>
                <p className="text-xs text-slate-500">Live preview with redaction rules applied</p>
              </div>
              <button
                onClick={closePreview}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors flex-shrink-0"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-100 relative min-h-[400px]">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <FaSpinner className="w-6 h-6 animate-spin" />
                  <span className="text-sm font-medium">Loading document…</span>
                </div>
              ) : previewError ? (
                <div className="flex flex-col items-center gap-2 text-rose-500 text-center px-6">
                  <FaLock className="w-8 h-8" />
                  <span className="text-sm font-semibold">{previewError}</span>
                </div>
              ) : currentPageRedacted ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
                  <FaLock className="w-10 h-10" />
                  <span className="text-base font-semibold text-slate-500">
                    This page is redacted
                  </span>
                </div>
              ) : (
                <>
                  {pageRendering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100/70">
                      <FaSpinner className="w-5 h-5 text-brand animate-spin" />
                    </div>
                  )}
                  <canvas ref={canvasRef} className="max-w-full h-auto shadow-md bg-white" />
                </>
              )}
            </div>

            {/* Modal Footer / Pagination */}
            {!previewLoading && !previewError && (
              <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-center gap-4">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-lg border border-slate-300 text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors"
                >
                  <FaChevronLeft />
                </button>
                <span className="text-sm font-medium text-slate-600">
                  Page {currentPage} of {numPages || "?"}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= numPages}
                  className="p-2 rounded-lg border border-slate-300 text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

