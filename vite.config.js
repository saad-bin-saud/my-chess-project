import { defineConfig } from 'vite';
import fs from 'fs'
import path from 'path'

// Replace this with your laptop LAN IP if you want HMR to announce a
// specific host to other devices on the network.
const LAN_HOST = process.env.LAN_HOST || '192.168.1.105';

// Optional HTTPS support for local development.
// Provide paths via env vars HTTPS_CERT and HTTPS_KEY or place certs in ./certs.
// Example (mkcert): ./certs/localhost.pem and ./certs/localhost-key.pem
function loadLocalHttps() {
  const certPath = process.env.HTTPS_CERT || path.resolve(process.cwd(), 'certs', 'localhost.pem')
  const keyPath = process.env.HTTPS_KEY || path.resolve(process.cwd(), 'certs', 'localhost-key.pem')
  try {
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      return {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      }
    }
  } catch (e) {
    // ignore and return undefined
  }
  return undefined
}

const httpsConfig = loadLocalHttps()

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    // listen on all addresses so other devices on your LAN can reach Vite
    host: true,
    // default dev port (you can override with --port or env var)
    port: 5173,
    open: '/index.html',
    // HMR must know which host to connect back to when the page is opened
    // from another device. Use your laptop IP on the LAN.
    hmr: {
      host: LAN_HOST,
      protocol: 'ws',
      port: 5173,
    },
    // Enable HTTPS when local certs are present
    ...(httpsConfig ? { https: httpsConfig } : {}),
  },
});