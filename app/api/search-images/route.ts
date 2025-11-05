import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SearchImageRequest {
  term: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("\n=== SEARCH IMAGES API CALLED ===");

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not found in environment");
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body: SearchImageRequest = await request.json();
    const { term } = body;

    console.log("1. Searching images for term:", term);

    if (!term || typeof term !== "string") {
      console.error("Invalid term type:", typeof term);
      return NextResponse.json({ error: "Invalid term" }, { status: 400 });
    }

    const systemPrompt = `You are an expert image researcher with access to web_search. Your task is to find high-quality, relevant images for a given search term.`;

    const userPrompt = `Search term: "${term}"

Use the web_search tool to find 1 high-quality image for this term. Return ONLY JSON in this exact format:
{
  "imageUrls": ["https://domain/path/image.jpg"]
}

Rules:
- Use web_search to find actual images
- Only include direct image URLs (ending in .jpg, .png, .jpeg, .webp or from known image CDNs)
- Find just 1 high-quality image
- Prioritize authoritative sources (museums, manufacturer sites, specialist publications)
- Exclude Pinterest, AI-generated images, watermarked stock photos
- Return ONLY the JSON, no other text`;

    console.log("2. Calling GPT-5 WITH web_search for images");

    const apiCallStart = Date.now();

    const response = await openai.responses.create({
      model: "gpt-5",
      tools: [{ type: "web_search" }],
      input: `${systemPrompt}\n\n${userPrompt}`,
    });

    const apiCallDuration = Date.now() - apiCallStart;
    console.log(`3. GPT-5 web search completed in ${apiCallDuration}ms`);

    const outputText =
      response.output_text ||
      (response as any).output?.[0]?.text ||
      (response as any).text;

    if (!outputText) {
      console.error("❌ No output text found!");
      throw new Error("No output from GPT-5");
    }

    let parsed;
    try {
      const jsonMatch = outputText.match(/\{[\s\S]*"imageUrls"[\s\S]*\}/);
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

    const imageUrls = Array.isArray(parsed?.imageUrls)
      ? parsed.imageUrls.filter(
          (url: any) => typeof url === "string" && url.startsWith("http")
        )
      : [];

    const totalTime = Date.now() - startTime;
    console.log(
      `✓ Found ${imageUrls.length} images for "${term}" in ${totalTime}ms\n`
    );

    return NextResponse.json({ imageUrls });
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error("\n❌ SEARCH IMAGES ERROR after", totalTime, "ms");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
