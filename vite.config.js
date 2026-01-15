import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Vite 的配置项
  base: '/Meeting-System/',  
  build: {
    outDir: 'dist'  
  }
})