import { encode } from 'next-auth/jwt'
import type { BrowserContext } from '@playwright/test'
import { MOCK_USER_ID } from '../mocks/session'

export async function setAuthCookie(context: BrowserContext): Promise<void> {
  const secret = process.env.NEXTAUTH_SECRET ?? 'ci-secret'

  const token = await encode({
    token: {
      name: 'Test User',
      email: 'test@example.com',
      picture: null,
      sub: MOCK_USER_ID,
    },
    secret,
  })

  await context.addCookies([
    {
      name: 'next-auth.session-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}
