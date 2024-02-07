// NOTE: taken from https://docs.npmjs.com/cli/configuring-npm/package-json#files

export const PACKAGE_JSON = 'package.json';

export const PACKAGE_FILES_INCLUDE = [
  PACKAGE_JSON,
  'README',
  'README.*',
  'LICENSE',
  'LICENSE.*',
  'LICENCE',
  'LICENCE.*'
];

export const PACKAGE_FILES_IGNORE_ALWAYS = [
  '.git',
  '.npmrc',
  'node_modules',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock'
];

export const PACKAGE_FILES_IGNORE_DEFAULT = [
  '*.orig',
  '.*.swp',
  '.DS_Store',
  '._*',
  '.hg',
  '.lock-wscript',
  '.svn',
  '.wafpickle-N',
  'CVS',
  'config.gypi',
  'npm-debug.log'
].concat(PACKAGE_FILES_IGNORE_ALWAYS);
