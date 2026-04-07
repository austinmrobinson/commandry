import { createCommandry } from 'commandry'

/**
 * Scope tree (runtime validation for nesting):
 * app → mailbox → thread-list → thread-item → message
 *
 * The reading pane uses the same thread-list → thread-item chain as the sidebar
 * row so cmdk ordering, context menu scope, and shortcuts match “this thread”.
 */
export const { registry, defineCommands } = createCommandry({
  scopes: {
    app: {
      children: {
        mailbox: {
          children: {
            'thread-list': {
              children: {
                'thread-item': {
                  children: {
                    message: {},
                  },
                },
              },
            },
          },
        },
      },
    },
  },
})
