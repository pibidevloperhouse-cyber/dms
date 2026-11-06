import { NextResponse } from 'next/server';
import { db } from '@/db';
import { biddingTermSheets } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { loadBiddingStore, saveBiddingStore, updateTermSheetInDB } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

const CANONICAL_TS_ID = 'ts_vdr_sell';
const CANONICAL_ROUND_ID = 'c7330177-a8ab-47a2-933c-af0be1d1246f';

export async function GET() {
  try {
    let comments = [];

    try {
      const rows = await db
        .select()
        .from(biddingTermSheets)
        .where(
          or(
            eq(biddingTermSheets.id, CANONICAL_TS_ID),
            eq(biddingTermSheets.roundId, CANONICAL_ROUND_ID)
          )
        );

      if (rows && rows.length > 0) {
        const row = rows[0];
        if (Array.isArray(row.counselComments)) {
          comments = row.counselComments;
        } else if (typeof row.counselComments === 'string') {
          try {
            comments = JSON.parse(row.counselComments) || [];
          } catch (_) {
            comments = [];
          }
        }
      }
    } catch (dbErr) {
      console.warn('[TermSheetComments API] Direct DB select failed:', dbErr?.message);
    }

    if (!comments || comments.length === 0) {
      const store = loadBiddingStore();
      comments = store?.termSheet?.counselComments || [];
    }

    return NextResponse.json({
      success: true,
      comments
    });
  } catch (error) {
    console.error('Error in /api/bidding/term-sheet/comments GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { sender, role, message, avatar } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Comment message is required' }, { status: 400 });
    }

    const isSeller =
      role === 'super_admin' ||
      role === 'seller' ||
      role === 'seller_counsel' ||
      sender?.includes('Super Admin') ||
      sender?.includes('Seller') ||
      sender?.includes('Vishwa');

    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const formattedTimestamp = `${day} ${month}, ${time}`;

    const newComment = {
      id: `c-${Date.now()}`,
      sender: sender || (isSeller ? 'Vishwa Raj (Super Admin)' : 'Naga raj (Buyer)'),
      role: isSeller ? 'seller' : 'buyer',
      avatar: avatar || (isSeller ? 'SA' : 'BA'),
      message: message.trim(),
      timestamp: formattedTimestamp,
      createdAt: now.toISOString()
    };

    let updatedComments = null;

    try {
      const rows = await db
        .select()
        .from(biddingTermSheets)
        .where(
          or(
            eq(biddingTermSheets.id, CANONICAL_TS_ID),
            eq(biddingTermSheets.roundId, CANONICAL_ROUND_ID)
          )
        );

      let existingComments = [];
      let targetRow = rows?.[0];

      if (targetRow) {
        if (Array.isArray(targetRow.counselComments)) {
          existingComments = targetRow.counselComments;
        } else if (typeof targetRow.counselComments === 'string') {
          try {
            existingComments = JSON.parse(targetRow.counselComments) || [];
          } catch (_) {
            existingComments = [];
          }
        }

        updatedComments = [...existingComments, newComment];

        await db
          .update(biddingTermSheets)
          .set({
            counselComments: updatedComments,
            updatedAt: new Date()
          })
          .where(eq(biddingTermSheets.id, targetRow.id));
      }
    } catch (dbErr) {
      console.warn('[TermSheetComments API] Direct DB update failed:', dbErr?.message);
    }

    // Keep service & fallback store synced
    try {
      if (!updatedComments) {
        const store = loadBiddingStore();
        const existing = store?.termSheet?.counselComments || [];
        updatedComments = [...existing, newComment];
      }
      await updateTermSheetInDB({
        counselComments: updatedComments
      });
    } catch (fallbackErr) {
      console.warn('[TermSheetComments API] Fallback store update failed:', fallbackErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment,
      comments: updatedComments
    });
  } catch (error) {
    console.error('Error in /api/bidding/term-sheet/comments POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
