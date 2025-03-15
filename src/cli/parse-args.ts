import command from 'argstree';
import { LnPkgOptions } from '../core/lnpkg.types.js';
import { LOG_LEVEL } from '../helpers/logger.js';
import * as PKG from '../package-json.js';
import { help } from './help.js';

function parseBool(args: string[]) {
  const l = args.length;
  const bool = l === 0 || args[l - 1][0] !== '0';
  // negate if arg was not from index 0
  return l > 1 !== bool;
}

export interface ParsedInput {
  src: string[];
  dest: string[];
}

export interface ParsedArgs extends Omit<LnPkgOptions, 'input' | 'dest'> {
  input: (string | ParsedInput)[];
  dest?: string[];
  config?: string[];
}

export function parseArgs(argv: string[]): ParsedArgs {
  const cmd = command({ strict: true })
    .option('--dest', { min: 1, max: 1 })
    .option('--dests', { min: 1, alias: '-d' })
    .option('--link', { min: 1, alias: '-l' })
    .option('--to', { min: 1, alias: '-t' })
    .option('--cwd', { min: 1, max: 1, alias: '-C' })
    .option('--config', { min: 1, max: 1 })
    .option('--configs', { min: 1, alias: '-c' })
    .option('--log-level', {
      min: 1,
      max: 1,
      onValidate(node) {
        const value = node.args[0];
        if (!(value in LOG_LEVEL)) {
          throw new Error(
            `Option '${node.key}' argument '${value}' is invalid. ` +
              'Allowed choices are: ' +
              Object.keys(LOG_LEVEL)
                .map(level => `'${level}'`)
                .join(', ')
          );
        }
      }
    })
    .option('--dry-run', {
      id: 'dryRun',
      read: false,
      alias: ['-n', ['--no-dry-run', '0']]
    })
    .option('--watch-only', {
      id: 'watchOnly',
      read: false,
      alias: ['-W', ['--no-watch-only', '0']]
    })
    .option('--version', {
      alias: '-v',
      assign: false,
      onBeforeValidate() {
        console.log('v%s', PKG.version);
        process.exit();
      }
    })
    .option('--help', { alias: '-h', assign: false, onCreate: help })
    .command('--', { strict: false });

  // flags / booleans
  for (const bool of ['force', 'skip', 'unlink', 'watch', 'quiet']) {
    cmd.option(`--${bool}`, {
      id: bool,
      read: false,
      alias: [`-${bool[0]}`, [`--no-${bool}`, '0']]
    });
  }

  const root = cmd.parse(argv);
  const options: ParsedArgs = { input: root.args.slice() };
  let input: ParsedInput | undefined;

  for (const node of root.children) {
    const { id, args } = node;
    switch (id) {
      case 'dryRun':
      case 'force':
      case 'skip':
      case 'unlink':
      case 'watch':
      case 'watchOnly':
        options[id] = parseBool(args);
        break;
      case 'quiet':
        // set or remove log level
        if (parseBool(args)) {
          options.logLevel = 'error';
        } else {
          delete options.logLevel;
        }
        break;
      case '--dest':
      case '--dests':
        (options.dest ||= []).push(...args);
        break;
      case '--link':
        if (!input || input.dest.length > 0) {
          input = { src: [], dest: [] };
          options.input.push(input);
        }
        input.src.push(...args);
        break;
      case '--to':
        if (!input || input.src.length === 0) {
          throw new Error("Missing option '--link' before option '--to'.");
        }
        input.dest.push(...args);
        break;
      case '--cwd':
        options.cwd = args[0];
        break;
      case '--config':
      case '--configs':
        (options.config ||= []).push(...args);
        break;
      case '--log-level':
        options.logLevel = args[0] as NonNullable<ParsedArgs['logLevel']>;
        break;
      case '--':
        options.input.push(...args);
        break;
    }
  }

  // make sure inputs have sources
  if (input && input.dest.length === 0) {
    throw new Error("Missing option '--to' after option '--link'.");
  }
  return options;
}
