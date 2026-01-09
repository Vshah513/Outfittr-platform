import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// GET /api/messages/count - Get total count of conversations
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

    // Get all messages for the user
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('conversation_id')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);

    if (fetchError) throw fetchError;

    // Count unique conversation IDs
    const uniqueConversations = new Set(
      messages?.map(msg => msg.conversation_id) || []
    );

    return NextResponse.json({ 
      count: uniqueConversations.size 
    });
  } catch (error) {
    console.error('Error fetching conversation count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation count' },
      { status: 500 }
    );
  }
}

