import Link from 'next/link'
import { FaFacebook, FaServer, FaUniversity, FaComments, FaStickyNote, FaKey, FaCode } from 'react-icons/fa'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-6xl font-cursive text-center mb-16 text-purple-800">
        brewmecoffee
      </h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <Link 
          href="/facebook-accounts"
          className="p-8 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-4 group hover:-translate-y-1"
        >
          <FaFacebook className="w-16 h-16 text-blue-600 group-hover:scale-110 transition-transform" />
          <span className="text-xl font-semibold text-gray-800">Facebook Accounts</span>
        </Link>

        <Link 
          href="/banks"
          className="p-8 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-4 group hover:-translate-y-1"
        >
          <FaUniversity className="w-16 h-16 text-green-600 group-hover:scale-110 transition-transform" />
          <span className="text-xl font-semibold text-gray-800">Banks</span>
        </Link>

        <Link 
          href="/servers"
          className="p-8 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-4 group hover:-translate-y-1"
        >
          <FaServer className="w-16 h-16 text-purple-600 group-hover:scale-110 transition-transform" />
          <span className="text-xl font-semibold text-gray-800">Servers</span>
        </Link>

        <Link 
          href="/messenger"
          className="p-8 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-4 group hover:-translate-y-1"
        >
          <FaComments className="w-16 h-16 text-yellow-600 group-hover:scale-110 transition-transform" />
          <span className="text-xl font-semibold text-gray-800">Messenger</span>
        </Link>

        <Link 
          href="/notes"
          className="p-8 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-4 group hover:-translate-y-1"
        >
          <FaStickyNote className="w-16 h-16 text-pink-600 group-hover:scale-110 transition-transform" />
          <span className="text-xl font-semibold text-gray-800">Notes</span>
        </Link>

        <Link 
          href="/credentials"
          className="p-8 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-4 group hover:-translate-y-1"
        >
          <FaKey className="w-16 h-16 text-amber-600 group-hover:scale-110 transition-transform" />
          <span className="text-xl font-semibold text-gray-800">Credentials</span>
        </Link>

        <Link 
          href="/snippets"
          className="p-8 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-4 group hover:-translate-y-1"
        >
          <FaCode className="w-16 h-16 text-indigo-600 group-hover:scale-110 transition-transform" />
          <span className="text-xl font-semibold text-gray-800">Code Snippets</span>
        </Link>
      </div>
    </div>
  )
}