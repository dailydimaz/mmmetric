import { defineConfig } from 'vite';
import { resolve } from 'path';
import { build } from 'vite';

// Multi-entry build configuration for tiered tracking scripts
const trackers = [
    { entry: 'src/tracker/track-lite.ts', output: 'track-lite.js', name: 'mmmetricLite' },
    { entry: 'src/tracker/track-standard.ts', output: 'track.js', name: 'mmmetric' },
    { entry: 'src/tracker/track-full.ts', output: 'track-full.js', name: 'mmmetricFull' },
    { entry: 'src/tracker/overlay.tsx', output: 'overlay.js', name: 'mmmetricOverlay' },
];

export default defineConfig({
    build: {
        lib: {
            // Default entry for single build mode (used by npm script)
            entry: resolve(__dirname, 'src/tracker/track-standard.ts'),
            name: 'mmmetric',
            fileName: () => 'track.js',
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

// Export a function to build all tracker variants
export async function buildAllTrackers() {
    for (const tracker of trackers) {
        await build({
            configFile: false,
            build: {
                lib: {
                    entry: resolve(__dirname, tracker.entry),
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
