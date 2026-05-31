'use client'

import { ReactNode } from 'react'

export default function AuthCard({
  title,
  children,
  footer,
}: {
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
        
        <h1 className="text-2xl font-semibold text-center mb-6">
          {title}
        </h1>

        {children}

        {footer && (
          <div className="mt-6 text-sm text-zinc-400 text-center">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}