import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateTermsRequest {
  query: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("\n=== GENERATE TERMS API CALLED ===");

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not found in environment");
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body: GenerateTermsRequest = await request.json();
    const { query } = body;

    console.log("1. Generating search terms for query:", query);

    if (!query || typeof query !== "string") {
      console.error("Invalid query type:", typeof query);
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    const systemPrompt = `You are an expert reference researcher. When given an art reference query, break it down into 8-15 highly specific, visually-focused search terms that would help find relevant reference images.`;

    const userPrompt = `Query: "${query}"

Generate specific search terms for finding visual references. Return ONLY JSON in this exact format:
{
  "terms": [
    {
      "term": "specific search term",
      "description": "why this term is relevant"
    }
  ]
}

Rules:
- Generate 8-15 specific search terms
- Focus on visual elements, objects, characters, settings, clothing, weapons, architecture, etc.
- Make terms searchable and concrete
- Each term should be 1-4 words
- Return ONLY the JSON, no other text`;

    console.log("2. Calling GPT-5 WITHOUT web_search to generate terms");

    const apiCallStart = Date.now();

    const response = await openai.responses.create({
      model: "gpt-5",
      input: `${systemPrompt}\n\n${userPrompt}`,
    });

    const apiCallDuration = Date.now() - apiCallStart;
    console.log(`3. GPT-5 call completed in ${apiCallDuration}ms`);

    const outputText = response.output_text || (response as any).output?.[0]?.text || (response as any).text;

    if (!outputText) {
      console.error("❌ No output text found!");
      throw new Error("No output from GPT-5");
    }

    let parsed;
    try {
      const jsonMatch = outputText.match(/\{[\s\S]*"terms"[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(outputText);
      }
    } catch (error) {
      console.error("❌ Parse error:", error);
      console.error("Output text:", outputText);
      throw new Error("Failed to parse GPT-5 response as JSON");
    }

    const terms = Array.isArray(parsed?.terms) ? parsed.terms : [];

    if (terms.length === 0) {
      throw new Error("No terms generated");
    }

    const totalTime = Date.now() - startTime;
    console.log(`✓ Generated ${terms.length} search terms in ${totalTime}ms\n`);

    return NextResponse.json({ terms });
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error("\n❌ GENERATE TERMS ERROR after", totalTime, "ms");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

