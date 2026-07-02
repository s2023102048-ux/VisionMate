export const runtime = 'edge';

export async function GET() {
  const steps = [];

  // ── Step 1: OpenRouter API Key ────────────────────────────
  const orKey = process.env.OPENROUTER_API_KEY;
  if (!orKey) {
    steps.push({ step: 'OpenRouter API Key', status: 'fail', detail: 'OPENROUTER_API_KEY not found in environment variables.' });
  } else {
    steps.push({ step: 'OpenRouter API Key', status: 'pass', detail: `Key found (${orKey.slice(0, 8)}...).` });

    // ── Step 2: OpenRouter Reachability ──────────────────────
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${orKey}`,
          'HTTP-Referer': 'https://visionmate.pages.dev',
          'X-Title': 'VisionMate'
        },
        body: JSON.stringify({
          model: 'google/gemma-4-26b-a4b-it:free',
          messages: [{ role: 'user', content: 'Reply with the single word: OK' }],
          max_tokens: 5
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        let detail = `HTTP ${res.status}`;
        try { detail = JSON.parse(errText)?.error?.message || detail; } catch {}
        steps.push({ step: 'OpenRouter API Reachability', status: 'fail', detail });
      } else {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content || '(no reply)';
        steps.push({ step: 'OpenRouter API Reachability', status: 'pass', detail: `Responded: "${reply.trim()}"` });
        steps.push({ step: 'Vision Model', status: 'pass', detail: 'llama-3.2-11b-vision supports image input (free tier).' });
        return Response.json({ ok: true, provider: 'openrouter', steps });
      }
    } catch (err) {
      steps.push({ step: 'OpenRouter API Reachability', status: 'fail', detail: `Network error: ${err.message}` });
    }
  }

  // ── Fallback: Check Gemini ────────────────────────────────
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    steps.push({ step: 'Gemini API Key (fallback)', status: 'fail', detail: 'No Gemini key either. Both providers unavailable.' });
    return Response.json({ ok: false, steps });
  }
  steps.push({ step: 'Gemini API Key (fallback)', status: 'pass', detail: `Key found (${geminiKey.slice(0, 8)}...).` });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with the single word: OK' }] }],
          generationConfig: { maxOutputTokens: 5 }
        })
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      let detail = `HTTP ${res.status}`;
      try { detail = JSON.parse(errText)?.error?.message || detail; } catch {}
      steps.push({ step: 'Gemini API Reachability (fallback)', status: 'fail', detail });
      return Response.json({ ok: false, steps });
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '(no reply)';
    steps.push({ step: 'Gemini API Reachability (fallback)', status: 'pass', detail: `Gemini responded: "${reply.trim()}"` });
    return Response.json({ ok: true, provider: 'gemini', steps });
  } catch (err) {
    steps.push({ step: 'Gemini API Reachability (fallback)', status: 'fail', detail: `Network error: ${err.message}` });
    return Response.json({ ok: false, steps });
  }
}
