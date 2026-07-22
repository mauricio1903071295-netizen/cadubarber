import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em dev, o Vite roda em :5173 e o backend Express em :3001.
// O proxy abaixo evita configurar CORS/URL absoluta durante o desenvolvimento.
// Em produção (Vercel), o frontend e as funções serverless ficam no mesmo domínio,
// então "/api/..." já funciona sem proxy.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
