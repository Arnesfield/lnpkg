import { Command, Option } from 'commander';
import { description, name, version } from '../../package.json';
import { LnPkgOptions } from '../core/lnpkg.types.js';
import { LOG_LEVEL } from '../helpers/logger.js';

export interface ProgramInput {
  src: string[];
  dest: string[];
}

export interface ProgramOptions extends Omit<LnPkgOptions, 'input' | 'dest'> {
  dest?: string[];
  dests?: string[];
  link?: ProgramInput[];
  config?: string[];
  configs?: string[];
}

// keep array reference
function createArrayParser(defaultValue: string[] = []) {
  return (value: string, previous = defaultValue) => (
    previous.push(value), previous
  );
}

export function createCommand(): Command {
  // NOTE: some options may break if commander changes how it parses options
  let input: ProgramInput = { src: [], dest: [] };
  let saved = false;

  const parseDest = createArrayParser();
  const destsOption = new Option(
    '-d, --dests <...>',
    'default destination package(s) to link source packages to'
  ).argParser(parseDest);
  destsOption.variadic = true;

  const parseConfig = createArrayParser();
  const configsOption = new Option(
    '-c, --configs <...>',
    "file path to config(s) or '-' for stdin (json format)"
  ).argParser(parseConfig);
  configsOption.variadic = true;

  const logLevels = Object.keys(LOG_LEVEL)
    .map(level => `'${level}'`)
    .join(', ');

  const command = new Command()
    .name(name)
    .addHelpText('before', description + '\n')
    .argument('[paths...]', 'paths of source packages to link')
    .option('-n, --dry-run', 'log only without performing operations (noop)')
    .addOption(destsOption)
    .option(
      '    --dest <path>',
      "similar to '--dests' but accepts one value at a time",
      parseDest
    )
    .option<ProgramInput[]>(
      '-l, --link <paths...>',
      "source packages to link to proceeding '--to' destination packages",
      (value, previous = [input]) => {
        if (saved) {
          saved = false;
          if (input.src.length > 0 || input.dest.length > 0) {
            input = { src: [], dest: [] };
            previous.push(input);
          }
        }
        input.src.push(value);
        return previous;
      }
    )
    .option(
      '-t, --to <paths...>',
      "destination packages for preceding '--link' source packages",
      value => {
        if (input.src.length === 0) {
          command.error(
            "error: missing option '-l, --link <paths...>' before option '-t, --to'"
          );
        }
        saved = true;
        input.dest.push(value);
      }
    )
    .option(
      '-C, --cwd <path>',
      'run command as if it was started in <path> instead of the current working directory'
    )
    .addOption(configsOption)
    .option(
      '    --config <path>',
      "similar to '--configs' but accepts one value at a time",
      parseConfig
    )
    // use implies for toggling to properly override config options
    .addOption(
      new Option(
        '-f, --force',
        'allow un/link even if source package is not a dependency of destination package'
      ).implies({ skip: false })
    )
    .addOption(
      new Option(
        '-s, --skip',
        'skip un/link if source package is not a dependency of destination package'
      ).implies({ force: false })
    )
    .addOption(
      new Option(
        '-u, --unlink',
        'unlink source packages from destination packages ' +
          '(package files only) and skip linking them in watch mode'
      ).implies({ watch: false, watchOnly: false })
    )
    .addOption(
      new Option(
        '-w, --watch',
        'watch package files for changes after linking packages'
      ).implies({ watchOnly: false })
    )
    .addOption(
      new Option(
        '-W, --watch-only',
        'skip linking packages and watch package files for changes only'
      ).implies({ watch: false })
    )
    .option('-q, --quiet', 'disable logging')
    .option(
      '    --log-level <level>',
      `output logs only of equal or higher level (${logLevels}, default: 'info')`,
      value => {
        if (!(value in LOG_LEVEL)) {
          command.error(
            `error: option '--log-level' argument '${value}' is invalid. Allowed choices are ${logLevels}.`
          );
        }
        return value;
      }
    )
    .version(`v${version}`, '-v, --version');
  // add hidden `--no` option for boolean options
  // NOTE: taken from https://github.com/tj/commander.js/issues/1343#issuecomment-699546401
  const match = /^--/;
  for (const option of command.options) {
    if (option.long && !option.required && !option.negate && !option.optional) {
      command.addOption(
        new Option(option.long.replace(match, '--no-')).hideHelp()
      );
    }
  }
  return command;
}
