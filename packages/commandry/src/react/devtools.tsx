import { useSyncExternalStore, type CSSProperties } from 'react'
import { useCommandry } from './hooks'

const panelStyle: CSSProperties = {
  position: 'fixed',
  bottom: 12,
  left: 12,
  zIndex: 99999,
  maxWidth: 360,
  maxHeight: '40vh',
  overflow: 'auto',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(148, 163, 184, 0.35)',
  background: 'rgba(15, 23, 42, 0.92)',
  color: '#e2e8f0',
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: 11,
  lineHeight: 1.45,
  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
}

const titleStyle: CSSProperties = {
  fontWeight: 600,
  marginBottom: 6,
  color: '#94a3b8',
  fontSize: 10,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
}

/**
 * Floating debug panel for development. Enable with
 * `<CommandryProvider registry={…} devtools />`.
 */
export function CommandryDevtools() {
  const { registry } = useCommandry()

  const snapshot = useSyncExternalStore(
    registry.subscribe,
    () => ({
      scopes: registry.getActiveScopes(),
      commandCount: registry.getCommands().length,
    }),
    () => ({ scopes: [] as string[], commandCount: 0 }),
  )

  return (
    <div style={panelStyle} data-commandry-devtools>
      <div style={titleStyle}>Commandry</div>
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: '#94a3b8' }}>Active scopes</span>
        <div style={{ marginTop: 4, wordBreak: 'break-word' }}>
          {snapshot.scopes.length ? snapshot.scopes.join(' → ') : '(none)'}
        </div>
      </div>
      <div>
        <span style={{ color: '#94a3b8' }}>Registered commands</span>
        <div style={{ marginTop: 4 }}>{snapshot.commandCount}</div>
      </div>
    </div>
  )
}
