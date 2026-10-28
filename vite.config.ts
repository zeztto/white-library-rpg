import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react(),tailwindcss()],resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},
 server:{host:'127.0.0.1'},preview:{host:'127.0.0.1'},build:{target:'es2022',rollupOptions:{output:{manualChunks:{react:['react','react-dom','zustand'],motion:['motion'],validation:['zod']}}}}});
