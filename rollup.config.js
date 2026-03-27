import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'

export default {
    input: ['src/app.ts'],
    output: {
        dir: 'dist',
        format: 'esm',
        entryFileNames: chunk => {
            if (chunk.facadeModuleId.includes('utils')) {
                return 'utils/[name].js';
            }
            return '[name].js';
        }
    },
    // Treat everything that is NOT a relative import as external (node_modules)
    external: (id) => !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('src'),
    onwarn: (warning) => {
        if (warning.code === 'UNRESOLVED_IMPORT') return
    },
    plugins: [
        resolve({ extensions: ['.ts', '.js'], resolveOnly: [/^\.\//, /^\.\.\//] }),
        typescript({ compilerOptions: { outDir: './dist', declaration: false } })
    ],
}
