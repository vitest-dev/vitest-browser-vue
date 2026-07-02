import type { Locator, LocatorSelectors, PrettyDOMOptions } from 'vitest/browser'
import { page, server, utils } from 'vitest/browser'
import { type ComponentMountingOptions, type VueWrapper, mount } from '@vue/test-utils'
import { type Component, type DefineComponent, defineComponent, h, nextTick, reactive } from 'vue'

export { config } from '@vue/test-utils'

/** Vue component rendered around the component under test. Must expose a default slot. */
export type WrapperComponent = Component

export interface RenderConfiguration {
  /** Default wrapper component rendered around the component under test. */
  wrapper?: WrapperComponent
}

const renderConfig: RenderConfiguration = {}

/**
 * Configure vitest-browser-vue options globally.
 *
 * Available from `vitest-browser-vue/pure` (recommended in setup files).
 */
export function configureRender(customConfig: Partial<RenderConfiguration>): void {
  Object.assign(renderConfig, customConfig)
}

const { debug, getElementLocatorSelectors } = utils

type ComponentProps<T> = T extends new (...args: any) => {
  $props: infer P
// eslint-disable-next-line ts/no-empty-object-type
} ? NonNullable<P> : T extends (props: infer P, ...args: any) => any ? P : {}

const mountedWrappers = new Set<VueWrapper>()

export interface RenderResult<Props> extends LocatorSelectors {
  container: HTMLElement
  baseElement: HTMLElement
  locator: Locator
  debug(el?: HTMLElement | HTMLElement[] | Locator | Locator[], maxLength?: number, options?: PrettyDOMOptions): void
  /**
   * Unmount the component. Also records a `vue.unmount` trace mark.
   */
  unmount(): Promise<void>
  emitted<T = unknown>(): Record<string, T[]>
  emitted<T = unknown[]>(eventName: string): undefined | T[]
  /**
   * Update the component props. Also records a `vue.rerender` trace mark.
   */
  rerender(props: Partial<Props>): Promise<void>
}

export interface ComponentRenderOptions<C, P extends ComponentProps<C>> extends ComponentMountingOptions<C, P> {
  container?: HTMLElement
  baseElement?: HTMLElement
  /**
   * Pass a Vue component as the `wrapper` option to have it rendered around the inner element.
   * The wrapper must expose a default slot for the component under test.
   *
   * Per-render `wrapper` takes precedence over the value set via {@link configureRender}.
   */
  wrapper?: WrapperComponent
}

let idx = 0
function ensureTestIdAttribute(element: HTMLElement) {
  const attributeId = server.config.browser.locators.testIdAttribute
  if (!element.hasAttribute(attributeId)) {
    element.setAttribute(attributeId, `__vitest_${idx++}__`)
  }
}

function wrapComponentIfNeeded<T, C, P extends ComponentProps<C>>(
  Component: T,
  wrapperComponent: WrapperComponent | undefined,
  mountOptions: ComponentMountingOptions<C, P>,
): WrappedMountTarget<T, C, P> {
  if (!wrapperComponent) {
    return { component: Component, mountOptions }
  }

  const { props, slots, ...restMountOptions } = mountOptions
  const sutProps = reactive({ ...(props ?? {}) })

  return {
    component: defineComponent({
      name: 'VitestBrowserVueWrapper',
      setup() {
        return () => h(
          wrapperComponent,
          null,
          {
            default: () => h(Component as Component, sutProps, slots),
          },
        )
      },
    }) as T,
    mountOptions: restMountOptions,
    sutProps,
  }
}

/**
 * Render a Vue component into the document.
 * Also records a `vue.render` trace mark.
 */
export async function render<T, C = T extends ((...args: any) => any) | (new (...args: any) => any) ? T : T extends {
  props?: infer Props
} ? DefineComponent<Props extends Readonly<(infer PropNames)[]> | (infer PropNames)[] ? {
    [key in PropNames extends string ? PropNames : string]?: any;
  } : Props> : DefineComponent, P extends ComponentProps<C> = ComponentProps<C>>(
  Component: T,
  {
    container: customContainer,
    baseElement: customBaseElement,
    wrapper: wrapperOption,
    ...mountOptions
  }: ComponentRenderOptions<C, P> = {},
): Promise<RenderResult<P>> {
  const baseElement = customBaseElement || customContainer || document.body
  const container = customContainer || baseElement.appendChild(document.createElement('div'))

  // Ensuring testid attributes exists so that the generated locators will be stable
  // https://github.com/vitest-community/vitest-browser-react/issues/42
  ensureTestIdAttribute(baseElement)
  ensureTestIdAttribute(container)

  if (mountOptions.attachTo) {
    throw new Error('`attachTo` is not supported, use `container` instead')
  }

  const wrapperComponent = wrapperOption ?? renderConfig.wrapper
  const { component: componentToMount, mountOptions: finalMountOptions, sutProps } = wrapComponentIfNeeded(
    Component,
    wrapperComponent,
    mountOptions,
  )

  const mounted = mount(componentToMount, {
    ...finalMountOptions,
    attachTo: container,
  })

  // this removes the additional wrapping div node from VTU:
  // https://github.com/vuejs/vue-test-utils-next/blob/master/src/mount.ts#L309
  unwrapNode((mounted as any).parentElement)

  mountedWrappers.add(mounted as any)

  const renderResult: RenderResult<P> = {
    container,
    baseElement,
    locator: page.elementLocator(container),
    debug: (el = baseElement, maxLength, options) => debug(el, maxLength, options),
    unmount: async () => {
      mounted.unmount()
      await mark(renderResult.locator, 'vue.unmount', renderResult.unmount)
    },
    emitted: ((name?: string) => resolveEmittedWrapper(
      mounted,
      Component as Component,
      sutProps != null,
    ).emitted(name as string)) as any,
    rerender: async (props) => {
      if (sutProps) {
        Object.assign(sutProps, props)
        await nextTick()
      }
      else {
        await mounted.setProps(props as any)
      }
      await mark(renderResult.locator, 'vue.rerender', renderResult.rerender)
    },
    ...getElementLocatorSelectors(baseElement),
  }
  await mark(renderResult.locator, 'vue.render', render)
  return renderResult
}

async function mark(locator: Locator, name: string, fn: Function): Promise<void> {
  if (!locator.mark) {
    return
  }
  const error = new Error(name)
  if ('captureStackTrace' in Error) {
    (Error as any).captureStackTrace(error, fn)
  }
  await locator.mark(name, error)
}

export function cleanup(): void {
  mountedWrappers.forEach((wrapper) => {
    if (wrapper.element?.parentNode?.parentNode === document.body) {
      document.body.removeChild(wrapper.element.parentNode)
    }

    wrapper.unmount()
    mountedWrappers.delete(wrapper)
  })
}

function unwrapNode(node: Element) {
  node.replaceWith(...node.childNodes)
}

interface WrappedMountTarget<T, C, P extends ComponentProps<C>> {
  component: T
  mountOptions: Omit<ComponentMountingOptions<C, P>, 'props' | 'slots'>
  sutProps?: Record<string, unknown>
}

function resolveEmittedWrapper(mounted: VueWrapper<any>, Component: Component, fromSut: boolean): VueWrapper<any> {
  if (!fromSut) {
    return mounted
  }

  const sut = mounted.findComponent(Component as any)
  return sut.exists() ? sut : mounted
}
