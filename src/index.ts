import { page } from 'vitest/browser'
import { beforeEach } from 'vitest'
import { cleanup, render } from './pure'

export { render, cleanup, config, configureRender } from './pure'
export type { ComponentRenderOptions, RenderConfiguration, RenderResult, WrapperComponent } from './pure'

page.extend({
  render,
  [Symbol.for('vitest:component-cleanup')]: cleanup,
})

beforeEach(() => {
  cleanup()
})

declare module 'vitest/browser' {
  interface BrowserPage {
    render: typeof render
  }
}
