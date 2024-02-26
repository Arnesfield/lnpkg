import { Link } from '../link/link';

// NOTE: internal

interface BaseAction {
  link: Link;
}

interface InitAction extends BaseAction {
  type: 'init';
}

interface CheckAction extends BaseAction {
  type: 'check';
}

interface CopyAction extends BaseAction {
  type: 'copy';
  filePath: string;
}

interface RemoveAction extends BaseAction {
  type: 'remove';
  filePath: string;
}

export type Action = InitAction | CheckAction | CopyAction | RemoveAction;

export interface WatcherPayload {
  event: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
  path: string;
}
