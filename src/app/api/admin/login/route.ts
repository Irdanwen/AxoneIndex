import { NextResponse } from 'next/server'

const ADMIN_COOKIE = 'axone_admin_auth'
const ADMIN_PASSWORD = '231294'

export async function POST(req: Request) {
	try {
		const { password } = (await req.json()) as { password?: string }
		if (password !== ADMIN_PASSWORD) {
			return NextResponse.json({ error: 'Mot de passe invalide' }, { status: 401 })
		}

		const res = NextResponse.json({ ok: true })

		res.cookies.set({
			name: ADMIN_COOKIE,
			value: ADMIN_PASSWORD,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24 * 7, // 7 jours
		})

		return res
	} catch {
		return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
	}
}


