import { NextRequest, NextResponse } from 'next/server';
import { toggleSaveMessage } from '@/lib/storage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const roomId = body?.roomId || 'our-secret-lounge';

    const updated = toggleSaveMessage(roomId, id);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update save status' }, { status: 500 });
  }
}
