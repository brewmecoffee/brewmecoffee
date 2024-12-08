import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata = {
  title: 'BrewMeCoffee',
  description: 'Personal Account Manager',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
