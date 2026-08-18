import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__specs__/**/*.spec.ts'],
    globals: true,
  },
  resolve: {
    // Resolves the `@/…` aliases from tsconfig.json so specs import the same
    // way application code does. Native replacement for vite-tsconfig-paths.
    tsconfigPaths: true,
    alias: {
      // `server-only` throws on import outside a Server Component. That guard
      // is a build-time contract for Next, and there is no Server Component
      // boundary under Vitest, so it is stubbed rather than worked around in
      // each spec. The modules it protects are still only ever called
      // server-side in the app itself.
      'server-only': new URL('./src/__specs__/stubs/server-only.ts', import.meta.url).pathname,
    },
  },
});
