import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
// base must match the public subpath of the frontend on the course VM
// without it the built asset URLs point to the domain root and 404 under /webdev/w14/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/webdev/w14/",
})
