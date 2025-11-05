# RefMonster

AI-powered comprehensive reference search using GPT-5 with web search capabilities to find real images dynamically.

## Features

- Search for comprehensive references using natural language queries
- GPT-5 agent mode breaks down queries into relevant search terms
- Web search integration to find actual image URLs (jpg, png, webp)
- Beautiful animated loading checklist showing search progress
- Image-only collage display with masonry layout
- No dependency on Unsplash - all images come from web search

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up your API key:
```bash
cp .env.example .env
# Edit .env and add OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)

## Usage

Type a search query like "mistborn era 2 guns" and the AI will:
1. Analyze the query with GPT-5 in agent mode
2. Generate comprehensive reference search terms
3. Search the web for actual image URLs for each term
4. Display all images in a beautiful collage format

The loading checklist shows:
- ✅ Analyzing query with GPT-5
- ✅ Generating reference search terms
- ✅ Searching web for images
- ✅ Collecting image URLs
- ✅ Building reference collage

## Technology Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- OpenAI GPT-5 API (with function calling)
- Web search for dynamic image discovery

