import _eslint from '@rollup/plugin-eslint';
import _json from '@rollup/plugin-json';
import _replace from '@rollup/plugin-replace';
import _typescript from '@rollup/plugin-typescript';
import { RollupOptions } from 'rollup';
import cleanup from 'rollup-plugin-cleanup';
import dts from 'rollup-plugin-dts';
import edit from 'rollup-plugin-edit';
import esbuild from 'rollup-plugin-esbuild';
import externals from 'rollup-plugin-node-externals';
import outputSize from 'rollup-plugin-output-size';
import pkg from './package.json' with { type: 'json' };
import { helpText } from './src/help-text.js';

// NOTE: remove once import errors are fixed for their respective packages
const eslint = _eslint as unknown as typeof _eslint.default;
const json = _json as unknown as typeof _json.default;
const replace = _replace as unknown as typeof _replace.default;
const typescript = _typescript as unknown as typeof _typescript.default;

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
      chunkFileNames: '[name].js'
    },
    plugins: [
      esbuild({ target: 'esnext' }),
      // only replace help text when not watching to properly
      // update help-text.ts contents during development
      !WATCH &&
        replace({
          preventAssignment: true,
          'process.env.HELP': JSON.stringify(helpText())
        }),
      // remove dangling wrap-ansi import
      // once it's replaced with the generated help text
      edit({
        chunk(data) {
          const pkg = 'wrap-ansi';
          const match = `import '${pkg}';\n`;
          if (data.contents.includes(match)) {
            console.log(
              '[edit] Removing %o import for %o.',
              pkg,
              data.fileName
            );
            return data.contents.replace(match, '');
          }
        }
      }),
      cleanup({
        comments: ['some', 'sources', /__PURE__/],
        extensions: ['js', 'ts']
      }),
      json(),
      // explicitly treat wrap-ansi as external
      // other external dev deps may be a mistake
      externals({ include: ['wrap-ansi'] }),
      outputSize()
    ]
  },
  {
    input,
    output: { file: pkg.types, format: 'esm' },
    plugins: [dts(), externals(), outputSize()]
  },
  WATCH && {
    input,
    watch: { skipWrite: true },
    plugins: [eslint(), typescript(), json(), externals()]
  }
]);
