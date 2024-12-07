import Link from 'next/link'
import { FaCoffee, FaHome } from 'react-icons/fa'
import './not-found.css'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 px-4">
      <div className="text-center space-y-8">
        {/* Coffee cup animation */}
        <div className="relative w-32 h-32 mx-auto mb-8 animate-bounce">
          <div className="absolute inset-0 flex items-center justify-center">
            <FaCoffee className="w-24 h-24 text-purple-600 transform -rotate-12" />
          </div>
          {/* Steam animation */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 space-y-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full steam-1 opacity-0"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full steam-2 opacity-0"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full steam-3 opacity-0"></div>
          </div>
        </div>

        <h1 className="text-6xl font-bold text-purple-800">
          404
        </h1>
        
        <h2 className="text-3xl font-cursive text-purple-700">
          Oops! Page Not Found
        </h2>
        
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Looks like this page took a coffee break! Do not worry, you can head back home and explore other parts of BrewMeCoffee.
        </p>

        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          <FaHome className="text-xl" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  )
}