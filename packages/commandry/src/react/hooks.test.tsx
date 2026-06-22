import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { CommandryProvider } from './provider'
import { CommandRegion } from './region'
import { CommandRegistry } from '../core/registry'
import {
  useCommand,
  useCommands,
  useRegisterCommands,
  useShortcutDisplay,
  useActiveContext,
} from './hooks'
import type { CommandDefinitionMap } from '../core/types'

function createTestRegistry() {
  return new CommandRegistry()
}

function Wrapper({ registry, children }: { registry: CommandRegistry; children: React.ReactNode }) {
  return (
    <CommandryProvider registry={registry}>
      {children}
    </CommandryProvider>
  )
}

describe('useCommand', () => {
  it('returns a resolved command', () => {
    const registry = createTestRegistry()
    registry.register({ 'test': { label: 'Test', handler: vi.fn() } })

    function TestComp() {
      const cmd = useCommand('test')
      return <div>{cmd?.label}</div>
    }

    render(<Wrapper registry={registry}><TestComp /></Wrapper>)
    expect(screen.getByText('Test')).toBeDefined()
  })

  it('returns null for unknown id', () => {
    const registry = createTestRegistry()

    function TestComp() {
      const cmd = useCommand('nope')
      return <div>{cmd ? 'found' : 'not found'}</div>
    }

    render(<Wrapper registry={registry}><TestComp /></Wrapper>)
    expect(screen.getByText('not found')).toBeDefined()
  })

  it('re-renders when registry changes', () => {
    const registry = createTestRegistry()

    function TestComp() {
      const cmd = useCommand('test')
      return <div>{cmd?.label ?? 'none'}</div>
    }

    render(<Wrapper registry={registry}><TestComp /></Wrapper>)
    expect(screen.getByText('none')).toBeDefined()

    act(() => {
      registry.register({ 'test': { label: 'Now Visible', handler: vi.fn() } })
    })

    expect(screen.getByText('Now Visible')).toBeDefined()
  })
})

describe('useCommands', () => {
  it('returns filtered commands', () => {
    const registry = createTestRegistry()
    registry.register({
      'a': { label: 'A', group: 'Alpha', handler: vi.fn() },
      'b': { label: 'B', group: 'Beta', handler: vi.fn() },
    })

    function TestComp() {
      const cmds = useCommands({ group: 'Alpha' })
      return <div>{cmds.map(c => c.label).join(',')}</div>
    }

    render(<Wrapper registry={registry}><TestComp /></Wrapper>)
    expect(screen.getByText('A')).toBeDefined()
  })
})

describe('useRegisterCommands', () => {
  it('registers on mount and unregisters on unmount', () => {
    const registry = createTestRegistry()
    const commands: CommandDefinitionMap = {
      'mounted': { label: 'Mounted', handler: vi.fn() },
    }

    function Inner() {
      useRegisterCommands(commands)
      return <div>inner</div>
    }

    const { unmount } = render(<Wrapper registry={registry}><Inner /></Wrapper>)
    expect(registry.getCommand('mounted')).not.toBeNull()

    unmount()
    expect(registry.getCommand('mounted')).toBeNull()
  })

  it('inherits region from nearest CommandRegion', () => {
    const registry = createTestRegistry()
    const commands: CommandDefinitionMap = {
      'scoped': { label: 'Scoped', handler: vi.fn() },
    }

    function Inner() {
      useRegisterCommands(commands)
      const cmd = useCommand('scoped')
      return <div data-testid="label">{cmd?.label}</div>
    }

    render(
      <Wrapper registry={registry}>
        <CommandRegion region="test-region" ctx={{ x: 1 }}>
          <Inner />
        </CommandRegion>
      </Wrapper>,
    )

    expect(screen.getByTestId('label').textContent).toBe('Scoped')
    expect(registry.getCommand('scoped')?.scope).toBe('test-region')
  })
})

describe('useShortcutDisplay', () => {
  it('formats shortcuts', () => {
    const registry = createTestRegistry()

    function TestComp() {
      const display = useShortcutDisplay([['mod', 's']])
      return <div data-testid="shortcut">{display}</div>
    }

    render(<Wrapper registry={registry}><TestComp /></Wrapper>)
    const text = screen.getByTestId('shortcut').textContent!
    expect(text.length).toBeGreaterThan(0)
  })

  it('returns empty for undefined', () => {
    const registry = createTestRegistry()

    function TestComp() {
      const display = useShortcutDisplay(undefined)
      return <div data-testid="shortcut">{display || 'empty'}</div>
    }

    render(<Wrapper registry={registry}><TestComp /></Wrapper>)
    expect(screen.getByTestId('shortcut').textContent).toBe('empty')
  })
})

describe('useActiveContext', () => {
  it('reflects effective context from registry', () => {
    const registry = createTestRegistry()

    function TestComp() {
      const ctx = useActiveContext()
      return <div data-testid="regions">{ctx.regions.join(',') || 'none'}</div>
    }

    render(<Wrapper registry={registry}><TestComp /></Wrapper>)
    expect(screen.getByTestId('regions').textContent).toBe('none')

    act(() => {
      registry.setLiveContext({
        regions: ['page'],
        anchors: {},
        ctx: {},
        element: null,
      })
    })

    expect(screen.getByTestId('regions').textContent).toBe('page')
  })
})
