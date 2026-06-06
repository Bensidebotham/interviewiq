import { test, expect } from './fixtures'

test.describe('Dashboard', () => {
  test('shows welcome message and New Session button', async ({ authedPage: page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /new session/i }).first()).toBeVisible()
  })

  test('New Session button navigates to /session/new', async ({ authedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('main').getByRole('link', { name: /new session/i }).click()
    await expect(page).toHaveURL('/session/new')
  })
})
