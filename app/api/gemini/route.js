export const runtime = 'edge';

// ============================================================
// app/api/gemini/route.js
// Uses Groq (free, worldwide) as the primary AI provider.
// Falls back to Gemini if GROQ_API_KEY is not set.
// ============================================================

const SYSTEM_PROMPT = (categoryHint) =>
  `You are an expert ADA-compliance and accessibility inspector for the crowdsourced mapping app, VisionMate.

Your task is to analyze the provided image of a building entrance, pathway, or facility and generate an "Accessibility Score" for wheelchair users and mobility-impaired individuals.${categoryHint ? `\n\nThe reporter has indicated this issue category: "${categoryHint}". Use this as additional context.` : ''}

You must respond ONLY with a valid JSON object exactly matching the structure below. Do not include markdown formatting like \`\`\`json, just the raw JSON object.

{
  "rating": <a float number between 1.0 and 5.0 representing the overall accessibility score>,
  "positive_features": [
    <an array of strings listing visible accessible features. Examples: "Wide Entrance", "Wheelchair Ramp", "Flat Surface", "Elevator", "Accessible Restroom">
  ],
  "warnings": [
    <an array of strings listing any visible hazards, difficulties, or missing features. Examples: "Steep incline", "Uneven pavement", "No handrails", "Blocked pathway">
  ]
}`;

// ── Groq vision call (primary) ────────────────────────────────
async function callGroq(mimeType, base64, categoryHint) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error('GROQ_API_KEY not set');

  const dataUrl = `data:${mimeType};base64,${base64}`;

  const body = {
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
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

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }

  const data = await res.json();
  // Return in Gemini-compatible shape so page.js doesn't need changes
  const text = data.choices?.[0]?.message?.content || '{}';
  return { candidates: [{ content: { parts: [{ text }] } }] };
}

// ── Gemini vision call (fallback) ─────────────────────────────
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

    let data;
    let provider;

    // Try Groq first (free, worldwide)
    if (process.env.GROQ_API_KEY) {
      try {
        data = await callGroq(mimeType, base64, categoryHint);
        provider = 'groq';
      } catch (groqErr) {
        console.error('Groq failed, trying Gemini:', groqErr.message);
      }
    }

    // Fallback to Gemini
    if (!data) {
      try {
        data = await callGemini(mimeType, base64, categoryHint);
        provider = 'gemini';
      } catch (geminiErr) {
        console.error('Gemini also failed:', geminiErr.message);
        return Response.json({ error: geminiErr.message }, { status: 502 });
      }
    }

    return Response.json({ ...data, _provider: provider });
  } catch (error) {
    console.error('Server error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
