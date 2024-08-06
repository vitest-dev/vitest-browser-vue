import { page } from '@vitest/browser/context'
import { render, cleanup } from './pure'
import { beforeEach } from 'vitest'

export { render, cleanup } from './pure'

page.extend({
  render,
})

beforeEach(() => {
  cleanup()
})

declare module '@vitest/browser/context' {
  interface BrowserPage {
    render: typeof render
  }
}
