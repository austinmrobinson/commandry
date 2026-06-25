import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CommandRegistry } from '../core/registry'
import { DATA_COMMANDRY_REGION } from '../dom/region-attributes'
import { CommandryProvider } from './provider'
import { CommandRegion } from './region'

describe('CommandRegion', () => {
  it('renders a wrapper div by default with data-commandry-region', () => {
    const registry = new CommandRegistry()
    const { container } = render(
      <CommandryProvider registry={registry}>
        <CommandRegion region="page" ctx={{}} active>
          <span>child</span>
        </CommandRegion>
      </CommandryProvider>,
    )
    const root = container.querySelector(`[${DATA_COMMANDRY_REGION}="page"]`)
    expect(root?.tagName).toBe('DIV')
    expect(root?.textContent).toContain('child')
  })

  it('asChild merges props onto the single child (no extra div)', () => {
    const registry = new CommandRegistry()
    const { container } = render(
      <CommandryProvider registry={registry}>
        <CommandRegion
          asChild
          region="page"
          ctx={{}}
          active
          className="layout-root"
        >
          <section data-testid="section">in</section>
        </CommandRegion>
      </CommandryProvider>,
    )
    expect(container.querySelectorAll(`div[${DATA_COMMANDRY_REGION}]`).length).toBe(0)
    const section = container.querySelector('[data-testid="section"]')
    expect(section?.getAttribute(DATA_COMMANDRY_REGION)).toBe('page')
    expect(section?.classList.contains('layout-root')).toBe(true)
  })
})
