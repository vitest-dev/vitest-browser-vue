import { page } from '@vitest/browser/context'
import { render, cleanup } from './pure'
import { beforeEach } from 'vitest'

export { render, cleanup } from './pure'
export type { ComponentRenderOptions, Screen } from './pure'

page.extend({
  render,
  cleanup,
})

beforeEach(() => {
  cleanup()
})

declare module '@vitest/browser/context' {
  interface BrowserPage {
    render: typeof render
    cleanup: typeof cleanup
  }
}
