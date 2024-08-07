import { expect, test } from 'vitest'
import { page } from '@vitest/browser/context'
import { render } from '../src/index'
import HelloWorld from './fixtures/HelloWorld.vue'

test('renders component', async () => {
  const screen = render(HelloWorld)
  await expect.element(page.getByText('Hello World')).toBeVisible()
  expect(screen.container).toMatchSnapshot()
})
