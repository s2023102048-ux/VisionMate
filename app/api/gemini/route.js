export const runtime = 'edge';

// ============================================================
// app/api/gemini/route.js
// Primary:  OpenRouter (free, Cloudflare-Edge compatible)
// Fallback: Gemini direct (if GEMINI_API_KEY present & working)
// ============================================================

const SYSTEM_PROMPT = (categoryHint) =>
  `You are a strict but accurate ADA-compliance and accessibility inspector analyzing images for the VisionMate crowdsourced accessibility mapping app in the Philippines.

Your job is to assess wheelchair and mobility-impaired accessibility of building entrances, pathways, ramps, and facilities in the photo.${categoryHint ? `\n\nReporter's issue category: "${categoryHint}". Use this as context.` : ''}

SCORING RUBRIC - follow this carefully:
5.0 = FULLY ACCESSIBLE: Proper ramp OR level entry, handrails on both sides, smooth/even surface, wide enough, no obstructions.
4.0-4.9 = MOSTLY ACCESSIBLE: Has a ramp or accessible entry, handrails present, minor issues but safely usable for wheelchairs.
3.0-3.9 = PARTIALLY ACCESSIBLE: Ramp exists but steep, narrow, or missing handrails. OR flat path with significant surface damage.
2.0-2.9 = MOSTLY INACCESSIBLE: Steep steps with no ramp, rough/broken surface, major obstructions.
1.0-1.9 = COMPLETELY INACCESSIBLE: Stairs only, no ramp, completely blocked, impossible for wheelchair users.

KEY RULES:
- If you see a RAMP with HANDRAILS, score MUST be at least 3.5. If it looks usable, score 4.0 or higher.
- If you see STEPS with NO ramp at all, score MUST be 2.5 or lower.
- If surface is SMOOTH and LEVEL with no barriers, score MUST be 4.0 or higher.
- Do NOT penalize for age or weathering. Focus on FUNCTIONAL accessibility.
- A yellow painted concrete ramp with metal handrails is a GOOD feature and should score 4.0 or higher.

Respond ONLY with a raw JSON object, no markdown, no explanation:
{
  "rating": <float 1.0-5.0 based on rubric>,
  "category": "<write a short, specific 1-4 word classification of the primary feature or hazard shown (e.g., 'Deep Pothole', 'Overgrown Bushes', 'Muddy Pathway', 'Construction Scaffolding', 'Broken Ramp'). Accurately describe what you see, do not restrict yourself to a predefined list.>",
  "comment": "<one sentence natural language summary of what you observed and why you gave that score. Example: 'Wheelchair ramp clearly visible with handrails on both sides — safe and functional for PWD users.' or 'Steep staircase with no ramp detected — inaccessible for wheelchair users.'>",
  "positive_features": ["<specific visible accessible feature>"],
  "warnings": ["<specific visible hazard or barrier>"]
}`;


// ── OpenRouter (primary — free, Cloudflare-compatible) ────────
// Supports up to 3 keys: OPENROUTER_API_KEY, OPENROUTER_API_KEY_2, OPENROUTER_API_KEY_3
async function callOpenRouter(mimeType, base64, categoryHint) {
  const keys = [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3,
  ].filter(Boolean);

  if (keys.length === 0) throw new Error('No OPENROUTER_API_KEY set');

  const dataUrl = `data:${mimeType};base64,${base64}`;
  const body = {
    model: 'google/gemma-4-26b-a4b-it:free',
    messages: [{
      role: 'user',
      content: [
        { type: 'text',      text: SYSTEM_PROMPT(categoryHint) },
        { type: 'image_url', image_url: { url: dataUrl } }
      ]
    }],
    temperature: 0.1,
    max_tokens: 512,
    response_format: { type: 'json_object' }
  };

  let lastError;
  for (const key of keys) {
    try {
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
        // Rate-limited or quota — try next key
        lastError = new Error(`OpenRouter error ${res.status}: ${err}`);
        console.warn(`OpenRouter key ${key.slice(0,10)}... failed, trying next:`, lastError.message);
        continue;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '{}';
      return { candidates: [{ content: { parts: [{ text }] } }] };
    } catch (err) {
      lastError = err;
      console.warn(`OpenRouter key ${key.slice(0,10)}... threw:`, err.message);
    }
  }

  throw lastError || new Error('All OpenRouter keys failed');
}

// ── Gemini (fallback) — supports 2 keys ─────────────────────
async function callGemini(mimeType, base64, categoryHint) {
  const keys = [
    process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
  ].filter(Boolean);

  if (keys.length === 0) throw new Error('No Gemini API key set');

  const body = {
    contents: [{
      parts: [
        { text: SYSTEM_PROMPT(categoryHint) },
        { inline_data: { mime_type: mimeType, data: base64 } }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 512, responseMimeType: 'application/json' }
  };

  let lastError;
  for (const apiKey of keys) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );

      if (!res.ok) {
        const err = await res.text();
        lastError = new Error(`Gemini error ${res.status}: ${err}`);
        console.warn(`Gemini key ${apiKey.slice(0,8)}... failed, trying next:`, lastError.message);
        continue;
      }
      return res.json();
    } catch (err) {
      lastError = err;
      console.warn(`Gemini key ${apiKey.slice(0,8)}... threw:`, err.message);
    }
  }

  throw lastError || new Error('All Gemini keys failed');
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
