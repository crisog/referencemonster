import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SearchRequest {
  query: string;
}

interface SearchResult {
  term: string;
  description: string;
  imageUrls: string[];
  sources?: string[];
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("\n=== SEARCH API CALLED ===");

  try {
    const body: SearchRequest = await request.json();
    const { query } = body;

    console.log("1. Query received:", query);

    if (!query || typeof query !== "string") {
      console.error("Invalid query type:", typeof query);
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not found in environment");
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    console.log("2. API key found, length:", process.env.OPENAI_API_KEY.length);

    const systemPrompt = `You are an expert reference researcher operating in GPT-5 agent mode with access to the web_search tool. When given an art reference query you must:
1. Break the query into 8-15 highly relevant visual search terms
2. For every search term, call the web_search tool to gather real image URLs (jpg, png, jpeg, or webp) from reputable sources
3. Only return URLs that point directly to image files or CDN-backed assets (no HTML pages, thumbnails, AI-generated images, or placeholders)
4. Provide 3-6 distinct image URLs per term, prioritising authoritative sources
5. Respond exclusively as JSON using the required schema`;

    const userPrompt = `Query: "${query}"

Return JSON with this structure:
{
  "results": [
    {
      "term": "descriptive search term",
      "description": "short explanation of why the images matter",
      "imageUrls": ["https://domain/path/image.jpg", ...]
    }
  ]
}

Rules:
- Use the web_search tool for every search term before you respond
- Do not fabricate links; verify each URL ends with an image extension or recognised image CDN parameters
- Supply at least six total results and prioritise authoritative sources (museums, manufacturer archives, specialist publications, reputable blogs)
- Exclude Pinterest, wallpaper scrapers, stock watermarks, and AI-generated assets`;

    console.log("3. Calling OpenAI Responses API with model: gpt-5");
    console.log("   - Tools:", JSON.stringify([{ type: "web_search" }]));

    const apiCallStart = Date.now();

    const response = await openai.responses.create({
      model: "gpt-5",
      tools: [{ type: "web_search" }],
      input: `${systemPrompt}\n\n${userPrompt}`,
    });

    const apiCallDuration = Date.now() - apiCallStart;
    console.log(`4. OpenAI API call completed in ${apiCallDuration}ms`);
    console.log("   - Response keys:", Object.keys(response));
    console.log("   - Response type:", typeof response);

    const outputText =
      response.output_text ||
      (response as any).output?.[0]?.text ||
      (response as any).text;

    console.log("5. Extracted output text:");
    console.log("   - Has output_text:", !!response.output_text);
    console.log(
      "   - Has output[0].text:",
      !!(response as any).output?.[0]?.text
    );
    console.log("   - Has text:", !!(response as any).text);
    console.log("   - Output length:", outputText?.length || 0);
    console.log("   - First 200 chars:", outputText?.substring(0, 200));

    if (!outputText) {
      console.error("❌ No output text found!");
      console.error("Full response:", JSON.stringify(response, null, 2));
      throw new Error("No output from GPT-5");
    }

    let parsed;
    try {
      console.log("6. Attempting to parse JSON response...");
      const jsonMatch = outputText.match(/\{[\s\S]*"results"[\s\S]*\}/);
      if (jsonMatch) {
        console.log("   - Found JSON via regex match");
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        console.log("   - No regex match, parsing directly");
        parsed = JSON.parse(outputText);
      }
      console.log("   - ✓ JSON parsed successfully");
      console.log("   - Has results array:", Array.isArray(parsed?.results));
      console.log("   - Results count:", parsed?.results?.length || 0);
    } catch (error) {
      console.error("❌ Parse error:", error);
      console.error("Output text:", outputText);
      throw new Error("Failed to parse GPT-5 response as JSON");
    }

    const rawResults = Array.isArray(parsed?.results) ? parsed.results : [];
    console.log("7. Processing", rawResults.length, "raw results...");

    const results: SearchResult[] = rawResults
      .map((item: any, index: number) => {
        const term = typeof item?.term === "string" ? item.term.trim() : "";
        const description =
          typeof item?.description === "string" ? item.description.trim() : "";
        const urls = Array.isArray(item?.imageUrls)
          ? item.imageUrls
              .filter(
                (url: any) => typeof url === "string" && url.startsWith("http")
              )
              .slice(0, 6)
          : [];

        console.log(`   [${index}] "${term}" - ${urls.length} images`);

        if (!term || urls.length === 0) {
          console.log(`   ⚠️  Skipping: ${!term ? "no term" : "no images"}`);
          return null;
        }

        return {
          term,
          description,
          imageUrls: urls,
          sources: urls,
        } as SearchResult;
      })
      .filter(Boolean) as SearchResult[];

    if (results.length === 0) {
      console.error("❌ No valid results after filtering!");
      throw new Error("No valid image results were returned");
    }

    const totalImages = results.reduce((acc, r) => acc + r.imageUrls.length, 0);
    const totalTime = Date.now() - startTime;

    console.log(
      `\n✓ SUCCESS: Returning ${results.length} terms with ${totalImages} total images`
    );
    console.log(`Total time: ${totalTime}ms\n`);

    return NextResponse.json({ results });
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error("\n❌ SEARCH API ERROR after", totalTime, "ms");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error:", JSON.stringify(error, null, 2));

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
