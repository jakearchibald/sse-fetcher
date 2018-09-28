import typescript from 'rollup-plugin-typescript2';
import { terser } from "rollup-plugin-terser";

const esm = {
  input: 'lib/index.ts',
  plugins: [
    typescript({ useTsconfigDeclarationDir: true }),
  ],
  output: {
    file: 'dist/SSEFetcher.mjs',
    format: 'esm'
  },
};

const iffe = {
  input: 'dist/SSEFetcher.mjs',
  output: {
    file: 'dist/SSEFetcher.js',
    format: 'iife',
    name: 'SSEFetcher'
  },
};

const iffeMin = {
  input: 'dist/SSEFetcher.mjs',
  plugins: [
    terser({
      compress: { ecma: 6 },
    })
  ],
  output: {
    file: 'dist/SSEFetcher-min.js',
    format: 'iife',
    name: 'SSEFetcher'
  },
};

export default [esm, iffe, iffeMin];
