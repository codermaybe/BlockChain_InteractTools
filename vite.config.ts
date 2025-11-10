import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Keep dev server on 9754 to match Tauri config
// Map a few Node core modules to browser-friendly shims if dependencies attempt to import them.
// Also expose CRA-style env keys used in code (REACT_APP_*).

export default defineConfig(({ mode }) => {
  // Load .env files so REACT_APP_* variables are available even in Vite
  const env = loadEnv(mode, process.cwd(), '');
  const defineProcessEnv: Record<string, string> = {
    NODE_ENV: JSON.stringify(process.env.NODE_ENV || mode),
  };
  const reactAppKeys = [
    'REACT_APP_ganacheRpc',
    'REACT_APP_ganacheAddress',
    'REACT_APP_BASE_URL',
  ];
  for (const key of reactAppKeys) {
    if (env[key] !== undefined) {
      defineProcessEnv[key] = JSON.stringify(env[key] as string);
    }
  }

  const jsAsJsx: Plugin = {
    name: 'js-as-jsx-transform',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.endsWith('.js')) return null;
      // only transform source files
      if (!(id.includes('/src/') || id.includes('\\src\\'))) return null;
      const esbuild = await import('esbuild');
      const result = await esbuild.transform(code, {
        loader: 'jsx',
        jsx: 'automatic',
        sourcemap: true,
      });
      return { code: result.code, map: result.map };
    },
  };

  return {
    plugins: [jsAsJsx, react()],
    server: {
      port: 9754,
      strictPort: true,
      host: true,
    },
    preview: {
      port: 9754,
      strictPort: true,
      host: true,
    },
    resolve: {
      alias: {
        crypto: 'crypto-browserify',
        path: 'path-browserify',
        os: 'os-browserify/browser',
      },
    },
    define: {
      global: 'globalThis',
      'process.env': defineProcessEnv,
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
    build: {
      outDir: 'dist',
    },
  };
});
