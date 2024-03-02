import { Link } from '../core/link';
import { PackageFile } from '../package/package.types';

// NOTE: internal

interface BaseAction {
  link: Link;
}

interface InitAction extends BaseAction {
  type: 'init';
}

interface CopyAction extends BaseAction {
  type: 'copy';
  file: PackageFile;
}

interface RemoveAction extends BaseAction {
  type: 'remove';
  file: PackageFile;
}

interface LinkAction extends BaseAction {
  type: 'link';
}

interface UnlinkAction extends BaseAction {
  type: 'unlink';
  files: PackageFile[];
}

export type Action =
  | InitAction
  | CopyAction
  | RemoveAction
  | LinkAction
  | UnlinkAction;

export interface WatcherPayload {
  event: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
  path: string;
}
