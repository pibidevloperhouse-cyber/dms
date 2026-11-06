import { NextResponse } from 'next/server';
import { db } from '@/db';
import { biddingMessages } from '@/db/schema';
import { eq, or, ilike } from 'drizzle-orm';
import { loadBiddingStore, saveBiddingStore } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

const CANONICAL_NAGA_CONV_ID = '3e5cac9b-e809-4a2a-a95d-35e9baa6eddf';
const CANONICAL_NAGA_BUYER_ID = '8ec0af77-0630-444f-8e1c-d362f35a2e13';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get('buyerId');

    let dbRows = [];
    try {
      dbRows = await db.select().from(biddingMessages);
    } catch (dbErr) {
      console.warn('[BiddingMessages API] DB select failed, fallback to local store:', dbErr?.message);
    }

    let conversations = {};
    if (dbRows && dbRows.length > 0) {
      for (const row of dbRows) {
        let parsedThreads = [];
        try {
          parsedThreads = Array.isArray(row.threads)
            ? row.threads
            : (typeof row.threads === 'string' ? JSON.parse(row.threads) : []);
        } catch (_) {
          parsedThreads = [];
        }

        const conv = {
          id: row.id,
          buyerId: row.buyerId || row.id,
          buyerUserId: row.buyerId,
          roundId: row.roundId,
          buyerName: row.buyerName,
          mark: row.mark || 'NT',
          type: row.type || '',
          status: row.status || '',
          leadName: row.leadName || '',
          advisorName: row.advisorName || '',
          currentOffer: row.currentOffer || '',
          unreadCount: row.unreadCount || 0,
          threads: parsedThreads
        };

        conversations[row.id] = conv;
        if (row.buyerId) {
          conversations[row.buyerId] = conv;
        }
      }
    } else {
      const store = loadBiddingStore();
      conversations = store.messages || {};
    }

    // Ensure the canonical Naga Tech conversation is mapped under all lookup keys
    const nagaConv = conversations[CANONICAL_NAGA_CONV_ID] || conversations[CANONICAL_NAGA_BUYER_ID];
    if (nagaConv) {
      conversations[CANONICAL_NAGA_CONV_ID] = nagaConv;
      conversations[CANONICAL_NAGA_BUYER_ID] = nagaConv;
    }

    if (buyerId) {
      const match =
        conversations[buyerId] ||
        (buyerId === CANONICAL_NAGA_BUYER_ID || buyerId === CANONICAL_NAGA_CONV_ID ? nagaConv : null) ||
        Object.values(conversations).find((m) =>
          m.buyerId === buyerId ||
          m.buyerUserId === buyerId ||
          m.id === buyerId ||
          (m.buyerName && m.buyerName.toLowerCase().includes('naga')) ||
          (m.leadName && m.leadName.toLowerCase().includes('naga'))
        ) ||
        nagaConv ||
        Object.values(conversations)[0];

      return NextResponse.json({ success: true, conversation: match });
    }

    return NextResponse.json({ success: true, conversations });
  } catch (err) {
    console.error('Error fetching messages:', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { dealId, buyerId, text, sender, senderRole, category } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const effectiveBuyerId = buyerId || CANONICAL_NAGA_BUYER_ID;
    const isSeller = senderRole === 'seller' || sender?.includes('Super Admin') || sender?.includes('Seller');
    const now = new Date();
    const timestamp =
      now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
      ', ' +
      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const newMsg = {
      id: 'm-' + Date.now(),
      sender: sender || (isSeller ? 'Vishwa Raj (Super Admin)' : 'Naga raj (Guest Admin)'),
      senderRole: isSeller ? 'seller' : 'buyer',
      isMe: isSeller,
      text: text.trim(),
      category: category || 'General',
      timestamp,
      createdAt: now.toISOString()
    };

    let updatedConversation = null;

    try {
      // Find canonical row: either by canonical ID, buyerId, or buyer name
      const existingRows = await db
        .select()
        .from(biddingMessages)
        .where(
          or(
            eq(biddingMessages.id, CANONICAL_NAGA_CONV_ID),
            eq(biddingMessages.buyerId, effectiveBuyerId),
            eq(biddingMessages.id, effectiveBuyerId),
            ilike(biddingMessages.buyerName, '%naga%')
          )
        );

      let targetRow =
        existingRows.find((r) => r.id === CANONICAL_NAGA_CONV_ID) ||
        existingRows[0];

      if (targetRow) {
        let currentThreads = [];
        try {
          currentThreads = Array.isArray(targetRow.threads)
            ? targetRow.threads
            : (typeof targetRow.threads === 'string' ? JSON.parse(targetRow.threads) : []);
        } catch (_) {
          currentThreads = [];
        }

        const newThreads = [...currentThreads, newMsg];

        await db
          .update(biddingMessages)
          .set({
            threads: newThreads,
            updatedAt: new Date()
          })
          .where(eq(biddingMessages.id, targetRow.id));

        updatedConversation = {
          ...targetRow,
          threads: newThreads
        };
      } else {
        const newRow = {
          id: CANONICAL_NAGA_CONV_ID,
          roundId: dealId || 'c7330177-a8ab-47a2-933c-af0be1d1246f',
          buyerId: effectiveBuyerId,
          buyerName: 'Naga Tech',
          leadName: 'Naga raj',
          mark: 'NT',
          type: 'Strategic Buyer',
          status: 'Shortlisted',
          currentOffer: '$10.0M',
          unreadCount: 0,
          threads: [newMsg],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.insert(biddingMessages).values(newRow);
        updatedConversation = newRow;
      }
    } catch (dbErr) {
      console.warn('[BiddingMessages API] DB update error, falling back:', dbErr?.message);
    }

    // Keep local store in sync
    try {
      const store = loadBiddingStore();
      if (!store.messages) store.messages = {};
      const targetStoreConv =
        store.messages[CANONICAL_NAGA_CONV_ID] ||
        store.messages[effectiveBuyerId] || {
          id: CANONICAL_NAGA_CONV_ID,
          buyerId: CANONICAL_NAGA_BUYER_ID,
          buyerName: 'Naga Tech',
          leadName: 'Naga raj',
          threads: []
        };

      targetStoreConv.threads = [...(targetStoreConv.threads || []), newMsg];
      store.messages[CANONICAL_NAGA_CONV_ID] = targetStoreConv;
      store.messages[CANONICAL_NAGA_BUYER_ID] = targetStoreConv;
      saveBiddingStore(store);

      if (!updatedConversation) {
        updatedConversation = targetStoreConv;
      }
    } catch (fallbackErr) {
      console.warn('Fallback store error:', fallbackErr);
    }

    return NextResponse.json({
      success: true,
      message: newMsg,
      conversation: updatedConversation
    });
  } catch (err) {
    console.error('Error posting message:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
