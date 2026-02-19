
import { build } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const trackers = [
    { entry: 'src/tracker/track-lite.ts', output: 'track-lite.js', name: 'mmmetricLite' },
    { entry: 'src/tracker/track-standard.ts', output: 'track.js', name: 'mmmetric' },
    { entry: 'src/tracker/track-full.ts', output: 'track-full.js', name: 'mmmetricFull' },
    { entry: 'src/tracker/overlay.tsx', output: 'overlay.js', name: 'mmmetricOverlay' },
];

async function buildAll() {
    console.log('Building trackers...');

    for (const tracker of trackers) {
        console.log(`Building ${tracker.output}...`);
        await build({
            configFile: false,
            root: rootDir,
            build: {
                lib: {
                    entry: resolve(rootDir, tracker.entry),
                    name: tracker.name,
                    fileName: () => tracker.output,
                    formats: ['iife'],
                },
                outDir: 'public',
                emptyOutDir: false,
                minify: 'terser',
                terserOptions: {
                    compress: {
                        drop_console: true,
                        drop_debugger: true,
                        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
                    },
                    mangle: {
                        toplevel: true,
                    },
                },
            },
        });
        console.log(`✓ Built ${tracker.output}`);
    }
}

buildAll().catch(err => {
    console.error(err);
    process.exit(1);
});
