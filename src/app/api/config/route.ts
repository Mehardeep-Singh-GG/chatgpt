import { NextRequest, NextResponse } from 'next/server';
import { getConfig, updateConfig } from '@/lib/storage';
import { AppConfig } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId') || 'our-secret-lounge';
  const config = getConfig(roomId);
  return NextResponse.json({ success: true, config });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId = 'our-secret-lounge', config } = body as {
      roomId?: string;
      config: Partial<AppConfig>;
    };

    if (!config) {
      return NextResponse.json({ success: false, error: 'Config payload required' }, { status: 400 });
    }

    const updated = updateConfig(roomId, config);
    return NextResponse.json({ success: true, config: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update config' }, { status: 500 });
  }
}
