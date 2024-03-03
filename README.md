> [!CAUTION]
>
> **_This package is an alpha version: currently untested and is considered unstable. Usage and API may change at any time. Use at your own risk._**

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
  paths                  paths of source packages to link

Options:
  -n, --dry-run          log only without performing operations (noop)
  -d, --dest <path>      default destination package(s) to link source packages
                         to
      --dests <...>      similar to '--dest' but accepts multiple paths
  -l, --link <paths...>  source packages to link to proceeding '--to'
                         destination packages
  -t, --to <paths...>    destination packages for preceding '--link' source
                         packages
  -C, --cwd <path>       run command as if it was started in <path> instead of
                         the current working directory
  -c, --config <path>    file path to config(s) or '-' for stdin (json format)
      --configs <...>    similar to '--config' but accepts multiple file paths
  -f, --force            allow link even if source package is not a dependency
                         of destination package
  -s, --skip             skip link if source package is not a dependency of
                         destination package
  -w, --watch            watch package files for changes after linking packages
  -W, --watch-only       skip linking packages and watch package files for
                         changes only
  -v, --version          output the version number
  -h, --help             display help for command
```

## License

Licensed under the [MIT License](LICENSE).
