import { spec } from 'argstree';
import { LnPkgOptions } from '../core/lnpkg.types.js';
import { LOG_LEVEL } from '../helpers/logger.js';
import * as PKG from '../package-json.js';
import { help } from './help.js';

function parseBool(args: string[]) {
  const arg = args.length > 0 ? args[0] : null;
  return !arg || !['0', 'f'].includes(arg[0].toLowerCase());
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

export function parseArgs(args: string[]): ParsedArgs {
  const cmd = spec({ min: 0, strict: true });
  cmd.option('--dest', { min: 1, max: 1 });
  cmd.option('--dests', { min: 1 }).alias('-d');
  cmd.option('--link', { min: 1 }).alias('-l');
  cmd.option('--to', { min: 1 }).alias('-t');
  cmd.option('--cwd', { min: 1, max: 1 }).alias('-C');
  cmd.option('--config', { min: 1, max: 1 });
  cmd.option('--configs', { min: 1 }).alias('-c');
  cmd.option('--log-level', {
    min: 1,
    max: 1,
    validate(data) {
      const value = data.args[0];
      if (!(value in LOG_LEVEL)) {
        const logLevels = Object.keys(LOG_LEVEL)
          .map(level => `'${level}'`)
          .join(', ');
        throw new Error(
          `Option '--log-level' argument '${value}' is invalid. Allowed choices are: ${logLevels}`
        );
      }
      return true;
    }
  });
  cmd.option('--version', { maxRead: 0 }).alias('-v');
  cmd
    .option('--help', {
      maxRead: 0,
      validate: data => (parseBool(data.args) && help(), true)
    })
    .alias('-h');
  cmd.command('--', { strict: false });

  // flags / booleans
  const bools = ['force', 'skip', 'unlink', 'watch', 'quiet'] as const;
  for (const bool of bools) {
    cmd
      .option(`--${bool}`, { id: bool, maxRead: 0 })
      .alias(`-${bool[0]}`)
      .alias(`--no-${bool}`, '0');
  }
  cmd
    .option('--dry-run', { id: 'dryRun', maxRead: 0 })
    .alias('-n')
    .alias('--no-dry-run', '0');
  cmd
    .option('--watch-only', { id: 'watchOnly', maxRead: 0 })
    .alias('-W')
    .alias('--no-watch-only', '0');

  const root = cmd.parse(args);
  // output version
  const versionNode = root.descendants.find(node => node.id === '--version');
  if (versionNode && parseBool(versionNode.args)) {
    console.log('v%s', PKG.version);
    process.exit(0);
  }

  const options: ParsedArgs = { input: root.args.slice() };
  let input: ParsedInput | undefined;

  for (const node of root.descendants) {
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
          throw new Error(
            "Missing option '-l, --link' before option '-t, --to'"
          );
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
        options.logLevel = args[0] as typeof options.logLevel;
        break;
      case '--':
        options.input.push(...args);
        break;
    }
  }

  // make sure inputs have sources
  if (input && input.dest.length === 0) {
    throw new Error("Missing option '-t, --to' after option '-l, --link'");
  }
  return options;
}
