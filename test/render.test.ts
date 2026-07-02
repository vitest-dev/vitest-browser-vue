import { expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { config, render } from 'vitest-browser-vue'
import HelloWorld from './fixtures/HelloWorld.vue'
import Slot from './fixtures/Slot.vue'
import Counter from './fixtures/Counter.vue'
import Async from './fixtures/Async.vue'

config.global.components = {
  InjectedGlobalComponent: {
    template: '<div>Global Component</div>',
  },
}

test('renders simple component', async () => {
  const screen = await render(HelloWorld)
  await expect.element(page.getByText('Hello World')).toBeVisible()
  expect(screen.container).toMatchSnapshot()
})

test('renders counter', async () => {
  const screen = await render(Counter, {
    props: {
      initialCount: 1,
    },
  })

  await expect.element(screen.getByText('Count is 1')).toBeVisible()
  await screen.getByRole('button', { name: 'Increment' }).click()
  await expect.element(screen.getByText('Count is 2')).toBeVisible()
})

test('renders slot', async () => {
  const screen = await render(Slot, {
    slots: {
      // TODO: using slots prints "decodeEntities option is passed but will be ignored in non-browser builds."
      default: 'Hello World',
    },
  })
  await expect.element(screen.getByText('Hello World')).toBeVisible()
})

test('renders complex slot', async () => {
  const screen = await render(Slot, {
    slots: {
      default: '<button>Hello World</button>',
    },
  })
  await expect.element(screen.getByRole('button', { name: 'Hello World' })).toBeVisible()
})

test('injected component works', async () => {
  const screen = await render({
    template: '<InjectedGlobalComponent />',
  })
  await expect.element(screen.getByText('Global Component')).toBeVisible()
})

test('renders async component', async () => {
  const screen = await render({
    components: { Async },
    // for some reason, @vue/test-utils can only render suspense
    // if it's wrapped in another element (a div in this case)
    template: `<div><Suspense><Async /></Suspense></div>`,
  })
  await expect.element(screen.getByText('Hello Async World')).toBeVisible()
})

test('trace mark', async () => {
  const screen = await render(Counter, {
    props: {
      initialCount: 1,
    },
  })

  await expect.element(screen.getByText('Count is 1')).toBeVisible()
  await screen.getByRole('button', { name: 'Increment' }).click()
  await expect.element(screen.getByText('Count is 2')).toBeVisible()

  await screen.rerender({ initialCount: -1 }) // doesn't matter
  await expect.element(screen.getByText('Count is 2')).toBeVisible()

  await screen.unmount()
  expect(screen.container.innerHTML).toBe('')
})
