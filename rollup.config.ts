import eslint from '@rollup/plugin-eslint';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { createRequire } from 'module';
import path from 'path';
import { PluginHooks, RollupOptions } from 'rollup';
import cleanup from 'rollup-plugin-cleanup';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import externals from 'rollup-plugin-node-externals';
import outputSize from 'rollup-plugin-output-size';
import type Pkg from './package.json';
import { helpText } from './src/help-text.js';

const require = createRequire(import.meta.url);
const pkg: typeof Pkg = require('./package.json');
const input = 'src/index.ts';
const WATCH = process.env.ROLLUP_WATCH === 'true';
const PROD = !WATCH || process.env.NODE_ENV === 'production';
let helpText2 = helpText;

function defineConfig(options: (false | RollupOptions)[]) {
  return options.filter((options): options is RollupOptions => !!options);
}

// taken from https://github.com/rollup/rollup/issues/3414#issuecomment-751699335
function watch(files: string[]): Partial<PluginHooks> {
  return {
    buildStart() {
      for (const file of files) {
        this.addWatchFile(path.resolve(file));
      }
    }
  };
}

export default defineConfig([
  {
    input: { index: input, cli: 'src/cli.ts' },
    output: {
      dir: 'lib',
      format: 'esm',
      exports: 'named',
      chunkFileNames: '[name].js'
    },
    plugins: [
      watch(['src/help-text.ts']),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      replace({
        preventAssignment: true,
        values: {
          'process.env.HELP': (id: string) => {
            return JSON.stringify(helpText2());
          }
        }
      }),
      esbuild({ target: 'esnext' }),
      cleanup({
        comments: ['some', 'sources', /__PURE__/],
        extensions: ['js', 'ts']
      }),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      json(),
      externals(),
      outputSize()
    ]
  },
  {
    input: 'src/help-text.ts',
    output: { dir: 'tmps' },
    plugins: [
      esbuild(),
      externals(),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      json(),
      {
        name: 'no-emit',
        generateBundle(_, bundle) {
          console.log(helpText2());
          for (const file in bundle) {
            delete bundle[file];
          }
        }
      }
    ]
  },
  {
    input,
    output: { file: pkg.types, format: 'esm' },
    plugins: [dts(), externals(), outputSize()]
  },
  !PROD && {
    input,
    watch: { skipWrite: true },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    plugins: [eslint(), typescript(), json(), externals()]
  }
]);
