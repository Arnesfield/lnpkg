import eslint from '@rollup/plugin-eslint';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import { RollupOptions } from 'rollup';
import cleanup from 'rollup-plugin-cleanup';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import nodeExternals from 'rollup-plugin-node-externals';
import outputSize from 'rollup-plugin-output-size';
import pkg from './package.json' with { type: 'json' };
import { helpText } from './src/help-text.js';

// const PROD = process.env.NODE_ENV !== 'development';
const WATCH = process.env.ROLLUP_WATCH === 'true';
const input = 'src/index.ts';

function defineConfig(options: (false | RollupOptions)[]) {
  return options.filter((options): options is RollupOptions => !!options);
}

export default defineConfig([
  {
    input: { index: input, cli: 'src/cli.ts' },
    output: {
      dir: 'lib',
      format: 'esm',
      exports: 'named',
      chunkFileNames: '[name].js',
      manualChunks: { lnpkg: [input] }
    },
    // ensures that '@isaacs/cliui' import is removed when help text is defined
    treeshake: { moduleSideEffects: 'no-external' },
    plugins: [
      esbuild({
        target: 'esnext',
        // only replace help text when not watching to properly
        // update help-text.ts contents during development
        define: !WATCH
          ? { 'process.env.HELP': JSON.stringify(helpText()) }
          : undefined
      }),
      cleanup({
        comments: ['some', 'sources', /__PURE__/],
        extensions: ['js', 'ts']
      }),
      json(),
      // explicitly treat '@isaacs/cliui' dev dependency as external
      nodeExternals({ include: ['@isaacs/cliui'] }),
      outputSize({ bytes: true })
    ]
  },
  {
    input,
    output: { file: pkg.types, format: 'esm' },
    plugins: [dts(), nodeExternals(), outputSize({ bytes: true })]
  },
  WATCH && {
    input,
    watch: { skipWrite: true },
    plugins: [eslint(), typescript(), json(), nodeExternals()]
  }
]);
