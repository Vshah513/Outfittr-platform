import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// GET /api/messages/unread-count - Get count of conversations with unread messages
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

    // Get all messages where user is recipient and message is unread
    const { data: unreadMessages, error: fetchError } = await supabase
      .from('messages')
      .select('conversation_id')
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    if (fetchError) throw fetchError;

    // Count unique conversation IDs (each conversation counts as 1, regardless of message count)
    const uniqueConversations = new Set(
      unreadMessages?.map(msg => msg.conversation_id) || []
    );

    return NextResponse.json({ 
      count: uniqueConversations.size 
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}

