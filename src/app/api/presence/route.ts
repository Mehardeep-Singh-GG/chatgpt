import { NextRequest, NextResponse } from 'next/server';
import { getPresence, updatePresence } from '@/lib/storage';
import { PartnerRole } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId') || 'our-secret-lounge';
  const presence = getPresence(roomId);
  return NextResponse.json({ success: true, presence });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId = 'our-secret-lounge', role, isTyping = false } = body as {
      roomId?: string;
      role: PartnerRole;
      isTyping?: boolean;
    };

    if (!role) {
      return NextResponse.json({ success: false, error: 'Role required' }, { status: 400 });
    }

    const presence = updatePresence(roomId, role, isTyping);
    return NextResponse.json({ success: true, presence });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update presence' }, { status: 500 });
  }
}
