import { NextRequest, NextResponse } from 'next/server';
import { toggleReaction } from '@/lib/storage';
import { PartnerRole } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { roomId = 'our-secret-lounge', sender, emoji } = body as {
      roomId?: string;
      sender: PartnerRole;
      emoji: string;
    };

    if (!sender || !emoji) {
      return NextResponse.json({ success: false, error: 'Sender and emoji required' }, { status: 400 });
    }

    const updated = toggleReaction(roomId, id, sender, emoji);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update reaction' }, { status: 500 });
  }
}
