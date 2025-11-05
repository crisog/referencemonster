"use client";

import { SearchResult } from "@/app/page";
import { useState, useEffect } from "react";

interface CollageDisplayProps {
  results: SearchResult[];
  searchTerms?: Array<{ term: string; description: string }>;
  loading?: boolean;
  termImages?: Map<string, string[]>;
}

export default function CollageDisplay({
  results,
  searchTerms = [],
  loading = false,
  termImages = new Map(),
}: CollageDisplayProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (imageUrl: string) => {
    setImageErrors((prev) => new Set(prev).add(imageUrl));
  };

  if (loading && searchTerms.length > 0) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Search Terms ({searchTerms.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {searchTerms.map((termObj, index) => {
            const term = termObj.term;
            const images = termImages.get(term) || [];
            const hasImages = images.length > 0;

            return (
              <div
                key={index}
                className="group cursor-default animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative overflow-hidden rounded-lg bg-gray-800 border border-gray-700 hover:border-blue-500 transition-all aspect-square">
                  {hasImages ? (
                    <>
                      <img
                        src={images[0]}
                        alt={term}
                        onError={() => handleImageError(images[0])}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                        <p className="text-white text-sm font-medium truncate">
                          {term}
                        </p>
                        {images.length > 1 && (
                          <p className="text-gray-300 text-xs mt-1">
                            +{images.length - 1} more
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full p-4">
                      <div className="text-center">
                        <div className="mb-3">
                          <div className="w-12 h-12 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-white text-sm font-medium">{term}</p>
                        <p className="text-gray-400 text-xs mt-2">
                          Searching web...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const allImages = results.flatMap((result, resultIndex) =>
    result.imageUrls.map((url, imgIndex) => ({
      url,
      key: `${resultIndex}-${imgIndex}`,
      term: result.term,
    }))
  );

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Reference Images ({allImages.length})
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {allImages.map(({ url, key, term }, index) => {
          if (imageErrors.has(url)) return null;

          return (
            <div
              key={key}
              className="group cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="relative overflow-hidden rounded-lg bg-gray-800 border border-gray-700 hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/20">
                <img
                  src={url}
                  alt={term}
                  onError={() => handleImageError(url)}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-white text-sm font-medium truncate">
                    {term}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
