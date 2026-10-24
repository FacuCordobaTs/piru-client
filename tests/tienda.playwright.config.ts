import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: '.',
    testMatch: 'tienda*.spec.ts',
    fullyParallel: true,
    workers: 2,
    timeout: 30_000,
    use: {
        baseURL: 'http://127.0.0.1:5188',
        headless: true,
        reducedMotion: 'reduce',
        trace: 'retain-on-failure',
    },
    webServer: {
        command:
            'VITE_API_URL=http://127.0.0.1:3100/api VITE_WS_URL=ws://127.0.0.1:3100 bun run dev --host 127.0.0.1 --port 5188',
        url: 'http://127.0.0.1:5188',
        reuseExistingServer: !process.env.CI,
    },
})
