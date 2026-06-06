import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('renders hero heading', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /stop guessing/i })).toBeVisible()
  })

  test('has a Sign in link in the nav', async ({ page }) => {
    await page.goto('/')
    const signInLink = page.getByRole('link', { name: /sign in/i }).first()
    await expect(signInLink).toBeVisible()
    await expect(signInLink).toHaveAttribute('href', '/auth/signin')
  })

  test('CTA button links to sign-in', async ({ page }) => {
    await page.goto('/')
    const cta = page.getByRole('link', { name: /start practicing free/i }).first()
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('href', '/auth/signin')
  })
})
