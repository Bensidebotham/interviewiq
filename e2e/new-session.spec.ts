import { test, expect } from './fixtures'
import { mockSessionsRoute } from './fixtures/api'
import { MOCK_SESSION_ID } from './mocks/session'

test.describe('New session wizard', () => {
  test('completes wizard and redirects to session page', async ({ authedPage: page }) => {
    await mockSessionsRoute(page)

    await page.goto('/session/new')
    await expect(page.getByRole('heading', { name: /new practice session/i })).toBeVisible()

    // Step 1: select session type
    await page.getByRole('button', { name: /behavioral/i }).click()
    await page.getByRole('button', { name: /^next$/i }).click()

    // Step 2: fill optional context
    await expect(page.getByText(/step 2 of 2/i)).toBeVisible()
    await page.getByLabel(/company/i).fill('Acme Corp')

    // Submit
    await page.getByRole('button', { name: /start session/i }).click()

    // Should redirect to the session page
    await expect(page).toHaveURL(`/session/${MOCK_SESSION_ID}`)
  })
})
