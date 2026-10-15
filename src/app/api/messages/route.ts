import { NextRequest, NextResponse } from 'next/server';
import { getMessages, addMessage, syncMessages } from '@/lib/storage';
import { ChatMessage } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId') || 'our-secret-lounge';
  const messages = getMessages(roomId);
  return NextResponse.json({ success: true, messages });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId = 'our-secret-lounge', message } = body as {
      roomId?: string;
      message: ChatMessage;
    };

    if (!message || !message.id || !message.sender || !message.type) {
      return NextResponse.json({ success: false, error: 'Invalid message payload' }, { status: 400 });
    }

    const saved = addMessage(roomId, message);
    return NextResponse.json({ success: true, message: saved });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to save message' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId = 'our-secret-lounge', messages: clientMessages } = body as {
      roomId?: string;
      messages: ChatMessage[];
    };

    if (!Array.isArray(clientMessages)) {
      return NextResponse.json({ success: false, error: 'Invalid messages array' }, { status: 400 });
    }

    const merged = syncMessages(roomId, clientMessages);
    return NextResponse.json({ success: true, messages: merged });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to sync messages' }, { status: 500 });
  }
}
