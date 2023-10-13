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

export const PACKAGE_FILES_IGNORE = [
  '.git',
  'CVS',
  '.svn',
  '.hg',
  '.lock-wscript',
  '.wafpickle-N',
  '.*.swp',
  '.DS_Store',
  '._*',
  'npm-debug.log',
  '.npmrc',
  'node_modules',
  'config.gypi',
  '*.orig',
  'package-lock.json'
];
