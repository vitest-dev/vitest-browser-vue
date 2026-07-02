# vitest-browser-vue

[Docs](https://vitest.dev/api/browser/vue.html) | [Package](https://npmx.dev/package/vitest-browser-vue)

Render Vue components in Vitest Browser Mode. This library follows [`testing-library` principles](https://testing-library.com/docs/guiding-principles/) and exposes only [locators](https://vitest.dev/guide/browser/locators) and utilities that encourage you to write tests that closely resemble how your Vue components are used.

Requires `vitest` 4.0.0 or higher.

```ts
import { render } from 'vitest-browser-vue'
import { expect, test } from 'vitest'

test('counter button increments the count', async () => {
  const screen = await render(Component, {
    props: {
      initialCount: 1,
    }
  })

  await screen.getByRole('button', { name: 'Increment' }).click()

  await expect.element(screen.getByText('Count is 2')).toBeVisible()
})
```

`vitest-browser-vue` also automatically injects `render` and `cleanup` methods on the `page`. Example:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // if the types are not picked up, add `vitest-browser-vue` to
    // "compilerOptions.types" in your tsconfig or
    // import `vitest-browser-vue` manually so TypeScript can pick it up
    setupFiles: ['vitest-browser-vue'],
    browser: {
      // ... your config
    },
  },
})
```

```ts
import { page } from 'vitest/browser'

test('counter button increments the count', async () => {
  const screen = await page.render(Component, {
    props: {
      initialCount: 1,
    }
  })

  screen.cleanup()
})
```

Unlike `@testing-library/vue`, `vitest-browser-vue` cleans up the component before the test starts instead of after, so you can see the rendered result in your UI. To avoid auto-cleanup, import the `render` function from `vitest-browser-vue/pure`.

## Configuration

You can change the global configuration by modifying the `config` export. You can import it from both `vitest-browser-vue` and `vitest-browser-vue/pure`. See [documentation](https://test-utils.vuejs.org/api/#config).

```js
import { config } from 'vitest-browser-vue'

config.global.mocks = {
  $t: text => text
}
```

## Special thanks

- Powered by [`@vue/test-utils`](https://github.com/vuejs/test-utils/)
- Inspired by [`@testing-library/vue`](https://github.com/testing-library/vue-testing-library)
