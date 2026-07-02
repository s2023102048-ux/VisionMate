export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { mimeType, base64, categoryHint } = await req.json();

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "No API Key configured on server" }, { status: 500 });
    }

    const SYSTEM_PROMPT = `You are an expert ADA-compliance and accessibility inspector for the crowdsourced mapping app, VisionMate.

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

    const requestBody = {
      contents: [{ parts: [{ text: SYSTEM_PROMPT }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 512, responseMimeType: 'application/json' }
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Gemini Error:', errorText);
      return NextResponse.json({ error: `Gemini API error: ${res.status}`, details: errorText }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error processing Gemini request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
