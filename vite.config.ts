import { defineConfig, loadEnv } from 'vite';
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

  return {
    plugins: [react()],
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
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            const normalizedId = id.replace(/\\/g, '/');
            if (normalizedId.includes('/react/') || normalizedId.includes('/react-dom/')) {
              return 'vendor-react';
            }
            if (normalizedId.includes('/antd/') || normalizedId.includes('/@ant-design/icons/')) {
              return 'vendor-antd';
            }
            if (normalizedId.includes('/ethers/')) {
              return 'vendor-ethers';
            }
            if (
              normalizedId.includes('/@solana/web3.js/') ||
              normalizedId.includes('/@solana/spl-token/')
            ) {
              return 'vendor-solana';
            }
            if (normalizedId.includes('/web3/') || normalizedId.includes('/react-moralis/')) {
              return 'vendor-web3';
            }
            return undefined;
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.js'],
      coverage: {
        provider: 'v8',
      },
    },
  };
});
