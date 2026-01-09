import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// GET /api/messages - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Get unique conversations for the user
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, full_name, avatar_url),
        recipient:users!messages_recipient_id_fkey(id, full_name, avatar_url),
        product:products(id, title, images, price)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    // Group by conversation_id and get the latest message for each
    const conversationsMap = new Map();
    messages?.forEach(msg => {
      if (!conversationsMap.has(msg.conversation_id)) {
        conversationsMap.set(msg.conversation_id, {
          conversation_id: msg.conversation_id,
          last_message: msg,
          other_user: msg.sender_id === user.id ? msg.recipient : msg.sender,
          product: msg.product,
          unread_count: 0,
        });
      }
      // Count unread messages
      if (msg.recipient_id === user.id && !msg.is_read) {
        const conv = conversationsMap.get(msg.conversation_id);
        conv.unread_count++;
      }
    });

    const conversations = Array.from(conversationsMap.values());

    return NextResponse.json({ data: conversations });
  } catch (error) {
    logger.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/messages - Create new message/conversation
const createMessageSchema = z.object({
  recipient_id: z.string().uuid(),
  product_id: z.string().uuid().optional(),
  content: z.string().min(1).max(1000),
  conversation_id: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const body = await request.json();
    const messageData = createMessageSchema.parse(body);

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Generate conversation ID if not provided
    const conversationId = messageData.conversation_id || crypto.randomUUID();

    const { data, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: messageData.recipient_id,
        product_id: messageData.product_id,
        content: messageData.content,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

