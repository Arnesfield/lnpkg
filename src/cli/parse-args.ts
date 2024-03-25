import argstree from 'argstree';
import { version } from '../../package.json';
import { LnPkgOptions } from '../core/lnpkg.types.js';
import { LOG_LEVEL } from '../helpers/logger.js';
import { ProgramInput } from './command.js';
import { help } from './help.js';

function parseBool(args: string[]) {
  const arg = args.length > 0 ? args[0] : null;
  return !arg || !['0', 'f'].includes(arg[0].toLowerCase());
}

export interface ProgramOptions extends Omit<LnPkgOptions, 'input' | 'dest'> {
  input: (string | ProgramInput)[];
  dest?: string[];
  config?: string[];
}

export function parseArgs(args = process.argv.slice(2)): ProgramOptions {
  const root = argstree(args, {
    alias: {
      '-n': '--dry-run',
      '--no-dry-run': ['--dry-run', '0'],
      '-d': '--dests',
      '-l': '--link',
      '-t': '--to',
      '-C': '--cwd',
      '-c': '--configs',
      '-f': '--force',
      '--no-force': ['--force', '0'],
      '-s': '--skip',
      '--no-skip': ['--skip', '0'],
      '-u': '--unlink',
      '--no-unlink': ['--unlink', '0'],
      '-w': '--watch',
      '--no-watch': ['--watch', '0'],
      '-W': '--watch-only',
      '--no-watch-only': ['--watch-only', '0'],
      '-q': '--quiet',
      '--no-quiet': ['--quiet', '0'],
      '-v': '--version',
      '-h': '--help'
    },
    args: {
      '--dry-run': { id: 'dryRun', maxRead: 0 },
      '--dest': { min: 1, max: 1 },
      '--dests': { min: 1 },
      '--link': { min: 1 },
      '--to': { min: 1 },
      '--cwd': { min: 1, max: 1 },
      '--config': { min: 1, max: 1 },
      '--configs': { min: 1 },
      '--force': { id: 'force', maxRead: 0 },
      '--skip': { id: 'skip', maxRead: 0 },
      '--unlink': { id: 'unlink', maxRead: 0 },
      '--watch': { id: 'watch', maxRead: 0 },
      '--watch-only': { id: 'watchOnly', maxRead: 0 },
      '--quiet': { id: 'quiet', maxRead: 0 },
      '--log-level': {
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
      },
      '--version': { maxRead: 0 },
      '--help': {
        maxRead: 0,
        validate: data => (parseBool(data.args) && help(), true)
      },
      '--': { args: {} }
    }
  });

  // output version
  if (root.descendants.some(node => node.id === '--version')) {
    console.log('v%s', version);
    process.exit(0);
  }

  const options: ProgramOptions = { input: root.args.slice() };
  let input: ProgramInput | undefined;

  for (const node of root.descendants) {
    const { id, args } = node;
    switch (id) {
      case 'dryRun':
      case 'force':
      case 'skip':
      case 'unlink':
      case 'watch':
      case 'watchOnly':
      case 'quiet':
        options[id] = parseBool(args);
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
