import type { Locator, LocatorSelectors } from '@vitest/browser/context'
import { type ComponentMountingOptions, type VueWrapper, mount } from '@vue/test-utils'
import type { DefineComponent } from 'vue'
import { type PrettyDOMOptions, debug, getElementLocatorSelectors } from '@vitest/browser/utils'

type ComponentProps<T> = T extends new (...angs: any) => {
  $props: infer P
// eslint-disable-next-line ts/no-empty-object-type
} ? NonNullable<P> : T extends (props: infer P, ...args: any) => any ? P : {}

const mountedWrappers = new Set<VueWrapper>()

export interface Screen<Props> extends LocatorSelectors {
  container: HTMLElement
  baseElement: HTMLElement
  debug(el?: HTMLElement | HTMLElement[] | Locator | Locator[], maxLength?: number, options?: PrettyDOMOptions): void
  unmount(): void
  emitted<T = unknown>(): Record<string, T[]>
  emitted<T = unknown[]>(eventName: string): undefined | T[]
  rerender(props: Partial<Props>): void
}

export interface ComponentRenderOptions<C, P extends ComponentProps<C>> extends ComponentMountingOptions<C, P> {
  container?: HTMLElement
  baseElement?: HTMLElement
}

export function render<T, C = T extends ((...args: any) => any) | (new (...args: any) => any) ? T : T extends {
  props?: infer Props
} ? DefineComponent<Props extends Readonly<(infer PropNames)[]> | (infer PropNames)[] ? {
    [key in PropNames extends string ? PropNames : string]?: any;
  } : Props> : DefineComponent, P extends ComponentProps<C> = ComponentProps<C>>(
  Component: T,
  {
    container: customContainer,
    baseElement: customBaseElement,
    ...mountOptions
  }: ComponentRenderOptions<C, P> = {},
): Screen<P> {
  const div = document.createElement('div')
  const baseElement = customBaseElement || customContainer || document.body
  const container = customContainer || baseElement.appendChild(div)

  if (mountOptions.attachTo) {
    throw new Error('`attachTo` is not supported, use `container` instead')
  }

  const wrapper = mount(Component, {
    ...mountOptions,
    attachTo: container,
  })

  // this removes the additional wrapping div node from VTU:
  // https://github.com/vuejs/vue-test-utils-next/blob/master/src/mount.ts#L309
  unwrapNode((wrapper as any).parentElement)

  mountedWrappers.add(wrapper as any)

  return {
    container,
    baseElement,
    debug: (el = baseElement, maxLength, options) => debug(el, maxLength, options),
    unmount: () => wrapper.unmount(),
    emitted: ((name?: string) => wrapper.emitted(name as string)) as any,
    rerender: props => wrapper.setProps(props as any),
    ...getElementLocatorSelectors(baseElement),
  }
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
