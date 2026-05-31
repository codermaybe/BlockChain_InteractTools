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
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-antd': ['antd', '@ant-design/icons'],
            'vendor-ethers': ['ethers'],
            'vendor-solana': ['@solana/web3.js', '@solana/spl-token'],
            'vendor-web3': ['web3', 'react-moralis'],
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
