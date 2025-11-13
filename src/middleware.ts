import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const ADMIN_COOKIE = 'axone_admin_auth'
const ADMIN_PASSWORD = '231294'

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl

	// Ne pas protéger la page de login ni les assets
	const isAdminPath = pathname.startsWith('/admin')
	const isLoginPath = pathname === '/admin/login'

	if (!isAdminPath || isLoginPath) {
		return NextResponse.next()
	}

	const cookie = req.cookies.get(ADMIN_COOKIE)?.value
	if (cookie === ADMIN_PASSWORD) {
		return NextResponse.next()
	}

	const url = req.nextUrl.clone()
	url.pathname = '/admin/login'
	url.searchParams.set('next', pathname)
	return NextResponse.redirect(url)
}

export const config = {
	matcher: ['/admin/:path*'],
}


