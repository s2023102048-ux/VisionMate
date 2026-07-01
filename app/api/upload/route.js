// ============================================================
// app/api/upload/route.js — Secure Cloudinary Upload Route
// Signs the upload server-side so the API secret is never
// exposed to the browser.
// ============================================================

export const runtime = 'edge';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey    = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return Response.json({ error: 'Cloudinary not configured' }, { status: 500 });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder    = 'visionmate';

    // Generate SHA-256 signature using Web Crypto API (Edge-compatible)
    const signString  = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const encoder     = new TextEncoder();
    const hashBuffer  = await crypto.subtle.digest('SHA-256', encoder.encode(signString));
    const hashArray   = Array.from(new Uint8Array(hashBuffer));
    const signature   = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Forward to Cloudinary with signed params
    const uploadForm = new FormData();
    uploadForm.append('file',      file);
    uploadForm.append('api_key',   apiKey);
    uploadForm.append('timestamp', String(timestamp));
    uploadForm.append('signature', signature);
    uploadForm.append('folder',    folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: uploadForm }
    );

    const result = await response.json();

    if (!response.ok) {
      return Response.json({ error: result.error?.message || 'Upload failed' }, { status: 500 });
    }

    return Response.json({ url: result.secure_url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
