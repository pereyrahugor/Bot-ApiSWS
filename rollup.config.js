import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

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
    onwarn: (warning) => {
        if (warning.code === 'UNRESOLVED_IMPORT') return
    },
    plugins: [
        resolve({ extensions: ['.ts', '.js'] }), 
        commonjs(),
        typescript({ compilerOptions: { outDir: './dist', declaration: false } })
    ],
}
