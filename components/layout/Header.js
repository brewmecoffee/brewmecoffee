'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()
  
  // Don't show header on homepage
  if (pathname === '/') return null

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <Link href="/" className="text-3xl font-cursive text-purple-800 hover:text-purple-600 transition-colors">
          brewmecoffee
        </Link>
      </div>
    </header>
  )
}