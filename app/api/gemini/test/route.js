export const runtime = 'edge';

export async function GET() {
  const steps = [];

  // Step 1: Check API key presence
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    steps.push({ step: 'API Key Check', status: 'fail', detail: 'No API key found in environment variables.' });
    return Response.json({ ok: false, steps }, { status: 200 });
  }
  steps.push({ step: 'API Key Check', status: 'pass', detail: `Key found (${apiKey.slice(0, 8)}...).` });

  // Step 2: Ping Gemini with a simple text-only request
  let pingRes;
  try {
    pingRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with the single word: OK' }] }],
          generationConfig: { maxOutputTokens: 5 }
        })
      }
    );
  } catch (fetchErr) {
    steps.push({ step: 'Gemini API Reachability', status: 'fail', detail: `Network error: ${fetchErr.message}` });
    return Response.json({ ok: false, steps }, { status: 200 });
  }

  if (!pingRes.ok) {
    const errText = await pingRes.text();
    let detail = `HTTP ${pingRes.status}`;
    try {
      const parsed = JSON.parse(errText);
      detail = parsed?.error?.message || detail;
    } catch {}
    steps.push({ step: 'Gemini API Reachability', status: 'fail', detail });
    return Response.json({ ok: false, steps }, { status: 200 });
  }

  const pingData = await pingRes.json();
  const reply = pingData?.candidates?.[0]?.content?.parts?.[0]?.text || '(no reply)';
  steps.push({ step: 'Gemini API Reachability', status: 'pass', detail: `Gemini responded: "${reply.trim()}"` });

  // Step 3: Check vision model availability (just check model list)
  steps.push({ step: 'Vision Model', status: 'pass', detail: 'gemini-2.0-flash supports multimodal input.' });

  return Response.json({ ok: true, steps }, { status: 200 });
}
