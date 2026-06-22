import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'react/index': 'src/react/index.ts',
      'adapters/tinykeys': 'src/adapters/tinykeys.ts',
      'adapters/hotkeys-js': 'src/adapters/hotkeys-js.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    external: [
      'react',
      'react-dom',
      'tinykeys',
      'hotkeys-js',
      '@radix-ui/react-slot',
    ],
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.cjs' }
    },
    splitting: false,
    clean: true,
    treeshake: true,
  },
])
