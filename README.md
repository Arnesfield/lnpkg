> [!CAUTION]
>
> **_This is an alpha version of the package: currently untested and is considered unstable. Usage and API may change at any time. Use at your own risk._**

# lnpkg

[![npm][npm-img]][npm-url]

[npm-img]: https://img.shields.io/npm/v/lnpkg.svg
[npm-url]: https://www.npmjs.com/package/lnpkg

Link local Node.js packages.

> [!NOTE]
>
> README is still a work in progress.

## Install

Run via `npx`:

```sh
npx lnpkg
```

Or install globally via `npm`:

```sh
npm install --global lnpkg
```

## Usage

```text
$ lnpkg
Link local Node.js packages.

Usage: lnpkg [-n|--dry-run] [src...] [options] [--] [src...]
       lnpkg <src...> -d|--dests <dest...>
       lnpkg <src...> --dest <dest1> [--dest <dest2>]
       lnpkg -l|--link <src1...> -t|--to <dest1...> [-l <src2...> -t <dest2...>]
       lnpkg -C|--cwd <path> ...
       lnpkg -c|--configs <[*.json...] [-] [*.json...]> # stdin '-' json format
       lnpkg --config <config1.json> [--config - --config <config3.json>]

Arguments
  [src...]                  paths of source packages to link to destination
                            packages (required only when '--link' and '--to'
                            options are not used)

Link package options
  -d, --dests <paths...>    default destination package(s) to link source
                            packages to (default: '.')
      --dest <path>         similar to '--dests' but accepts one value at a time
  -l, --link <paths...>     source packages to link to proceeding '--to'
                            destination packages
  -t, --to <paths...>       destination packages for preceding '--link' source
                            packages
  -C, --cwd <path>          run command as if it was started in <path> instead
                            of the current working directory
  -c, --configs <paths...>  file path to config(s) or '-' for stdin (json
                            format)
      --config <path>       similar to '--configs' but accepts one value at a
                            time

Flags (use '--<flag>=0' or '--no-<flag>' to set to false)
  -n, --dry-run             log only without performing operations (noop)
  -f, --force               allow un/link even if source package is not a
                            dependency of destination package
  -s, --skip                skip un/link if source package is not a dependency
                            of destination package
  -u, --unlink              unlink source packages from destination packages
                            (package files only) and skip linking them in watch
                            mode
  -w, --watch               watch package files for changes after linking
                            packages
  -W, --watch-only          skip linking packages and watch package files for
                            changes only

Output options
  -q, --quiet               set '--log-level' to 'error'
      --log-level <level>   output logs only of equal or higher level ('info',
                            'warn', 'error', default: 'info')
  -v, --version             display version information
  -h, --help                display this help text
```

## License

Licensed under the [MIT License](LICENSE).
