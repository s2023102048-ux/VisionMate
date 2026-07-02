export const runtime = 'edge';

export async function GET() {
  const steps = [];

  // ── OpenRouter: try all keys ────────────────────────────────
  const orKeys = [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3,
    process.env.OPENROUTER_API_KEY_4,
    process.env.OPENROUTER_API_KEY_5,
    process.env.OPENROUTER_API_KEY_6,
    process.env.OPENROUTER_API_KEY_7,
  ].filter(Boolean);

  if (orKeys.length === 0) {
    steps.push({ step: 'OpenRouter API Keys', status: 'fail', detail: 'No OPENROUTER_API_KEY found in environment variables.' });
  } else {
    steps.push({ step: 'OpenRouter API Keys', status: 'pass', detail: `${orKeys.length} key(s) configured. Trying each until one works…` });

    let orWorking = false;
    let orWorkingIndex = -1;

    for (let i = 0; i < orKeys.length; i++) {
      const key = orKeys[i];
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
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
          // Key is quota-limited, try next
          steps.push({ step: `OpenRouter Key ${i + 1}`, status: 'fail', detail: `Quota/limit: ${detail.slice(0, 80)}` });
          continue;
        }

        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content || '(no reply)';
        steps.push({ step: `OpenRouter Key ${i + 1} ✓ (Active)`, status: 'pass', detail: `Responded: "${reply.trim()}" — this key will handle requests.` });
        orWorking = true;
        orWorkingIndex = i + 1;
        break;

      } catch (err) {
        steps.push({ step: `OpenRouter Key ${i + 1}`, status: 'fail', detail: `Network error: ${err.message}` });
      }
    }

    if (orWorking) {
      return Response.json({ ok: true, provider: `openrouter-key-${orWorkingIndex}`, steps });
    }

    steps.push({ step: 'OpenRouter Rotation', status: 'fail', detail: `All ${orKeys.length} OpenRouter key(s) are quota-limited. Falling back to Gemini…` });
  }

  // ── Gemini fallback: try all keys ──────────────────────────
  const geminiKeys = [
    process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
  ].filter(Boolean);

  if (geminiKeys.length === 0) {
    steps.push({ step: 'Gemini API Key (fallback)', status: 'fail', detail: 'No Gemini key configured. Both providers unavailable.' });
    return Response.json({ ok: false, steps });
  }

  steps.push({ step: 'Gemini API Keys (fallback)', status: 'pass', detail: `${geminiKeys.length} Gemini key(s) configured. Trying each…` });

  for (let i = 0; i < geminiKeys.length; i++) {
    const apiKey = geminiKeys[i];
    try {
      const res = await fetch(
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

      if (!res.ok) {
        const errText = await res.text();
        let detail = `HTTP ${res.status}`;
        try { detail = JSON.parse(errText)?.error?.message || detail; } catch {}
        steps.push({ step: `Gemini Key ${i + 1}`, status: 'fail', detail: `Quota/limit: ${detail.slice(0, 80)}` });
        continue;
      }

      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '(no reply)';
      steps.push({ step: `Gemini Key ${i + 1} ✓ (Active)`, status: 'pass', detail: `Responded: "${reply.trim()}" — this key will handle fallback requests.` });
      return Response.json({ ok: true, provider: `gemini-key-${i + 1}`, steps });

    } catch (err) {
      steps.push({ step: `Gemini Key ${i + 1}`, status: 'fail', detail: `Network error: ${err.message}` });
    }
  }

  steps.push({ step: 'All Providers Failed', status: 'fail', detail: 'All OpenRouter and Gemini keys are quota-limited. AI inspection is temporarily unavailable.' });
  return Response.json({ ok: false, steps });
}
