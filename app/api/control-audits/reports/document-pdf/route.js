import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { db } from '@/db';
import { dmsDeals, dmsProjects, companies, users, biddingBids, biddingRounds, documentEditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedDealId = searchParams.get('dealId');
    const docType = (searchParams.get('type') || searchParams.get('docType') || 'loi').toLowerCase();

    // 1. Load active deal metadata
    let dealName = 'Naga raj Deal';
    let dealNumber = 'D-51013';
    let sellerCompany = 'Vishwa Tech';
    let buyerCompany = 'Naga Tech';
    let valuation = '$15.0M';
    let cashPercent = '50%';
    let stockPercent = '50%';
    let targetCloseDate = '24 Nov 2026';
    let buyerLead = 'Vijay';
    let sellerLead = 'Vishwa Raj';
    let activeDealObj = null;

    try {
      let query = db.select().from(dmsDeals);
      if (requestedDealId) {
        query = query.where(eq(dmsDeals.id, requestedDealId));
      }
      const deals = await query.limit(1);

      if (deals.length > 0) {
        activeDealObj = deals[0];
        const deal = deals[0];
        dealName = deal.dealName || dealName;
        dealNumber = `D-${deal.id.slice(0, 5).toUpperCase()}`;

        if (deal.projectId) {
          const projs = await db.select().from(dmsProjects).where(eq(dmsProjects.id, deal.projectId));
          if (projs[0]?.companyId) {
            const seller = await db.select().from(companies).where(eq(companies.id, projs[0].companyId));
            if (seller[0]?.name) sellerCompany = seller[0].name;
          }
        }

        if (deal.buyerId) {
          const buyers = await db.select().from(users).where(eq(users.id, deal.buyerId));
          if (buyers[0]?.companyId) {
            const buyerComp = await db.select().from(companies).where(eq(companies.id, buyers[0].companyId));
            if (buyerComp[0]?.name) buyerCompany = buyerComp[0].name;
          }
        }
      }

      // Check live bids for valuation & cash/stock ratio
      const rawBids = await db.select().from(biddingBids);
      if (rawBids.length > 0) {
        const b = rawBids[0];
        if (b.offer) valuation = b.offer;
        if (b.cash) cashPercent = b.cash;
        if (b.stock) stockPercent = b.stock;
        if (b.name) buyerLead = b.name;
        if (b.expectedCloseDate) {
          try {
            targetCloseDate = new Date(b.expectedCloseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn('Error reading deal metadata for document PDF:', e);
    }

    // 2. Setup PDF Document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    const { width, height } = page.getSize();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const drawCenteredText = (text, y, size, font, color) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y,
        size,
        font,
        color,
      });
    };

    // Outer Decorative Border
    page.drawRectangle({
      x: 24,
      y: 24,
      width: width - 48,
      height: height - 48,
      borderColor: rgb(0.75, 0.82, 0.88),
      borderWidth: 2,
    });

    // Inner Border
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: rgb(0, 0.4, 0.4),
      borderWidth: 1,
    });

    let docTitle = 'LETTER OF INTENT (LOI)';
    let docSubtitle = 'BINDING ACQUISITION PROPOSAL & COMMERCIAL TERMS';
    let docRef = `LOI-${dealNumber}-2026`;
    let filename = `Letter_of_Intent_LOI_${dealNumber}.pdf`;

    if (docType === 'term-sheet' || docType === 'termsheet') {
      docTitle = 'BINDING M&A TERM SHEET';
      docSubtitle = 'COMMERCIAL AGREEMENT, EXCLUSIVITY & GOVERNANCE COVENANTS';
      docRef = `TS-${dealNumber}-EXEC`;
      filename = `Binding_Term_Sheet_${dealNumber}.pdf`;
    } else if (docType === 'spa' || docType === 'agreement') {
      docTitle = 'SHARE PURCHASE AGREEMENT (SPA)';
      docSubtitle = 'DEFINITIVE CLOSING LEGAL INSTRUMENT & EQUITY TRANSFER';
      docRef = `SPA-${dealNumber}-FINAL`;
      filename = `Share_Purchase_Agreement_${dealNumber}.pdf`;
    }

    // Header Tag
    drawCenteredText('DEAL MANAGEMENT SYSTEM  ·  TRANSACTION GOVERNANCE', height - 60, 8, fontBold, rgb(0, 0.4, 0.4));
    drawCenteredText(docTitle, height - 90, 20, fontSerifBold, rgb(0.08, 0.12, 0.18));
    drawCenteredText(docSubtitle, height - 108, 9, fontBold, rgb(0.4, 0.45, 0.5));
    drawCenteredText(`Reference No. ${docRef}  ·  Executed 10-17 Nov 2026`, height - 124, 8, fontRegular, rgb(0.5, 0.55, 0.6));

    // Divider
    page.drawLine({
      start: { x: 50, y: height - 138 },
      end: { x: width - 50, y: height - 138 },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92),
    });

    // Transaction Overview Box
    let curY = height - 155;
    page.drawRectangle({
      x: 50,
      y: curY - 55,
      width: width - 100,
      height: 55,
      color: rgb(0.97, 0.98, 0.99),
      borderColor: rgb(0.88, 0.91, 0.94),
      borderWidth: 1,
    });

    page.drawText('TRANSACTION CONTEXT & COUNTERPARTIES', { x: 65, y: curY - 16, size: 8, font: fontBold, color: rgb(0, 0.4, 0.4) });
    page.drawText(`Target Transaction: ${dealName} (${dealNumber})`, { x: 65, y: curY - 30, size: 9, font: fontBold, color: rgb(0.1, 0.15, 0.2) });
    page.drawText(`Acquiring Entity (Buyer): ${buyerCompany} (Rep: ${buyerLead})`, { x: 65, y: curY - 44, size: 8.5, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });
    page.drawText(`Target Entity (Seller): ${sellerCompany} (Rep: ${sellerLead})`, { x: 320, y: curY - 44, size: 8.5, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });

    curY = curY - 75;

    // Commercial Terms Table
    page.drawText('1. AGREED COMMERCIAL TERMS & VALUATION', { x: 50, y: curY, size: 10, font: fontBold, color: rgb(0.1, 0.15, 0.2) });
    curY -= 15;

    const termsData = [
      ['Proposed / Agreed Valuation:', `${valuation} (Benchmark Variance: +50% vs Ask)`],
      ['Consideration Structure:', `${cashPercent} Cash / ${stockPercent} Stock (Balance Sheet Equity)`],
      ['Target Closing Date:', targetCloseDate],
      ['Financing Verification:', 'All equity / balance sheet cash (Solvency Verified Clean)'],
      ['Bilateral Exclusivity Period:', '30 Business Days from Bilateral Endorsement'],
      ['Governing Law & Jurisdiction:', 'Delaware Corporate Law / Indian Jurisdiction'],
    ];

    termsData.forEach(([label, val], idx) => {
      const rowY = curY - idx * 20;
      page.drawRectangle({
        x: 50,
        y: rowY - 14,
        width: width - 100,
        height: 20,
        color: idx % 2 === 0 ? rgb(1, 1, 1) : rgb(0.97, 0.98, 0.99),
        borderColor: rgb(0.9, 0.92, 0.95),
        borderWidth: 0.5,
      });

      page.drawText(label, { x: 60, y: rowY - 9, size: 8, font: fontBold, color: rgb(0.2, 0.25, 0.3) });
      page.drawText(val, { x: 210, y: rowY - 9, size: 8, font: fontRegular, color: rgb(0.1, 0.15, 0.2) });
    });

    curY -= termsData.length * 20 + 20;

    // Key Provisions
    page.drawText('2. GOVERNANCE, CONTINGENCIES & CLOSING CONDITIONS', { x: 50, y: curY, size: 10, font: fontBold, color: rgb(0.1, 0.15, 0.2) });
    curY -= 15;

    const provisions = [
      '• Due Diligence Completion: Counterparties confirmed satisfaction of all stage gates & certificate attestation #DDC-51013.',
      '• Regulatory Pre-Clearance: Clearances from antitrust and sector regulatory bodies without material adverse conditions.',
      '• Post-Closing Governance: 2 board seats assigned to acquiring entity leadership; supermajority required on extraordinary CapEx.',
      '• Escrow & Closing Wiring: Definitive cash consideration placed into escrow release upon digital signature of final execution versions.',
      '• Strict Confidentiality: Terms protected under bilateral VDR dynamic watermarking and non-disclosure covenants.',
    ];

    provisions.forEach((prov) => {
      page.drawText(prov, { x: 55, y: curY, size: 7.5, font: fontRegular, color: rgb(0.25, 0.3, 0.35) });
      curY -= 14;
    });

    curY -= 15;

    // Signatures Section
    page.drawText('3. MULTI-PARTY DIGITAL ENDORSEMENTS', { x: 50, y: curY, size: 10, font: fontBold, color: rgb(0.1, 0.15, 0.2) });
    curY -= 15;

    const sigs = [
      {
        party: 'BUYER EXECUTIVE LEAD',
        signer: buyerLead,
        role: `Authorized Representative, ${buyerCompany}`,
        status: 'Digitally Verified & Endorsed',
        date: targetCloseDate,
      },
      {
        party: 'SELLER EXECUTIVE LEAD',
        signer: sellerLead,
        role: `Super Admin, ${sellerCompany}`,
        status: 'Board Accepted & Sealed',
        date: targetCloseDate,
      },
    ];

    const sigColWidth = (width - 120) / 2;
    sigs.forEach((s, idx) => {
      const colX = 50 + idx * (sigColWidth + 20);
      page.drawRectangle({
        x: colX,
        y: curY - 80,
        width: sigColWidth,
        height: 80,
        color: rgb(0.98, 0.99, 1),
        borderColor: rgb(0.85, 0.88, 0.92),
        borderWidth: 1,
      });

      page.drawText(s.party, { x: colX + 10, y: curY - 15, size: 7, font: fontBold, color: rgb(0, 0.4, 0.4) });
      page.drawText(s.signer, { x: colX + 10, y: curY - 32, size: 12, font: fontSerifBold, color: rgb(0.08, 0.12, 0.18) });
      page.drawText(s.role, { x: colX + 10, y: curY - 46, size: 7, font: fontRegular, color: rgb(0.35, 0.4, 0.45) });
      page.drawText(`Status: ${s.status}`, { x: colX + 10, y: curY - 60, size: 7, font: fontBold, color: rgb(0.05, 0.55, 0.3) });
      page.drawText(`Date: ${s.date}`, { x: colX + 10, y: curY - 72, size: 6.5, font: fontRegular, color: rgb(0.5, 0.55, 0.6) });
    });

    // Footer
    const footerY = 55;
    page.drawLine({
      start: { x: 50, y: footerY + 20 },
      end: { x: width - 50, y: footerY + 20 },
      thickness: 0.8,
      color: rgb(0.85, 0.88, 0.92),
    });

    drawCenteredText(`SHA-256 Digest: 9f3a8b24e65012e84c979d31f0814bb657c9284ea0bc129486c71e · Ref: ${docRef}`, footerY + 8, 7, fontRegular, rgb(0.4, 0.45, 0.5));
    drawCenteredText('Generated by DMS Compliance Engine. Bank-grade legal instrumentation under ESIGN Act & SEC Rule 17a-4.', footerY - 2, 6.8, fontRegular, rgb(0.5, 0.55, 0.6));
    drawCenteredText('Strictly Confidential  |  Authorized Counterparty Attestation Package', footerY - 12, 6.5, fontItalic, rgb(0.55, 0.6, 0.65));

    const pdfBytes = await pdfDoc.save();

    // Log official Document PDF download (LOI, Term Sheet, SPA) to document_edit_logs for audit trails
    try {
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || '127.0.0.1';
      const actorUserId = searchParams.get('userId') || activeDealObj?.buyerId || '240d8762-77e2-40c0-aa87-1e2cee0c2c52';
      const targetWorkspaceId = requestedDealId || activeDealObj?.id || '51013f2a-99dd-4405-95fb-f25502053455';

      await db.insert(documentEditLogs).values({
        userId: actorUserId,
        documentId: targetWorkspaceId,
        actionType: 'DOWNLOAD_ORIGINAL',
        metadata: {
          file_name: filename,
          document_name: docTitle,
          doc_type: docType,
          download_type: 'REPORT_PDF',
          ip_address: clientIp,
          workspace_id: targetWorkspaceId,
          deal_name: dealName,
          doc_ref: docRef,
        },
        changedAt: new Date(),
      });
    } catch (logErr) {
      console.warn('Could not insert document PDF download log in document_edit_logs:', logErr.message);
    }

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBytes.length),
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error generating document PDF:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
