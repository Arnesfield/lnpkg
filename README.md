> [!CAUTION]
>
> **_This is an alpha version of the package: currently untested and is considered unstable. Usage and API may change at any time. Use at your own risk._**

# lnpkg

[![npm](https://img.shields.io/npm/v/lnpkg.svg)](https://www.npmjs.com/package/lnpkg)

Link local Node.js packages.

> [!NOTE]
>
> README is still a work in progress.

## Install

Install globally for `lnpkg` command:

```sh
npm install -g lnpkg
```

Or install as a dependency to use as a module:

```sh
npm install lnpkg --save-dev
```

## Usage

Import module (dependency install):

```javascript
import lnpkg from 'lnpkg';
```

Use command (global install):

```text
$ lnpkg
Link local Node.js packages.

Usage: lnpkg [options] [paths...]

Arguments:
  paths                    paths of source packages to link

Options:
  -n, --dry-run            log only without performing operations (noop)
  -d, --dests <...>        default destination package(s) to link source
                           packages to
      --dest <path>        similar to '--dests' but accepts one value at a time
  -l, --link <paths...>    source packages to link to proceeding '--to'
                           destination packages
  -t, --to <paths...>      destination packages for preceding '--link' source
                           packages
  -C, --cwd <path>         run command as if it was started in <path> instead
                           of the current working directory
  -c, --configs <...>      file path to config(s) or '-' for stdin (json
                           format)
      --config <path>      similar to '--configs' but accepts one value at a
                           time
  -f, --force              allow un/link even if source package is not a
                           dependency of destination package
  -s, --skip               skip un/link if source package is not a dependency
                           of destination package
  -u, --unlink             unlink source packages from destination packages
                           (package files only) and skip linking them in watch
                           mode
  -w, --watch              watch package files for changes after linking
                           packages
  -W, --watch-only         skip linking packages and watch package files for
                           changes only
  -q, --quiet              disable logging
      --log-level <level>  output logs only of equal or higher level ('info',
                           'warn', 'error', default: 'info')
  -v, --version            output the version number
  -h, --help               display help for command
```

## License

Licensed under the [MIT License](LICENSE).
