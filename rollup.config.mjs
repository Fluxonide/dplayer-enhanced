import { readFileSync } from 'fs';
import { execSync } from 'child_process';

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import url from '@rollup/plugin-url';
import postcss from 'rollup-plugin-postcss';
import { string } from 'rollup-plugin-string';
// serve and livereload are loaded dynamically — only in watch/dev mode

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const isDev = process.env.ROLLUP_WATCH === 'true';

// Get git hash (short), fall back gracefully if not in a git repo
let gitHash = 'unknown';
try {
    gitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (_) {}

/** Build the plugin list for a given config */
async function makePlugins({ extractCss, inlineSources = false, devServer = false }) {
    return [
        resolve({ browser: true, extensions: ['.ts', '.js'] }),
        commonjs(),
        // Import .svg files as raw inline SVG strings
        string({ include: '**/*.svg' }),
        // CSS / Less
        // extractCss = false  → inject via JS (dev, or ESM for bundler consumers)
        // extractCss = string → write to that filename
        postcss({
            extract: extractCss,
            minimize: !isDev,
            use: ['less'],
        }),
        // Inline small raster assets as base64 data URIs
        url({ limit: 40 * 1024, include: ['**/*.png', '**/*.jpg', '**/*.gif', '**/*.webp'] }),
        // TypeScript
        typescript({
            tsconfig: './tsconfig.json',
            sourceMap: true,
            inlineSources,
        }),
        // Compile-time constants
        replace({
            preventAssignment: true,
            values: {
                DPLAYER_VERSION: JSON.stringify(pkg.version),
                GIT_HASH: JSON.stringify(gitHash),
            },
        }),
        // Dev server — only in watch mode (loaded dynamically to avoid side-effects in prod)
        ...(devServer ? [(await import('rollup-plugin-serve')).default({ contentBase: ['demo', 'dist'], port: 8080, open: true }), (await import('rollup-plugin-livereload')).default({ watch: 'dist' })] : []),
    ];
}

let config;

if (isDev) {
    // ── Dev (watch mode: rollup -c --watch) ──────────────────────────────────
    config = {
        input: 'src/ts/index.ts',
        output: {
            file: 'dist/DPlayer.js',
            format: 'umd',
            name: 'DPlayer',
            exports: 'default',
            sourcemap: true,
        },
        plugins: await makePlugins({ extractCss: false, inlineSources: true, devServer: true }),
        external: [],
    };
} else {
    // ── Production ────────────────────────────────────────────────────────────

    // UMD — CDN / <script> tag; also writes the single DPlayer.css
    const umdConfig = {
        input: 'src/ts/index.ts',
        output: {
            file: 'dist/DPlayer.min.js',
            format: 'umd',
            name: 'DPlayer',
            exports: 'default',
            sourcemap: true,
        },
        plugins: await makePlugins({ extractCss: 'DPlayer.css' }),
        external: [],
    };

    // ESM — for bundlers (Vite, webpack, Rollup); CSS already extracted by UMD build
    const esmConfig = {
        input: 'src/ts/index.ts',
        output: {
            file: 'dist/DPlayer.esm.js',
            format: 'esm',
            exports: 'default',
            sourcemap: true,
        },
        plugins: await makePlugins({ extractCss: false }), // bundler consumers handle CSS themselves
        external: [],
    };

    config = [umdConfig, esmConfig];
}

export default config;
