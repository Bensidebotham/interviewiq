import { test as base, expect } from '@playwright/test'
import { setAuthCookie } from './auth'
import { MEDIA_STUB_SCRIPT } from './media'
import type { Page } from '@playwright/test'

type Fixtures = {
  authedPage: Page
}

export const test = base.extend<Fixtures>({
  authedPage: async ({ context, page }, use) => {
    await setAuthCookie(context)
    await page.addInitScript(MEDIA_STUB_SCRIPT)
    await use(page)
    // Playwright manages context lifecycle — no need to close manually
  },
})

export { expect }
