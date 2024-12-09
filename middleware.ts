import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { BYPASS_AUTH, DEV_MODE } from './utils/devBypass'

export function middleware(request: NextRequest) {
    // Skip auth check for public paths
    if (
        request.nextUrl.pathname.startsWith('/api/auth') ||
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname === '/login' ||
        request.nextUrl.pathname === '/favicon.ico'
    ) {
        return NextResponse.next()
    }

    // Development mode bypass
    if (DEV_MODE && BYPASS_AUTH) {
        return NextResponse.next()
    }

    // Check for authentication - check both possible cookie names
    const sessionToken = request.cookies.get('session-token')
    const isAuthenticated = request.cookies.get('authenticated')
    
    if (!sessionToken || !isAuthenticated) {
        const url = new URL('/login', request.url)
        url.searchParams.set('from', request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}