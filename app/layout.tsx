import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RefMonster - AI Reference Search',
  description: 'Search for comprehensive references using AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

