import { afterEach, expect, test } from 'vitest'
import { configureRender, render } from 'vitest-browser-vue'
import Emitter from './fixtures/Emitter.vue'
import InnerProvider from './fixtures/InnerProvider.vue'
import Label from './fixtures/Label.vue'
import OuterProvider from './fixtures/OuterProvider.vue'
import Provider from './fixtures/Provider.vue'
import Slot from './fixtures/Slot.vue'

afterEach(() => {
  configureRender({ wrapper: undefined })
})

test('renders component inside wrapper', async () => {
  const screen = await render(Label, {
    wrapper: Provider,
    props: {
      label: 'Hello Provider',
    },
  })

  await expect.element(screen.getByText('Hello Provider')).toBeVisible()
  expect(screen.container.querySelector('[data-provider="true"]')).not.toBeNull()
})

test('rerender updates props on the component under test when wrapper is used', async () => {
  const screen = await render(Label, {
    wrapper: Provider,
    props: {
      label: 'Initial',
    },
  })

  await expect.element(screen.getByText('Initial')).toBeVisible()

  await screen.rerender({ label: 'Updated' })

  await expect.element(screen.getByText('Updated')).toBeVisible()
  expect(screen.container.querySelector('[data-provider="true"]')).not.toBeNull()
})

test('wrapper forwards slots to the component under test', async () => {
  const screen = await render(Slot, {
    wrapper: Provider,
    slots: {
      default: 'Slotted content',
    },
  })

  await expect.element(screen.getByText('Slotted content')).toBeVisible()
  expect(screen.container.querySelector('[data-provider="true"]')).not.toBeNull()
})

test('uses wrapper configured globally', async () => {
  configureRender({ wrapper: Provider })

  const screen = await render(Label, {
    props: {
      label: 'Global wrapper',
    },
  })

  await expect.element(screen.getByText('Global wrapper')).toBeVisible()
  expect(screen.container.querySelector('[data-provider="true"]')).not.toBeNull()
})

test('per-render wrapper overrides global wrapper', async () => {
  configureRender({ wrapper: OuterProvider })

  const screen = await render(Label, {
    wrapper: InnerProvider,
    props: {
      label: 'Override wrapper',
    },
  })

  await expect.element(screen.getByText('Override wrapper')).toBeVisible()
  expect(screen.container.querySelector('[data-provider="outer"]')).toBeNull()
  expect(screen.container.querySelector('[data-provider="inner"]')).not.toBeNull()
})

test('emitted() reads from the component under test when wrapper is used', async () => {
  const screen = await render(Emitter, {
    wrapper: Provider,
  })

  await screen.getByRole('button', { name: 'Submit' }).click()

  expect(screen.emitted('submit')).toEqual([['ok']])
})

test('emitted() returns undefined when the event was not emitted', async () => {
  const screen = await render(Emitter, {
    wrapper: Provider,
  })

  expect(screen.emitted('submit')).toBeUndefined()
})

test('configureRender({ wrapper: undefined }) clears the global wrapper', async () => {
  configureRender({ wrapper: Provider })

  await render(Label, {
    props: {
      label: 'Wrapped once',
    },
  })

  configureRender({ wrapper: undefined })

  const screen = await render(Label, {
    props: {
      label: 'Unwrapped',
    },
  })

  expect(screen.container.querySelector('[data-provider="true"]')).toBeNull()
  await expect.element(screen.getByText('Unwrapped')).toBeVisible()
})

test('wrapper: undefined does not disable a globally configured wrapper', async () => {
  configureRender({ wrapper: Provider })

  const screen = await render(Label, {
    wrapper: undefined,
    props: {
      label: 'Still wrapped',
    },
  })

  expect(screen.container.querySelector('[data-provider="true"]')).not.toBeNull()
  await expect.element(screen.getByText('Still wrapped')).toBeVisible()
})

test('throws when attachTo is combined with wrapper', async () => {
  await expect(render(Label, {
    wrapper: Provider,
    attachTo: document.body,
    props: {
      label: 'Nope',
    },
  })).rejects.toThrow('`attachTo` is not supported, use `container` instead')
})

test('rerender does not remount or alter the wrapper component', async () => {
  const screen = await render(Label, {
    wrapper: Provider,
    props: {
      label: 'Before',
    },
  })

  const provider = screen.container.querySelector('[data-provider="true"]')

  await screen.rerender({ label: 'After' })

  expect(screen.container.querySelector('[data-provider="true"]')).toBe(provider)
  await expect.element(screen.getByText('After')).toBeVisible()
})

test('emitted() resolves inline option components wrapped with a provider', async () => {
  const screen = await render({
    emits: ['submit'],
    template: '<button @click="$emit(\'submit\', \'inline\')">Submit inline</button>',
  }, {
    wrapper: Provider,
  })

  await screen.getByRole('button', { name: 'Submit inline' }).click()

  expect(screen.emitted('submit')).toEqual([['inline']])
})
