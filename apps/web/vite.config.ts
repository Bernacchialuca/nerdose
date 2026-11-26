import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Los clients de los juegos se cargan con import() y traen deps propias (zod, dnd-kit, shiki) que
  // esta app no declara: sin escanearlos al arrancar, Vite las descubre recién al abrir un juego,
  // re-optimiza y el import dinámico falla con «504 Outdated Optimize Dep».
  optimizeDeps: { entries: ['index.html', '../../packages/games/*/src/client/index.ts'] },
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
