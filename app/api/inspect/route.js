// ============================================================
// app/api/inspect/route.js — SECURE Gemini API Route
// This runs SERVER-SIDE only. The GEMINI_API_KEY is never
// exposed to the browser. Frontend calls /api/inspect instead.
// ============================================================

// Required for Cloudflare Pages deployment
export const runtime = 'edge';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL   = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are an expert accessibility inspector for public infrastructure. 
Your task is to evaluate photos of public pathways, sidewalks, ramps, and entrances for wheelchair users and mobility-impaired individuals.

Analyze the provided image and respond in this EXACT format (no extra text):
STATUS: ACCESSIBLE
REASON: [One clear sentence explaining why the path is accessible or safe for wheelchair users.]

OR:

STATUS: HAZARD
REASON: [One clear sentence explaining the specific barrier, obstacle, or hazard present.]

Be concise and factual. Focus on: ramps, curb cuts, sidewalk condition, obstacles, door widths, steps, uneven surfaces, and pathway clearance.`;

export async function POST(request) {
  try {
    const { base64, mimeType } = await request.json();

    if (!base64 || !mimeType) {
      return Response.json(
        { error: 'Missing base64 or mimeType in request body' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: 'GEMINI_API_KEY not configured on server' },
        { status: 500 }
      );
    }

    const requestBody = {
      contents: [
        {
          parts: [
            { text: SYSTEM_PROMPT },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 256,
      },
    };

    const geminiResponse = await fetch(GEMINI_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(requestBody),
    });

    if (!geminiResponse.ok) {
      const err = await geminiResponse.json().catch(() => ({}));
      return Response.json(
        { error: err?.error?.message || `Gemini API error: ${geminiResponse.status}` },
        { status: geminiResponse.status }
      );
    }

    const data    = await geminiResponse.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Log the raw response for debugging
    console.log('Gemini raw response:', rawText);

    const statusMatch = rawText.match(/STATUS:\s*(ACCESSIBLE|HAZARD)/i);
    const reasonMatch = rawText.match(/REASON:\s*(.+)/i);

    // If Gemini didn't respond in the expected format, return an error
    // instead of silently defaulting to HAZARD
    if (!statusMatch) {
      return Response.json(
        { error: 'Gemini did not return a valid status. Raw: ' + rawText.slice(0, 200) },
        { status: 502 }
      );
    }

    const status      = statusMatch[1].toUpperCase();
    const description = reasonMatch
      ? reasonMatch[1].trim()
      : 'Unable to determine accessibility from the provided image.';

    return Response.json({ status, description });

  } catch (err) {
    console.error('Inspect route error:', err);
    return Response.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
