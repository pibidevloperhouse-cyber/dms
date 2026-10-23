"use client";

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { FaSpinner } from 'react-icons/fa';

// ── Risk configuration ────────────────────────────────────────────────────────
const RISK = {
    PRINT_SCREEN: 100,  // instant logout
    DEVTOOLS: 100,  // instant logout
    WIN_SHIFT_S: 100,  // instant logout — Snipping Tool
    CTRL_P: 60,
    CTRL_C: 30,
    CTRL_A: 20,
    CTRL_S: 40,
    CTRL_U: 50,
    BLUR: 100,  // instant logout — window lost focus / Snipping Tool active
    RIGHT_CLICK: 10,
    DRAG: 10,
};
const LOGOUT_THRESHOLD = 100;
// ─────────────────────────────────────────────────────────────────────────────

export default function SecureViewer({ params }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const docId = resolvedParams.id;

    // ── Core state ────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [docName, setDocName] = useState('');
    const [docPayload, setDocPayload] = useState(null);
    const containerRef = useRef(null);

    // ── Watermark Settings State ──────────────────────────────────────────────
    const [watermarkSettings, setWatermarkSettings] = useState(null);
    const [brandLogo, setBrandLogo] = useState(null);

    // ── Security state ────────────────────────────────────────────────────────
    const [riskScore, setRiskScore] = useState(0);
    const [violated, setViolated] = useState(false);
    const [violationMsg, setViolationMsg] = useState('');
    const [countdown, setCountdown] = useState(5);
    const [userInfo, setUserInfo] = useState({ name: '', email: '', sessionId: '', companyId: '' });
    const [clientIp, setClientIp] = useState('...');

    const riskRef = useRef(0);
    const countdownRef = useRef(null);
    const shiftSRef = useRef(false);
    const devtoolsRef = useRef(false);
    const shieldDivRef = useRef(null); // direct DOM ref — synchronous, no React delay

    const accessLogIdRef = useRef(null);
    const activeSecondsRef = useRef(0);
    const viewStartTimeRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);

    const userInfoRef = useRef(userInfo);
    const clientIpRef = useRef(clientIp);
    const watermarkSettingsRef = useRef(null);
    const brandLogoRef = useRef(null);

    useEffect(() => { userInfoRef.current = userInfo; }, [userInfo]);
    useEffect(() => { clientIpRef.current = clientIp; }, [clientIp]);
    useEffect(() => { watermarkSettingsRef.current = watermarkSettings; }, [watermarkSettings]);
    useEffect(() => { brandLogoRef.current = brandLogo; }, [brandLogo]);
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        try {
            const raw = localStorage.getItem('vdr_session');
            if (raw) {
                const s = JSON.parse(raw);
                setUserInfo({
                    id: s.id || '',
                    name: s.name || '',
                    email: s.email || '',
                    sessionId: (s.id || '').slice(0, 8),
                    companyId: s.company_id || '',
                });
            }
        } catch (_) { }

    }, []);

    // ── Document load & render ────────────────────────────────────────────────
    useEffect(() => { loadDocument(); }, [docId]);

    useEffect(() => {
        if (!loading && docPayload && containerRef.current && clientIp !== '...') {
            renderDocument(docPayload.ext, docPayload.bytes, docPayload.text);
        }
    }, [loading, docPayload, clientIp]);

    // ── Heartbeat Ping Engine ──────────────────────────────────────────────────
    useEffect(() => {
        if (!loading && docPayload) {
            viewStartTimeRef.current = Date.now();
            const sendHeartbeat = (final = false) => {
                if (!accessLogIdRef.current) return;
                const elapsed = viewStartTimeRef.current
                    ? Math.max(1, Math.round((Date.now() - viewStartTimeRef.current) / 1000))
                    : activeSecondsRef.current;
                const duration = Math.max(activeSecondsRef.current, elapsed);
                activeSecondsRef.current = duration;

                const payload = JSON.stringify({
                    accessLogId: accessLogIdRef.current,
                    durationSeconds: duration
                });
                if (final && typeof navigator !== 'undefined' && navigator.sendBeacon) {
                    const blob = new Blob([payload], { type: 'application/json' });
                    navigator.sendBeacon('/api/view/heartbeat', blob);
                } else {
                    fetch('/api/view/heartbeat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: payload,
                        keepalive: true
                    }).catch(() => { });
                }
            };

            heartbeatIntervalRef.current = setInterval(() => {
                if (document.hasFocus() && !document.hidden) {
                    const elapsed = viewStartTimeRef.current
                        ? Math.max(1, Math.round((Date.now() - viewStartTimeRef.current) / 1000))
                        : activeSecondsRef.current + 5;
                    activeSecondsRef.current = Math.max(activeSecondsRef.current + 5, elapsed);
                    sendHeartbeat(false);
                }
            }, 5000);

            const handleUnload = () => sendHeartbeat(true);
            window.addEventListener('beforeunload', handleUnload);
            window.addEventListener('pagehide', handleUnload);

            return () => {
                if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
                window.removeEventListener('beforeunload', handleUnload);
                window.removeEventListener('pagehide', handleUnload);
                sendHeartbeat(true);
            };
        }
    }, [loading, docPayload]);

    // ── Security Engine ───────────────────────────────────────────────────────
    useEffect(() => {

        // Show violation overlay + 5s countdown logout
        const triggerLogout = (msg) => {
            if (countdownRef.current) return;
            // Synchronous DOM shield (no React delay)
            if (shieldDivRef.current) shieldDivRef.current.style.display = 'flex';
            setViolationMsg(msg);
            setViolated(true);
            setCountdown(5);
            let secs = 5;
            countdownRef.current = setInterval(() => {
                secs -= 1;
                setCountdown(secs);
                if (secs <= 0) {
                    clearInterval(countdownRef.current);
                    fetch('/api/auth/logout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            session: userInfoRef.current,
                            userId: userInfoRef.current?.id || userInfoRef.current?.sessionId,
                            email: userInfoRef.current?.email,
                            reason: `Security violation: ${msg}`
                        })
                    }).catch(() => { }).finally(() => {
                        localStorage.removeItem('vdr_session');
                        window.location.href = '/login';
                    });
                }
            }, 1000);
        };

        // Add risk score; logout when threshold reached
        const addRisk = (points, msg) => {
            riskRef.current += points;
            setRiskScore(riskRef.current);
            console.warn(`[SECURITY] +${points} (${msg}) | Total: ${riskRef.current}`);
            if (riskRef.current >= LOGOUT_THRESHOLD) triggerLogout(msg);
        };

        // Shield helpers — shieldDivRef is direct DOM (synchronous, instant)
        const showShield = () => {
            if (shieldDivRef.current) shieldDivRef.current.style.display = 'flex';
        };
        const hideShield = () => {
            if (!countdownRef.current && shieldDivRef.current) {
                shieldDivRef.current.style.display = 'none';
            }
        };

        // Clear clipboard helper
        const clearClipboard = () => {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText && document.hasFocus()) {
                    navigator.clipboard.writeText('PROTECTED VDR DOCUMENT - SCREENSHOT RESTRICTED').catch(() => { });
                }
            } catch (_) { }
        };

        // ── Keyboard handler ─────────────────────────────────────────────────
        const onKeyDown = (e) => {
            const key = (e.key || '').toLowerCase();
            const ctrl = e.ctrlKey || e.metaKey;

            // 1. Instant black-out on Meta (Win key), Shift, or Alt to preempt Snipping Tool screen freeze
            if (e.key === 'Meta' || e.key === 'Shift' || e.key === 'Alt') {
                showShield();
            }

            // PrintScreen — instant logout + clipboard wipe
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                showShield();
                clearClipboard();
                addRisk(RISK.PRINT_SCREEN, 'PrintScreen detected');
                return;
            }
            // Win+Shift+S detection
            if ((e.metaKey || e.shiftKey) && key === 's') {
                e.preventDefault();
                showShield();
                clearClipboard();
                addRisk(RISK.WIN_SHIFT_S, 'Win+Shift+S Snipping Tool detected');
                return;
            }
            // Ctrl+P (Print)
            if (ctrl && key === 'p') { e.preventDefault(); showShield(); clearClipboard(); addRisk(RISK.CTRL_P, 'Ctrl+P (Print)'); return; }
            // Ctrl+C (Copy)
            if (ctrl && key === 'c') { e.preventDefault(); showShield(); clearClipboard(); addRisk(RISK.CTRL_C, 'Ctrl+C (Copy)'); return; }
            // Ctrl+A (Select All)
            if (ctrl && key === 'a') { e.preventDefault(); addRisk(RISK.CTRL_A, 'Ctrl+A (Select All)'); return; }
            // Ctrl+S (Save)
            if (ctrl && key === 's') { e.preventDefault(); showShield(); clearClipboard(); addRisk(RISK.CTRL_S, 'Ctrl+S (Save)'); return; }
            // Ctrl+U (View Source)
            if (ctrl && key === 'u') { e.preventDefault(); addRisk(RISK.CTRL_U, 'Ctrl+U (View Source)'); return; }
            // F12 (DevTools)
            if (e.key === 'F12') { e.preventDefault(); showShield(); addRisk(RISK.DEVTOOLS, 'F12 DevTools'); return; }
            // Ctrl+Shift+I/J/C (DevTools)
            if (ctrl && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
                e.preventDefault(); showShield(); addRisk(RISK.DEVTOOLS, 'DevTools Inspect'); return;
            }
        };

        const onKeyUp = (e) => {
            // Hide shield if user just pressed Shift/Alt/Meta without triggering shortcut/blur
            if ((e.key === 'Meta' || e.key === 'Shift' || e.key === 'Alt') && !countdownRef.current) {
                hideShield();
            }
        };

        // ── Window blur — Snipping Tool causes blur immediately when overlay opens ──
        const onBlur = () => {
            // Always show black shield INSTANTLY via DOM ref
            showShield();
            clearClipboard();
            // Trigger immediate security violation & logout
            addRisk(100, 'Screenshot Tool / Window Focus Lost');
        };

        // Window regains focus — hide shield
        const onFocus = () => hideShield();

        // Tab hidden (screen capture tools may trigger this)
        const onVisibility = () => {
            if (document.hidden) {
                showShield();
                addRisk(RISK.BLUR, 'Tab hidden / screen capture detected');
            }
        };

        // Right-click blocked
        const onContextMenu = (e) => {
            e.preventDefault();
            addRisk(RISK.RIGHT_CLICK, 'Right-click attempt');
        };

        // Drag blocked
        const onDragStart = (e) => {
            e.preventDefault();
            addRisk(RISK.DRAG, 'Drag attempt');
        };

        // Select all text blocked
        const onSelectStart = (e) => { e.preventDefault(); };

        // DevTools panel size detection (every 1s)
        const devToolsInterval = setInterval(() => {
            const wDiff = window.outerWidth - window.innerWidth;
            const hDiff = window.outerHeight - window.innerHeight;
            if (wDiff > 160 || hDiff > 160) {
                if (!devtoolsRef.current) {
                    devtoolsRef.current = true;
                    addRisk(RISK.DEVTOOLS, 'DevTools panel opened');
                }
            } else {
                devtoolsRef.current = false;
            }
        }, 1000);

        // Register all listeners
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onBlur);
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);
        document.addEventListener('contextmenu', onContextMenu);
        document.addEventListener('dragstart', onDragStart);
        document.addEventListener('selectstart', onSelectStart);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', onBlur);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
            document.removeEventListener('contextmenu', onContextMenu);
            document.removeEventListener('dragstart', onDragStart);
            document.removeEventListener('selectstart', onSelectStart);
            clearInterval(devToolsInterval);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);
    // ─────────────────────────────────────────────────────────────────────────

    const loadDocument = async () => {
        try {
            const raw = localStorage.getItem('vdr_session');
            if (!raw) { window.location.href = '/login'; return; }
            const session = JSON.parse(raw);

            const res = await fetch('/api/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ docId, session })
            });

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to load document');
            }

            setDocName(data.docName);
            if (data.accessLogId) accessLogIdRef.current = data.accessLogId;
            let finalIp = data.clientIp || 'Unknown IP';
            if (finalIp.startsWith('::ffff:')) finalIp = finalIp.replace('::ffff:', '');
            finalIp = finalIp.replace(/:\d+$/, '');
            
            if (finalIp === '::1' || finalIp === '127.0.0.1' || finalIp === 'Unknown IP') {
                const host = window.location.hostname.replace(/:\d+$/, '');
                finalIp = host === 'localhost' ? 'Localhost' : host;
            }
            
            setClientIp(finalIp);

            if (data.brandLogo) setBrandLogo(data.brandLogo);
            if (data.watermarkSettings) {
                setWatermarkSettings(data.watermarkSettings);
                watermarkSettingsRef.current = data.watermarkSettings;
            }

            const decryptedBase64 = data.base64Data;
            const binaryString = atob(decryptedBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

            const utf8Text = new TextDecoder('utf-8').decode(bytes);
            setDocPayload({ ext: data.fileExt, bytes, text: utf8Text });

            setLoading(false);
        } catch (err) {
            console.error('View Error:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const loadScript = (src) => new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src; s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
    });

    const hexToRGBA = (hex, opacity) => {
        if (!hex) return `rgba(100, 116, 139, ${opacity / 100})`;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            let c = hex.substring(1).split('');
            if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            c = '0x' + c.join('');
            return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${opacity / 100})`;
        }
        return `rgba(100, 116, 139, ${opacity / 100})`;
    };

    const getLogoUrl = (path) => {
        if (!path) return null;
        const { data } = supabase.storage.from('vdr-logos').getPublicUrl(path);
        return data?.publicUrl || null;
    };

    const generateWatermarkContentHTML = (info, ip, settings, bLogo, scale = 1.0) => {
        const type = settings?.watermark_type || 'dynamic';
        const rawFontSize = settings?.font_size || 22;
        const fontSize = Math.round(rawFontSize * scale);
        const textColor = settings?.text_color || '#334155';
        const textOpacity = settings?.text_opacity ?? 25;
        const rotation = settings?.rotation ?? -30;
        const logoPath = settings?.logo_path || bLogo;
        const logoOpacity = settings?.logo_opacity ?? 0.5;

        let lines = [];
        if (type === 'static') {
            lines.push(settings?.custom_text || 'CONFIDENTIAL');
        } else {
            lines.push(settings?.custom_text || 'CONFIDENTIAL');
            if (settings?.email_address) lines.push(settings.email_address);
            if (settings?.attributes?.ip) lines.push(ip || 'Unknown IP');
            if (settings?.attributes?.date) {
                const d = new Date();
                const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}\u00A0${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
                lines.push(dateStr);
            }
        }

        const logoHeight = Math.max(10, Math.round(40 * scale));
        let html = `<div style="transform: rotate(${rotation}deg); color: ${hexToRGBA(textColor, textOpacity)}; font-weight: bold; transform-origin: center; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.2s;">`;
        if (logoPath) {
            html += `<img src="${getLogoUrl(logoPath)}" alt="logo" style="height: ${logoHeight}px; object-fit: contain; margin-bottom: ${Math.round(6 * scale)}px; opacity: ${logoOpacity};" />`;
        }
        html += `<div style="font-size: ${fontSize}px; white-space: nowrap; display: flex; flex-direction: column; align-items: center;">`;
        lines.forEach(line => {
            html += `<span style="line-height: 1.2;">${line}</span>`;
        });
        html += `</div></div>`;
        return html;
    };

    const appendWatermarkToElement = (element, info, ip, scale = 1.0) => {
        if (!element) return;
        element.style.position = 'relative';

        const overlay = document.createElement('div');
        overlay.className = 'page-watermark-overlay';
        overlay.style.position = 'absolute';
        overlay.style.inset = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '10';
        overlay.style.overflow = 'hidden';
        overlay.style.display = 'grid';
        overlay.style.gridTemplateColumns = 'repeat(3, 1fr)';
        overlay.style.gridTemplateRows = 'repeat(3, 1fr)';

        const padX = Math.min(32, element.offsetWidth * 0.1);
        const padY = Math.min(32, element.offsetHeight * 0.1);
        overlay.style.padding = `${padY}px ${padX}px`;

        const settings = watermarkSettingsRef.current || {};
        const positions = settings.positions || { 'middle-center': true };

        const gridCells = [
            { key: 'top-left', cls: 'align-items: flex-start; justify-content: flex-start;' },
            { key: 'top-center', cls: 'align-items: flex-start; justify-content: center;' },
            { key: 'top-right', cls: 'align-items: flex-start; justify-content: flex-end;' },
            { key: 'middle-left', cls: 'align-items: center; justify-content: flex-start;' },
            { key: 'middle-center', cls: 'align-items: center; justify-content: center;' },
            { key: 'middle-right', cls: 'align-items: center; justify-content: flex-end;' },
            { key: 'bottom-left', cls: 'align-items: flex-end; justify-content: flex-start;' },
            { key: 'bottom-center', cls: 'align-items: flex-end; justify-content: center;' },
            { key: 'bottom-right', cls: 'align-items: flex-end; justify-content: flex-end;' },
        ];

        let contentHtml = generateWatermarkContentHTML(info, ip, settings, brandLogoRef.current, scale);

        gridCells.forEach(({ key, cls }) => {
            const cell = document.createElement('div');
            cell.style.display = 'flex';
            cell.style.overflow = 'visible';
            cell.style.cssText += cls;
            if (positions[key]) {
                cell.innerHTML = contentHtml;
            }
            overlay.appendChild(cell);
        });

        element.appendChild(overlay);
    };

    const renderDocument = async (ext, bytes, utf8Text) => {
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = '';
        try {
            // --- MAGIC BYTE DETECTION ---
            // If a PPT/PPTX was converted to PDF on the server, the encrypted bytes will start with %PDF
            if (bytes.length > 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
                ext = 'pdf';
            }

            if (ext === 'csv') {
                const rows = utf8Text.split(/\r?\n/).filter(r => r.length > 0);
                let tableHtml = '<table class="min-w-max w-auto text-left border-collapse bg-white shadow-sm font-sans">';
                rows.forEach((row, rowIndex) => {
                    tableHtml += '<tr>';
                    // simple split by comma, ignoring quotes for basic CSVs
                    row.split(',').forEach(val => {
                        const cleanVal = val.replace(/^"|"$/g, '').trim();
                        if (rowIndex === 0) {
                            tableHtml += `<th class="px-4 py-2 border border-gray-200 bg-gray-50 text-gray-700 font-bold text-sm whitespace-nowrap">${cleanVal}</th>`;
                        } else {
                            tableHtml += `<td class="px-4 py-2 border border-gray-200 text-gray-600 text-sm whitespace-nowrap">${cleanVal}</td>`;
                        }
                    });
                    tableHtml += '</tr>';
                });
                tableHtml += '</table>';

                const wrapperHtml = `
                    <div style="padding: 16px; overflow: auto; width: 100%; height: 100%; display: flex; justify-content: flex-start; align-items: flex-start; background: #f8fafc;">
                        <div id="csv-content-wrapper" style="position: relative; display: inline-block; background: white;">
                            ${tableHtml}
                        </div>
                    </div>
                `;
                container.innerHTML = wrapperHtml;

                setTimeout(() => {
                    const wrapper = container.querySelector('#csv-content-wrapper');
                    if (wrapper) {
                        const w = wrapper.offsetWidth;
                        const h = wrapper.offsetHeight;
                        let csvScale = 1.0;
                        if (w < 400) csvScale = Math.min(csvScale, w / 400);
                        if (h < 300) csvScale = Math.min(csvScale, h / 300);
                        if (csvScale < 0.55) csvScale = 0.55; // Keep it readable and slightly larger

                        appendWatermarkToElement(wrapper, userInfoRef.current, clientIpRef.current, csvScale);
                    }
                }, 100);
            } else if (['xlsx', 'xls'].includes(ext)) {
                if (!window.luckysheet) {
                    await loadScript('https://cdn.jsdelivr.net/npm/luckysheet/dist/plugins/js/plugin.js');
                    await loadScript('https://cdn.jsdelivr.net/npm/luckysheet/dist/luckysheet.umd.js');
                    await loadScript('https://cdn.jsdelivr.net/npm/luckyexcel/dist/luckyexcel.umd.js');
                }
                container.innerHTML = '<div id="luckysheet-container" style="width:100%;height:100%;position:absolute;top:0;left:0;"></div>';
                const opts = {
                    container: 'luckysheet-container', lang: 'en', showinfobar: false,
                    showtoolbar: false, showsheetbar: true, showstatisticBar: true,
                    allowEdit: false, enableAddRow: false, enableAddCol: false, sheetFormulaBar: false,
                };
                window.LuckyExcel.transformExcelToLucky(new File([bytes], 'file.xlsx'), (json) => {
                    window.luckysheet.create({ ...opts, data: json.sheets, title: docName });
                });
                setTimeout(() => {
                    const luckysheetBox = container.querySelector('#luckysheet-container');
                    if (luckysheetBox) appendWatermarkToElement(luckysheetBox, userInfoRef.current, clientIpRef.current);
                }, 500);
            } else if (ext === 'pdf') {
                if (!window['pdfjs-dist/build/pdf']) {
                    await loadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.min.js');
                }
                const pdfjsLib = window['pdfjs-dist/build/pdf'];
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
                const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });
                    const wrapper = document.createElement('div');
                    wrapper.className = 'pdf-page-wrapper shadow-lg mb-8 bg-white relative overflow-hidden';
                    wrapper.style.width = viewport.width + 'px';
                    wrapper.style.height = viewport.height + 'px';
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width; canvas.height = viewport.height;
                    wrapper.appendChild(canvas);
                    container.appendChild(wrapper);
                    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                    appendWatermarkToElement(wrapper, userInfoRef.current, clientIpRef.current, 1.5);
                }
            } else if (['docx', 'doc'].includes(ext)) {
                if (!window.docx) {
                    await loadScript('https://unpkg.com/jszip/dist/jszip.min.js');
                    await loadScript('https://unpkg.com/docx-preview/dist/docx-preview.min.js');
                }
                const docContainer = document.createElement('div');
                docContainer.style.width = '100%';
                container.appendChild(docContainer);
                window.docx.renderAsync(bytes.buffer, docContainer, null, {
                    className: 'docx', inWrapper: true, ignoreWidth: false, ignoreHeight: false, breakPages: true,
                }).then(() => {
                    const sections = docContainer.querySelectorAll('section.docx');
                    sections.forEach(sec => {
                        appendWatermarkToElement(sec, userInfoRef.current, clientIpRef.current);
                    });
                }).catch(err => {
                    container.innerHTML = `<p style="color:red;">Error parsing DOCX: ${err.message}</p>`;
                });
            } else if (['txt', 'text'].includes(ext)) {
                const lines = utf8Text.split(/\r?\n/);
                const LPP = 40;
                let html = '';
                for (let i = 0; i < lines.length; i += LPP) {
                    html += `<div class="txt-page-wrapper relative overflow-hidden"><pre class="txt-view">${lines.slice(i, i + LPP).join('\n')}</pre></div>`;
                }
                container.innerHTML = html;
                const txtPages = container.querySelectorAll('.txt-page-wrapper');
                txtPages.forEach(p => {
                    appendWatermarkToElement(p, userInfoRef.current, clientIpRef.current);
                });
            } else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
                container.style.height = '100%';

                const blob = new Blob([bytes]);
                const url = URL.createObjectURL(blob);

                const imgWrapper = document.createElement('div');
                imgWrapper.style.position = 'relative';
                imgWrapper.style.maxWidth = '100%';
                imgWrapper.style.maxHeight = '100%';
                imgWrapper.style.display = 'flex';
                imgWrapper.style.alignItems = 'center';
                imgWrapper.style.justifyContent = 'center';

                const img = document.createElement('img');
                img.src = url;
                img.style.maxWidth = '90vw';
                img.style.maxHeight = '80vh';
                img.style.objectFit = 'contain';
                img.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
                img.style.borderRadius = '8px';
                img.style.userSelect = 'none';
                img.style.pointerEvents = 'none';

                imgWrapper.appendChild(img);
                container.appendChild(imgWrapper);

                appendWatermarkToElement(imgWrapper, userInfoRef.current, clientIpRef.current);
            } else {
                container.innerHTML = '<div class="text-white text-center mt-20 font-bold text-xl">Unsupported Format</div>';
            }
        } catch (e) {
            console.error(e);
            setError('Rendering Error: ' + e.message);
        }
    };

    // ── Loading / Error screens ───────────────────────────────────────────────
    if (loading) return (
        <div className="h-screen w-screen bg-[#1a1a1a] flex items-center justify-center">
            <FaSpinner className="animate-spin text-4xl text-brand" />
        </div>
    );

    if (error) return (
        <div className="h-screen w-screen bg-slate-900 flex items-center justify-center">
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-6 rounded-xl max-w-md text-center">
                <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                <p className="text-sm">{error}</p>
                <button onClick={() => window.close()} className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    Close Tab
                </button>
            </div>
        </div>
    );

    return (
        <div
            className="min-h-screen bg-[#1a1a1a] flex flex-col"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
            {/* ── CSS ──────────────────────────────────────────────────────── */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://cdn.jsdelivr.net/npm/luckysheet/dist/plugins/css/pluginsCss.css');
                @import url('https://cdn.jsdelivr.net/npm/luckysheet/dist/plugins/plugins.css');
                @import url('https://cdn.jsdelivr.net/npm/luckysheet/dist/css/luckysheet.css');
                * { user-select: none !important; -webkit-user-select: none !important; }
                body { margin: 0; padding: 0; background-color: #1a1a1a; }
                .docx-wrapper { background: transparent !important; padding: 0 !important; display: flex; flex-direction: column; align-items: center; width: 100%; }
                .docx-wrapper > section.docx { background: #ffffff !important; box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important; margin-bottom: 30px !important; min-height: 297mm !important; width: 210mm !important; position: relative !important; }
                .txt-page-wrapper { background: #fff !important; width: 210mm; min-height: 297mm; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); padding: 25mm; box-sizing: border-box; position: relative !important; }
                .txt-view { white-space: pre-wrap; font-family: monospace; font-size: 14px; margin: 0; word-wrap: break-word; color: #000 !important; width: 100%; }
            ` }} />

            {/* ── BLACK SHIELD — always in DOM, toggled synchronously via DOM ref ── */}
            {/* This div is shown INSTANTLY on blur — no React re-render delay      */}
            <div
                ref={shieldDivRef}
                style={{
                    display: 'none',
                    position: 'fixed', inset: 0, zIndex: 99990,
                    background: '#000000',
                    alignItems: 'center', justifyContent: 'center',
                }}
            >
                {!violated && (
                    <p style={{ color: '#1f2937', fontSize: 13, fontFamily: 'system-ui', margin: 0 }}>
                        Secure View paused — return to this window to continue.
                    </p>
                )}
            </div>

            {/* ── VIOLATION OVERLAY — countdown + logout ───────────────────── */}
            {violated && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 99999,
                    background: 'rgba(0,0,0,0.97)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 20,
                }}>
                    <div style={{ fontSize: 64 }}>🚫</div>
                    <h1 style={{
                        color: '#ef4444', fontSize: 26, fontWeight: 900,
                        margin: 0, fontFamily: 'system-ui', textAlign: 'center',
                    }}>
                        Security Violation Detected
                    </h1>
                    <p style={{
                        color: '#fca5a5', fontSize: 14, maxWidth: 420,
                        textAlign: 'center', lineHeight: 1.8, margin: 0, fontFamily: 'system-ui',
                    }}>
                        <strong>{violationMsg}</strong><br />
                        This activity has been recorded and reported.<br />
                        Secure View has been terminated.
                    </p>
                    <div style={{
                        width: 84, height: 84, borderRadius: '50%',
                        border: '3px solid #ef4444', background: '#7f1d1d',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{ color: '#fca5a5', fontSize: 10, fontFamily: 'system-ui', fontWeight: 700, letterSpacing: 1 }}>
                            LOGOUT IN
                        </span>
                        <span style={{ color: '#ef4444', fontSize: 34, fontWeight: 900, fontFamily: 'system-ui', lineHeight: 1 }}>
                            {countdown}
                        </span>
                    </div>
                    <p style={{ color: '#4b5563', fontSize: 12, fontFamily: 'system-ui', margin: 0 }}>
                        Risk Score: {riskScore} / {LOGOUT_THRESHOLD}
                    </p>
                </div>
            )}

            {/* ── DYNAMIC BACKGROUND WATERMARK GRID ────────────────────────── */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' }}>
                    {[
                        { key: 'top-left', cls: 'flex items-start justify-start' },
                        { key: 'top-center', cls: 'flex items-start justify-center' },
                        { key: 'top-right', cls: 'flex items-start justify-end' },
                        { key: 'middle-left', cls: 'flex items-center justify-start' },
                        { key: 'middle-center', cls: 'flex items-center justify-center' },
                        { key: 'middle-right', cls: 'flex items-center justify-end' },
                        { key: 'bottom-left', cls: 'flex items-end justify-start' },
                        { key: 'bottom-center', cls: 'flex items-end justify-center' },
                        { key: 'bottom-right', cls: 'flex items-end justify-end' },
                    ].map(({ key, cls }) => {
                        const settings = watermarkSettings || {};
                        const positions = settings.positions || { 'middle-center': true };
                        if (!positions[key]) return <div key={key} />;

                        const type = settings.watermark_type || 'dynamic';
                        const rawFontSize = settings.font_size || 22;
                        const fontSize = Math.round(rawFontSize * 1.5);
                        const textColor = settings.text_color || '#64748B';
                        const textOpacity = settings.text_opacity ?? 25;
                        const rotation = settings.rotation ?? -30;
                        const logoPath = settings.logo_path || brandLogo;
                        const logoOpacity = settings.logo_opacity ?? 0.5;

                        let lines = [];
                        if (type === 'static') {
                            lines.push(settings.custom_text || 'CONFIDENTIAL');
                        } else {
                            lines.push(settings.custom_text || 'CONFIDENTIAL');
                            if (settings.email_address) lines.push(settings.email_address);
                            if (settings.attributes?.ip) lines.push(clientIp || 'Unknown IP');
                            if (settings.attributes?.date) {
                                const d = new Date();
                                const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}\u00A0${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
                                lines.push(dateStr);
                            }
                        }

                        return (
                            <div key={key} className={`${cls} overflow-visible`}>
                                <div style={{ transform: `rotate(${rotation}deg)`, color: hexToRGBA(textColor, textOpacity) }}
                                    className="font-bold origin-center transition-all duration-200 flex flex-col items-center justify-center">
                                    {logoPath && (
                                        <img src={getLogoUrl(logoPath)} alt="logo" className="h-10 object-contain mb-1.5" style={{ opacity: logoOpacity }} />
                                    )}
                                    <div style={{ fontSize: `${fontSize}px`, whiteSpace: 'nowrap' }} className="flex flex-col items-center">
                                        {lines.map((line, idx) => (
                                            <span key={idx} style={{ lineHeight: 1.2 }} className="block">{line}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── TOP TOOLBAR ──────────────────────────────────────────────── */}
            <div
                className="h-[60px] bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 sticky top-0"
                style={{ zIndex: 200 }}
            >
                <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-brand text-white text-[11px] font-bold rounded">SECURE VIEW</span>
                    <h1 className="text-slate-100 font-semibold text-[15px]">{docName}</h1>
                </div>
                {/* Live risk bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 4, transition: 'width 0.3s, background 0.3s',
                            background: riskScore < 40 ? '#22c55e' : riskScore < 70 ? '#f59e0b' : '#ef4444',
                            width: `${Math.min(riskScore, 100)}%`,
                        }} />
                    </div>
                    <span style={{ color: '#64748b', fontSize: 10, fontFamily: 'system-ui', letterSpacing: 1 }}>RISK</span>
                </div>
            </div>

            {/* ── DOCUMENT CONTAINER ───────────────────────────────────────── */}
            <div
                className="flex-1 w-full relative overflow-auto flex flex-col items-center py-10"
                style={{ zIndex: 10 }}
                ref={containerRef}
                onCopy={e => e.preventDefault()}
                onCut={e => e.preventDefault()}
                onPaste={e => e.preventDefault()}
                onDragStart={e => e.preventDefault()}
            />
        </div>
    );
}
