import { act, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CommandRegistry } from '../core/registry'
import { CommandryProvider } from './provider'

describe('CommandryProvider', () => {
  it('calls onCommandError when a shortcut-triggered command rejects', async () => {
    const registry = new CommandRegistry()
    const error = new Error('boom')
    const onCommandError = vi.fn()

    registry.register({
      'task.fail': {
        label: 'Fail',
        shortcut: [['x']],
        handler: async () => {
          throw error
        },
      },
    })

    render(
      <CommandryProvider registry={registry} onCommandError={onCommandError}>
        <div>ready</div>
      </CommandryProvider>,
    )

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }))
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(onCommandError).toHaveBeenCalledTimes(1)
    })
    expect(onCommandError).toHaveBeenCalledWith(error, 'task.fail')
  })

  it('logs when command rejection has no error handler', async () => {
    const registry = new CommandRegistry()
    const error = new Error('no-handler')
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    registry.register({
      'task.fail': {
        label: 'Fail',
        shortcut: [['y']],
        handler: async () => {
          throw error
        },
      },
    })

    render(
      <CommandryProvider registry={registry}>
        <div>ready</div>
      </CommandryProvider>,
    )

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', bubbles: true }))
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })
    expect(consoleErrorSpy).toHaveBeenCalledWith("[commandry] Command 'task.fail' failed", error)

    consoleErrorSpy.mockRestore()
  })
})
