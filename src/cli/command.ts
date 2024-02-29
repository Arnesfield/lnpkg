import { Command, Option } from 'commander';
import { description, name, version } from '../../package.json';

export interface ProgramInput {
  src: string[];
  dest: string[];
}

export interface ProgramOptions {
  dest: string[] | undefined;
  link: ProgramInput[] | undefined;
  cwd?: string;
  config?: string;
  dryRun?: boolean;
  force?: boolean;
  skip?: boolean;
  watch?: boolean;
  watchOnly?: boolean;
}

export function createCommand(): Command {
  // NOTE: '--link' option may break if commander changes how it parses options
  let input: ProgramInput = { src: [], dest: [] };
  let saved = false;
  const command = new Command();
  return command
    .name(name)
    .addHelpText('before', description + '\n')
    .argument('[paths...]', 'paths of source packages to link')
    .option('-n, --dry-run', 'log only without performing operations (noop)')
    .option<string[]>(
      '-d, --dest <path>',
      'default destination package(s) to link source packages to',
      (value, previous = []) => (previous.push(value), previous)
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
    .option<undefined>(
      '-t, --to <paths...>',
      "destination packages for preceding '--link' source packages",
      value => {
        if (input.src.length === 0) {
          command.error("error: missing '-l, --link' before '-t, --to'");
        }
        saved = true;
        input.dest.push(value);
      }
    )
    .option(
      '-C, --cwd <path>',
      'run command as if it was started in <path> instead of the current working directory'
    )
    .option(
      '-c, --config <path>',
      "file path to config or '-' for stdin (json format)"
    )
    .addOption(
      new Option(
        '-f, --force',
        'allow link even if source package is not a dependency of destination package'
      ).conflicts('skip')
    )
    .option(
      '-s, --skip',
      'skip link if source package is not a dependency of destination package'
    )
    .option(
      '-w, --watch',
      'watch package files for changes after linking packages'
    )
    .option(
      '-W, --watch-only',
      'skip linking packages and watch package files for changes only'
    )
    .version(`v${version}`, '-v, --version');
}
