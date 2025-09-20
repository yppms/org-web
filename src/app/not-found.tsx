"use client"

import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-base-200">
      <div className="max-w-[425px] mx-auto p-6 text-center">
        <h1 className="text-6xl font-extrabold text-primary">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">We couldn’t find the page you were looking for.</p>
        <p className="mt-2 text-xs text-muted-foreground">If you entered a URL, please check it and try again.</p>
      </div>
    </main>
  )
}
