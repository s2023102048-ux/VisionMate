// ============================================================
// app/api/inspect/route.js — SECURE Gemini API Route
// This runs SERVER-SIDE only. The GEMINI_API_KEY is never
// exposed to the browser. Frontend calls /api/inspect instead.
// ============================================================

// Required for Cloudflare Pages deployment
export const runtime = 'edge';

const GEMINI_MODEL = 'gemini-2.0-flash';

export async function POST(request) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return Response.json(
        { error: 'GEMINI_API_KEY not configured on server' },
        { status: 500 }
      );
    }

    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const { base64, mimeType, category } = await request.json();

    if (!base64 || !mimeType) {
      return Response.json(
        { error: 'Missing base64 or mimeType in request body' },
        { status: 400 }
      );
    }

    const categoryContext = category
      ? `\n\nThe reporter has indicated this issue category: "${category}". Use this as additional context when analyzing the image.`
      : '';

    const SYSTEM_PROMPT = `You are an expert ADA-compliance and accessibility inspector for the crowdsourced mapping app, VisionMate.

Your task is to analyze the provided image of a building entrance, pathway, or facility and generate an "Accessibility Score" for wheelchair users and mobility-impaired individuals.${categoryContext}

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
        maxOutputTokens: 512,
        responseMimeType: 'application/json',
      },
    };

    // gemini-2.5-flash = primary (works with this key)
    // gemini-2.0-flash = fallback
    const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let geminiResponse;
    let lastStatus = 0;

    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      for (let attempt = 1; attempt <= 2; attempt++) {
        geminiResponse = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(requestBody),
        });
        lastStatus = geminiResponse.status;
        if (geminiResponse.status !== 429) break;
        // Rate limited — wait 3s before retry
        await new Promise(r => setTimeout(r, 3000));
      }
      if (geminiResponse.status !== 429) break;
    }

    if (!geminiResponse.ok) {
      const err = await geminiResponse.json().catch(() => ({}));
      return Response.json(
        { error: err?.error?.message || `Gemini API error: ${lastStatus}` },
        { status: lastStatus }
      );
    }

    const data    = await geminiResponse.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('Gemini raw response:', rawText);

    // Parse the JSON response from Gemini
    let parsed;
    try {
      // Strip possible markdown code fences just in case
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr, 'Raw:', rawText);
      return Response.json(
        { error: 'Gemini did not return valid JSON. Raw: ' + rawText.slice(0, 300) },
        { status: 502 }
      );
    }

    const { rating, positive_features = [], warnings = [] } = parsed;

    if (typeof rating !== 'number') {
      return Response.json(
        { error: 'Invalid rating from Gemini: ' + JSON.stringify(parsed) },
        { status: 502 }
      );
    }

    // Derive severity and status from rating
    let severity;
    if      (rating >= 4.0) severity = 'Safe';
    else if (rating >= 3.0) severity = 'Minor';
    else if (rating >= 2.0) severity = 'Moderate';
    else                    severity = 'Dangerous';

    const status = rating >= 3.0 ? 'ACCESSIBLE' : 'HAZARD';

    // Build a human-readable description for the map popup
    const descParts = [];
    if (positive_features.length) descParts.push(positive_features.slice(0, 2).join(', '));
    if (warnings.length)          descParts.push('⚠️ ' + warnings.slice(0, 2).join('; '));
    const description = descParts.join(' — ') || 'Accessibility report submitted.';

    return Response.json({ status, severity, description, rating, positive_features, warnings });

  } catch (err) {
    console.error('Inspect route error:', err);
    return Response.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
