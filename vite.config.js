import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// REMPLACER 'scanner-tickets' par le nom de votre repo GitHub
export default defineConfig({
  plugins: [react()],
  base: '/scanner-tickets/',
})