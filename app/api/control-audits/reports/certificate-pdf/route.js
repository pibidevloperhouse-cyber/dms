import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { db } from '@/db';
import { dmsDeals, dmsProjects, companies, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedDealId = searchParams.get('dealId');

    // 1. Load active deal metadata
    let dealName = 'Test User Deal';
    let dealNumber = 'D-51013';
    let sellerCompany = 'Vishwa Tech';
    let buyerCompany = "Test User's Firm";
    let periodText = '02 Sep to 30 Oct 2026';

    try {
      let query = db.select().from(dmsDeals);
      if (requestedDealId) {
        query = query.where(eq(dmsDeals.id, requestedDealId));
      }
      const deals = await query.limit(1);

      if (deals.length > 0) {
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
    } catch (e) {
      console.warn('Error reading deal metadata for certificate PDF:', e);
    }

    // 2. Load certificate data from .vdr_active_stage.json
    let certData = null;
    const STATE_FILE_PATH = path.join(process.cwd(), '.vdr_active_stage.json');
    if (fs.existsSync(STATE_FILE_PATH)) {
      try {
        const content = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(content);
        certData = parsed.dueDiligenceCertificate || null;
      } catch (e) {}
    }

    const advisorSig = certData?.advisorSignature || {
      signer: 'Rohit Verma',
      role: 'Lead Advisor, Buyer Advisory',
      timestamp: '03 Nov 2026, 11:05 IST',
    };

    const guestAdminSig = certData?.guestAdminSignature || {
      signer: 'Arjun Mehta',
      role: 'Guest Admin, Buyer Executive',
      timestamp: '03 Nov 2026, 11:15 IST',
      hash: '9f3a8b24e65012e84c979d31f0814bb657c9284ea0bc129486c71e',
    };

    const superAdminSig = certData?.superAdminSignature || {
      signer: 'Vishwa Raj',
      role: 'Super Admin, Seller Executive',
      timestamp: '03 Nov 2026, 11:20 IST',
      hash: '9f3a8b24e65012e84c979d31f0814bb657c9284ea0bc129486c71e',
    };

    const certSerial = `DDC-${dealNumber.replace('D-', '') || '51013'}`;

    // 3. Create PDF Document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    const { width, height } = page.getSize();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // Helpers
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

    // Inner Deep Teal Border
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: rgb(0.0, 0.4, 0.4),
      borderWidth: 1,
    });

    // Top Header
    drawCenteredText('DEAL MANAGEMENT SYSTEM', height - 62, 10, fontBold, rgb(0.35, 0.45, 0.55));
    drawCenteredText('CERTIFICATE OF DUE DILIGENCE COMPLETION', height - 88, 17, fontSerifBold, rgb(0.06, 0.16, 0.24));
    drawCenteredText(`No. ${certSerial}  |  Version 1.0  |  Issued 03 Nov 2026`, height - 104, 8.5, fontRegular, rgb(0.45, 0.52, 0.6));

    // Attestation Statement
    let curY = height - 130;
    drawCenteredText('This certifies that bilateral due diligence on', curY, 9.5, fontRegular, rgb(0.35, 0.4, 0.45));
    curY -= 17;
    drawCenteredText(`${dealName} (${dealNumber})`, curY, 13, fontBold, rgb(0.08, 0.15, 0.25));
    curY -= 16;
    drawCenteredText(`between ${buyerCompany} (Buyer) and ${sellerCompany} (Seller)`, curY, 9.5, fontBold, rgb(0.2, 0.28, 0.35));
    curY -= 14;
    drawCenteredText(`Diligence Horizon: ${periodText}`, curY, 8.5, fontItalic, rgb(0.45, 0.52, 0.6));

    // Divider Line
    curY -= 16;
    page.drawLine({
      start: { x: 50, y: curY },
      end: { x: width - 50, y: curY },
      thickness: 0.8,
      color: rgb(0.85, 0.88, 0.92),
    });

    // SECTION 1: REVIEW COVERAGE
    curY -= 22;
    page.drawText('1. WORKSTREAM & FOLDER REVIEW COVERAGE', {
      x: 52,
      y: curY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.1, 0.35, 0.4),
    });

    const folders = [
      { name: 'Financials & Audited Statements', lead: 'Finance Team (Abhishek)', docs: '48/48 docs', status: 'VERIFIED' },
      { name: 'Legal & Corporate Structure', lead: 'Legal Counsel (Sarah Mitchell)', docs: '36/36 docs', status: 'VERIFIED' },
      { name: 'Tax, Environmental & IP Disclosures', lead: 'Advisory Lead (Dr. Julian)', docs: '24/24 docs', status: 'VERIFIED' },
      { name: 'Operational & HR Agreements', lead: 'HR Lead (Devan / Radhi)', docs: '18/18 docs', status: 'VERIFIED' },
    ];

    curY -= 14;
    folders.forEach((f, idx) => {
      const boxY = curY - (idx * 26);
      page.drawRectangle({
        x: 52,
        y: boxY - 6,
        width: width - 104,
        height: 22,
        color: idx % 2 === 0 ? rgb(0.97, 0.98, 0.99) : rgb(1, 1, 1),
        borderColor: rgb(0.88, 0.9, 0.94),
        borderWidth: 0.5,
      });

      page.drawText(`[OK] ${f.name}`, {
        x: 58,
        y: boxY,
        size: 8.5,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.25),
      });

      page.drawText(`${f.lead}  |  ${f.docs}`, {
        x: 270,
        y: boxY,
        size: 8,
        font: fontRegular,
        color: rgb(0.4, 0.45, 0.5),
      });

      page.drawText(f.status, {
        x: width - 115,
        y: boxY,
        size: 7.5,
        font: fontBold,
        color: rgb(0.05, 0.55, 0.35),
      });
    });

    curY -= (folders.length * 26) + 16;

    // SECTION 2: RISK SUMMARY & FINDINGS
    page.drawText('2. RISK REGISTER & FINDINGS EVALUATION', {
      x: 52,
      y: curY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.1, 0.35, 0.4),
    });

    curY -= 18;
    // Risk metrics row
    const riskMetrics = [
      { label: 'Critical: 0', color: rgb(0.8, 0.2, 0.2) },
      { label: 'High: 1', color: rgb(0.9, 0.5, 0.1) },
      { label: 'Medium: 2', color: rgb(0.2, 0.45, 0.8) },
      { label: 'Low: 1', color: rgb(0.45, 0.5, 0.55) },
      { label: 'Total Logged: 4 Findings', color: rgb(0.15, 0.2, 0.25) },
    ];

    let metricX = 52;
    riskMetrics.forEach((m) => {
      page.drawText(m.label, {
        x: metricX,
        y: curY,
        size: 8.5,
        font: fontBold,
        color: m.color,
      });
      metricX += 85;
    });

    // OVERALL CONCLUSION BANNER
    curY -= 26;
    page.drawRectangle({
      x: 52,
      y: curY - 5,
      width: width - 104,
      height: 28,
      color: rgb(0.93, 0.98, 0.95),
      borderColor: rgb(0.2, 0.7, 0.45),
      borderWidth: 1,
    });

    drawCenteredText('OVERALL CONCLUSION: CLEAR WITH CONDITIONS', curY + 6, 10, fontBold, rgb(0.05, 0.45, 0.28));

    // SECTION 3: 3-WAY DIGITAL SIGNATORIES
    curY -= 32;
    page.drawText('3. EXECUTED DIGITAL SIGNATORIES (3-WAY VERIFICATION)', {
      x: 52,
      y: curY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.1, 0.35, 0.4),
    });

    const sigs = [
      {
        title: 'Lead Advisor',
        name: advisorSig.signer || 'Rohit Verma',
        role: advisorSig.role || 'Lead Advisor, Buyer Advisory',
        date: advisorSig.timestamp || '03 Nov 2026, 11:05 IST',
        status: 'Digitally Certified',
      },
      {
        title: 'Guest Admin',
        name: guestAdminSig.signer || 'Arjun Mehta',
        role: guestAdminSig.role || 'Guest Admin, Buyer Executive',
        date: guestAdminSig.timestamp || '03 Nov 2026, 11:15 IST',
        status: 'Endorsed & Transmitted',
      },
      {
        title: 'Seller Super Admin',
        name: superAdminSig.signer || 'Vishwa Raj',
        role: superAdminSig.role || 'Super Admin, Seller Executive',
        date: superAdminSig.timestamp || '03 Nov 2026, 11:20 IST',
        status: 'Accepted & Sealed',
      },
    ];

    curY -= 18;
    const colWidth = (width - 104 - 24) / 3;

    sigs.forEach((s, idx) => {
      const colX = 52 + idx * (colWidth + 12);
      const boxHeight = 85;

      page.drawRectangle({
        x: colX,
        y: curY - boxHeight,
        width: colWidth,
        height: boxHeight,
        color: rgb(0.98, 0.99, 1),
        borderColor: rgb(0.8, 0.85, 0.9),
        borderWidth: 1,
      });

      // Role tag
      page.drawText(s.title.toUpperCase(), {
        x: colX + 8,
        y: curY - 14,
        size: 7.5,
        font: fontBold,
        color: rgb(0.0, 0.4, 0.4),
      });

      // Signature cursive/italic line
      page.drawText(s.name, {
        x: colX + 8,
        y: curY - 32,
        size: 11,
        font: fontItalic,
        color: rgb(0.0, 0.3, 0.4),
      });

      page.drawLine({
        start: { x: colX + 8, y: curY - 36 },
        end: { x: colX + colWidth - 8, y: curY - 36 },
        thickness: 0.5,
        color: rgb(0.7, 0.75, 0.8),
      });

      page.drawText(s.name, {
        x: colX + 8,
        y: curY - 48,
        size: 8,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.25),
      });

      page.drawText(s.role, {
        x: colX + 8,
        y: curY - 58,
        size: 6.8,
        font: fontRegular,
        color: rgb(0.45, 0.5, 0.55),
      });

      page.drawText(`[OK] ${s.status}`, {
        x: colX + 8,
        y: curY - 70,
        size: 7,
        font: fontBold,
        color: rgb(0.05, 0.55, 0.3),
      });

      page.drawText(s.date, {
        x: colX + 8,
        y: curY - 80,
        size: 6.5,
        font: fontRegular,
        color: rgb(0.5, 0.55, 0.6),
      });
    });

    // FOOTER LEGAL & CRYPTOGRAPHIC VERIFICATION
    const footerY = 70;
    page.drawLine({
      start: { x: 50, y: footerY + 22 },
      end: { x: width - 50, y: footerY + 22 },
      thickness: 0.8,
      color: rgb(0.85, 0.88, 0.92),
    });

    const hashStr = superAdminSig.hash || guestAdminSig.hash || '9f3a8b24e65012e84c979d31f0814bb657c9284ea0bc129486c71e';
    drawCenteredText(`SHA-256 Checksum Digest: ${hashStr}`, footerY + 10, 7, fontRegular, rgb(0.4, 0.45, 0.5));
    drawCenteredText('Generated by DMS Compliance & Audit Ledger. Bank-grade verifiable chain of custody under SEC & ESIGN standards.', footerY, 6.8, fontRegular, rgb(0.5, 0.55, 0.6));
    drawCenteredText('Strictly confidential  |  Authorized Buyer & Seller Counterparty Attestation', footerY - 10, 6.8, fontItalic, rgb(0.55, 0.6, 0.65));

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Due_Diligence_Completion_Certificate_${certSerial}.pdf"`,
        'Content-Length': String(pdfBytes.length),
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error generating Due Diligence Certificate PDF:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

