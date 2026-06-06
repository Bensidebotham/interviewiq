import { test, expect } from './fixtures'
import {
  mockSessionDetailRoute,
  mockResponsesRoute,
  mockUploadRoute,
  mockAnalyzeRoute,
  mockResponseStatusRoute,
} from './fixtures/api'
import { MOCK_SESSION_ID } from './mocks/session'

test.describe('Interview session — happy path', () => {
  test('renders question, records, and shows feedback panel', async ({ authedPage: page }) => {
    // Set up all mocks before navigating
    await mockSessionDetailRoute(page)
    await mockResponsesRoute(page)
    await mockUploadRoute(page)
    await mockAnalyzeRoute(page)
    await mockResponseStatusRoute(page)

    await page.goto(`/session/${MOCK_SESSION_ID}`)

    // Question should render
    await expect(
      page.getByText('Tell me about a time you overcame a challenge.')
    ).toBeVisible()

    // Start recording
    await page.getByRole('button', { name: /start recording/i }).click()

    // Recording indicator should appear (Stop & Analyze button)
    await expect(
      page.getByRole('button', { name: /stop & analyze/i })
    ).toBeVisible({ timeout: 5_000 })

    // Stop recording and trigger analysis
    await page.getByRole('button', { name: /stop & analyze/i }).click()

    // Feedback panel should appear after polling completes (~3s + instant mock response)
    await expect(
      page.getByText('Excellent response demonstrating relevant experience.')
    ).toBeVisible({ timeout: 10_000 })

    // Score value should be visible (exact match to avoid matching "8/10" substrings)
    await expect(page.getByText('8', { exact: true }).first()).toBeVisible()
  })
})
