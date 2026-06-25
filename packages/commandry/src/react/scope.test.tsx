import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CommandRegistry } from '../core/registry'
import { CommandryProvider } from './provider'
import { CommandScope } from './scope'

describe('CommandScope', () => {
  it('renders a wrapper div by default with data-commandry-scope', () => {
    const registry = new CommandRegistry()
    const { container } = render(
      <CommandryProvider registry={registry}>
        <CommandScope scope="page" ctx={{}} activateOn="mount">
          <span>child</span>
        </CommandScope>
      </CommandryProvider>,
    )
    const root = container.querySelector('[data-commandry-scope="page"]')
    expect(root?.tagName).toBe('DIV')
    expect(root?.textContent).toContain('child')
  })

  it('asChild merges props onto the single child (no extra div)', () => {
    const registry = new CommandRegistry()
    const { container } = render(
      <CommandryProvider registry={registry}>
        <CommandScope
          asChild
          scope="page"
          ctx={{}}
          activateOn="mount"
          className="layout-root"
        >
          <section data-testid="section">in</section>
        </CommandScope>
      </CommandryProvider>,
    )
    expect(container.querySelectorAll('div[data-commandry-scope]').length).toBe(0)
    const section = container.querySelector('[data-testid="section"]')
    expect(section?.getAttribute('data-commandry-scope')).toBe('page')
    expect(section?.classList.contains('layout-root')).toBe(true)
  })
})
