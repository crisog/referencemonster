'use client'

import { useState } from 'react'
import SearchInterface from '@/components/SearchInterface'
import CollageDisplay from '@/components/CollageDisplay'

export interface SearchResult {
  term: string
  description: string
  imageUrls: string[]
  sources?: string[]
}

export default function Home() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [searchTerms, setSearchTerms] = useState<Array<{term: string, description: string}>>([])
  const [termImages, setTermImages] = useState<Map<string, string[]>>(new Map())
  const [loading, setLoading] = useState(false)

  const handleImageFound = (term: string, imageUrls: string[]) => {
    setTermImages((prev) => new Map(prev).set(term, imageUrls))
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          RefMonster
        </h1>
        <p className="text-center text-gray-400 mb-8">
          AI-powered comprehensive reference search
        </p>

        <SearchInterface
          onSearchComplete={setResults}
          onSearchTermsGenerated={setSearchTerms}
          onImageFound={handleImageFound}
          loading={loading}
          setLoading={setLoading}
        />

        {searchTerms.length > 0 && results.length === 0 && (
          <CollageDisplay results={[]} searchTerms={searchTerms} loading={true} termImages={termImages} />
        )}

        {results.length > 0 && (
          <CollageDisplay results={results} searchTerms={[]} loading={false} />
        )}
      </div>
    </main>
  )
}
