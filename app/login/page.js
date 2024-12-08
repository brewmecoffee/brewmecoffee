// app/login/page.js
'use client'
import { useState } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    twoFactorCode: ''
  })
  const [recaptchaToken, setRecaptchaToken] = useState(null)
  const [error, setError] = useState('')
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)

  const handleSubmit = async (e) => {
	  e.preventDefault()
	  setError('')

	  if (!recaptchaToken) {
		setError('Please complete the ReCAPTCHA')
		return
	  }

	  try {
		const response = await fetch('/api/auth/login', {
		  method: 'POST',
		  headers: { 'Content-Type': 'application/json' },
		  body: JSON.stringify({
			...credentials,
			recaptchaToken
		  })
		})

		const data = await response.json()
		console.log('Login response:', data)

		if (response.status === 401 && data.require2FA) {
		  setRequiresTwoFactor(true)
		  setError('')
		  return
		}

		if (!response.ok) {
		  throw new Error(data.error || 'Login failed')
		}

		if (data.success) {
		  // Force a hard redirect to ensure all state is reset
		  window.location.replace(data.redirect || '/')
		}
	  } catch (error) {
		setError(error.message)
		console.error('Login error:', error)
	  }
	}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200">
      <div className="max-w-md w-full p-8 bg-white/80 backdrop-blur-sm rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 font-cursive">Login</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Username</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              className="w-full p-3 bg-white/50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-medium">Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="w-full p-3 bg-white/50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              required
            />
          </div>

          {requiresTwoFactor && (
            <div>
              <label className="block text-gray-700 mb-2 font-medium">2FA Code</label>
              <input
                type="text"
                value={credentials.twoFactorCode}
                onChange={(e) => setCredentials({...credentials, twoFactorCode: e.target.value})}
                className="w-full p-3 bg-white/50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                pattern="[0-9]*"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength="6"
                required
              />
              <p className="mt-1 text-sm text-gray-600">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          )}

          <div className="flex justify-center mb-6">
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
              onChange={setRecaptchaToken}
              theme="light"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {requiresTwoFactor ? 'Verify 2FA' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

