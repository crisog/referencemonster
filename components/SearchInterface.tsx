"use client";

import { useState, FormEvent } from "react";
import { SearchResult } from "@/app/page";
import LoadingChecklist from "./LoadingChecklist";

interface SearchInterfaceProps {
  onSearchComplete: (results: SearchResult[]) => void;
  onSearchTermsGenerated: (
    terms: Array<{ term: string; description: string }>
  ) => void;
  onImageFound: (term: string, imageUrls: string[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  status: "pending" | "active" | "completed";
}

export default function SearchInterface({
  onSearchComplete,
  onSearchTermsGenerated,
  onImageFound,
  loading,
  setLoading,
}: SearchInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: "1", label: "Analyzing query with GPT-5", status: "pending" },
    { id: "2", label: "Generating reference search terms", status: "pending" },
    {
      id: "3",
      label: "Searching web for images (per term)",
      status: "pending",
    },
    { id: "4", label: "Building reference collage", status: "pending" },
  ]);

  const updateChecklist = (
    id: string,
    status: "pending" | "active" | "completed",
    label?: string
  ) => {
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status, ...(label && { label }) } : item
      )
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    onSearchTermsGenerated([]);
    onSearchComplete([]);
    setChecklistItems((prev) =>
      prev.map((item) => ({ ...item, status: "pending" as const }))
    );

    try {
      console.log("Starting search for:", searchTerm);
      updateChecklist("1", "active");

      console.log("Step 1: Generating search terms...");
      const termsResponse = await fetch("/api/generate-terms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchTerm }),
      });

      if (!termsResponse.ok) {
        const errorData = await termsResponse.json();
        console.error("Terms generation error:", errorData);
        throw new Error(errorData.error || "Failed to generate search terms");
      }

      const termsData = await termsResponse.json();
      const terms = termsData.terms || [];
      console.log(`Generated ${terms.length} search terms:`, terms);

      updateChecklist("1", "completed");
      updateChecklist(
        "2",
        "completed",
        `Generated ${terms.length} search terms`
      );

      onSearchTermsGenerated(terms);

      await new Promise((resolve) => setTimeout(resolve, 500));

      updateChecklist("3", "active");

      console.log("Step 2: Searching for images for all terms in parallel...");

      const imageSearchPromises = terms.map(
        async (termObj: { term: string; description: string }, i: number) => {
          const term = termObj.term;
          console.log(
            `[${i + 1}/${terms.length}] Starting search for: ${term}`
          );

          try {
            const imageResponse = await fetch("/api/search-images", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ term }),
            });

            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              const imageUrls = imageData.imageUrls || [];

              console.log(`  Found ${imageUrls.length} images for "${term}"`);

              if (imageUrls.length > 0) {
                const result = {
                  term,
                  description: termObj.description || "",
                  imageUrls,
                  sources: imageUrls,
                };

                onImageFound(term, imageUrls);
                return result;
              }
            } else {
              console.error(`Failed to fetch images for "${term}"`);
            }
          } catch (error) {
            console.error(`Error searching images for "${term}":`, error);
          }

          return null;
        }
      );

      const searchResults = await Promise.all(imageSearchPromises);
      const results: SearchResult[] = searchResults.filter(
        (result): result is SearchResult => result !== null
      );

      updateChecklist(
        "3",
        "completed",
        `Found images for ${results.length} terms`
      );
      updateChecklist("4", "active");

      await new Promise((resolve) => setTimeout(resolve, 300));

      updateChecklist("4", "completed");

      setTimeout(() => {
        onSearchComplete(results);
        setLoading(false);
      }, 500);
    } catch (error: any) {
      console.error("Search error:", error);
      setChecklistItems((prev) =>
        prev.map((item) => ({ ...item, status: "pending" as const }))
      );
      setLoading(false);
      alert(
        error.message || "Search failed. Please check your OPENAI_API_KEY."
      );
    }
  };

  const suggestions = [
    "mistborn era 2",
    "cyberpunk street samurai",
    "steampunk airship",
    "medieval castle interior",
    "fantasy tavern",
    "sci-fi spaceship cockpit",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    const fakeEvent = { preventDefault: () => {} } as FormEvent;
    handleSubmit(fakeEvent);
  };

  return (
    <div className="mb-12">
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4 max-w-2xl mx-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="mistborn era 2"
            className="flex-1 px-6 py-4 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none text-white placeholder-gray-400 text-lg"
          />
          <button
            type="submit"
            disabled={!searchTerm.trim() || loading}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {!loading && (
        <div className="max-w-2xl mx-auto mb-6">
          <p className="text-gray-400 text-sm mb-3 text-center">
            Quick suggestions:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg text-sm text-gray-300 hover:text-white transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="animate-fade-in">
          <LoadingChecklist items={checklistItems} />
        </div>
      )}
    </div>
  );
}
