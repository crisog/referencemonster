'use client'

import { useEffect, useState } from 'react'

interface ChecklistItem {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed'
}

interface LoadingChecklistProps {
  items: ChecklistItem[]
}

export default function LoadingChecklist({ items }: LoadingChecklistProps) {
  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 transition-all duration-300"
          >
            <div className="flex-shrink-0">
              {item.status === 'completed' && (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center animate-scale-in">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
              {item.status === 'active' && (
                <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              )}
              {item.status === 'pending' && (
                <div className="w-6 h-6 rounded-full border-2 border-gray-600" />
              )}
            </div>
            <span
              className={`text-sm transition-all duration-300 ${
                item.status === 'completed'
                  ? 'text-green-400 line-through'
                  : item.status === 'active'
                  ? 'text-blue-400 font-medium'
                  : 'text-gray-400'
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

