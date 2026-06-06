import type { Page } from '@playwright/test'
import {
  MOCK_SESSION_ID,
  MOCK_RESPONSE_ID,
  mockSession,
  mockFeedback,
  mockSessionsList,
} from '../mocks/session'

export async function mockSessionsRoute(page: Page): Promise<void> {
  await page.route('/api/sessions', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({ json: { session: { id: MOCK_SESSION_ID } } })
    } else {
      route.fulfill({ json: mockSessionsList })
    }
  })
}

export async function mockSessionDetailRoute(page: Page): Promise<void> {
  await page.route(/\/api\/sessions\/[^/]+$/, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ json: { session: mockSession } })
    } else {
      route.continue()
    }
  })
}

export async function mockResponsesRoute(page: Page): Promise<void> {
  await page.route('/api/responses', (route) => {
    route.fulfill({ json: { response: { id: MOCK_RESPONSE_ID } } })
  })
}

export async function mockUploadRoute(page: Page): Promise<void> {
  await page.route('/api/upload', (route) => {
    route.fulfill({ json: { url: 'https://example.com/fake-audio.webm' } })
  })
}

export async function mockAnalyzeRoute(page: Page): Promise<void> {
  await page.route('/api/analyze', (route) => {
    route.fulfill({
      status: 202,
      json: { runId: 'fake-run-id', responseId: MOCK_RESPONSE_ID },
    })
  })
}

export async function mockResponseStatusRoute(page: Page): Promise<void> {
  await page.route(/\/api\/responses\/[^/]+\/status$/, (route) => {
    route.fulfill({
      json: {
        status: 'done',
        feedback: mockFeedback,
        transcript: 'This is a test transcript of the interview response.',
      },
    })
  })
}
