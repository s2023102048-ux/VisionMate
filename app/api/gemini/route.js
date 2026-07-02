export const runtime = 'edge';

// ============================================================
// app/api/gemini/route.js
// Primary:  OpenRouter (free, Cloudflare-Edge compatible)
// Fallback: Gemini direct (if GEMINI_API_KEY present & working)
// ============================================================

const SYSTEM_PROMPT = (categoryHint) =>
  `You are an expert ADA-compliance and accessibility inspector for the crowdsourced mapping app, VisionMate.

Your task is to analyze the provided image of a building entrance, pathway, or facility and generate an "Accessibility Score" for wheelchair users and mobility-impaired individuals.${categoryHint ? `\n\nThe reporter has indicated this issue category: "${categoryHint}". Use this as additional context.` : ''}

You must respond ONLY with a valid JSON object exactly matching the structure below. Do not include markdown formatting, just the raw JSON object.

{
  "rating": <a float number between 1.0 and 5.0>,
  "positive_features": ["<visible accessible feature>"],
  "warnings": ["<visible hazard or missing feature>"]
}`;

// ── OpenRouter (primary — free, Cloudflare-compatible) ────────
async function callOpenRouter(mimeType, base64, categoryHint) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY not set');

  const dataUrl = `data:${mimeType};base64,${base64}`;

  const body = {
    model: 'google/gemma-4-26b-a4b-it:free',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text',      text: SYSTEM_PROMPT(categoryHint) },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }
    ],
    temperature: 0.1,
    max_tokens: 512,
    response_format: { type: 'json_object' }
  };

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'https://visionmate.pages.dev',
      'X-Title': 'VisionMate'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  // Return Gemini-compatible shape
  return { candidates: [{ content: { parts: [{ text }] } }] };
}

// ── Gemini (fallback) ─────────────────────────────────────────
async function callGemini(mimeType, base64, categoryHint) {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No Gemini API key set');

  const body = {
    contents: [{
      parts: [
        { text: SYSTEM_PROMPT(categoryHint) },
        { inline_data: { mime_type: mimeType, data: base64 } }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 512, responseMimeType: 'application/json' }
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }
  return res.json();
}

// ── Handler ───────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { mimeType, base64, categoryHint } = await req.json();

    // Try OpenRouter first
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const data = await callOpenRouter(mimeType, base64, categoryHint);
        return Response.json({ ...data, _provider: 'openrouter' });
      } catch (err) {
        console.error('OpenRouter failed, trying Gemini:', err.message);
      }
    }

    // Fallback to Gemini
    try {
      const data = await callGemini(mimeType, base64, categoryHint);
      return Response.json({ ...data, _provider: 'gemini' });
    } catch (err) {
      console.error('Gemini also failed:', err.message);
      return Response.json({ error: err.message }, { status: 502 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
