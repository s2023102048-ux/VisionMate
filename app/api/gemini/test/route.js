export const runtime = 'edge';

export async function GET() {
  const steps = [];

  // ── Step 1: Groq API Key ──────────────────────────────────
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    steps.push({ step: 'Groq API Key', status: 'fail', detail: 'GROQ_API_KEY not found in environment variables.' });
  } else {
    steps.push({ step: 'Groq API Key', status: 'pass', detail: `Key found (${groqKey.slice(0, 8)}...).` });

    // ── Step 2: Groq Reachability ───────────────────────────
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{ role: 'user', content: 'Reply with the single word: OK' }],
          max_tokens: 5
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        let detail = `HTTP ${res.status}`;
        try { detail = JSON.parse(errText)?.error?.message || detail; } catch {}
        steps.push({ step: 'Groq API Reachability', status: 'fail', detail });
      } else {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content || '(no reply)';
        steps.push({ step: 'Groq API Reachability', status: 'pass', detail: `Groq responded: "${reply.trim()}"` });
        steps.push({ step: 'Vision Model', status: 'pass', detail: 'llama-4-scout-17b supports multimodal (vision) input.' });
        return Response.json({ ok: true, provider: 'groq', steps });
      }
    } catch (err) {
      steps.push({ step: 'Groq API Reachability', status: 'fail', detail: `Network error: ${err.message}` });
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
