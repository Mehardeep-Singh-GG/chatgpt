import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

function ensureUploadsDir() {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  } catch {
    // In serverless / read-only environment
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle JSON payload with base64 DataURL
    if (contentType.includes('application/json')) {
      const { dataUrl, filename, mimeType } = await request.json();
      if (!dataUrl) {
        return NextResponse.json({ success: false, error: 'No data provided' }, { status: 400 });
      }

      // Try saving to public/uploads if filesystem is writable
      try {
        ensureUploadsDir();
        const base64Data = dataUrl.replace(/^data:[A-Za-z-+/]+;base64,/, '');
        const ext = filename ? path.extname(filename) : mimeType?.includes('video') ? '.webm' : '.wav';
        const safeName = `media_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
        const filePath = path.join(UPLOADS_DIR, safeName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

        return NextResponse.json({
          success: true,
          url: `/uploads/${safeName}`,
        });
      } catch {
        // In Vercel serverless where filesystem is read-only, return the dataUrl directly
        return NextResponse.json({
          success: true,
          url: dataUrl,
        });
      }
    }

    // Handle multipart FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      ensureUploadsDir();
      const ext = path.extname(file.name) || (file.type.includes('video') ? '.webm' : file.type.includes('audio') ? '.wav' : '.jpg');
      const safeName = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
      const filePath = path.join(UPLOADS_DIR, safeName);
      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${safeName}`,
        fileName: file.name,
        fileSize: file.size,
      });
    } catch {
      // Fallback to base64 DataURL for serverless
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      return NextResponse.json({
        success: true,
        url: dataUrl,
        fileName: file.name,
        fileSize: file.size,
      });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to upload media' }, { status: 500 });
  }
}
